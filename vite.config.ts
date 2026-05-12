import { existsSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

declare module 'node:fs' {
  export function existsSync(path: string): boolean
}
declare const process: { env: Record<string, string | undefined> }

// A `public/CNAME` file means GitHub Pages is serving the site from a custom
// domain at the root path, so assets must be referenced from `/`. Without one,
// the site lives at `username.github.io/<repo>/` and `base` must match.
const hasCustomDomain = existsSync('public/CNAME')
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = hasCustomDomain || !repoName ? '/' : `/${repoName}/`

export default defineConfig({
  base,
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
