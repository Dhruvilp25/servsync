# ServSync

Sync data from Notion to Google Sheets on a schedule. You configure jobs in a small React dashboard; the rest runs on AWS (Lambda, Step Functions, EventBridge)


---

## What you need before you start the application.

- **Node.js** (v18+) and **npm**
- **AWS account** (CLI configured: `aws configure` with access key and region, e.g. `us-east-1`)
- **Notion**: A database and an [integration](https://www.notion.so/my-integrations) — you’ll use the integration’s token and share the database with it
- **Google Sheets**: A sheet and a [service account](https://console.cloud.google.com/iam-admin/serviceaccounts) with a JSON key — the sheet must be shared with the service account email

---

## 1. Create secrets in AWS

In **AWS Console** → **Secrets Manager** (in the region you’ll deploy to, e.g. `us-east-1`), create two secrets:

| Secret name       | Value |
|-------------------|--------|
| `NOTION_TOKEN`    | Your Notion integration token (e.g. `ntn_...`), or `{"token":"ntn_..."}` |
| `GOOGLE_SA_JSON`  | The full Google service account JSON (paste the whole file), or `{"json":"<paste JSON here>"}` |

Use these **exact** names; the app looks for them.

---

## 2. Deploy the backend

From the repo root:

```bash
npm install
cd infra && npm install
npx cdk bootstrap    # once per AWS account/region
npx cdk deploy
```

When it finishes, copy the **HttpApiUrl** from the output (e.g. `https://abc123.execute-api.us-east-1.amazonaws.com`). You’ll need it for the dashboard.

---

## 3. Run the dashboard locally

In the repo root:

```bash
cd web
npm install
```

Create a file `web/.env` with:

```
VITE_API_BASE=https://YOUR_API_ID.execute-api.REGION.amazonaws.com
```

Use the **HttpApiUrl** from step 2 (no trailing slash).

Start the app:

```bash
npm run dev
```

Open the URL Vite prints (e.g. http://localhost:5173).

---

## 4. Create and run a sync job

1. In the dashboard, click **New Job**.
2. **Job ID** — Any id (e.g. `notion-to-sheets-1`).
3. **Notion Database ID** — From the Notion database URL (the long id). In Notion, open the database → ⋮ → **Connections** → add your integration so it can read the database.
4. **Google Sheet ID** — From the sheet URL: `https://docs.google.com/spreadsheets/d/SHEET_ID/...`.
5. **Range** — Use the **tab name** at the bottom of the sheet:
   - If the tab is “Sheet1”: `Sheet1!A1:C`
   - If the tab has a space (e.g. “To-do list”): `'To-do list'!A1:C` (single quotes).
6. Save the job, open it, then click **Run now**. On the job page you’ll see **Run history** with status (Succeeded / Failed / Running) and basic stats.

You can **Edit** a job later (e.g. to fix the range or sheet) from the job detail page.

Syncs also run automatically every 5 minutes for jobs that are due; you don’t have to click “Run now” for that.

---

## New AWS account?

If you’re using a brand‑new account (e.g. new free tier), follow **[docs/SETUP-NEW-ACCOUNT.md](docs/SETUP-NEW-ACCOUNT.md)** for a full step‑by‑step (secrets, bootstrap, deploy, dashboard, first job).

---

## Automatic deploys (CI/CD)

If you use GitHub and want the stack to deploy when you push to `main`:

1. In the repo go to **Settings** → **Secrets and variables** → **Actions**.
2. Add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (from an IAM user that can deploy the CDK stack).
3. Optionally add `AWS_REGION` (default is `us-east-1`).

After that, every push to `main` runs the workflow: it validates the stack with `cdk synth`, then runs `cdk deploy` so you don’t need to deploy from your laptop.
