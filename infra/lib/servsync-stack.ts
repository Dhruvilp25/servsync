import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as secrets from 'aws-cdk-lib/aws-secretsmanager';
import * as apigwv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as apigwInt from '@aws-cdk/aws-apigatewayv2-integrations-alpha';

export class ServsyncStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /* ========== Data stores ========== */
    const jobs = new ddb.Table(this, 'Jobs', {
      partitionKey: { name: 'tenantId', type: ddb.AttributeType.STRING },
      sortKey: { name: 'jobId', type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
    });

    const runs = new ddb.Table(this, 'Runs', {
      partitionKey: { name: 'jobId', type: ddb.AttributeType.STRING },
      sortKey: { name: 'runId', type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
    });

    /* ========== Secrets (already created in console) ========== */
    const notionToken = secrets.Secret.fromSecretNameV2(this, 'NotionToken', 'NOTION_TOKEN');
    const googleSa = secrets.Secret.fromSecretNameV2(this, 'GoogleSA', 'GOOGLE_SA_JSON');

    /* ========== Helper to create Lambdas ========== */
    const mk = (id: string, entry: string, extraEnv: Record<string, string> = {}) =>
      new lambda.NodejsFunction(this, id, {
        entry, // path is relative to /infra
        environment: {
          JOBS_TABLE: jobs.tableName,
          RUNS_TABLE: runs.tableName,
          NOTION_TOKEN_ARN: notionToken.secretArn,
          GOOGLE_SA_JSON_ARN: googleSa.secretArn,
          ...extraEnv,
        },
      });

    /* ========== Step Lambdas (no ARN needed yet) ========== */
    const pull = mk('PullNotion', '../services/lambdas/pull-notion/index.ts');
    const xform = mk('TransformMap', '../services/lambdas/transform-map/index.ts');
    const push = mk('PushSheets', '../services/lambdas/push-sheets/index.ts');
    const record = mk('RecordRun', '../services/lambdas/record-run/index.ts');

    // DDB permissions for steps
    jobs.grantReadData(pull);                 // read Job config
    jobs.grantReadWriteData(record);         // update watermark
    runs.grantReadWriteData(record);

    // Secrets access
    notionToken.grantRead(pull);
    googleSa.grantRead(push);

    /* ========== State Machine: Pull -> Transform -> Push -> Record ========== */
    const pullTask = new tasks.LambdaInvoke(this, 'Pull', {
      lambdaFunction: pull,
      payloadResponseOnly: true,
    }).addRetry({ maxAttempts: 2, backoffRate: 2 });

    const xformTask = new tasks.LambdaInvoke(this, 'Transform', {
      lambdaFunction: xform,
      payloadResponseOnly: true,
    });

    const pushTask = new tasks.LambdaInvoke(this, 'Push', {
      lambdaFunction: push,
      payloadResponseOnly: true,
    }).addRetry({ maxAttempts: 3, backoffRate: 2 });

    const recordTask = new tasks.LambdaInvoke(this, 'Record', {
      lambdaFunction: record,
      payloadResponseOnly: true,
    });

    const machine = new sfn.StateMachine(this, 'ServSyncMachine', {
      definition: pullTask.next(xformTask).next(pushTask).next(recordTask),
      timeout: cdk.Duration.minutes(5),
    });

    /* ========== API Lambda (needs machine ARN) ========== */
    const apiHandler = mk('ApiRouter', '../services/api/router.ts', {
      STATE_MACHINE_ARN: machine.stateMachineArn,
    });

    // API Lambda needs table access (simple MVP)
    jobs.grantReadWriteData(apiHandler);
    runs.grantReadWriteData(apiHandler);

    // Can start executions
    machine.grantStartExecution(apiHandler);

    /* ========== Scheduler Lambda + EventBridge rule ========== */
    const scheduler = mk('Scheduler', '../services/lambdas/scheduler/index.ts', {
      STATE_MACHINE_ARN: machine.stateMachineArn,
    });
    machine.grantStartExecution(scheduler);

    new events.Rule(this, 'Every5Min', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
      targets: [new targets.LambdaFunction(scheduler)],
    });

    /* ========== HTTP API (API Gateway v2) ========== */
    const httpApi = new apigwv2.HttpApi(this, 'HttpApi');

    httpApi.addRoutes({
      path: '/jobs',
      methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.POST],
      integration: new apigwInt.HttpLambdaIntegration('JobsRoute', apiHandler),
    });

    httpApi.addRoutes({
      path: '/jobs/{id}',
      methods: [apigwv2.HttpMethod.GET],
      integration: new apigwInt.HttpLambdaIntegration('JobById', apiHandler),
    });

    httpApi.addRoutes({
      path: '/jobs/{id}/runs',
      methods: [apigwv2.HttpMethod.GET],
      integration: new apigwInt.HttpLambdaIntegration('JobRuns', apiHandler),
    });

    httpApi.addRoutes({
      path: '/jobs/{id}/run',
      methods: [apigwv2.HttpMethod.POST],
      integration: new apigwInt.HttpLambdaIntegration('RunNow', apiHandler),
    });

    /* ========== Outputs ========== */
    new cdk.CfnOutput(this, 'HttpApiUrl', { value: httpApi.url! });
    new cdk.CfnOutput(this, 'StateMachineArn', { value: machine.stateMachineArn });
    new cdk.CfnOutput(this, 'JobsTableName', { value: jobs.tableName });
    new cdk.CfnOutput(this, 'RunsTableName', { value: runs.tableName });
  }
}
