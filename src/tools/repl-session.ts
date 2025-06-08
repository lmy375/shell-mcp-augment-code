import { spawn, ChildProcess } from 'child_process';
import { ReplConfig, ReplSession, McpTool, CommandResult } from '../types';
import { SecurityValidator } from '../utils/security';
import { logger } from '../utils/logger';

export class ReplSessionManager {
  private sessions: Map<string, ReplSession> = new Map();
  private config: ReplConfig;
  private security: SecurityValidator;
  private sessionCounter = 0;

  constructor(config: ReplConfig, security?: SecurityValidator) {
    this.config = config;
    this.security = security || new SecurityValidator();
  }

  public generateMcpTools(): McpTool[] {
    const baseName = this.config.name || this.config.command.replace(/[^a-zA-Z0-9]/g, '_');
    
    return [
      {
        name: `${baseName}_start_session`,
        description: `Start a ${this.config.command} REPL session`,
        inputSchema: {
          type: 'object',
          properties: {
            args: {
              type: 'array',
              description: 'Additional arguments to start the session',
              optional: true
            }
          }
        }
      },
      {
        name: `${baseName}_send`,
        description: `Send command to the ${this.config.command} session`,
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID returned from start_session'
            },
            command: {
              type: 'string',
              description: 'Command to execute in the session'
            }
          },
          required: ['sessionId', 'command']
        }
      },
      {
        name: `${baseName}_recv`,
        description: `Read output from the ${this.config.command} session`,
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID'
            },
            timeout: {
              type: 'number',
              description: 'Timeout in seconds',
              default: 10
            },
            endMarker: {
              type: 'string',
              description: 'Read until this marker is found',
              optional: true
            }
          },
          required: ['sessionId']
        }
      },
      {
        name: `${baseName}_send_recv`,
        description: `Send command and receive output in one call`,
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID'
            },
            command: {
              type: 'string',
              description: 'Command to execute'
            },
            timeout: {
              type: 'number',
              description: 'Timeout in seconds',
              default: 10
            },
            endMarker: {
              type: 'string',
              description: 'Read until this marker is found',
              optional: true
            }
          },
          required: ['sessionId', 'command']
        }
      },
      {
        name: `${baseName}_close_session`,
        description: `Close the ${this.config.command} session`,
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID to close'
            }
          },
          required: ['sessionId']
        }
      }
    ];
  }

  public async startSession(args: string[] = []): Promise<{ sessionId: string; success: boolean; error?: string }> {
    try {
      const sessionId = `session_${++this.sessionCounter}_${Date.now()}`;
      logger.info(`Starting REPL session ${sessionId} for command: ${this.config.command}`);

      const commandArgs = [...(this.config.args || []), ...args];
      const process = spawn(this.config.command, commandArgs, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false
      });

      const session: ReplSession = {
        id: sessionId,
        process,
        isActive: true,
        lastActivity: new Date()
      };

      this.sessions.set(sessionId, session);

      // Handle process exit
      process.on('exit', (code) => {
        logger.info(`REPL session ${sessionId} exited with code ${code}`);
        session.isActive = false;
      });

      process.on('error', (error) => {
        logger.error(`REPL session ${sessionId} error: ${error.message}`);
        session.isActive = false;
      });

      return { sessionId, success: true };
    } catch (error) {
      logger.error(`Failed to start REPL session: ${error}`);
      return {
        sessionId: '',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  public async sendCommand(sessionId: string, command: string): Promise<CommandResult> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return {
        success: false,
        stdout: '',
        stderr: '',
        error: 'Session not found or inactive'
      };
    }

    try {
      // Security validation
      const validation = this.security.validateCommand(command);
      if (!validation.valid) {
        return {
          success: false,
          stdout: '',
          stderr: '',
          error: `Security validation failed: ${validation.reason}`
        };
      }

      const sanitizedCommand = this.security.sanitizeInput(command);
      session.process.stdin?.write(sanitizedCommand + '\n');
      session.lastActivity = new Date();

      return {
        success: true,
        stdout: '',
        stderr: '',
      };
    } catch (error) {
      logger.error(`Failed to send command to session ${sessionId}: ${error}`);
      return {
        success: false,
        stdout: '',
        stderr: '',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  public async receiveOutput(
    sessionId: string, 
    timeout: number = 10, 
    endMarker?: string
  ): Promise<CommandResult> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return {
        success: false,
        stdout: '',
        stderr: '',
        error: 'Session not found or inactive'
      };
    }

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let isResolved = false;

      const timeoutMs = timeout * 1000;
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          resolve({
            success: true,
            stdout: stdout.trim(),
            stderr: stderr.trim()
          });
        }
      }, timeoutMs);

      const stdoutHandler = (data: Buffer) => {
        const text = data.toString();
        stdout += text;
        
        if (endMarker && text.includes(endMarker)) {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutId);
            session.process.stdout?.off('data', stdoutHandler);
            session.process.stderr?.off('data', stderrHandler);
            resolve({
              success: true,
              stdout: stdout.trim(),
              stderr: stderr.trim()
            });
          }
        }
      };

      const stderrHandler = (data: Buffer) => {
        stderr += data.toString();
      };

      session.process.stdout?.on('data', stdoutHandler);
      session.process.stderr?.on('data', stderrHandler);

      session.lastActivity = new Date();
    });
  }

  public async sendAndReceive(
    sessionId: string,
    command: string,
    timeout: number = 10,
    endMarker?: string
  ): Promise<CommandResult> {
    const sendResult = await this.sendCommand(sessionId, command);
    if (!sendResult.success) {
      return sendResult;
    }

    // Wait a bit for the command to start producing output
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return await this.receiveOutput(sessionId, timeout, endMarker);
  }

  public closeSession(sessionId: string): { success: boolean; error?: string } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: 'Session not found'
      };
    }

    try {
      if (session.isActive) {
        session.process.kill('SIGTERM');
        session.isActive = false;
      }
      this.sessions.delete(sessionId);
      logger.info(`Closed REPL session ${sessionId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to close session ${sessionId}: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  public listActiveSessions(): string[] {
    return Array.from(this.sessions.values())
      .filter(session => session.isActive)
      .map(session => session.id);
  }

  public cleanup(): void {
    for (const sessionId of this.sessions.keys()) {
      this.closeSession(sessionId);
    }
  }
}
