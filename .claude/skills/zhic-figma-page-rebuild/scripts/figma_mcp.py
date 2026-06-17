#!/usr/bin/env python3
"""Minimal MCP streamable-HTTP client for Figma's local Dev Mode server.

The Figma desktop app exposes a local Dev Mode MCP server at 127.0.0.1:3845/mcp
(streamable-HTTP, MCP/JSON-RPC). It reads the CURRENTLY-FOCUSED desktop tab; tools
take only `nodeId` (no fileKey). Omit nodeId / pass '{}' for the current selection.

Tools: get_metadata, get_design_context, get_screenshot, get_variable_defs, get_figjam.

Usage:
  python3 figma_mcp.py schemas
  python3 figma_mcp.py call <tool_name> '<json-args>' [outfile]

Notes / gotchas baked in:
- Responses are SSE; a single result is often MULTIPLE text items (the code/tree PLUS a
  trailing "IMPORTANT/SUPER CRITICAL" note). This client CONCATENATES all text items — a
  naive client that writes each item to `outfile` overwrites and keeps only the note
  (you'd get 110-234 byte stubs). Keep this concatenation.
- get_design_context returns React/Tailwind code with image assets referenced as
  `http://localhost:3845/assets/<hash>.{png,svg}` — curl those down (served from the
  desktop app's local cache; no Figma-cloud geo-block).
- get_screenshot returns base64 image content → saved to `outfile` as PNG.
- get_design_context is METERED (cloud-proxied codegen): after a big sweep it returns
  "Rate limit exceeded, please try again tomorrow". get_metadata/get_screenshot are local.
- If a nodeId yields "No node could be found", the wrong Figma tab is focused — ask the
  operator to open + select the frame, then retry.
"""
import json, sys, time, urllib.request

URL = "http://127.0.0.1:3845/mcp"
PROTO = "2025-06-18"

def _post_once(body, session=None):
    headers = {"Content-Type": "application/json",
               "Accept": "application/json, text/event-stream"}
    if session:
        headers["mcp-session-id"] = session
    req = urllib.request.Request(URL, data=json.dumps(body).encode(),
                                 headers=headers, method="POST")
    r = urllib.request.urlopen(req, timeout=120)
    sid = r.headers.get("mcp-session-id")
    ctype = r.headers.get("content-type", "")
    raw = r.read().decode("utf-8", "replace")
    payloads = []
    if "text/event-stream" in ctype:
        buf = []
        for line in raw.split("\n"):
            if line.startswith("data:"):
                buf.append(line[5:].lstrip())
            elif line.strip() == "" and buf:
                chunk = "\n".join(buf).strip(); buf = []
                if chunk and chunk != "[DONE]":
                    try: payloads.append(json.loads(chunk))
                    except Exception: pass
        if buf:
            chunk = "\n".join(buf).strip()
            if chunk and chunk != "[DONE]":
                try: payloads.append(json.loads(chunk))
                except Exception: pass
    elif raw.strip():
        try: payloads.append(json.loads(raw))
        except Exception: payloads.append({"_raw": raw[:1000]})
    return sid, payloads

def _post(body, session=None):
    # Notifications (no id) don't expect a body; one shot is fine.
    expects = "id" in body
    last = (session, [])
    for attempt in range(5):
        try:
            sid, payloads = _post_once(body, session)
        except Exception as e:
            sys.stderr.write(f"[retry {attempt}] {type(e).__name__}: {e}\n")
            sid, payloads = session, []
        if not expects or payloads:
            return sid, payloads
        last = (sid, payloads)
        time.sleep(0.6 * (attempt + 1))
    return last

def session():
    sid, _ = _post({"jsonrpc":"2.0","id":1,"method":"initialize","params":{
        "protocolVersion":PROTO,"capabilities":{},
        "clientInfo":{"name":"claude-cowork","version":"0.1"}}})
    _post({"jsonrpc":"2.0","method":"notifications/initialized"}, session=sid)
    return sid

def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "schemas"
    sid = session()
    if cmd == "schemas":
        _, tools = _post({"jsonrpc":"2.0","id":2,"method":"tools/list"}, session=sid)
        for p in tools:
            for t in (p.get("result", {}) or {}).get("tools", []):
                print("###", t["name"])
                print(json.dumps(t.get("inputSchema", {}), ensure_ascii=False, indent=1))
    elif cmd == "call":
        import base64, os
        name = sys.argv[2]
        args = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
        outfile = sys.argv[4] if len(sys.argv) > 4 else None
        _, res = _post({"jsonrpc":"2.0","id":3,"method":"tools/call",
                        "params":{"name":name,"arguments":args}}, session=sid)
        all_text = []
        saved_img = False
        for p in res:
            result = p.get("result", {}) or {}
            content = result.get("content", [])
            for i, item in enumerate(content):
                if item.get("type") == "image" and item.get("data"):
                    path = outfile or f"/tmp/figma_shot_{i}.png"
                    with open(path, "wb") as f:
                        f.write(base64.b64decode(item["data"]))
                    print(f"[image saved] {path}  ({item.get('mimeType')}, {os.path.getsize(path)} bytes)")
                    saved_img = True
                elif item.get("type") == "text":
                    all_text.append(item.get("text", ""))
            if "error" in p:
                print("ERROR:", json.dumps(p["error"], ensure_ascii=False))
            if not content and "result" in p:
                all_text.append(json.dumps(result, ensure_ascii=False)[:2000])
        if all_text and not saved_img:
            joined = "\n".join(all_text)
            if outfile:
                with open(outfile, "w") as f:
                    f.write(joined)
                print(f"[text saved] {outfile}  ({len(joined)} chars)")
            else:
                print(joined[:8000])

if __name__ == "__main__":
    main()
