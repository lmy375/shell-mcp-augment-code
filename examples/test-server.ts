#!/usr/bin/env node

import { ShellMcpServer } from '../src/server';

async function main() {
  const server = new ShellMcpServer({
    cmd: 'echo "Hello, $NAME!"',
    name: 'greet',
    description: 'Greet someone by name',
    args: ['NAME:string:Name of the person to greet'],
    logLevel: 'info'
  });

  await server.start();
}

main().catch(console.error);
