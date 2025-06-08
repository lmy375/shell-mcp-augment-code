export interface CommandConfig {
  cmd: string;
  name?: string;
  description?: string;
  args?: Record<string, ArgumentConfig>;
  timeout?: number;
}

export interface ArgumentConfig {
  type: 'string' | 'int' | 'float' | 'boolean' | 'string[]';
  description?: string;
  optional?: boolean;
  default?: any;
}

export interface ReplConfig {
  command: string;
  name?: string;
  description?: string;
  args?: string[];
  timeout?: number;
  endMarkers?: string[];
}

export interface ShellMcpConfig {
  [toolName: string]: CommandConfig | ReplConfig;
}

export interface ToolArgument {
  type: string;
  description?: string;
  optional?: boolean;
  default?: any;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, ToolArgument>;
    required?: string[];
  };
}

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode?: number;
  error?: string;
}

export interface ReplSession {
  id: string;
  process: any;
  isActive: boolean;
  lastActivity: Date;
}

export interface SecurityConfig {
  allowedCommands?: string[];
  blockedCommands?: string[];
  allowShellOperators?: boolean;
  allowFileOperations?: boolean;
  allowNetworkAccess?: boolean;
  maxTimeout?: number;
}

export interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

export interface ServerOptions {
  config?: string;
  cmd?: string;
  name?: string;
  description?: string;
  args?: string[];
  repl?: string;
  timeout?: number;
  security?: SecurityConfig;
  logLevel?: keyof LogLevel;
}
