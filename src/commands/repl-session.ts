import { spawn, ChildProcess } from 'child_process';
import { logger } from '../utils/logger.js';
import { withTimeout, delay } from '../utils/timeout.js';
import { CommandValidator } from '../security/validator.js';
import { ReplConfig } from '../config/parser.js';

export interface ReplSession {
  id: string;
  process: ChildProcess;
  isActive: boolean;
  startTime: Date;
}

export interface ReplResult {
  output: string;
  error?: string;
  success: boolean;
}

export class ReplSessionManager {
  private sessions = new Map<string, ReplSession>();
  private sessionCounter = 0;

  constructor(private config: ReplConfig) {}

  async startSession(args: string[] = []): Promise<string> {
    const sessionId = `session_${++this.sessionCounter}_${Date.now()}`;
    
    logger.info('Starting REPL session', {
      sessionId,
      command: this.config.command,
      args: [...(this.config.startArgs || []), ...args]
    });

    try {
      const startArgs = this.config.startArgs || [];
      const allArgs = [...startArgs, ...args];
      
      // Validate command and arguments
      CommandValidator.validateCommand(this.config.command);
      allArgs.forEach((arg, index) => {
        CommandValidator.validateArgument(arg, `arg_${index}`);
      });

      const childProcess = spawn(this.config.command, allArgs, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
        env: process.env
      });

      const session: ReplSession = {
        id: sessionId,
        process: childProcess,
        isActive: true,
        startTime: new Date()
      };

      this.sessions.set(sessionId, session);

      // Handle process events
      childProcess.on('close', (code: number | null) => {
        logger.info('REPL session closed', { sessionId, exitCode: code });
        session.isActive = false;
      });

      childProcess.on('error', (error: Error) => {
        logger.error('REPL session error', { sessionId, error: error.message });
        session.isActive = false;
      });

      // Wait a bit for the process to start
      await delay(100);

      if (!session.isActive) {
        throw new Error('Failed to start REPL session');
      }

      logger.info('REPL session started successfully', { sessionId });
      return sessionId;

    } catch (error: any) {
      logger.error('Failed to start REPL session', { error: error.message });
      throw error;
    }
  }

  async sendCommand(sessionId: string, command: string): Promise<void> {
    const session = this.getActiveSession(sessionId);
    
    logger.debug('Sending command to REPL', { sessionId, command });

    // Validate command
    CommandValidator.validateCommand(command);

    if (!session.process.stdin) {
      throw new Error('Session stdin is not available');
    }

    session.process.stdin.write(command + '\n');
  }

  async receiveOutput(
    sessionId: string, 
    timeoutMs: number = 10000, 
    endMarker?: string
  ): Promise<ReplResult> {
    const session = this.getActiveSession(sessionId);
    
    logger.debug('Receiving output from REPL', { 
      sessionId, 
      timeoutMs, 
      endMarker 
    });

    return withTimeout(
      this.collectOutput(session, endMarker),
      timeoutMs,
      `REPL output timeout after ${timeoutMs}ms`
    );
  }

  async sendAndReceive(
    sessionId: string,
    command: string,
    timeoutMs: number = 10000,
    endMarker?: string
  ): Promise<ReplResult> {
    await this.sendCommand(sessionId, command);
    
    // Small delay to allow command to start processing
    await delay(50);
    
    return this.receiveOutput(sessionId, timeoutMs, endMarker);
  }

  async closeSession(sessionId: string, args: string[] = []): Promise<void> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      logger.warn('Attempted to close non-existent session', { sessionId });
      return;
    }

    logger.info('Closing REPL session', { sessionId });

    try {
      // Send end arguments if specified
      if ((this.config.endArgs || []).length > 0 || args.length > 0) {
        const endCommands = [...(this.config.endArgs || []), ...args];
        for (const cmd of endCommands) {
          await this.sendCommand(sessionId, cmd);
          await delay(100);
        }
      }

      // Close stdin to signal end
      session.process.stdin?.end();
      
      // Wait a bit for graceful shutdown
      await delay(500);
      
      // Force kill if still running
      if (session.isActive) {
        session.process.kill('SIGTERM');
        await delay(1000);
        
        if (session.isActive) {
          session.process.kill('SIGKILL');
        }
      }

    } catch (error: any) {
      logger.warn('Error during session cleanup', { sessionId, error: error.message });
    } finally {
      this.sessions.delete(sessionId);
    }
  }

  getActiveSessions(): string[] {
    return Array.from(this.sessions.entries())
      .filter(([, session]) => session.isActive)
      .map(([id]) => id);
  }

  private getActiveSession(sessionId: string): ReplSession {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    if (!session.isActive) {
      throw new Error(`Session is not active: ${sessionId}`);
    }
    
    return session;
  }

  private collectOutput(session: ReplSession, endMarker?: string): Promise<ReplResult> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let resolved = false;

      const checkEndCondition = () => {
        if (resolved) return;

        if (endMarker && stdout.includes(endMarker)) {
          resolved = true;
          resolve({
            output: stdout.trim(),
            error: stderr.trim() || undefined,
            success: true
          });
        }
      };

      const dataHandler = (data: Buffer) => {
        stdout += data.toString();
        checkEndCondition();
      };

      const errorHandler = (data: Buffer) => {
        stderr += data.toString();
      };

      const closeHandler = () => {
        if (!resolved) {
          resolved = true;
          resolve({
            output: stdout.trim(),
            error: stderr.trim() || undefined,
            success: session.process.exitCode === 0
          });
        }
      };

      session.process.stdout?.on('data', dataHandler);
      session.process.stderr?.on('data', errorHandler);
      session.process.on('close', closeHandler);

      // If no end marker specified, wait for a short period then return
      if (!endMarker) {
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            session.process.stdout?.off('data', dataHandler);
            session.process.stderr?.off('data', errorHandler);
            session.process.off('close', closeHandler);
            
            resolve({
              output: stdout.trim(),
              error: stderr.trim() || undefined,
              success: true
            });
          }
        }, 1000);
      }
    });
  }

  getToolDefinitions() {
    const baseName = this.config.name || this.config.command;
    
    return [
      {
        name: `${baseName}_start_session`,
        description: `Start a ${baseName} REPL session`,
        inputSchema: {
          type: 'object',
          properties: {
            args: {
              type: 'array',
              items: { type: 'string' },
              description: 'Additional arguments to start the session'
            }
          }
        }
      },
      {
        name: `${baseName}_send`,
        description: `Send command to ${baseName} session`,
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID returned from start_session'
            },
            command: {
              type: 'string',
              description: 'Command to send to the session'
            }
          },
          required: ['sessionId', 'command']
        }
      },
      {
        name: `${baseName}_receive`,
        description: `Receive output from ${baseName} session`,
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID'
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds',
              default: 10000
            },
            endMarker: {
              type: 'string',
              description: 'String to wait for before returning output'
            }
          },
          required: ['sessionId']
        }
      },
      {
        name: `${baseName}_send_receive`,
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
              description: 'Command to send'
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds',
              default: 10000
            },
            endMarker: {
              type: 'string',
              description: 'String to wait for before returning output'
            }
          },
          required: ['sessionId', 'command']
        }
      },
      {
        name: `${baseName}_close_session`,
        description: `Close ${baseName} session`,
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID to close'
            },
            args: {
              type: 'array',
              items: { type: 'string' },
              description: 'Additional arguments for closing'
            }
          },
          required: ['sessionId']
        }
      }
    ];
  }
}
