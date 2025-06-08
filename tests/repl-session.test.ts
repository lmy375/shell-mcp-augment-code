import { ReplSessionManager } from '../src/tools/repl-session';
import { SecurityValidator } from '../src/utils/security';
import { ReplConfig } from '../src/types';

describe('ReplSessionManager', () => {
  let manager: ReplSessionManager;
  let security: SecurityValidator;

  beforeEach(() => {
    security = new SecurityValidator({ allowShellOperators: true });
  });

  describe('generateMcpTools', () => {
    it('should generate all REPL tools', () => {
      const config: ReplConfig = {
        command: 'python',
        name: 'python_repl'
      };
      
      manager = new ReplSessionManager(config, security);
      const tools = manager.generateMcpTools();

      expect(tools).toHaveLength(5);
      
      const toolNames = tools.map(t => t.name);
      expect(toolNames).toContain('python_repl_start_session');
      expect(toolNames).toContain('python_repl_send');
      expect(toolNames).toContain('python_repl_recv');
      expect(toolNames).toContain('python_repl_send_recv');
      expect(toolNames).toContain('python_repl_close_session');
    });

    it('should use command name when no name provided', () => {
      const config: ReplConfig = {
        command: 'node'
      };
      
      manager = new ReplSessionManager(config, security);
      const tools = manager.generateMcpTools();

      const startTool = tools.find(t => t.name.endsWith('_start_session'));
      expect(startTool?.name).toBe('node_start_session');
    });

    it('should generate proper tool schemas', () => {
      const config: ReplConfig = {
        command: 'python'
      };
      
      manager = new ReplSessionManager(config, security);
      const tools = manager.generateMcpTools();

      const sendTool = tools.find(t => t.name.endsWith('_send'));
      expect(sendTool?.inputSchema.properties.sessionId).toBeDefined();
      expect(sendTool?.inputSchema.properties.command).toBeDefined();
      expect(sendTool?.inputSchema.required).toContain('sessionId');
      expect(sendTool?.inputSchema.required).toContain('command');

      const recvTool = tools.find(t => t.name.endsWith('_recv'));
      expect(recvTool?.inputSchema.properties.timeout).toBeDefined();
      expect(recvTool?.inputSchema.properties.endMarker).toBeDefined();
    });
  });

  describe('session management', () => {
    beforeEach(() => {
      const config: ReplConfig = {
        command: 'cat', // Use cat as a simple command that reads stdin
        args: []
      };
      manager = new ReplSessionManager(config, security);
    });

    afterEach(() => {
      manager.cleanup();
    });

    it('should start a session successfully', async () => {
      const result = await manager.startSession();
      
      expect(result.success).toBe(true);
      expect(result.sessionId).toBeDefined();
      expect(result.sessionId).toMatch(/^session_\d+_\d+$/);
    });

    it('should list active sessions', async () => {
      const result1 = await manager.startSession();
      const result2 = await manager.startSession();
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      const activeSessions = manager.listActiveSessions();
      expect(activeSessions).toHaveLength(2);
      expect(activeSessions).toContain(result1.sessionId);
      expect(activeSessions).toContain(result2.sessionId);
    });

    it('should send commands to session', async () => {
      const sessionResult = await manager.startSession();
      expect(sessionResult.success).toBe(true);

      const sendResult = await manager.sendCommand(sessionResult.sessionId, 'test command');
      expect(sendResult.success).toBe(true);
    });

    it('should fail to send to non-existent session', async () => {
      const result = await manager.sendCommand('invalid_session', 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Session not found');
    });

    it('should receive output from session', async () => {
      const sessionResult = await manager.startSession();
      expect(sessionResult.success).toBe(true);

      // Send a command and then try to receive output
      await manager.sendCommand(sessionResult.sessionId, 'hello world');
      
      const recvResult = await manager.receiveOutput(sessionResult.sessionId, 1);
      expect(recvResult.success).toBe(true);
      // Note: cat will echo the input, so we should see "hello world"
    });

    it('should handle send and receive in one call', async () => {
      const sessionResult = await manager.startSession();
      expect(sessionResult.success).toBe(true);

      const result = await manager.sendAndReceive(
        sessionResult.sessionId, 
        'hello world', 
        2
      );
      expect(result.success).toBe(true);
    });

    it('should close session successfully', async () => {
      const sessionResult = await manager.startSession();
      expect(sessionResult.success).toBe(true);

      const closeResult = manager.closeSession(sessionResult.sessionId);
      expect(closeResult.success).toBe(true);

      const activeSessions = manager.listActiveSessions();
      expect(activeSessions).not.toContain(sessionResult.sessionId);
    });

    it('should fail to close non-existent session', () => {
      const result = manager.closeSession('invalid_session');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Session not found');
    });

    it('should cleanup all sessions', async () => {
      await manager.startSession();
      await manager.startSession();
      
      expect(manager.listActiveSessions()).toHaveLength(2);
      
      manager.cleanup();
      
      expect(manager.listActiveSessions()).toHaveLength(0);
    });
  });

  describe('security validation', () => {
    beforeEach(() => {
      const restrictiveSecurity = new SecurityValidator({ allowShellOperators: false });
      const config: ReplConfig = {
        command: 'cat'
      };
      manager = new ReplSessionManager(config, restrictiveSecurity);
    });

    afterEach(() => {
      manager.cleanup();
    });

    it('should validate commands before sending', async () => {
      const sessionResult = await manager.startSession();
      expect(sessionResult.success).toBe(true);

      const result = await manager.sendCommand(sessionResult.sessionId, 'echo hello && rm -rf /');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Security validation failed');
    });
  });

  describe('timeout handling', () => {
    beforeEach(() => {
      const config: ReplConfig = {
        command: 'cat'
      };
      manager = new ReplSessionManager(config, security);
    });

    afterEach(() => {
      manager.cleanup();
    });

    it('should timeout when receiving output', async () => {
      const sessionResult = await manager.startSession();
      expect(sessionResult.success).toBe(true);

      // Don't send any command, just try to receive with short timeout
      const recvResult = await manager.receiveOutput(sessionResult.sessionId, 0.1);
      expect(recvResult.success).toBe(true);
      expect(recvResult.stdout).toBe('');
    });
  });
});
