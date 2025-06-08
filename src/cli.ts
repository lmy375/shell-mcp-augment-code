import { Command } from 'commander';
import { logger } from './utils/logger.js';
import { ConfigParser, ArgumentConfig } from './config/parser.js';

export interface CliOptions {
  // Single command mode
  cmd?: string;
  name?: string;
  description?: string;
  args?: string[];
  timeout?: number;

  // REPL mode
  repl?: string;
  replName?: string;
  replDescription?: string;
  replTimeout?: number;
  startArgs?: string[];
  endArgs?: string[];
  prompt?: string;

  // Config file mode
  config?: string;

  // General options
  logLevel?: string;
}

export function createCli(): Command {
  const program = new Command();

  program
    .name('shell-mcp')
    .description('A MCP Server tool that converts shell commands and REPL sessions into MCP tools')
    .version('1.0.0');

  // Single command mode
  program
    .option('--cmd <command>', 'Command to execute')
    .option('--name <name>', 'Tool name (defaults to "command")')
    .option('--description <desc>', 'Tool description')
    .option('--args <args...>', 'Tool arguments in format "name:type:description"')
    .option('--timeout <ms>', 'Command timeout in milliseconds', '30000');

  // REPL mode
  program
    .option('--repl <command>', 'REPL command to start')
    .option('--repl-name <name>', 'REPL tool name')
    .option('--repl-description <desc>', 'REPL tool description')
    .option('--repl-timeout <ms>', 'REPL timeout in milliseconds', '30000')
    .option('--start-args <args...>', 'Arguments to pass when starting REPL')
    .option('--end-args <args...>', 'Arguments to pass when ending REPL')
    .option('--prompt <prompt>', 'REPL prompt pattern');

  // Config file mode
  program
    .option('--config <file>', 'Configuration file path');

  // General options
  program
    .option('--log-level <level>', 'Log level (debug, info, warn, error)', 'info');

  return program;
}

export function parseCliOptions(argv: string[]): CliOptions {
  const program = createCli();
  program.parse(argv);
  const options = program.opts();

  // Set log level
  if (options.logLevel) {
    logger.level = options.logLevel;
  }

  // Validate options
  validateCliOptions(options);

  return {
    cmd: options.cmd,
    name: options.name,
    description: options.description,
    args: options.args,
    timeout: options.timeout ? parseInt(options.timeout) : undefined,
    
    repl: options.repl,
    replName: options.replName,
    replDescription: options.replDescription,
    replTimeout: options.replTimeout ? parseInt(options.replTimeout) : undefined,
    startArgs: options.startArgs,
    endArgs: options.endArgs,
    prompt: options.prompt,
    
    config: options.config,
    logLevel: options.logLevel
  };
}

function validateCliOptions(options: any): void {
  const modes = [
    options.cmd ? 'cmd' : null,
    options.repl ? 'repl' : null,
    options.config ? 'config' : null
  ].filter(Boolean);

  if (modes.length === 0) {
    throw new Error('Must specify one of: --cmd, --repl, or --config');
  }

  if (modes.length > 1) {
    throw new Error(`Cannot specify multiple modes: ${modes.join(', ')}`);
  }

  // Validate timeout values
  if (options.timeout && (isNaN(parseInt(options.timeout)) || parseInt(options.timeout) <= 0)) {
    throw new Error('Timeout must be a positive number');
  }

  if (options.replTimeout && (isNaN(parseInt(options.replTimeout)) || parseInt(options.replTimeout) <= 0)) {
    throw new Error('REPL timeout must be a positive number');
  }
}

export function buildConfigFromCli(options: CliOptions) {
  if (options.config) {
    return ConfigParser.parseConfigFile(options.config);
  }

  if (options.cmd) {
    const args: Record<string, ArgumentConfig> = {};
    
    if (options.args) {
      for (const argString of options.args) {
        const [name, ...rest] = argString.split(':');
        if (rest.length >= 2) {
          args[name] = ConfigParser.parseArgumentString(argString);
        } else {
          logger.warn('Invalid argument format, skipping', { argString });
        }
      }
    }

    return {
      tools: {
        [options.name || 'command']: {
          cmd: options.cmd,
          name: options.name,
          description: options.description,
          args,
          timeout: options.timeout
        }
      }
    };
  }

  if (options.repl) {
    return {
      repls: {
        [options.replName || options.repl]: {
          command: options.repl,
          name: options.replName,
          description: options.replDescription,
          timeout: options.replTimeout,
          startArgs: options.startArgs || [],
          endArgs: options.endArgs || [],
          prompt: options.prompt
        }
      }
    };
  }

  throw new Error('No valid configuration found');
}
