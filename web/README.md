# ServSync dashboard

The React (Vite + TypeScript + Tailwind) dashboard for [ServSync](../README.md). Create,
edit, and run Notion → Google Sheets sync jobs, and watch run history.

## Run locally

```bash
npm install
echo "VITE_API_BASE=https://YOUR_API_ID.execute-api.REGION.amazonaws.com" > .env
npm run dev
```

`VITE_API_BASE` is the **HttpApiUrl** output from `cdk deploy` (no trailing slash). See the
[root README](../README.md) for the full backend setup.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint

## Notes

- The dashboard talks only to the deployed HTTP API; there are no other env vars.
- It is single-tenant by design (a fixed `tenantId`) — fine for a self-hosted/demo setup.
