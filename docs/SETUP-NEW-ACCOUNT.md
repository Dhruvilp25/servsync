# ServSync: Set up on a new AWS account

Use this when you’re starting fresh (e.g. new free-tier account). All steps assume you’re in the same **region** (e.g. `us-east-1`) for everything.

---

## 1. AWS account and CLI

- Create or sign in to your AWS account at [aws.amazon.com](https://aws.amazon.com).
- Install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) if you don’t have it.
- Create an access key: **AWS Console** → **IAM** → **Users** → your user → **Security credentials** → **Create access key** (e.g. “CLI”).
- Configure the CLI (use the new account’s key):
  ```bash
  aws configure
  ```
  Enter **Access Key ID**, **Secret Access Key**, and default **region** (e.g. `us-east-1`).

---

## 2. Store secrets in SSM Parameter Store (free)

ServSync reads credentials from **SSM Parameter Store** `SecureString` parameters (free for
standard parameters — no Secrets Manager charge). Create both in the **same region** you’ll
deploy to:

```bash
# Notion integration token (starts with ntn_...)
aws ssm put-parameter --name /servsync/NOTION_TOKEN --type SecureString \
  --value 'ntn_xxxxxxxxxxxxxxxxxxxx'

# Google service-account JSON (paste the whole file)
aws ssm put-parameter --name /servsync/GOOGLE_SA_JSON --type SecureString \
  --value "$(cat /path/to/service-account.json)"
```

Names must be **exactly** `/servsync/NOTION_TOKEN` and `/servsync/GOOGLE_SA_JSON`.

### Google Cloud (for `GOOGLE_SA_JSON`)

1. [Google Cloud Console](https://console.cloud.google.com/) → create/pick a project.
2. **Enable the Google Sheets API** (APIs & Services → Library → “Google Sheets API” → Enable).
3. Create a **service account** (IAM & Admin → Service Accounts), then add a **JSON key**
   (Keys → Add key → JSON) — that file is the value above.
4. **Share your sheet** with the service account email as **Editor**.

(Your Notion integration must also be set up, and the database shared with it.)

---

## 3. Repo and dependencies

From your project root (where `infra/` and `web/` are):

```bash
# Root
npm install

# Infra (needed for CDK deploy)
cd infra && npm install && cd ..
```

(You can run `cd web && npm install` later before starting the dashboard.)

---

## 4. Bootstrap CDK (once per account/region)

From repo root:

```bash
cd infra
npx cdk bootstrap
```

If it asks for approval, confirm. When it finishes, CDK is ready for this account/region.

---

## 5. Deploy the stack

Still in `infra/`:

```bash
npx cdk deploy
```

- Approve any IAM/security prompts.
- When it finishes, the **outputs** will include **HttpApiUrl** (e.g. `https://abc123.execute-api.us-east-1.amazonaws.com`).
- Copy that URL (no trailing slash); you’ll use it for the dashboard.

---

## 6. Dashboard (local)

From repo root:

```bash
cd web
npm install
```

Create or edit `web/.env`:

```bash
VITE_API_BASE=https://YOUR_API_ID.execute-api.REGION.amazonaws.com
```

Use the **HttpApiUrl** from step 5 (no trailing slash).

Start the app:

```bash
npm run dev
```

Open the URL Vite prints (e.g. http://localhost:5173).

---

## 7. Create and run a job

1. In the dashboard, click **New Job**.
2. **Job ID**: any id (e.g. `notion-to-sheets-1`).
3. **Notion Database ID**: from the Notion database URL (the long id). The database must be **shared with your Notion integration** (⋮ → Connections → Add connection).
4. **Google Sheet ID**: from the sheet URL (`/d/SHEET_ID/...`).
5. **Fields to sync**: the **Notion property names** you want, in column order (map to A, B,
   C… and become the header row). Names must match your database exactly.
6. **Range**: use the **tab name** at the bottom of the sheet. Examples:
   - `Sheet1!A1:C` if the tab is “Sheet1”.
   - `'To-do list'!A1:C` if the tab is “To-do list” (quotes needed for spaces).
7. Save, open the job, then **Run now**. Check **Run history** for status. Each run overwrites
   the range (a mirror of your database — no duplicate rows).

---

## Teardown

```bash
cd infra && npx cdk destroy
aws ssm delete-parameter --name /servsync/NOTION_TOKEN
aws ssm delete-parameter --name /servsync/GOOGLE_SA_JSON
```

---

## Quick checklist

- [ ] New AWS account + CLI configured (`aws configure`)
- [ ] SSM: `/servsync/NOTION_TOKEN` and `/servsync/GOOGLE_SA_JSON` created in the deploy region
- [ ] Google Sheets API enabled; sheet shared with the service account email
- [ ] `infra`: `npm install` and `npx cdk bootstrap`
- [ ] `infra`: `npx cdk deploy` → copy **HttpApiUrl**
- [ ] `web/.env`: `VITE_API_BASE=<HttpApiUrl>`
- [ ] `web`: `npm install` and `npm run dev`
- [ ] Notion DB shared with integration; create job with fields + correct Sheet range (tab name)

If something fails, check CloudWatch Logs for the Lambda that errors (e.g. PullNotion, PushSheets) and the main [README](../README.md) for the troubleshooting table.
