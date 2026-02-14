# ServSync (MVP)
Serverless sync: Notion->Google Sheets using AWS (Lambda, Step Functions, EventBridge), React/Tailwind dashboard.

**Setting up on a new AWS account?** → See **[docs/SETUP-NEW-ACCOUNT.md](docs/SETUP-NEW-ACCOUNT.md)** for a full step-by-step.

## Quick start (first-time / deploy)

1. **Secrets** — Create in AWS Secrets Manager (same account/region as deploy):
   - `NOTION_TOKEN`: plain token string (e.g. `ntn_...`) or `{ "token": "ntn_..." }`
   - `GOOGLE_SA_JSON`: full service account JSON string, or `{ "json": "<entire SA JSON string>" }`
2. **Notion** — In the job, use the **Database ID** from the Notion database URL (with or without dashes). The database must be **shared with your integration** (database ⋮ → Connections → Add connection).
3. **Google Sheet** — In the job, **Range** must use the **actual tab name** (see the tab at the bottom of the sheet). If the tab is not "Sheet1", use that name, e.g. `To-do list!A1:C`. If the tab name has **spaces**, wrap it in single quotes: `'To-do list'!A1:C`.
4. **Install** — From repo root:
   - `npm install` (root)
   - `cd infra && npm install`
   - `cd ../web && npm install`
5. **Deploy** — From repo root:
   - `cd infra && npx cdk bootstrap` (once per account/region)
   - `npx cdk deploy`
   - Note the **HttpApiUrl** in the outputs.

## Run and test

1. **Backend** — Already running in AWS after deploy. No local server for API/Lambdas.
2. **Dashboard** — Point the React app at your API, then start the dev server:
   - In `web/` create or edit `.env`:
     ```bash
     VITE_API_BASE=https://YOUR_API_ID.execute-api.REGION.amazonaws.com
     ```
     (Use the HttpApiUrl from `cdk deploy` output; no trailing slash.)
   - From repo root:
     ```bash
     cd web && npm run dev
     ```
   - Open the URL Vite prints (e.g. http://localhost:5173).
3. **Test flow** — Create a job (New Job) with a Notion DB ID and Google Sheet ID, then open the job and use **Run now**. Check **Run history** on the job detail page for status and stats.
