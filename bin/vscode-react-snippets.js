#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');

const scriptPath = resolve(__dirname, '..', 'scripts', 'bootstrap-vscode.sh');
const args = process.argv.slice(2);

const result = spawnSync('bash', [scriptPath, ...args], {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
