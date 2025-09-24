import { DynamoDBClient, PutItemCommand, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
const ddb = new DynamoDBClient({}); const sfn = new SFNClient({});
const json = (code:number, data:any) => ({
  statusCode: code,
  headers: { 'content-type':'application/json', 'access-control-allow-origin':'*' },
  body: JSON.stringify(data)
});

export const handler = async (event: any) => {
  // Helpful logging while we test
  console.log('event.routeKey:', event.routeKey);
  console.log('event.rawPath:', event.rawPath);
  console.log('event.httpMethod:', event.httpMethod);
  console.log('event.requestContext?.http:', event.requestContext?.http);

  // Normalize method & path (strip trailing slashes)
  const method =
    event.httpMethod ||
    event.requestContext?.http?.method ||
    'GET';

  const pathRaw =
    event.rawPath ||
    event.requestContext?.http?.path ||
    '/';

  const path = pathRaw.replace(/\/+$/,'') || '/'; // remove trailing '/'
  const segments = path.split('/').filter(Boolean); // ['jobs', ':id', 'run'...]

  // /jobs (GET, POST)
  if (segments.length === 1 && segments[0] === 'jobs' && method === 'GET') {
    const res = await ddb.send(new ScanCommand({ TableName: process.env.JOBS_TABLE! }));
    const items = (res.Items || []).map(i => ({ tenantId: i.tenantId.S, jobId: i.jobId.S }));
    return json(200, items);
  }
  if (segments.length === 1 && segments[0] === 'jobs' && method === 'POST') {
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

  // /jobs/:id (GET)
  if (segments.length === 2 && segments[0] === 'jobs' && method === 'GET') {
    const id = segments[1];
    const res = await ddb.send(new GetItemCommand({
      TableName: process.env.JOBS_TABLE!,
      Key: { tenantId: { S: 'jay' }, jobId: { S: id } }
    }));
    return json(200, res.Item || {});
  }

  // /jobs/:id/run (POST)
  if (segments.length === 3 && segments[0] === 'jobs' && segments[2] === 'run' && method === 'POST') {
    const id = segments[1];
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
    // fetch target from Job so push step knows where to write
    const job = await ddb.send(new GetItemCommand({
      TableName: process.env.JOBS_TABLE!,
      Key: { tenantId: { S: body.tenantId || 'jay' }, jobId: { S: id } }
    }));
    const target = job.Item ? JSON.parse(job.Item.target.S!) : undefined;
    const input = { tenantId: body.tenantId || 'jay', jobId: id, watermark: null, target };
    const out = await sfn.send(new StartExecutionCommand({
      stateMachineArn: process.env.STATE_MACHINE_ARN!,
      input: JSON.stringify(input)
    }));
    return json(200, { executionArn: out.executionArn });
  }

  return json(404, { message: 'not found', path, method });
};
