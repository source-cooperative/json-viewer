# Deployment is handled by Cloudflare Pages via its GitHub App integration.
# Cloudflare Pages builds and deploys on every push to main, and posts
# PR preview URLs automatically via the cloudflare-workers-and-pages bot.
#
# Build settings configured in the Cloudflare dashboard:
#   Build command:    pnpm run build
#   Output directory: dist
#   Node version:     (set via NODE_VERSION env var or .node-version file)
