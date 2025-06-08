import { spawn } from 'child_process';
import { CommandConfig, CommandResult, ArgumentConfig, McpTool } from '../types';
import { SecurityValidator } from '../utils/security';
import { logger } from '../utils/logger';

export class SingleCommandTool {
  private config: CommandConfig;
  private security: SecurityValidator;

  constructor(config: CommandConfig, security?: SecurityValidator) {
    this.config = config;
    this.security = security || new SecurityValidator();
  }

  public generateMcpTool(): McpTool {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    if (this.config.args) {
      for (const [argName, argConfig] of Object.entries(this.config.args)) {
        properties[argName] = {
          type: this.mapArgumentType(argConfig.type),
          description: argConfig.description || `Parameter ${argName}`
        };

        if (argConfig.default !== undefined) {
          properties[argName].default = argConfig.default;
        }

        if (!argConfig.optional) {
          required.push(argName);
        }
      }
    }

    return {
      name: this.config.name || this.generateDefaultName(),
      description: this.config.description || `Execute command: ${this.config.cmd}`,
      inputSchema: {
        type: 'object',
        properties,
        ...(required.length > 0 && { required })
      }
    };
  }

  public async execute(args: Record<string, any> = {}): Promise<CommandResult> {
    try {
      const command = this.buildCommand(args);
      logger.info(`Executing command: ${command}`);

      // Security validation
      const validation = this.security.validateCommand(command);
      if (!validation.valid) {
        throw new Error(`Security validation failed: ${validation.reason}`);
      }

      const timeout = this.config.timeout || 30000; // 30 seconds default
      const timeoutValidation = this.security.validateTimeout(timeout / 1000);
      if (!timeoutValidation.valid) {
        throw new Error(`Timeout validation failed: ${timeoutValidation.reason}`);
      }

      return await this.executeCommand(command, timeout);
    } catch (error) {
      logger.error(`Command execution failed: ${error}`);
      return {
        success: false,
        stdout: '',
        stderr: '',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private buildCommand(args: Record<string, any>): string {
    let command = this.config.cmd;

    // Replace environment variable style placeholders
    if (this.config.args) {
      for (const [argName, argConfig] of Object.entries(this.config.args)) {
        const value = args[argName] ?? argConfig.default;
        if (value !== undefined) {
          const placeholder = `$${argName}`;
          const sanitizedValue = this.security.sanitizeInput(String(value));
          command = command.replace(new RegExp(`\\${placeholder}`, 'g'), sanitizedValue);
        }
      }
    }

    return command;
  }

  private async executeCommand(command: string, timeout: number): Promise<CommandResult> {
    return new Promise((resolve) => {
      const parts = command.split(' ');
      const cmd = parts[0];
      const args = parts.slice(1);

      const child = spawn(cmd, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false // Disable shell to prevent injection
      });

      let stdout = '';
      let stderr = '';
      let isResolved = false;

      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          child.kill('SIGTERM');
          resolve({
            success: false,
            stdout,
            stderr,
            error: `Command timed out after ${timeout}ms`
          });
        }
      }, timeout);

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          resolve({
            success: code === 0,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode: code || 0
          });
        }
      });

      child.on('error', (error) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          resolve({
            success: false,
            stdout,
            stderr,
            error: error.message
          });
        }
      });
    });
  }

  private generateDefaultName(): string {
    const cmd = this.config.cmd.split(' ')[0];
    return cmd.replace(/[^a-zA-Z0-9]/g, '_');
  }

  private mapArgumentType(type: string): string {
    switch (type) {
      case 'int':
      case 'float':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'string[]':
        return 'array';
      default:
        return 'string';
    }
  }
}
