import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class ServsyncStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Jobs table
    new dynamodb.Table(this, 'JobsTable', {
      partitionKey: { name: 'tenantId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    // Runs table
    new dynamodb.Table(this, 'RunsTable', {
      partitionKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'runId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });
  }
}
