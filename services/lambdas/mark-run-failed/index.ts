import { DynamoDBClient, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const ddb = new DynamoDBClient({});

/**
 * Invoked by EventBridge when a Step Functions execution fails.
 * Finds the run record by executionArn (stored when "Run now" was clicked) and marks it FAILED.
 */
export const handler = async (event: any) => {
  const detail = event.detail || {};
  const executionArn = detail.executionArn;
  const status = detail.status;

  if (status !== 'FAILED' || !executionArn) {
    return { skipped: true, reason: status !== 'FAILED' ? 'not failed' : 'no executionArn' };
  }

  const tableName = process.env.RUNS_TABLE!;
  const now = new Date().toISOString();
  const error = detail.error || '';
  const cause = detail.cause || '';
  const failureJson = JSON.stringify({ error, cause });

  const scan = await ddb.send(new ScanCommand({
    TableName: tableName,
    FilterExpression: 'executionArn = :arn AND #status = :running',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':arn': { S: executionArn },
      ':running': { S: 'RUNNING' },
    },
    Limit: 5,
  }));

  const items = scan.Items || [];
  if (items.length === 0) {
    return { updated: 0, message: 'no RUNNING run found for this executionArn (may be scheduler run)' };
  }

  for (const item of items) {
    const jobId = item.jobId?.S!;
    const runId = item.runId?.S!;
    await ddb.send(new UpdateItemCommand({
      TableName: tableName,
      Key: { jobId: { S: jobId }, runId: { S: runId } },
      UpdateExpression: 'SET #status = :status, endedAt = :endedAt, failure = :failure',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': { S: 'FAILED' },
        ':endedAt': { S: now },
        ':failure': { S: failureJson },
      },
    }));
  }

  return { updated: items.length, jobId: items[0]?.jobId?.S, runId: items[0]?.runId?.S };
};
