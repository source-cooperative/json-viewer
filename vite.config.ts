import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  base: '/json-viewer/',
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@openeo/vue-components/assets/*',
          dest: 'assets',
        },
      ],
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
