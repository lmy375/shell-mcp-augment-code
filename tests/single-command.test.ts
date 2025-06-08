import { SingleCommandTool } from '../src/tools/single-command';
import { SecurityValidator } from '../src/utils/security';
import { CommandConfig } from '../src/types';

describe('SingleCommandTool', () => {
  let tool: SingleCommandTool;
  let security: SecurityValidator;

  beforeEach(() => {
    security = new SecurityValidator({ allowShellOperators: true });
  });

  describe('generateMcpTool', () => {
    it('should generate basic tool without arguments', () => {
      const config: CommandConfig = {
        cmd: 'date',
        name: 'get_date',
        description: 'Get current date and time'
      };
      
      tool = new SingleCommandTool(config, security);
      const mcpTool = tool.generateMcpTool();

      expect(mcpTool.name).toBe('get_date');
      expect(mcpTool.description).toBe('Get current date and time');
      expect(mcpTool.inputSchema.properties).toEqual({});
    });

    it('should generate tool with arguments', () => {
      const config: CommandConfig = {
        cmd: 'echo $MESSAGE',
        name: 'echo_message',
        description: 'Echo a message',
        args: {
          MESSAGE: {
            type: 'string',
            description: 'Message to echo'
          }
        }
      };
      
      tool = new SingleCommandTool(config, security);
      const mcpTool = tool.generateMcpTool();

      expect(mcpTool.name).toBe('echo_message');
      expect(mcpTool.inputSchema.properties.MESSAGE).toEqual({
        type: 'string',
        description: 'Message to echo'
      });
      expect(mcpTool.inputSchema.required).toContain('MESSAGE');
    });

    it('should handle optional arguments', () => {
      const config: CommandConfig = {
        cmd: 'echo $MESSAGE',
        name: 'echo_message',
        args: {
          MESSAGE: {
            type: 'string',
            description: 'Message to echo',
            optional: true,
            default: 'Hello World'
          }
        }
      };
      
      tool = new SingleCommandTool(config, security);
      const mcpTool = tool.generateMcpTool();

      expect(mcpTool.inputSchema.properties.MESSAGE.default).toBe('Hello World');
      expect(mcpTool.inputSchema.required).toBeUndefined();
    });

    it('should generate default name from command', () => {
      const config: CommandConfig = {
        cmd: 'ps aux'
      };
      
      tool = new SingleCommandTool(config, security);
      const mcpTool = tool.generateMcpTool();

      expect(mcpTool.name).toBe('ps');
    });
  });

  describe('execute', () => {
    it('should execute simple command successfully', async () => {
      const config: CommandConfig = {
        cmd: 'echo hello'
      };
      
      tool = new SingleCommandTool(config, security);
      const result = await tool.execute();

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('hello');
      expect(result.stderr).toBe('');
    });

    it('should substitute arguments in command', async () => {
      const config: CommandConfig = {
        cmd: 'echo $MESSAGE',
        args: {
          MESSAGE: {
            type: 'string',
            description: 'Message to echo'
          }
        }
      };
      
      tool = new SingleCommandTool(config, security);
      const result = await tool.execute({ MESSAGE: 'test message' });

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('test message');
    });

    it('should use default values for missing arguments', async () => {
      const config: CommandConfig = {
        cmd: 'echo $MESSAGE',
        args: {
          MESSAGE: {
            type: 'string',
            description: 'Message to echo',
            default: 'default message'
          }
        }
      };
      
      tool = new SingleCommandTool(config, security);
      const result = await tool.execute();

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('default message');
    });

    it('should handle command failure', async () => {
      const config: CommandConfig = {
        cmd: 'false' // Command that always fails
      };
      
      tool = new SingleCommandTool(config, security);
      const result = await tool.execute();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
    });

    it('should handle non-existent command', async () => {
      const config: CommandConfig = {
        cmd: 'nonexistentcommand12345'
      };
      
      tool = new SingleCommandTool(config, security);
      const result = await tool.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should respect timeout', async () => {
      const config: CommandConfig = {
        cmd: 'sleep 2',
        timeout: 500 // 500ms timeout
      };
      
      tool = new SingleCommandTool(config, security);
      const result = await tool.execute();

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    }, 10000);

    it('should fail security validation', async () => {
      const restrictiveSecurity = new SecurityValidator({ allowShellOperators: false });
      const config: CommandConfig = {
        cmd: 'echo hello && echo world'
      };
      
      tool = new SingleCommandTool(config, restrictiveSecurity);
      const result = await tool.execute();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Security validation failed');
    });
  });

  describe('argument type mapping', () => {
    it('should map argument types correctly', () => {
      const config: CommandConfig = {
        cmd: 'test',
        args: {
          str_arg: { type: 'string', description: 'String arg' },
          int_arg: { type: 'int', description: 'Int arg' },
          float_arg: { type: 'float', description: 'Float arg' },
          bool_arg: { type: 'boolean', description: 'Bool arg' },
          array_arg: { type: 'string[]', description: 'Array arg' }
        }
      };
      
      tool = new SingleCommandTool(config, security);
      const mcpTool = tool.generateMcpTool();

      expect(mcpTool.inputSchema.properties.str_arg.type).toBe('string');
      expect(mcpTool.inputSchema.properties.int_arg.type).toBe('number');
      expect(mcpTool.inputSchema.properties.float_arg.type).toBe('number');
      expect(mcpTool.inputSchema.properties.bool_arg.type).toBe('boolean');
      expect(mcpTool.inputSchema.properties.array_arg.type).toBe('array');
    });
  });
});
