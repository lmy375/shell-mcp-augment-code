import { FastMCP } from 'fastmcp';
import { readFileSync } from 'fs';
import { z } from 'zod';
import { SingleCommandTool } from './tools/single-command';
import { ReplSessionManager } from './tools/repl-session';
import { EnhancedFeatures } from './tools/enhanced-features';
import { SecurityValidator } from './utils/security';
import { logger } from './utils/logger';
import {
  ServerOptions,
  ShellMcpConfig,
  CommandConfig,
  ReplConfig,
  ArgumentConfig
} from './types';

export class ShellMcpServer {
  private mcp: FastMCP;
  private security: SecurityValidator;
  private singleCommandTools: Map<string, SingleCommandTool> = new Map();
  private replManagers: Map<string, ReplSessionManager> = new Map();
  private enhancedFeatures: EnhancedFeatures;

  constructor(options: ServerOptions) {
    this.mcp = new FastMCP({
      name: 'shell-mcp',
      version: '1.0.0'
    });
    this.security = new SecurityValidator(options.security);

    if (options.logLevel) {
      logger.level = options.logLevel;
    }

    this.setupServer(options);

    // Initialize enhanced features (Level 3 improvements)
    this.enhancedFeatures = new EnhancedFeatures(this.mcp, this.security);
  }

  private setupServer(options: ServerOptions): void {
    if (options.config) {
      this.loadConfigFile(options.config);
    } else if (options.cmd) {
      this.setupSingleCommand(options);
    } else if (options.repl) {
      this.setupReplCommand(options);
    } else {
      throw new Error('Must specify either --config, --cmd, or --repl');
    }
  }

  private loadConfigFile(configPath: string): void {
    try {
      logger.info(`Loading configuration from: ${configPath}`);
      const configContent = readFileSync(configPath, 'utf-8');
      const config: ShellMcpConfig = JSON.parse(configContent);

      for (const [toolName, toolConfig] of Object.entries(config)) {
        if ('cmd' in toolConfig) {
          this.setupSingleCommandFromConfig(toolName, toolConfig as CommandConfig);
        } else if ('command' in toolConfig) {
          this.setupReplFromConfig(toolName, toolConfig as ReplConfig);
        }
      }
    } catch (error) {
      logger.error(`Failed to load config file: ${error}`);
      throw error;
    }
  }

  private setupSingleCommand(options: ServerOptions): void {
    if (!options.cmd) return;

    const config: CommandConfig = {
      cmd: options.cmd,
      name: options.name,
      description: options.description,
      timeout: options.timeout ? options.timeout * 1000 : undefined
    };

    // Parse args from command line format
    if (options.args) {
      config.args = this.parseArgsFromCommandLine(options.args);
    }

    const toolName = config.name || 'command';
    this.setupSingleCommandFromConfig(toolName, config);
  }

  private setupReplCommand(options: ServerOptions): void {
    if (!options.repl) return;

    const config: ReplConfig = {
      command: options.repl,
      name: options.name,
      description: options.description,
      args: options.args,
      timeout: options.timeout ? options.timeout * 1000 : undefined
    };

    const toolName = config.name || options.repl;
    this.setupReplFromConfig(toolName, config);
  }

  private setupSingleCommandFromConfig(toolName: string, config: CommandConfig): void {
    logger.info(`Setting up single command tool: ${toolName}`);

    const tool = new SingleCommandTool(config, this.security);
    this.singleCommandTools.set(toolName, tool);

    const mcpTool = tool.generateMcpTool();
    const zodSchema = this.convertToZodSchema(config.args || {});

    this.mcp.addTool({
      name: mcpTool.name,
      description: mcpTool.description,
      parameters: zodSchema,
      execute: async (args) => {
        logger.debug(`Executing tool ${mcpTool.name} with args:`, args);
        const result = await tool.execute(args);

        if (result.success) {
          return result.stdout || 'Command executed successfully';
        } else {
          throw new Error(result.error || result.stderr || 'Command execution failed');
        }
      }
    });
  }

  private setupReplFromConfig(toolName: string, config: ReplConfig): void {
    logger.info(`Setting up REPL tool: ${toolName}`);

    const manager = new ReplSessionManager(config, this.security);
    this.replManagers.set(toolName, manager);

    const mcpTools = manager.generateMcpTools();

    for (const mcpTool of mcpTools) {
      const zodSchema = this.convertMcpSchemaToZod(mcpTool.inputSchema);

      this.mcp.addTool({
        name: mcpTool.name,
        description: mcpTool.description,
        parameters: zodSchema,
        execute: async (args) => {
          logger.debug(`Executing REPL tool ${mcpTool.name} with args:`, args);

          if (mcpTool.name.endsWith('_start_session')) {
            const result = await manager.startSession(args.args || []);
            if (result.success) {
              return `Session started with ID: ${result.sessionId}`;
            } else {
              throw new Error(result.error || 'Failed to start session');
            }
          } else if (mcpTool.name.endsWith('_send')) {
            const result = await manager.sendCommand(args.sessionId, args.command);
            if (result.success) {
              return 'Command sent successfully';
            } else {
              throw new Error(result.error || 'Failed to send command');
            }
          } else if (mcpTool.name.endsWith('_recv')) {
            const result = await manager.receiveOutput(
              args.sessionId,
              args.timeout || 10,
              args.endMarker
            );
            return result.stdout || result.stderr || 'No output received';
          } else if (mcpTool.name.endsWith('_send_recv')) {
            const result = await manager.sendAndReceive(
              args.sessionId,
              args.command,
              args.timeout || 10,
              args.endMarker
            );
            if (result.success) {
              return result.stdout || result.stderr || 'Command executed, no output';
            } else {
              throw new Error(result.error || 'Failed to execute command');
            }
          } else if (mcpTool.name.endsWith('_close_session')) {
            const result = manager.closeSession(args.sessionId);
            if (result.success) {
              return 'Session closed successfully';
            } else {
              throw new Error(result.error || 'Failed to close session');
            }
          }

          throw new Error(`Unknown tool: ${mcpTool.name}`);
        }
      });
    }
  }

  private parseArgsFromCommandLine(args: string[]): Record<string, ArgumentConfig> {
    const result: Record<string, ArgumentConfig> = {};

    for (const arg of args) {
      // Format: "ARGNAME:type:'description'"
      const match = arg.match(/^([^:]+):([^:]+):(.+)$/);
      if (match) {
        const [, name, type, description] = match;
        result[name] = {
          type: type as any,
          description: description.replace(/^['"]|['"]$/g, '') // Remove quotes
        };
      }
    }

    return result;
  }

  private convertToZodSchema(args: Record<string, ArgumentConfig>): z.ZodSchema {
    const schemaFields: Record<string, z.ZodTypeAny> = {};

    for (const [argName, argConfig] of Object.entries(args)) {
      let field: z.ZodTypeAny;

      switch (argConfig.type) {
        case 'int':
          field = z.number().int();
          break;
        case 'float':
          field = z.number();
          break;
        case 'boolean':
          field = z.boolean();
          break;
        case 'string[]':
          field = z.array(z.string());
          break;
        default:
          field = z.string();
      }

      if (argConfig.optional) {
        field = field.optional();
      }

      if (argConfig.default !== undefined) {
        field = field.default(argConfig.default);
      }

      schemaFields[argName] = field;
    }

    return z.object(schemaFields);
  }

  private convertMcpSchemaToZod(inputSchema: any): z.ZodSchema {
    const schemaFields: Record<string, z.ZodTypeAny> = {};

    if (inputSchema.properties) {
      for (const [propName, propDef] of Object.entries(inputSchema.properties)) {
        const prop = propDef as any;
        let field: z.ZodTypeAny;

        switch (prop.type) {
          case 'number':
            field = z.number();
            break;
          case 'boolean':
            field = z.boolean();
            break;
          case 'array':
            field = z.array(z.string());
            break;
          default:
            field = z.string();
        }

        if (prop.default !== undefined) {
          field = field.default(prop.default);
        }

        if (!inputSchema.required?.includes(propName)) {
          field = field.optional();
        }

        schemaFields[propName] = field;
      }
    }

    return z.object(schemaFields);
  }

  public async start(): Promise<void> {
    logger.info('Starting Shell MCP Server...');

    // Setup cleanup handlers
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
    process.on('exit', () => this.cleanup());

    await this.mcp.start({
      transportType: 'stdio'
    });
    logger.info('Shell MCP Server started successfully');
  }

  private cleanup(): void {
    logger.info('Cleaning up resources...');
    
    // Close all REPL sessions
    for (const manager of this.replManagers.values()) {
      manager.cleanup();
    }
    
    logger.info('Cleanup completed');
  }
}
