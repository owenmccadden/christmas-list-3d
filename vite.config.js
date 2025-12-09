import { defineConfig } from 'vite'

export default defineConfig({
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true
  },
  server: {
    host: true,
    open: true
  },
  // Enable JSON imports
  json: {
    stringify: false
  }
})
