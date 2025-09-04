import { DynamoDBClient, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
const ddb = new DynamoDBClient({}); const sfn = new SFNClient({});

export const handler = async () => {
  const now = new Date().toISOString();
  const res = await ddb.send(new ScanCommand({ TableName: process.env.JOBS_TABLE! }));
  const due = (res.Items || []).filter(i => (i.nextDueAt?.S || '') <= now);
  for (const it of due) {
    const tenantId = it.tenantId.S!, jobId = it.jobId.S!;
    // Pass target through (from Job.target string) so push step knows where to write
    const target = JSON.parse(it.target.S!);
    await sfn.send(new StartExecutionCommand({
      stateMachineArn: process.env.STATE_MACHINE_ARN!,
      input: JSON.stringify({ tenantId, jobId, watermark: it.lastWatermark?.S || null, target })
    }));
    const next = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    await ddb.send(new UpdateItemCommand({
      TableName: process.env.JOBS_TABLE!, Key: { tenantId: { S: tenantId }, jobId: { S: jobId } },
      UpdateExpression: 'SET nextDueAt = :n', ExpressionAttributeValues: { ':n': { S: next } }
    }));
  }
  return { started: due.length };
};
