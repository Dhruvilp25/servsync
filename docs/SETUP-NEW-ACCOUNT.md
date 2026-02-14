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

## 2. Create secrets in AWS Secrets Manager

In the AWS Console, go to **Secrets Manager** in the **same region** you’ll deploy to (e.g. `us-east-1`).

### NOTION_TOKEN

- **Create secret** → **Other type of secret**.
- **Key/value**: add one key, e.g. `token`, value = your Notion integration token (starts with `ntn_...`).  
  Or use **Plaintext** and paste the token only.
- **Secret name**: exactly `NOTION_TOKEN`.
- Create the secret.

### GOOGLE_SA_JSON

- **Create secret** → **Other type of secret**.
- **Plaintext**: paste the **entire** Google Cloud service account JSON (the file you download when you create a service account key).  
  Or use one key `json` and paste that same JSON as the value.
- **Secret name**: exactly `GOOGLE_SA_JSON`.
- Create the secret.

(Your Notion integration and Google Sheet must already be set up; the sheet must be shared with the service account email.)

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
5. **Range**: use the **tab name** at the bottom of the sheet. Examples:
   - `Sheet1!A1:C` if the tab is “Sheet1”.
   - `'To-do list'!A1:C` if the tab is “To-do list” (quotes needed for spaces).
6. Save, open the job, then **Run now**. Check **Run history** for status.

---

## Quick checklist

- [ ] New AWS account + CLI configured (`aws configure`)
- [ ] Secrets Manager: `NOTION_TOKEN` and `GOOGLE_SA_JSON` created in the deploy region
- [ ] `infra`: `npm install` and `npx cdk bootstrap`
- [ ] `infra`: `npx cdk deploy` → copy **HttpApiUrl**
- [ ] `web/.env`: `VITE_API_BASE=<HttpApiUrl>`
- [ ] `web`: `npm install` and `npm run dev`
- [ ] Notion DB shared with integration; create job with correct Sheet range (tab name)

If something fails, check CloudWatch Logs for the Lambda that errors (e.g. PullNotion, PushSheets) and the main [README](../README.md) for Notion/Sheets setup details.
