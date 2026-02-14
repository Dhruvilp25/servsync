import { DynamoDBClient, PutItemCommand, GetItemCommand, ScanCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
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

  // Normalize method & path (to strip trailing slashes)
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

  // /jobs/:id (PUT) — update job
  if (segments.length === 2 && segments[0] === 'jobs' && method === 'PUT') {
    const id = segments[1];
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const tenantId = body.tenantId || 'jay';
    await ddb.send(new PutItemCommand({
      TableName: process.env.JOBS_TABLE!,
      Item: {
        tenantId: { S: tenantId },
        jobId: { S: id },
        name: { S: body.name ?? id },
        source: { S: JSON.stringify(body.source ?? {}) },
        target: { S: JSON.stringify(body.target ?? {}) },
        mapping: { S: JSON.stringify(body.mapping ?? []) },
        nextDueAt: { S: body.nextDueAt ?? new Date().toISOString() }
      }
    }));
    return json(200, { ok: true });
  }

  // /jobs/:id/runs (GET) — run history for monitoring
  if (segments.length === 3 && segments[0] === 'jobs' && segments[2] === 'runs' && method === 'GET') {
    const jobId = segments[1];
    const res = await ddb.send(new QueryCommand({
      TableName: process.env.RUNS_TABLE!,
      KeyConditionExpression: 'jobId = :jobId',
      ExpressionAttributeValues: { ':jobId': { S: jobId } },
      ScanIndexForward: false,
      Limit: 50,
    }));
    const runs = (res.Items || []).map((i) => ({
      runId: i.runId?.S,
      status: i.status?.S,
      stats: i.stats?.S ? JSON.parse(i.stats.S) : undefined,
      startedAt: i.startedAt?.S,
      endedAt: i.endedAt?.S,
      executionArn: i.executionArn?.S,
      failure: i.failure?.S ? JSON.parse(i.failure.S) : undefined,
    }));
    return json(200, runs);
  }

  // /jobs/:id/run (POST)
  if (segments.length === 3 && segments[0] === 'jobs' && segments[2] === 'run' && method === 'POST') {
    const id = segments[1];
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
    const tenantId = body.tenantId || 'jay';
    const job = await ddb.send(new GetItemCommand({
      TableName: process.env.JOBS_TABLE!,
      Key: { tenantId: { S: tenantId }, jobId: { S: id } }
    }));
    const target = job.Item ? JSON.parse(job.Item.target.S!) : undefined;
    const runId = `manual-${Date.now()}`;
    const startedAt = new Date().toISOString();
    const input = { tenantId, jobId: id, watermark: null, target, runId };
    const out = await sfn.send(new StartExecutionCommand({
      stateMachineArn: process.env.STATE_MACHINE_ARN!,
      input: JSON.stringify(input)
    }));
    await ddb.send(new PutItemCommand({
      TableName: process.env.RUNS_TABLE!,
      Item: {
        jobId: { S: id },
        runId: { S: runId },
        status: { S: 'RUNNING' },
        startedAt: { S: startedAt },
        executionArn: { S: out.executionArn! },
      }
    }));
    return json(200, { runId, executionArn: out.executionArn });
  }

  return json(404, { message: 'not found', path, method });
};
