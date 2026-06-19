import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { Client as Notion } from '@notionhq/client';
import { notionPropToString } from '../../../packages/core/src/notion';
import type { Mapping } from '../../../packages/core/src/types';

// DynamoDB + SSM Parameter Store clients
const ddb = new DynamoDBClient({});
const ssm = new SSMClient({});

export const handler = async (event: any) => {
  const { tenantId, jobId } = event;

  const item = await ddb.send(new GetItemCommand({
    TableName: process.env.JOBS_TABLE!,
    Key: { tenantId: { S: tenantId }, jobId: { S: jobId } }
  }));
  if (!item.Item) throw new Error('Job not found');

  const source = JSON.parse(item.Item.source.S!); // { type:'notion', dbId: '...' }

  // Field mapping defines which Notion properties to pull, in column order.
  const mapping: Mapping[] = item.Item.mapping?.S ? JSON.parse(item.Item.mapping.S) : [];
  const properties = mapping.map((m) => m.from).filter(Boolean);
  if (properties.length === 0) {
    throw new Error('Job has no field mapping — add at least one Notion property to sync.');
  }

  // Read the Notion token from SSM (supports JSON { "token": "ntn_..." } or a plain string).
  const secretRaw = (await ssm.send(new GetParameterCommand({
    Name: process.env.NOTION_TOKEN_PARAM!,
    WithDecryption: true,
  }))).Parameter!.Value!;
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

  // Full pull: page through every row. Full-refresh keeps the sheet a true mirror.
  const pages: any[] = [];
  let cursor: string | undefined;
  do {
    const resp = await notion.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
    });
    pages.push(...resp.results);
    cursor = resp.has_more && resp.next_cursor ? resp.next_cursor : undefined;
  } while (cursor);

  // Each row is an object keyed by the mapped Notion property name.
  const rows = pages.map((p: any) => {
    const row: Record<string, string> = {};
    for (const name of properties) {
      row[name] = notionPropToString(p.properties?.[name]);
    }
    return row;
  });

  return { ...event, columns: properties, rows, meta: { pulled: rows.length } };
};
