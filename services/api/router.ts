import { DynamoDBClient, PutItemCommand, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
const ddb = new DynamoDBClient({}); const sfn = new SFNClient({});
const json = (code:number, data:any) => ({ statusCode: code, headers: { 'content-type':'application/json','access-control-allow-origin':'*' }, body: JSON.stringify(data) });

export const handler = async (event: any) => {
  const { rawPath, httpMethod, pathParameters } = event;

  if (rawPath === '/jobs' && httpMethod === 'GET') {
    const res = await ddb.send(new ScanCommand({ TableName: process.env.JOBS_TABLE! }));
    const items = (res.Items || []).map(i => ({ tenantId: i.tenantId.S, jobId: i.jobId.S }));
    return json(200, items);
  }

  if (rawPath === '/jobs' && httpMethod === 'POST') {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    await ddb.send(new PutItemCommand({
      TableName: process.env.JOBS_TABLE!, Item: {
        tenantId: { S: body.tenantId }, jobId: { S: body.jobId },
        name: { S: body.name },
        source: { S: JSON.stringify(body.source) },
        target: { S: JSON.stringify(body.target) },
        mapping: { S: JSON.stringify(body.mapping) },
        nextDueAt: { S: body.nextDueAt || new Date().toISOString() }
      }
    }));
    return json(200, { ok: true });
  }

  if (rawPath.match(/^\/jobs\/.+\/run$/) && httpMethod === 'POST') {
    const id = pathParameters?.id || rawPath.split('/')[2];
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
    // Attach target from Job so push step knows where to write
    const job = await ddb.send(new GetItemCommand({ TableName: process.env.JOBS_TABLE!, Key: { tenantId: { S: body.tenantId || 'jay' }, jobId: { S: id } } }));
    const target = job.Item ? JSON.parse(job.Item.target.S!) : undefined;
    const input = { tenantId: body.tenantId || 'jay', jobId: id, watermark: null, target };
    const out = await sfn.send(new StartExecutionCommand({ stateMachineArn: process.env.STATE_MACHINE_ARN!, input: JSON.stringify(input) }));
    return json(200, { executionArn: out.executionArn });
  }

  if (rawPath.match(/^\/jobs\/.+$/) && httpMethod === 'GET') {
    const id = pathParameters?.id || rawPath.split('/')[2];
    const res = await ddb.send(new GetItemCommand({ TableName: process.env.JOBS_TABLE!, Key: { tenantId: { S: 'jay' }, jobId: { S: id } } }));
    return json(200, res.Item || {});
  }

  return json(404, { message: 'not found' });
};
