import { defineConfig } from 'vite';

// IMPORTANT: GitHub Pages serves this app under a repo path:
// https://<user>.github.io/<repo>/
// Set VITE_BASE to "/<repo>/" (including leading+trailing slashes).
const base = process.env.VITE_BASE ?? '/a205_layout/';

export default defineConfig({
  base,
});
