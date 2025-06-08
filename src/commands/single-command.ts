import { spawn } from 'child_process';
import { logger } from '../utils/logger.js';
import { withTimeout, TimeoutError } from '../utils/timeout.js';
import { CommandValidator } from '../security/validator.js';
import { ToolConfig, ArgumentConfig } from '../config/parser.js';

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export class SingleCommandExecutor {
  constructor(private config: ToolConfig) {}

  async execute(args: Record<string, any> = {}): Promise<CommandResult> {
    logger.info('Executing single command', { 
      cmd: this.config.cmd, 
      args,
      timeout: this.config.timeout 
    });

    // Validate arguments
    this.validateArguments(args);

    // Prepare command with environment variables
    const env = this.prepareEnvironment(args);
    const command = this.config.cmd;

    // Validate the final command
    CommandValidator.validateCommand(command);

    try {
      const result = await withTimeout(
        this.runCommand(command, env),
        this.config.timeout || 30000,
        `Command execution timed out after ${this.config.timeout || 30000}ms`
      );

      logger.info('Command executed successfully', { 
        cmd: command,
        exitCode: result.exitCode,
        stdoutLength: result.stdout.length,
        stderrLength: result.stderr.length
      });

      return result;
    } catch (error: any) {
      logger.error('Command execution failed', {
        cmd: command,
        error: error.message
      });

      if (error instanceof TimeoutError) {
        return {
          stdout: '',
          stderr: `Command timed out: ${error.message}`,
          exitCode: -1,
          success: false
        };
      }

      throw error;
    }
  }

  private validateArguments(args: Record<string, any>): void {
    if (!this.config.args) return;

    for (const [argName, argConfig] of Object.entries(this.config.args)) {
      const value = args[argName];

      // Check required arguments
      if (!argConfig.optional && (value === undefined || value === null)) {
        throw new Error(`Required argument '${argName}' is missing`);
      }

      // Validate argument value if provided
      if (value !== undefined && value !== null) {
        this.validateArgumentValue(value, argName, argConfig);
      }
    }
  }

  private validateArgumentValue(value: any, argName: string, config: ArgumentConfig): void {
    // Type validation
    switch (config.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Argument '${argName}' must be a string`);
        }
        CommandValidator.validateArgument(value, argName);
        break;
      case 'int':
        if (!Number.isInteger(Number(value))) {
          throw new Error(`Argument '${argName}' must be an integer`);
        }
        break;
      case 'float':
        if (isNaN(Number(value))) {
          throw new Error(`Argument '${argName}' must be a number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          throw new Error(`Argument '${argName}' must be a boolean`);
        }
        break;
    }
  }

  private prepareEnvironment(args: Record<string, any>): Record<string, string> {
    const env: Record<string, string> = {};

    // Copy process.env, filtering out undefined values
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        env[key] = value;
      }
    }

    // Add arguments as environment variables
    if (this.config.args) {
      for (const [argName, argConfig] of Object.entries(this.config.args)) {
        const value = args[argName];
        if (value !== undefined && value !== null) {
          env[argName] = String(value);
        } else if (argConfig.default !== undefined) {
          env[argName] = String(argConfig.default);
        }
      }
    }

    return CommandValidator.sanitizeEnvironmentVariables(env);
  }

  private runCommand(command: string, env: Record<string, string>): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      // Parse command and arguments
      const parts = command.trim().split(/\s+/);
      const cmd = parts[0];
      const args = parts.slice(1);

      logger.debug('Spawning process', { cmd, args, envKeys: Object.keys(env) });

      const child = spawn(cmd, args, {
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false // Important for security
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const result: CommandResult = {
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code || 0,
          success: (code || 0) === 0
        };

        logger.debug('Process completed', { 
          cmd, 
          exitCode: result.exitCode,
          success: result.success 
        });

        resolve(result);
      });

      child.on('error', (error) => {
        logger.error('Process error', { cmd, error: error.message });
        reject(new Error(`Failed to execute command: ${error.message}`));
      });

      // Close stdin to prevent hanging
      child.stdin?.end();
    });
  }

  getToolDefinition() {
    return {
      name: this.config.name || 'command',
      description: this.config.description || `Execute command: ${this.config.cmd}`,
      args: this.config.args || {}
    };
  }
}
