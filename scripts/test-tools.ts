#!/usr/bin/env ts-node

import { SingleCommandTool } from '../src/tools/single-command';
import { ReplSessionManager } from '../src/tools/repl-session';
import { SecurityValidator } from '../src/utils/security';
import { logger, Logger } from '../src/utils/logger';

// Set log level for testing
Logger.setLevel('info');

async function testSingleCommand() {
  console.log('\n=== Testing Single Command Tool ===');
  
  const security = new SecurityValidator({ allowShellOperators: true });
  
  // Test basic echo command
  const echoTool = new SingleCommandTool({
    cmd: 'echo "Hello, $NAME!"',
    name: 'greet',
    description: 'Greet someone',
    args: {
      NAME: {
        type: 'string',
        description: 'Name to greet'
      }
    }
  }, security);

  const mcpTool = echoTool.generateMcpTool();
  console.log('Generated MCP Tool:', JSON.stringify(mcpTool, null, 2));

  const result = await echoTool.execute({ NAME: 'World' });
  console.log('Execution result:', result);

  // Test math calculation
  const mathTool = new SingleCommandTool({
    cmd: 'echo "$(($A + $B))"',
    name: 'add',
    description: 'Add two numbers',
    args: {
      A: { type: 'int', description: 'First number' },
      B: { type: 'int', description: 'Second number' }
    }
  }, security);

  const mathResult = await mathTool.execute({ A: 5, B: 3 });
  console.log('Math result:', mathResult);
}

async function testSecurity() {
  console.log('\n=== Testing Security Features ===');
  
  const security = new SecurityValidator({
    allowShellOperators: false,
    allowFileOperations: false,
    blockedCommands: ['rm', 'del'],
    maxTimeout: 30
  });

  // Test dangerous command blocking
  const dangerousCommands = [
    'rm -rf /',
    'echo hello && rm file',
    'cat ../../../etc/passwd',
    'echo hello | grep world'
  ];

  for (const cmd of dangerousCommands) {
    const validation = security.validateCommand(cmd);
    console.log(`Command: "${cmd}" -> Valid: ${validation.valid}, Reason: ${validation.reason || 'N/A'}`);
  }

  // Test safe commands
  const safeCommands = [
    'echo hello',
    'date',
    'whoami'
  ];

  for (const cmd of safeCommands) {
    const validation = security.validateCommand(cmd);
    console.log(`Command: "${cmd}" -> Valid: ${validation.valid}`);
  }
}

async function main() {
  try {
    await testSingleCommand();
    await testSecurity();
    
    console.log('\n=== All tests completed successfully! ===');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
