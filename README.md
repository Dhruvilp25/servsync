# ServSync

Sync data from **Notion** to **Google Sheets** on a schedule. You configure jobs in a small
React dashboard; the rest runs serverless on AWS (Lambda, Step Functions, EventBridge,
DynamoDB). Each run is a **full refresh** — ServSync mirrors your Notion database into the
sheet, so there are no duplicate rows.

---

## What you need before you start

- **Node.js** (v18+) and **npm**
- **AWS account** with the CLI configured (`aws configure` — access key + default region)
- **Notion**: a database and an [integration](https://www.notion.so/my-integrations). You’ll
  use the integration token and share the database with the integration.
- **Google Cloud**: a service account with a JSON key, **the Google Sheets API enabled**, and
  a sheet shared with the service account’s email (see [step 1b](#1b-google-cloud-setup)).

---

## 1a. Store your secrets in AWS (SSM Parameter Store — free)

ServSync reads the Notion token and Google service-account JSON from **SSM Parameter Store**
as `SecureString` parameters (free for standard parameters, unlike Secrets Manager). Create
them with the CLI, in the **same region** you’ll deploy to:

```bash
# Notion integration token (starts with ntn_...). Plain string is fine.
aws ssm put-parameter \
  --name /servsync/NOTION_TOKEN \
  --type SecureString \
  --value 'ntn_xxxxxxxxxxxxxxxxxxxx'

# Google service-account JSON — paste the whole file as the value.
aws ssm put-parameter \
  --name /servsync/GOOGLE_SA_JSON \
  --type SecureString \
  --value "$(cat /path/to/service-account.json)"
```

Use these **exact** names; the app looks for them. (Both also accept a JSON wrapper —
`{"token":"ntn_..."}` / `{"json":"<json>"}` — if you prefer.)

> The service-account JSON is ~2 KB, well under the 4 KB free standard-parameter limit.

## 1b. Google Cloud setup

1. In the [Google Cloud Console](https://console.cloud.google.com/), create (or pick) a project.
2. **Enable the Google Sheets API**: APIs & Services → Library → search “Google Sheets API” → **Enable**.
3. **Create a service account**: IAM & Admin → Service Accounts → Create. No roles needed.
4. **Create a key**: open the service account → Keys → Add key → **JSON**. This downloads the
   JSON you paste into `/servsync/GOOGLE_SA_JSON` above.
5. **Share your sheet** with the service account’s email (`...@...iam.gserviceaccount.com`) as
   an **Editor**.

---

## 2. Deploy the backend

From the repo root:

```bash
npm install
cd infra && npm install
npx cdk bootstrap    # once per AWS account/region
npx cdk deploy
```

The stack deploys to the region from your AWS CLI profile (override with `CDK_DEFAULT_REGION`
or `AWS_REGION`; defaults to `us-east-1`). When it finishes, copy the **HttpApiUrl** output
(e.g. `https://abc123.execute-api.us-east-1.amazonaws.com`) — you’ll need it for the dashboard.

---

## 3. Run the dashboard locally

```bash
cd web
npm install
```

Create `web/.env`:

```
VITE_API_BASE=https://YOUR_API_ID.execute-api.REGION.amazonaws.com
```

Use the **HttpApiUrl** from step 2 (no trailing slash). Then:

```bash
npm run dev
```

Open the URL Vite prints (e.g. http://localhost:5173).

---

## 4. Create and run a sync job

1. In the dashboard, click **New Job**.
2. **Job ID** — any id (e.g. `notion-to-sheets-1`).
3. **Notion Database ID** — the long id from the database URL. In Notion, open the database →
   ⋮ → **Connections** → add your integration so it can read the database.
4. **Google Sheet ID** — from the sheet URL: `https://docs.google.com/spreadsheets/d/SHEET_ID/...`.
5. **Fields to sync** — list the **Notion property names** you want, in column order. They map
   to columns A, B, C… and become the sheet’s header row. **Names must match your database
   exactly** (case-sensitive). Most property types are supported (text, number, select,
   status, multi-select, date, checkbox, people, formula, url/email/phone, …).
6. **Range** — use the **tab name** from the bottom of the sheet:
   - Tab “Sheet1”, three fields: `Sheet1!A1:C`
   - Tab with a space: `'To-do list'!A1:C` (single quotes)
7. Save the job, open it, then click **Run now**. The **Run history** shows status
   (Succeeded / Failed / Running) and basic stats.

Each run **clears the range and rewrites it** with a header row + your data, so the sheet
always mirrors Notion (re-running never creates duplicates). Jobs also run automatically about
every 5 minutes — you don’t have to click “Run now”.

You can **Edit** a job later (fields, range, sheet) from the job detail page.

---

## Cost

Designed to run in the **AWS always-free tier** — roughly **$0/month** at demo scale:

| Service | Cost |
|---|---|
| Lambda, DynamoDB (on-demand), EventBridge | $0 (always-free tier) |
| Step Functions | ~$0 (4,000 free transitions/mo) |
| API Gateway (HTTP) | pennies (only when you use the dashboard) |
| **SSM Parameter Store** (SecureString, standard) | **$0** |

(Using SSM instead of Secrets Manager avoids the ~$0.80/mo Secrets Manager charge.)

---

## Teardown

To remove everything and stop any charges:

```bash
cd infra && npx cdk destroy
```

Then delete the two SSM parameters (they’re created outside the stack, so `destroy` leaves them):

```bash
aws ssm delete-parameter --name /servsync/NOTION_TOKEN
aws ssm delete-parameter --name /servsync/GOOGLE_SA_JSON
```

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Run is **FAILED**, “Job not found” | Wrong region — secrets/tables must be in the deploy region. |
| Sheet rows are **blank** | Field names don’t match your Notion property names exactly (case-sensitive). |
| “Could not find database” / empty pull | Database not **shared with your integration** (⋮ → Connections). |
| Sheets error “API has not been used / disabled” | **Enable the Google Sheets API** in the GCP project ([step 1b](#1b-google-cloud-setup)). |
| Sheets error “Unable to parse range” | Use the real **tab name**; quote names with spaces: `'To-do list'!A1:C`. |
| Sheets 403 / permission denied | Share the sheet with the **service account email** as Editor. |
| Parameter not found | SSM parameter name typo — must be `/servsync/NOTION_TOKEN` and `/servsync/GOOGLE_SA_JSON`. |

When a run fails, the error/cause is shown on the job page; full logs are in **CloudWatch**
under the relevant Lambda (e.g. `PullNotion`, `PushSheets`).

---

## New AWS account?

If you’re starting fresh (e.g. new free tier), follow
**[docs/SETUP-NEW-ACCOUNT.md](docs/SETUP-NEW-ACCOUNT.md)** for the full step-by-step.

---

## Automatic deploys (CI/CD)

To deploy the stack on every push to `main`:

1. In the repo: **Settings** → **Secrets and variables** → **Actions**.
2. Add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (an IAM user that can deploy the stack).
3. Optionally add `AWS_REGION` (default `us-east-1`).

The workflow validates with `cdk synth`, then runs `cdk deploy`.

---

## Notes

- **Single-tenant by design.** Jobs use a fixed `tenantId` and the API is unauthenticated —
  intended for self-hosted / demo use, not a public multi-user service.
- Architecture: API Gateway → Lambda; EventBridge (schedule) or the API → Step Functions
  (`pull-notion` → `transform-map` → `push-sheets` → `record-run`); DynamoDB for job/run state;
  SSM Parameter Store for credentials. Licensed under [MIT](LICENSE).
