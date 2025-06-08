import { SingleCommandExecutor } from '../src/commands/single-command.js';
import { ToolConfig } from '../src/config/parser.js';

describe('SingleCommandExecutor', () => {
  describe('execute', () => {
    it('should execute simple command successfully', async () => {
      const config: ToolConfig = {
        cmd: 'echo hello world',
        timeout: 5000
      };

      const executor = new SingleCommandExecutor(config);
      const result = await executor.execute();

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('hello world');
      expect(result.exitCode).toBe(0);
    });

    it('should handle command with arguments', async () => {
      const config: ToolConfig = {
        cmd: 'printenv MESSAGE',
        args: {
          MESSAGE: {
            type: 'string',
            description: 'Message to echo'
          }
        },
        timeout: 5000
      };

      const executor = new SingleCommandExecutor(config);
      const result = await executor.execute({ MESSAGE: 'test message' });

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('test message');
    });

    it('should handle numeric arguments', async () => {
      const config: ToolConfig = {
        cmd: 'printenv NUM1',
        args: {
          NUM1: {
            type: 'int',
            description: 'First number'
          }
        },
        timeout: 5000
      };

      const executor = new SingleCommandExecutor(config);
      const result = await executor.execute({ NUM1: 5 });

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('5');
    });

    it('should validate required arguments', async () => {
      const config: ToolConfig = {
        cmd: 'printenv REQUIRED_ARG',
        args: {
          REQUIRED_ARG: {
            type: 'string',
            description: 'Required argument'
          }
        }
      };

      const executor = new SingleCommandExecutor(config);

      await expect(executor.execute({})).rejects.toThrow('Required argument');
    });

    it('should handle optional arguments', async () => {
      const config: ToolConfig = {
        cmd: 'printenv OPTIONAL_ARG',
        args: {
          OPTIONAL_ARG: {
            type: 'string',
            description: 'Optional argument',
            optional: true,
            default: 'default_value'
          }
        }
      };

      const executor = new SingleCommandExecutor(config);
      const result = await executor.execute({});

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('default_value');
    });

    it('should handle command failure', async () => {
      const config: ToolConfig = {
        cmd: 'false',
        timeout: 5000
      };

      const executor = new SingleCommandExecutor(config);
      const result = await executor.execute();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
    });

    it('should handle timeout', async () => {
      const config: ToolConfig = {
        cmd: 'sleep 2',
        timeout: 100
      };

      const executor = new SingleCommandExecutor(config);
      const result = await executor.execute();

      expect(result.success).toBe(false);
      expect(result.stderr).toContain('timed out');
    }, 10000);
  });

  describe('getToolDefinition', () => {
    it('should generate correct tool definition', () => {
      const config: ToolConfig = {
        cmd: 'echo $ARG1',
        name: 'test_tool',
        description: 'Test tool description',
        args: {
          ARG1: {
            type: 'string',
            description: 'Test argument'
          },
          ARG2: {
            type: 'int',
            description: 'Optional argument',
            optional: true
          }
        }
      };

      const executor = new SingleCommandExecutor(config);
      const toolDef = executor.getToolDefinition();

      expect(toolDef.name).toBe('test_tool');
      expect(toolDef.description).toBe('Test tool description');
      expect(toolDef.args).toEqual(config.args);
    });
  });
});
