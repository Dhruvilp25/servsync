import { DynamoDBClient, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
const ddb = new DynamoDBClient({});

export const handler = async (event: any) => {
  const now = new Date().toISOString();
  const jobId = event.jobId;
  const runId = event.runId;

  if (runId) {
    // Both API "Run now" and the scheduler create a RUNNING row up front and
    // pass runId; mark it SUCCEEDED here.
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
    // Fallback (no runId passed): create a completed run record.
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

  return { ok: true };
};
