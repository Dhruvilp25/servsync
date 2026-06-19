#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ServsyncStack } from '../lib/servsync-stack';

const app = new cdk.App();
new ServsyncStack(app, 'ServsyncStack', {
  // Follow the region/account from your AWS CLI profile (override with
  // CDK_DEFAULT_REGION or AWS_REGION). Falls back to us-east-1.
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
  },
});
