import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { google } from 'googleapis';

const ssm = new SSMClient({});

/** Sheets API requires at least one row in A1 notation. "Sheet1!A:C" -> "Sheet1!A1:C" */
function normalizeSheetsRange(range: string): string {
  if (!range || typeof range !== 'string') return range;
  // Match "!Letters:Letters" at end (no row number). Insert row 1: "!A:C" -> "!A1:C"
  const fixed = range.replace(/!([A-Z]+):([A-Z]+)$/i, '!$11:$2');
  return fixed;
}

export const handler = async (event: any) => {
  // Read the Google service-account JSON from SSM (supports JSON { "json": "..." } or plain).
  const raw = (await ssm.send(new GetParameterCommand({
    Name: process.env.GOOGLE_SA_JSON_PARAM!,
    WithDecryption: true,
  }))).Parameter!.Value!;
  const parsed = JSON.parse(raw) as string | { json?: string };
  const saJson = typeof parsed === 'string' ? parsed : parsed.json ?? raw;
  const sa = JSON.parse(saJson);
  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const { header, values } = event as { header?: string[]; values: string[][] };
  const { sheetId, range: rawRange } = event.target;
  const range = normalizeSheetsRange(rawRange);

  // Full-refresh sync: clear the target range, then write header + all rows.
  // This makes the sheet a true mirror of Notion (no duplicate rows on re-run).
  await sheets.spreadsheets.values.clear({ spreadsheetId: sheetId, range });

  const body = header?.length ? [header, ...(values || [])] : values || [];
  if (body.length === 0) {
    return { ...event, meta: { ...event.meta, pushed: 0 } };
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: body },
  });

  return { ...event, meta: { ...event.meta, pushed: values?.length ?? 0 } };
};
