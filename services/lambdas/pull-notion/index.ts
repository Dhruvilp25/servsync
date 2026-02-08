import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { Client as Notion } from '@notionhq/client';

// DynamoDB + Secrets Manager clients
const ddb = new DynamoDBClient({});
const sm = new SecretsManagerClient({});

export const handler = async (event: any) => {
  const { tenantId, jobId, watermark } = event;

  const item = await ddb.send(new GetItemCommand({
    TableName: process.env.JOBS_TABLE!,
    Key: { tenantId: { S: tenantId }, jobId: { S: jobId } }
  }));
  if (!item.Item) throw new Error('Job not found');

  const source = JSON.parse(item.Item.source.S!); // { type:'notion', dbId: '...' }
  const notionToken = (await sm.send(new GetSecretValueCommand({ SecretId: process.env.NOTION_TOKEN_ARN! }))).SecretString!;
  const notion = new Notion({ auth: notionToken });

  const dbId = source.dbId;
  const pages: any[] = [];
  let cursor: string | undefined;

  do {
    const resp = await (notion.databases as any).query({
      database_id: dbId,
      start_cursor: cursor,
      filter: watermark ? { timestamp: 'last_edited_time', last_edited_time: { on_or_after: watermark } } : undefined
    });
    pages.push(...resp.results);
    cursor = resp.has_more ? resp.next_cursor ?? undefined : undefined;
  } while (cursor);

  const rows = pages.map((p: any) => ({
    Name: p.properties?.Name?.title?.[0]?.plain_text ?? '',
    Status: p.properties?.Status?.status?.name ?? '',
    DueDate: p.properties?.Due?.date?.start ?? ''
  }));

  return { ...event, rows, meta: { pulled: rows.length } };
};
