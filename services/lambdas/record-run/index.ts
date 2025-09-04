import { DynamoDBClient, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
const ddb = new DynamoDBClient({});

export const handler = async (event: any) => {
  const now = new Date().toISOString();
  await ddb.send(new PutItemCommand({
    TableName: process.env.RUNS_TABLE!,
    Item: {
      jobId: { S: event.jobId },
      runId: { S: now },
      status: { S: 'SUCCEEDED' },
      stats: { S: JSON.stringify(event.meta || {}) },
      startedAt: { S: event.startedAt || now },
      endedAt: { S: now }
    }
  }));
  await ddb.send(new UpdateItemCommand({
    TableName: process.env.JOBS_TABLE!,
    Key: { tenantId: { S: event.tenantId }, jobId: { S: event.jobId } },
    UpdateExpression: 'SET lastWatermark = :ts',
    ExpressionAttributeValues: { ':ts': { S: now } }
  }));
  return { ok: true };
};
