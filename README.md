# GGBOX

React/Vite prototype for GGBOX drops, marketplace, account, public profile, and pack opening flows.

## Development

```bash
pnpm install
pnpm dev
```

## Checks

```bash
pnpm test
pnpm build
```

## Deploy

The project is ready for Netlify:

- Build command: `npm run build` or `pnpm build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

`netlify.toml` already includes SPA redirects and cache headers for video/image assets.
