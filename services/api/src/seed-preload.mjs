// Preload shim: Payload 3 + Node 24 + tsx hits a CJS/ESM interop bug where
// `@next/env` exports `loadEnvConfig` at the top level under CommonJS but
// Payload's compiled `loadEnv.js` does `import nextEnvImport from '@next/env'`
// then destructures `nextEnvImport.default.loadEnvConfig`. Under tsx's
// CJS-bridge, `require('@next/env').default` is `undefined`, so payload crashes
// before buildConfig even runs.
//
// Fix: patch require cache. Before any other module loads @next/env, we load
// it ourselves and ensure both `.default` and top-level exports are populated.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const nextEnv = require('@next/env');
if (!nextEnv.default) {
  Object.defineProperty(nextEnv, 'default', { value: nextEnv, enumerable: false });
}
