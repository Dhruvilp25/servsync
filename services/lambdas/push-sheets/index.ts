import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { google } from 'googleapis';

const sm = new SecretsManagerClient({});

/** Sheets API requires at least one row in A1 notation. "Sheet1!A:C" -> "Sheet1!A1:C" */
function normalizeSheetsRange(range: string): string {
  if (!range || typeof range !== 'string') return range;
  // Match "!Letters:Letters" at end (no row number). Insert row 1: "!A:C" -> "!A1:C"
  const fixed = range.replace(/!([A-Z]+):([A-Z]+)$/i, '!$11:$2');
  return fixed;
}

export const handler = async (event: any) => {
  const raw = (await sm.send(new GetSecretValueCommand({ SecretId: process.env.GOOGLE_SA_JSON_ARN! }))).SecretString!;
  const parsed = JSON.parse(raw) as string | { json?: string };
  const saJson = typeof parsed === 'string' ? parsed : parsed.json ?? raw;
  const sa = JSON.parse(saJson);
  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // target comes from Job; Step 1 pulled Job but for brevity we pass it along via API/run input
  const { values } = event;
  if (!values?.length) return { ...event, meta: { ...event.meta, pushed: 0 } };

  // Expect API to provide target in event.target or store/parse from Job (simplify: attach in API)
  const { sheetId, range: rawRange } = event.target;
  // Sheets API requires at least one row in A1 notation (e.g. Sheet1!A1:C). Normalize "Sheet1!A:C" -> "Sheet1!A1:C"
  const range = normalizeSheetsRange(rawRange);
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  });

  return { ...event, meta: { ...event.meta, pushed: values.length } };
};
