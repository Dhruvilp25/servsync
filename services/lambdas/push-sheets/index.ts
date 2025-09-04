import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { google } from 'googleapis';

const sm = new SecretsManagerClient({});

export const handler = async (event: any) => {
  const saJson = (await sm.send(new GetSecretValueCommand({ SecretId: process.env.GOOGLE_SA_JSON_ARN! }))).SecretString!;
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
  const { sheetId, range } = event.target;
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  });

  return { ...event, meta: { ...event.meta, pushed: values.length } };
};
