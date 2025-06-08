import { SecurityConfig } from '../types';
import { logger } from './logger';

export class SecurityValidator {
  private config: SecurityConfig;

  constructor(config: SecurityConfig = {}) {
    this.config = {
      allowShellOperators: false,
      allowFileOperations: false,
      allowNetworkAccess: true,
      maxTimeout: 300, // 5 minutes
      ...config
    };
  }

  public validateCommand(command: string): { valid: boolean; reason?: string } {
    logger.debug(`Validating command: ${command}`);

    // Check for shell operators that could lead to command injection
    if (!this.config.allowShellOperators) {
      const dangerousOperators = ['&&', '||', ';', '|', '>', '<', '>>', '<<', '&', '$(', '`'];
      for (const operator of dangerousOperators) {
        if (command.includes(operator)) {
          return {
            valid: false,
            reason: `Command contains potentially dangerous operator: ${operator}`
          };
        }
      }
    }

    // Check for directory traversal attempts
    if (command.includes('../') || command.includes('..\\')) {
      return {
        valid: false,
        reason: 'Command contains directory traversal patterns'
      };
    }

    // Check for file operations if not allowed
    if (!this.config.allowFileOperations) {
      const fileOperations = ['rm ', 'del ', 'rmdir', 'mv ', 'cp ', 'copy ', 'move '];
      for (const op of fileOperations) {
        if (command.toLowerCase().includes(op)) {
          return {
            valid: false,
            reason: `File operation not allowed: ${op.trim()}`
          };
        }
      }
    }

    // Check blocked commands
    if (this.config.blockedCommands) {
      const commandParts = command.split(' ');
      const baseCommand = commandParts[0];
      if (this.config.blockedCommands.includes(baseCommand)) {
        return {
          valid: false,
          reason: `Command is blocked: ${baseCommand}`
        };
      }
    }

    // Check allowed commands (if whitelist is defined)
    if (this.config.allowedCommands && this.config.allowedCommands.length > 0) {
      const commandParts = command.split(' ');
      const baseCommand = commandParts[0];
      if (!this.config.allowedCommands.includes(baseCommand)) {
        return {
          valid: false,
          reason: `Command not in allowed list: ${baseCommand}`
        };
      }
    }

    return { valid: true };
  }

  public validateTimeout(timeout: number): { valid: boolean; reason?: string } {
    if (timeout <= 0) {
      return {
        valid: false,
        reason: 'Timeout must be positive'
      };
    }

    if (this.config.maxTimeout && timeout > this.config.maxTimeout) {
      return {
        valid: false,
        reason: `Timeout exceeds maximum allowed: ${this.config.maxTimeout}s`
      };
    }

    return { valid: true };
  }

  public sanitizeInput(input: string): string {
    // Remove null bytes and other control characters
    // eslint-disable-next-line no-control-regex
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  public escapeShellArgument(arg: string): string {
    // Escape shell special characters
    return arg.replace(/(["\s'$`\\])/g, '\\$1');
  }
}
