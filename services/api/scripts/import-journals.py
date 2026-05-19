#!/usr/bin/env python3
"""
Import journal posts from a WordPress WXR backup into Payload.

Reads /home/ahmad/imports/WordPress.2026-03-17.xml, finds post-type=post
+ status=publish entries, downloads inline & featured images from
zhicwood.co into services/api/media/, registers them as Payload media
docs, converts HTML body to Lexical JSON (with proper upload nodes for
inline images), upserts one author + one category, and inserts each
article with status=published.

Idempotent on the slug column — re-running skips articles already
imported but will still download referenced images that don't exist yet.

Usage:
  python3 services/api/scripts/import-journals.py
"""

import io
import json
import mimetypes
import os
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from urllib.parse import quote, unquote, urlparse

import psycopg2
import requests
from bs4 import BeautifulSoup, NavigableString
from PIL import Image
from psycopg2.extras import Json

# --- config --------------------------------------------------------------

WXR_PATH = '/home/ahmad/imports/WordPress.2026-03-17.xml'
MEDIA_DIR = '/home/ahmad/Zhic/services/api/media'
ENV_PATH = '/home/ahmad/Zhic/services/api/.env'
PAYLOAD_BASE_URL = 'http://80.240.31.146:3001'

NS = {
    'wp': 'http://wordpress.org/export/1.2/',
    'content': 'http://purl.org/rss/1.0/modules/content/',
    'excerpt': 'http://wordpress.org/export/1.2/excerpt/',
    'dc': 'http://purl.org/dc/elements/1.1/',
}


def load_db_uri():
    with open(ENV_PATH) as f:
        env = f.read()
    m = re.search(r'^DATABASE_URI=(.+)$', env, re.M)
    if not m:
        sys.exit('DATABASE_URI not found in .env')
    return m.group(1).strip().strip('"\'')


def t(el, path):
    f = el.find(path, NS)
    return f.text if f is not None and f.text is not None else ''


# --- 1. Parse WXR --------------------------------------------------------

print(f'Parsing {WXR_PATH}...')
tree = ET.parse(WXR_PATH)
root = tree.getroot()

# Build attachment_id → attachment_url map
attachments = {}
for item in root.iter('item'):
    if t(item, 'wp:post_type') == 'attachment':
        aid = t(item, 'wp:post_id')
        url = t(item, 'wp:attachment_url')
        if aid and url:
            attachments[aid] = url

# Collect published posts
posts_to_import = []
for item in root.iter('item'):
    if t(item, 'wp:post_type') != 'post':
        continue
    if t(item, 'wp:status') != 'publish':
        continue
    thumb_id = None
    for pm in item.findall('wp:postmeta', NS):
        key_el = pm.find('wp:meta_key', NS)
        val_el = pm.find('wp:meta_value', NS)
        if key_el is not None and key_el.text == '_thumbnail_id' and val_el is not None:
            thumb_id = val_el.text
            break
    posts_to_import.append({
        'wp_id': t(item, 'wp:post_id'),
        'title': t(item, 'title'),
        'slug': unquote(t(item, 'wp:post_name')),
        'date': t(item, 'wp:post_date_gmt') or t(item, 'wp:post_date'),
        'body_html': t(item, 'content:encoded'),
        'creator': t(item, 'dc:creator'),
        'thumb_id': thumb_id,
        'thumb_url': attachments.get(thumb_id) if thumb_id else None,
    })

print(f'  Found {len(posts_to_import)} published posts.')

# --- 2. Image-URL collection (skipped) ----------------------------------
# zhicwood.co (the old WP host) currently serves an HTML placeholder for
# every image URL — confirmed by checking Content-Type: text/html on
# multiple uploads in /2025/05/. With no live source for the binaries,
# we skip downloads entirely. Articles import as text-only:
#   - cover_id = NULL (the home page falls back to /docs/test-media/*)
#   - inline <img> tags are stripped from the body
# If the operator later finds the original uploads folder, a follow-up
# script can attach Payload Media docs and rewrite article bodies.

all_image_urls = set()
print('  Skipping image downloads (old host no longer serves originals).')

# --- 3. Connect to DB ----------------------------------------------------

DB_URI = load_db_uri()
conn = psycopg2.connect(DB_URI)
conn.autocommit = False
cur = conn.cursor()


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# --- 4. (no image inserts in text-only mode) -----------------------------
url_to_media = {}  # always empty in text-only mode

# --- 5. Upsert author + category -----------------------------------------

AUTHOR_NAME = 'مدیر سایت'
AUTHOR_SLUG = 'admin'
CATEGORY_NAME = 'بلاگ'
CATEGORY_SLUG = 'blog'

cur.execute('SELECT id FROM authors WHERE slug = %s', (AUTHOR_SLUG,))
row = cur.fetchone()
if row:
    author_id = row[0]
    print(f'\nAuthor exists: id={author_id}')
else:
    cur.execute(
        """
        INSERT INTO authors (name, slug, role, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
        """,
        (AUTHOR_NAME, AUTHOR_SLUG, 'نویسنده', now_iso(), now_iso()),
    )
    author_id = cur.fetchone()[0]
    print(f'\nAuthor created: id={author_id} ({AUTHOR_NAME})')

cur.execute('SELECT id FROM journal_categories WHERE slug = %s', (CATEGORY_SLUG,))
row = cur.fetchone()
if row:
    category_id = row[0]
    print(f'Category exists: id={category_id}')
else:
    cur.execute(
        """
        INSERT INTO journal_categories (name, slug, seo_noindex, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
        """,
        (CATEGORY_NAME, CATEGORY_SLUG, False, now_iso(), now_iso()),
    )
    category_id = cur.fetchone()[0]
    print(f'Category created: id={category_id} ({CATEGORY_NAME})')

conn.commit()

# --- 6. HTML → Lexical conversion ----------------------------------------

FORMAT_BOLD = 1
FORMAT_ITALIC = 2

def text_node(text, fmt=0):
    return {
        'type': 'text', 'format': fmt, 'style': '', 'mode': 'normal',
        'text': text, 'detail': 0, 'version': 1,
    }


def parse_inline(node, fmt=0):
    out = []
    for child in node.children:
        if isinstance(child, NavigableString):
            txt = str(child)
            if txt:
                out.append(text_node(txt, fmt))
        elif child.name in ('strong', 'b'):
            out.extend(parse_inline(child, fmt | FORMAT_BOLD))
        elif child.name in ('em', 'i'):
            out.extend(parse_inline(child, fmt | FORMAT_ITALIC))
        elif child.name == 'br':
            out.append({
                'type': 'linebreak', 'version': 1,
            })
        elif child.name == 'a':
            href = child.get('href') or ''
            inner = parse_inline(child, fmt)
            if href:
                out.append({
                    'type': 'link', 'version': 3,
                    'format': '', 'indent': 0, 'direction': 'rtl',
                    'fields': {'url': href, 'newTab': True, 'linkType': 'custom'},
                    'children': inner,
                })
            else:
                out.extend(inner)
        else:
            out.extend(parse_inline(child, fmt))
    return out


def paragraph(children):
    if not children:
        return None
    return {
        'type': 'paragraph', 'children': children,
        'direction': 'rtl', 'format': '', 'indent': 0, 'version': 1,
        'textFormat': 0, 'textStyle': '',
    }


def heading(tag, children):
    return {
        'type': 'heading', 'tag': tag, 'children': children,
        'direction': 'rtl', 'format': '', 'indent': 0, 'version': 1,
    }


def list_block(name, items):
    list_type = 'bullet' if name == 'ul' else 'number'
    return {
        'type': 'list', 'listType': list_type, 'tag': name,
        'start': 1, 'children': items,
        'direction': 'rtl', 'format': '', 'indent': 0, 'version': 1,
    }


def listitem(children, value=1):
    return {
        'type': 'listitem', 'children': children, 'value': value,
        'direction': 'rtl', 'format': '', 'indent': 0, 'version': 1,
    }


def upload_node(media_id):
    return {
        'type': 'upload', 'version': 3, 'format': '',
        'relationTo': 'media', 'value': media_id, 'fields': None,
    }


def lexical_root(blocks):
    return {
        'root': {
            'type': 'root', 'children': blocks,
            'direction': 'rtl', 'format': '', 'indent': 0, 'version': 1,
        }
    }


def convert_html_to_lexical(html_str, url_map):
    soup = BeautifulSoup(html_str, 'html.parser')
    blocks = []

    def emit_loose_text(buf):
        text = ''.join(buf).strip()
        if text:
            blocks.append(paragraph([text_node(text)]))
        buf.clear()

    def walk(node):
        loose = []
        for child in node.children:
            if isinstance(child, NavigableString):
                txt = str(child)
                if txt.strip():
                    loose.append(txt)
                continue
            name = child.name
            if name == 'p':
                emit_loose_text(loose)
                pblock = paragraph(parse_inline(child))
                if pblock:
                    blocks.append(pblock)
            elif name in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
                emit_loose_text(loose)
                blocks.append(heading(name if name != 'h1' else 'h2', parse_inline(child)))
            elif name in ('ul', 'ol'):
                emit_loose_text(loose)
                items = []
                for li in child.find_all('li', recursive=False):
                    li_children = []
                    for li_child in li.children:
                        if isinstance(li_child, NavigableString):
                            txt = str(li_child)
                            if txt.strip():
                                li_children.append(text_node(txt))
                        elif li_child.name == 'p':
                            li_children.extend(parse_inline(li_child))
                        elif li_child.name in ('strong', 'b'):
                            li_children.extend(parse_inline(li_child, FORMAT_BOLD))
                        elif li_child.name in ('em', 'i'):
                            li_children.extend(parse_inline(li_child, FORMAT_ITALIC))
                        else:
                            li_children.extend(parse_inline(li_child))
                    if li_children:
                        items.append(listitem(li_children))
                if items:
                    blocks.append(list_block(name, items))
            elif name == 'img':
                emit_loose_text(loose)
                src = child.get('src')
                mapped = url_map.get(src)
                if mapped:
                    blocks.append(upload_node(mapped['id']))
            elif name in ('blockquote',):
                emit_loose_text(loose)
                inner = parse_inline(child)
                if inner:
                    blocks.append({
                        'type': 'quote', 'children': inner,
                        'direction': 'rtl', 'format': '', 'indent': 0, 'version': 1,
                    })
            elif name in ('hr',):
                emit_loose_text(loose)
                blocks.append({'type': 'horizontalrule', 'version': 1})
            elif name in ('div', 'section', 'article', 'figure'):
                emit_loose_text(loose)
                walk(child)
            elif name in ('script', 'style', 'iframe', 'embed', 'noscript'):
                continue
            else:
                # Fallthrough: treat unknown wrappers as inline
                inline = parse_inline(child)
                if inline:
                    blocks.append(paragraph(inline))

        emit_loose_text(loose)

    walk(soup)

    if not blocks:
        blocks.append(paragraph([text_node('')]))

    return lexical_root(blocks)


# --- 7. Excerpt extraction -----------------------------------------------

def first_paragraph_text(html_str, limit=200):
    soup = BeautifulSoup(html_str, 'html.parser')
    for p in soup.find_all('p'):
        text = p.get_text(' ', strip=True)
        if text:
            if len(text) > limit:
                text = text[:limit].rstrip() + '…'
            return text
    return ''


# --- 8. Reading-time computation -----------------------------------------

def reading_time_minutes(html_str):
    soup = BeautifulSoup(html_str, 'html.parser')
    text = soup.get_text(' ', strip=True)
    words = len(text.split())
    return max(1, round(words / 200))


# --- 9. Insert articles --------------------------------------------------

print('\nInserting articles...')
imported = 0
skipped = 0
for p in posts_to_import:
    cur.execute('SELECT id FROM articles WHERE slug = %s', (p['slug'],))
    if cur.fetchone():
        print(f'  SKIP {p["slug"]} (already exists)')
        skipped += 1
        continue

    body_jsonb = convert_html_to_lexical(p['body_html'], url_to_media)
    excerpt = first_paragraph_text(p['body_html']) or p['title'][:200]

    cover_id = None
    if p['thumb_url'] and p['thumb_url'] in url_to_media:
        cover_id = url_to_media[p['thumb_url']]['id']

    pub_date = None
    if p['date']:
        try:
            dt = datetime.fromisoformat(p['date'].replace(' ', 'T'))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            pub_date = dt.isoformat()
        except Exception:
            pub_date = now_iso()
    if not pub_date:
        pub_date = now_iso()

    rt = reading_time_minutes(p['body_html'])

    cur.execute(
        """
        INSERT INTO articles (
            title, slug, body, excerpt, cover_id, author_id, category_id,
            status, published_at, featured, reading_time_minutes,
            created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            p['title'], p['slug'], Json(body_jsonb), excerpt, cover_id,
            author_id, category_id, 'published', pub_date, False, rt,
            now_iso(), now_iso(),
        ),
    )
    article_id = cur.fetchone()[0]
    print(f'  + article[{article_id}] {p["slug"]} (cover={cover_id}, ~{rt}min)')
    imported += 1

conn.commit()
cur.close()
conn.close()

print(f'\nDone. Imported {imported} articles, skipped {skipped}.')
