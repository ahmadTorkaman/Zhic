export default function ThreeLab() {
  return (
    <article>
      <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-accent">
        Lab · 3D / WebXR
      </p>
      <h1 className="font-serif text-5xl font-light leading-tight">
        3D &amp; WebXR experiments
      </h1>
      <p className="mt-6 max-w-2xl text-stone">
        Trial space for the WebXR product viewer. The current direction is
        Google&apos;s <code>&lt;model-viewer&gt;</code> web component because
        it gives us zero-config Scene Viewer on Android and Quick Look on
        iOS. Alternatives (react-three-fiber, threlte) stay on the table
        until we measure them here.
      </p>

      <h2 className="mt-16 font-serif text-2xl font-light">Decision matrix</h2>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand text-left text-[10px] uppercase tracking-[0.2em] text-stone">
              <th className="py-3 pr-4">Option</th>
              <th className="py-3 pr-4">AR on iOS</th>
              <th className="py-3 pr-4">AR on Android</th>
              <th className="py-3 pr-4">Bundle cost</th>
              <th className="py-3 pr-4">Customization</th>
            </tr>
          </thead>
          <tbody className="text-stone">
            <tr className="border-b border-sand/40">
              <td className="py-3 pr-4 text-charcoal">&lt;model-viewer&gt;</td>
              <td className="py-3 pr-4">USDZ Quick Look</td>
              <td className="py-3 pr-4">Scene Viewer</td>
              <td className="py-3 pr-4">~70kb gz</td>
              <td className="py-3 pr-4">Medium</td>
            </tr>
            <tr className="border-b border-sand/40">
              <td className="py-3 pr-4 text-charcoal">react-three-fiber</td>
              <td className="py-3 pr-4">Manual USDZ link</td>
              <td className="py-3 pr-4">Manual</td>
              <td className="py-3 pr-4">~150kb+ gz</td>
              <td className="py-3 pr-4">Total</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 text-charcoal">threlte</td>
              <td className="py-3 pr-4">Manual</td>
              <td className="py-3 pr-4">Manual</td>
              <td className="py-3 pr-4">~120kb+ gz</td>
              <td className="py-3 pr-4">Total (Svelte)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="mt-16 font-serif text-2xl font-light">Asset budgets</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-stone">
        <li>glTF / GLB: ≤ 2 MB, draco-compressed, KTX2 textures preferred.</li>
        <li>Polycount: ≤ 100k triangles per model.</li>
        <li>Material slots: ≤ 4 unless variants are declared via KHR_materials_variants.</li>
        <li>USDZ pair: ≤ 8 MB.</li>
        <li>Poster image: real, branded, eager-loaded.</li>
      </ul>

      <h2 className="mt-16 font-serif text-2xl font-light">To test</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-stone">
        <li>Click-to-load vs auto-load — measure LCP impact on PDPs.</li>
        <li>HDR environment lighting vs studio lighting at the same file size.</li>
        <li>Material variant swap latency on a mid-range Android.</li>
        <li>AR placement: floor for beds, but verify Quick Look anchor on iOS.</li>
        <li>Fallback when WebGL is unavailable: still gallery only.</li>
      </ul>

      <p className="mt-12 text-xs text-stone/70">
        Note: this page intentionally does not load any 3D library yet.
        Add the viewer once we are ready to measure it against budgets.
      </p>
    </article>
  );
}
