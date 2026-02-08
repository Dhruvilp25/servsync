import { DynamoDBClient, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
const ddb = new DynamoDBClient({});

export const handler = async (event: any) => {
  const now = new Date().toISOString();
  const jobId = event.jobId;
  const runId = event.runId;

  if (runId) {
    // API-triggered run: update the run we created when "Run now" was clicked
    await ddb.send(new UpdateItemCommand({
      TableName: process.env.RUNS_TABLE!,
      Key: { jobId: { S: jobId }, runId: { S: runId } },
      UpdateExpression: 'SET #status = :status, stats = :stats, endedAt = :endedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': { S: 'SUCCEEDED' },
        ':stats': { S: JSON.stringify(event.meta || {}) },
        ':endedAt': { S: now },
      },
    }));
  } else {
    // Scheduler-triggered run: create a new run record (no runId was passed)
    await ddb.send(new PutItemCommand({
      TableName: process.env.RUNS_TABLE!,
      Item: {
        jobId: { S: jobId },
        runId: { S: now },
        status: { S: 'SUCCEEDED' },
        stats: { S: JSON.stringify(event.meta || {}) },
        startedAt: { S: event.startedAt || now },
        endedAt: { S: now }
      }
    }));
  }

  await ddb.send(new UpdateItemCommand({
    TableName: process.env.JOBS_TABLE!,
    Key: { tenantId: { S: event.tenantId }, jobId: { S: jobId } },
    UpdateExpression: 'SET lastWatermark = :ts',
    ExpressionAttributeValues: { ':ts': { S: now } }
  }));
  return { ok: true };
};
