#!/usr/bin/env node
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  format: 'esm',
  platform: 'node',
  target: 'node18',
  external: ['__STATIC_CONTENT_MANIFEST'],
  plugins: [],
}).catch(() => process.exit(1)); 