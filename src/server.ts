import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { logger } from './utils/logger.js';
import { SingleCommandExecutor } from './commands/single-command.js';
import { ReplSessionManager } from './commands/repl-session.js';
import { ShellMcpConfig, ArgumentConfig } from './config/parser.js';

export class ShellMcpServer {
  private mcp: FastMCP;
  private commandExecutors = new Map<string, SingleCommandExecutor>();
  private replManagers = new Map<string, ReplSessionManager>();

  constructor(private config: ShellMcpConfig) {
    this.mcp = new FastMCP({
      name: 'shell-mcp',
      version: '1.0.0'
    });

    this.setupTools();
  }

  private createZodSchema(args: Record<string, ArgumentConfig>): z.ZodSchema {
    const shape: Record<string, z.ZodTypeAny> = {};

    for (const [name, config] of Object.entries(args)) {
      let zodType: z.ZodTypeAny;

      switch (config.type) {
        case 'string':
          zodType = z.string().describe(config.description);
          break;
        case 'int':
          zodType = z.number().int().describe(config.description);
          break;
        case 'float':
          zodType = z.number().describe(config.description);
          break;
        case 'boolean':
          zodType = z.boolean().describe(config.description);
          break;
        default:
          zodType = z.string().describe(config.description);
      }

      if (config.optional) {
        zodType = zodType.optional();
      }

      if (config.default !== undefined) {
        zodType = zodType.default(config.default);
      }

      shape[name] = zodType;
    }

    return z.object(shape);
  }

  private convertInputSchemaToZod(inputSchema: any): z.ZodSchema {
    if (!inputSchema || !inputSchema.properties) {
      return z.object({});
    }

    const shape: Record<string, z.ZodTypeAny> = {};
    const required = inputSchema.required || [];

    for (const [name, prop] of Object.entries(inputSchema.properties)) {
      const property = prop as any;
      let zodType: z.ZodTypeAny;

      switch (property.type) {
        case 'string':
          zodType = z.string();
          break;
        case 'number':
          zodType = z.number();
          break;
        case 'integer':
          zodType = z.number().int();
          break;
        case 'boolean':
          zodType = z.boolean();
          break;
        case 'array':
          if (property.items?.type === 'string') {
            zodType = z.array(z.string());
          } else {
            zodType = z.array(z.any());
          }
          break;
        default:
          zodType = z.any();
      }

      if (property.description) {
        zodType = zodType.describe(property.description);
      }

      if (property.default !== undefined) {
        zodType = zodType.default(property.default);
      }

      if (!required.includes(name)) {
        zodType = zodType.optional();
      }

      shape[name] = zodType;
    }

    return z.object(shape);
  }

  private setupTools(): void {
    logger.info('Setting up MCP tools', { 
      toolCount: Object.keys(this.config.tools || {}).length,
      replCount: Object.keys(this.config.repls || {}).length
    });

    // Setup single command tools
    if (this.config.tools) {
      for (const [name, toolConfig] of Object.entries(this.config.tools)) {
        this.setupSingleCommandTool(name, toolConfig);
      }
    }

    // Setup REPL tools
    if (this.config.repls) {
      for (const [name, replConfig] of Object.entries(this.config.repls)) {
        this.setupReplTools(name, replConfig);
      }
    }
  }

  private setupSingleCommandTool(name: string, toolConfig: any): void {
    const executor = new SingleCommandExecutor(toolConfig);
    this.commandExecutors.set(name, executor);

    const toolDef = executor.getToolDefinition();

    logger.debug('Registering single command tool', { name, toolDef });

    // Convert arguments to Zod schema
    const zodSchema = this.createZodSchema(toolDef.args);

    this.mcp.addTool({
      name: toolDef.name,
      description: toolDef.description,
      parameters: zodSchema,
      execute: async (args) => {
        try {
          const result = await executor.execute(args);

          if (result.success) {
            return result.stdout || 'Command executed successfully (no output)';
          } else {
            return `Command failed (exit code ${result.exitCode}):\n${result.stderr || result.stdout}`;
          }
        } catch (error: any) {
          logger.error('Tool execution error', { name, error: error.message });
          throw new Error(`Error executing command: ${error.message}`);
        }
      }
    });
  }

  private setupReplTools(name: string, replConfig: any): void {
    const manager = new ReplSessionManager(replConfig);
    this.replManagers.set(name, manager);

    const toolDefs = manager.getToolDefinitions();
    
    logger.debug('Registering REPL tools', { name, toolCount: toolDefs.length });

    for (const toolDef of toolDefs) {
      // Convert inputSchema to Zod schema
      const zodSchema = this.convertInputSchemaToZod(toolDef.inputSchema);

      this.mcp.addTool({
        name: toolDef.name,
        description: toolDef.description,
        parameters: zodSchema,
        execute: async (args) => {
          try {
            return await this.handleReplTool(manager, toolDef.name, args);
          } catch (error: any) {
            logger.error('REPL tool execution error', {
              toolName: toolDef.name,
              error: error.message
            });
            throw new Error(`Error: ${error.message}`);
          }
        }
      });
    }
  }

  private async handleReplTool(manager: ReplSessionManager, toolName: string, args: any): Promise<string> {
    const action = toolName.split('_').pop();

    switch (action) {
      case 'session':
        if (toolName.includes('start')) {
          const sessionId = await manager.startSession(args.args || []);
          return `Session started: ${sessionId}`;
        } else if (toolName.includes('close')) {
          await manager.closeSession(args.sessionId, args.args || []);
          return `Session closed: ${args.sessionId}`;
        }
        break;

      case 'send':
        if (toolName.includes('receive')) {
          // send_receive
          const result = await manager.sendAndReceive(
            args.sessionId,
            args.command,
            args.timeout,
            args.endMarker
          );
          return result.output || '(no output)';
        } else {
          // send only
          await manager.sendCommand(args.sessionId, args.command);
          return 'Command sent';
        }

      case 'receive':
        const result = await manager.receiveOutput(
          args.sessionId,
          args.timeout,
          args.endMarker
        );
        return result.output || '(no output)';

      default:
        throw new Error(`Unknown REPL action: ${action}`);
    }

    throw new Error(`Unknown REPL tool: ${toolName}`);
  }

  async start(): Promise<void> {
    logger.info('Starting Shell MCP Server');

    // Setup graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());

    await this.mcp.start({ transportType: 'stdio' });
  }

  private async shutdown(): Promise<void> {
    logger.info('Shutting down Shell MCP Server');
    
    // Close all active REPL sessions
    for (const [name, manager] of this.replManagers) {
      const activeSessions = manager.getActiveSessions();
      logger.info('Closing active REPL sessions', { name, sessionCount: activeSessions.length });
      
      for (const sessionId of activeSessions) {
        try {
          await manager.closeSession(sessionId);
        } catch (error: any) {
          logger.warn('Error closing session during shutdown', {
            sessionId,
            error: error.message
          });
        }
      }
    }

    process.exit(0);
  }
}
