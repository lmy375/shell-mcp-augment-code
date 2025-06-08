import { logger } from '../utils/logger.js';

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class CommandValidator {
  private static readonly DANGEROUS_PATTERNS = [
    // Command chaining
    /[;&|`]/,
    // File redirection
    /[<>]/,
    // Directory traversal
    /\.\.[/\\]/,
    // Command substitution with backticks
    /`[^`]*`/,
    // Process substitution
    /<\([^)]*\)/,
    />\([^)]*\)/,
  ];

  private static readonly SAFE_COMMAND_CHARS = /^[a-zA-Z0-9\s\-_./=:@+,]*$/;

  static validateCommand(command: string): void {
    logger.debug('Validating command', { command });

    if (!command || command.trim().length === 0) {
      throw new SecurityError('Command cannot be empty');
    }

    // Allow safe environment variable patterns
    let safeCommand = command;
    // Allow $VAR and ${VAR} patterns for environment variables
    safeCommand = safeCommand.replace(/\$[A-Z_][A-Z0-9_]*/g, 'VAR');
    safeCommand = safeCommand.replace(/\$\{[A-Z_][A-Z0-9_]*\}/g, 'VAR');
    // Allow arithmetic expressions like $((expr))
    safeCommand = safeCommand.replace(/\$\(\([^)]*\)\)/g, 'EXPR');

    // Check for dangerous patterns in the sanitized command
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(safeCommand)) {
        logger.warn('Dangerous pattern detected in command', {
          command,
          pattern: pattern.toString()
        });
        throw new SecurityError(`Command contains dangerous pattern: ${pattern.toString()}`);
      }
    }

    // Additional validation for argument values
    const trimmed = command.trim();
    if (trimmed.startsWith('-') && trimmed.includes('--')) {
      // Allow common command line patterns but be cautious
      logger.debug('Command appears to contain command line arguments', { command });
    }
  }

  static validateArgument(arg: string, argName: string): void {
    logger.debug('Validating argument', { arg, argName });

    if (typeof arg !== 'string') {
      throw new SecurityError(`Argument ${argName} must be a string`);
    }

    // Check for dangerous patterns in arguments
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(arg)) {
        logger.warn('Dangerous pattern detected in argument', { 
          arg, 
          argName, 
          pattern: pattern.toString() 
        });
        throw new SecurityError(`Argument ${argName} contains dangerous pattern: ${pattern.toString()}`);
      }
    }
  }

  static sanitizeEnvironmentVariables(env: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(env)) {
      // Skip npm package variables that may contain special characters
      if (key.startsWith('npm_package_')) {
        continue;
      }

      // Validate environment variable names
      if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
        logger.warn('Invalid environment variable name', { key });
        continue;
      }

      // Validate environment variable values
      try {
        this.validateArgument(value, `env.${key}`);
        sanitized[key] = value;
      } catch (error: any) {
        logger.warn('Skipping invalid environment variable', { key, error: error.message });
      }
    }

    return sanitized;
  }
}
