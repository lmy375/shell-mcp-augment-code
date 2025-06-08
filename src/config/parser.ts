import fs from 'fs';
import { logger } from '../utils/logger.js';

export interface ArgumentConfig {
  type: 'string' | 'int' | 'float' | 'boolean';
  description: string;
  optional?: boolean;
  default?: any;
}

export interface ToolConfig {
  cmd: string;
  name?: string;
  description?: string;
  args?: Record<string, ArgumentConfig>;
  timeout?: number;
}

export interface ReplConfig {
  command: string;
  name?: string;
  description?: string;
  timeout?: number;
  startArgs?: string[];
  endArgs?: string[];
  prompt?: string;
}

export interface ShellMcpConfig {
  tools?: Record<string, ToolConfig>;
  repls?: Record<string, ReplConfig>;
}

export class ConfigParser {
  static parseConfigFile(configPath: string): ShellMcpConfig {
    logger.info('Parsing config file', { configPath });

    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);
      
      return this.validateConfig(config);
    } catch (error: any) {
      logger.error('Failed to parse config file', { configPath, error });
      throw new Error(`Failed to parse config file: ${error.message}`);
    }
  }

  static parseArgumentString(argString: string): ArgumentConfig {
    // Format: "name:type:description" or "name:type:optional:description"
    const parts = argString.split(':');
    
    if (parts.length < 3) {
      throw new Error(`Invalid argument format: ${argString}. Expected format: name:type:description`);
    }

    const [, type, ...descParts] = parts;
    let description = descParts.join(':');
    let optional = false;

    // Check if description starts with 'optional:'
    if (description.toLowerCase().startsWith('optional:')) {
      optional = true;
      description = description.substring(9);
    }

    // Remove quotes if present
    description = description.replace(/^['"]|['"]$/g, '');

    if (!['string', 'int', 'float', 'boolean'].includes(type)) {
      throw new Error(`Invalid argument type: ${type}. Must be one of: string, int, float, boolean`);
    }

    return {
      type: type as ArgumentConfig['type'],
      description,
      optional
    };
  }

  private static validateConfig(config: any): ShellMcpConfig {
    const result: ShellMcpConfig = {};

    if (config.tools) {
      result.tools = {};
      for (const [name, toolConfig] of Object.entries(config.tools)) {
        result.tools[name] = this.validateToolConfig(toolConfig as any);
      }
    }

    if (config.repls) {
      result.repls = {};
      for (const [name, replConfig] of Object.entries(config.repls)) {
        result.repls[name] = this.validateReplConfig(replConfig as any);
      }
    }

    // Support legacy format where tools are at root level
    if (!result.tools && !result.repls) {
      result.tools = {};
      for (const [name, toolConfig] of Object.entries(config)) {
        if (typeof toolConfig === 'object' && toolConfig !== null && 'cmd' in toolConfig) {
          result.tools[name] = this.validateToolConfig(toolConfig as any);
        }
      }
    }

    return result;
  }

  private static validateToolConfig(config: any): ToolConfig {
    if (!config.cmd) {
      throw new Error('Tool config must have a "cmd" property');
    }

    return {
      cmd: config.cmd,
      name: config.name,
      description: config.description,
      args: config.args || {},
      timeout: config.timeout || 30000
    };
  }

  private static validateReplConfig(config: any): ReplConfig {
    if (!config.command) {
      throw new Error('REPL config must have a "command" property');
    }

    return {
      command: config.command,
      name: config.name,
      description: config.description,
      timeout: config.timeout || 30000,
      startArgs: config.startArgs || [],
      endArgs: config.endArgs || [],
      prompt: config.prompt
    };
  }
}
