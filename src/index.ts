#!/usr/bin/env node

import { Command } from 'commander';
import { ShellMcpServer } from './server';
import { logger, Logger } from './utils/logger';
import { ServerOptions } from './types';

const program = new Command();

program
  .name('shell-mcp')
  .description('A MCP Server tool that converts shell commands and REPL sessions into MCP tools')
  .version('1.0.0');

program
  .option('--config <path>', 'Path to configuration file')
  .option('--cmd <command>', 'Single command to wrap as MCP tool')
  .option('--name <name>', 'Name for the tool')
  .option('--description <desc>', 'Description for the tool')
  .option('--args <args...>', 'Arguments definition in format "NAME:type:description"')
  .option('--repl <command>', 'REPL command to wrap as MCP session tools')
  .option('--timeout <seconds>', 'Timeout in seconds for command execution', parseInt)
  .option('--log-level <level>', 'Log level (error, warn, info, debug)', 'info')
  .option('--allow-shell-operators', 'Allow shell operators like &&, ||, etc.')
  .option('--allow-file-operations', 'Allow file operations like rm, mv, etc.')
  .option('--blocked-commands <commands...>', 'List of blocked commands')
  .option('--allowed-commands <commands...>', 'List of allowed commands (whitelist)')
  .option('--max-timeout <seconds>', 'Maximum allowed timeout in seconds', parseInt);

program.action(async (options) => {
  try {
    // Set log level
    Logger.setLevel(options.logLevel);
    
    // Validate options
    if (!options.config && !options.cmd && !options.repl) {
      logger.error('Must specify either --config, --cmd, or --repl');
      process.exit(1);
    }

    if ((options.cmd && options.repl) || (options.config && (options.cmd || options.repl))) {
      logger.error('Cannot specify multiple modes (config, cmd, repl) simultaneously');
      process.exit(1);
    }

    // Build server options
    const serverOptions: ServerOptions = {
      config: options.config,
      cmd: options.cmd,
      name: options.name,
      description: options.description,
      args: options.args,
      repl: options.repl,
      timeout: options.timeout,
      logLevel: options.logLevel,
      security: {
        allowShellOperators: options.allowShellOperators || false,
        allowFileOperations: options.allowFileOperations || false,
        blockedCommands: options.blockedCommands,
        allowedCommands: options.allowedCommands,
        maxTimeout: options.maxTimeout
      }
    };

    // Create and start server
    const server = new ShellMcpServer(serverOptions);
    await server.start();

  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

program.parse();
