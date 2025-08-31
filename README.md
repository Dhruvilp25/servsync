# ServSync (MVP)
Serverless sync: Notion -> Google Sheets using AWS (Lambda, Step Functions, EventBridge), React/Tailwind dashboard.

## Quick start
1) Create secrets in AWS Secrets Manager:
   - NOTION_TOKEN: { token: "ntn_..." }
   - GOOGLE_SA_JSON: { json: "{...full SA JSON...}" }
2) `npm install` in subprojects as you add them.
3) `cd infra && cdk bootstrap && cdk deploy`
