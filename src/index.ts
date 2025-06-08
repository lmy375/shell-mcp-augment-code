#!/usr/bin/env node

import { parseCliOptions, buildConfigFromCli } from './cli.js';
import { ShellMcpServer } from './server.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    // Parse command line arguments
    const options = parseCliOptions(process.argv);
    
    logger.info('Shell MCP Server starting', { 
      mode: options.config ? 'config' : options.cmd ? 'command' : 'repl',
      logLevel: options.logLevel 
    });

    // Build configuration
    const config = buildConfigFromCli(options);
    
    logger.debug('Configuration loaded', { 
      toolCount: Object.keys(config.tools || {}).length,
      replCount: Object.keys(config.repls || {}).length
    });

    // Create and start server
    const server = new ShellMcpServer(config);
    await server.start();

  } catch (error: any) {
    logger.error('Failed to start Shell MCP Server', { error: error.message });
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

if (require.main === module) {
  main();
}
