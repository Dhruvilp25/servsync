#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ServsyncStack } from '../lib/servsync-stack';

const app = new cdk.App();
new ServsyncStack(app, 'ServsyncStack', {
  env: { region: 'us-east-1' } // or ca-central-1 if you prefer
});
