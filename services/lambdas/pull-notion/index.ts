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
  const secretRaw = (await sm.send(new GetSecretValueCommand({ SecretId: process.env.NOTION_TOKEN_ARN! }))).SecretString!;
  // Support both JSON { "token": "ntn_..." } and plain token string
  let auth: string;
  try {
    const parsed = JSON.parse(secretRaw) as { token?: string };
    auth = parsed.token ?? secretRaw;
  } catch {
    auth = secretRaw;
  }
  const notion = new Notion({ auth });

  // 2025-09-03 API: query uses data_source_id, not database_id. Resolve if user passed database_id.
  let dataSourceId: string;
  if (source.dataSourceId) {
    dataSourceId = source.dataSourceId;
  } else {
    const db = await notion.databases.retrieve({ database_id: source.dbId });
    const dataSources = (db as any).data_sources;
    if (!dataSources?.length) throw new Error('Database has no data sources');
    dataSourceId = dataSources[0].id;
  }

  const pages: any[] = [];
  let cursor: string | undefined;

  do {
    const resp = await notion.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
      filter: watermark
        ? { timestamp: 'last_edited_time', last_edited_time: { on_or_after: watermark }, type: 'last_edited_time' }
        : undefined
    });
    pages.push(...resp.results);
    cursor = resp.has_more && resp.next_cursor ? resp.next_cursor : undefined;
  } while (cursor);

  const rows = pages.map((p: any) => ({
    Name: p.properties?.Name?.title?.[0]?.plain_text ?? '',
    Status: p.properties?.Status?.status?.name ?? '',
    DueDate: p.properties?.Due?.date?.start ?? ''
  }));

  return { ...event, rows, meta: { pulled: rows.length } };
};
