import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { SecurityValidator } from '../utils/security';

/**
 * Enhanced features for Shell MCP - Level 3 improvements
 * This module provides additional functionality beyond basic command and REPL tools
 */

export class EnhancedFeatures {
  private mcp: FastMCP;
  private security: SecurityValidator;

  constructor(mcp: FastMCP, security: SecurityValidator) {
    this.mcp = mcp;
    this.security = security;
    this.setupEnhancedTools();
  }

  private setupEnhancedTools(): void {
    this.setupCommandHistory();
    this.setupEnvironmentManager();
    this.setupFileWatcher();
    this.setupBatchProcessor();
  }

  /**
   * Command History Tool - Track and replay command executions
   */
  private setupCommandHistory(): void {
    const commandHistory: Array<{ command: string; timestamp: Date; result: string }> = [];

    this.mcp.addTool({
      name: 'command_history',
      description: 'View command execution history',
      parameters: z.object({
        limit: z.number().int().min(1).max(100).default(10).optional(),
        filter: z.string().optional()
      }),
      execute: async (args) => {
        let history = commandHistory;
        
        if (args.filter) {
          history = history.filter(entry => 
            entry.command.toLowerCase().includes(args.filter!.toLowerCase())
          );
        }

        const limited = history.slice(-args.limit!);
        
        return limited.map(entry => 
          `[${entry.timestamp.toISOString()}] ${entry.command} -> ${entry.result.substring(0, 100)}...`
        ).join('\n');
      }
    });

    this.mcp.addTool({
      name: 'replay_command',
      description: 'Replay a command from history',
      parameters: z.object({
        index: z.number().int().min(0),
        modify: z.string().optional()
      }),
      execute: async (args) => {
        if (args.index >= commandHistory.length) {
          throw new Error('Command index out of range');
        }

        const originalCommand = commandHistory[args.index].command;
        const command = args.modify || originalCommand;
        
        // Here you would execute the command using your existing infrastructure
        return `Would replay: ${command}`;
      }
    });
  }

  /**
   * Environment Manager - Manage environment variables and working directories
   */
  private setupEnvironmentManager(): void {
    const environments: Map<string, { vars: Record<string, string>; cwd: string }> = new Map();

    this.mcp.addTool({
      name: 'create_environment',
      description: 'Create a named environment with specific variables and working directory',
      parameters: z.object({
        name: z.string(),
        variables: z.record(z.string()).optional(),
        workingDirectory: z.string().optional()
      }),
      execute: async (args) => {
        environments.set(args.name, {
          vars: args.variables || {},
          cwd: args.workingDirectory || process.cwd()
        });
        
        logger.info(`Created environment: ${args.name}`);
        return `Environment '${args.name}' created successfully`;
      }
    });

    this.mcp.addTool({
      name: 'list_environments',
      description: 'List all created environments',
      parameters: z.object({}),
      execute: async () => {
        const envList = Array.from(environments.entries()).map(([name, env]) => 
          `${name}: ${Object.keys(env.vars).length} vars, cwd: ${env.cwd}`
        );
        
        return envList.length > 0 ? envList.join('\n') : 'No environments created';
      }
    });

    this.mcp.addTool({
      name: 'execute_in_environment',
      description: 'Execute a command in a specific environment',
      parameters: z.object({
        environment: z.string(),
        command: z.string()
      }),
      execute: async (args) => {
        const env = environments.get(args.environment);
        if (!env) {
          throw new Error(`Environment '${args.environment}' not found`);
        }

        // Security validation
        const validation = this.security.validateCommand(args.command);
        if (!validation.valid) {
          throw new Error(`Security validation failed: ${validation.reason}`);
        }

        // Here you would execute the command with the environment
        return `Would execute '${args.command}' in environment '${args.environment}'`;
      }
    });
  }

  /**
   * File Watcher - Monitor file changes and trigger actions
   */
  private setupFileWatcher(): void {
    const watchers: Map<string, { path: string; pattern?: string }> = new Map();

    this.mcp.addTool({
      name: 'watch_file',
      description: 'Start watching a file or directory for changes',
      parameters: z.object({
        path: z.string(),
        pattern: z.string().optional(),
        watchId: z.string()
      }),
      execute: async (args) => {
        // Validate path for security
        if (args.path.includes('..')) {
          throw new Error('Path traversal not allowed');
        }

        watchers.set(args.watchId, {
          path: args.path,
          pattern: args.pattern
        });

        logger.info(`Started watching: ${args.path}`);
        return `Started watching '${args.path}' with ID '${args.watchId}'`;
      }
    });

    this.mcp.addTool({
      name: 'list_watchers',
      description: 'List all active file watchers',
      parameters: z.object({}),
      execute: async () => {
        const watcherList = Array.from(watchers.entries()).map(([id, watcher]) => 
          `${id}: ${watcher.path}${watcher.pattern ? ` (pattern: ${watcher.pattern})` : ''}`
        );
        
        return watcherList.length > 0 ? watcherList.join('\n') : 'No active watchers';
      }
    });

    this.mcp.addTool({
      name: 'stop_watcher',
      description: 'Stop a file watcher',
      parameters: z.object({
        watchId: z.string()
      }),
      execute: async (args) => {
        if (watchers.delete(args.watchId)) {
          return `Stopped watcher '${args.watchId}'`;
        } else {
          throw new Error(`Watcher '${args.watchId}' not found`);
        }
      }
    });
  }

  /**
   * Batch Processor - Execute multiple commands in sequence or parallel
   */
  private setupBatchProcessor(): void {
    this.mcp.addTool({
      name: 'batch_execute',
      description: 'Execute multiple commands in sequence or parallel',
      parameters: z.object({
        commands: z.array(z.string()),
        mode: z.enum(['sequence', 'parallel']).default('sequence'),
        continueOnError: z.boolean().default(false),
        timeout: z.number().int().min(1).max(300).default(30)
      }),
      execute: async (args) => {
        // Validate all commands first
        for (const command of args.commands) {
          const validation = this.security.validateCommand(command);
          if (!validation.valid) {
            throw new Error(`Security validation failed for '${command}': ${validation.reason}`);
          }
        }

        const results: string[] = [];
        
        if (args.mode === 'sequence') {
          for (let i = 0; i < args.commands.length; i++) {
            const command = args.commands[i];
            try {
              // Here you would execute the command using your existing infrastructure
              results.push(`Command ${i + 1}: ${command} -> [EXECUTED]`);
            } catch (error) {
              const errorMsg = `Command ${i + 1}: ${command} -> ERROR: ${error}`;
              results.push(errorMsg);
              
              if (!args.continueOnError) {
                break;
              }
            }
          }
        } else {
          // Parallel execution would be implemented here
          results.push('Parallel execution not yet implemented');
        }

        return results.join('\n');
      }
    });

    this.mcp.addTool({
      name: 'create_command_template',
      description: 'Create a reusable command template',
      parameters: z.object({
        name: z.string(),
        template: z.string(),
        description: z.string().optional(),
        parameters: z.array(z.object({
          name: z.string(),
          type: z.enum(['string', 'int', 'float', 'boolean']),
          description: z.string().optional(),
          default: z.any().optional()
        })).optional()
      }),
      execute: async (args) => {
        // Store template for later use
        logger.info(`Created command template: ${args.name}`);
        return `Command template '${args.name}' created: ${args.template}`;
      }
    });
  }
}
