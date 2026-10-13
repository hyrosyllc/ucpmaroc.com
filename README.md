# UCP Maroc

UCP Maroc is a React 18, TypeScript, and Vite platform for talent services, portfolio websites, tenant storefronts, ecommerce, billing, and platform administration. Supabase provides authentication, Postgres, storage, realtime updates, and Edge Functions.

## Local Development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the browser-facing Supabase settings. Add server-only values to Supabase Edge Function secrets, never to `VITE_` variables.
3. Start Vite with `npm run dev`.

Available checks: `npm run build`, `npm run lint`, and `npm run preview`. There is no `npm test` script in `package.json`.

## Project Map

- [Architecture and source map](docs/PROJECT_ARCHITECTURE.md)
- [Repository file and backend catalog](docs/REPOSITORY_CATALOG.md)
- [Feature catalog](docs/FEATURES.md)
- [Billing operations](docs/BILLING_OPERATIONS.md)
- [Billing design notes](BILLING_GUIDE.md)
- [Development resources and agent skills](docs/DEVELOPMENT_RESOURCES.md)

For routes, modules, state ownership, backend functions, and deployment caveats, start with the architecture map. Treat local source presence and uncommitted work separately from production deployment status.
