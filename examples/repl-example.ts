#!/usr/bin/env node

import { ShellMcpServer } from '../src/server';

async function main() {
  const server = new ShellMcpServer({
    repl: 'node',
    name: 'nodejs_repl',
    logLevel: 'info'
  });

  await server.start();
}

main().catch(console.error);
