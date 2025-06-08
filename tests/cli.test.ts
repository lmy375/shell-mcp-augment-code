import { parseCliOptions, buildConfigFromCli } from '../src/cli.js';

describe('CLI', () => {
  describe('parseCliOptions', () => {
    it('should parse single command options', () => {
      const argv = [
        'node', 'shell-mcp',
        '--cmd', 'echo hello',
        '--name', 'test_echo',
        '--description', 'Test echo command',
        '--args', 'MESSAGE:string:Message to echo',
        '--timeout', '5000'
      ];

      const options = parseCliOptions(argv);

      expect(options.cmd).toBe('echo hello');
      expect(options.name).toBe('test_echo');
      expect(options.description).toBe('Test echo command');
      expect(options.args).toEqual(['MESSAGE:string:Message to echo']);
      expect(options.timeout).toBe(5000);
    });

    it('should parse REPL options', () => {
      const argv = [
        'node', 'shell-mcp',
        '--repl', 'python3',
        '--repl-name', 'python',
        '--repl-description', 'Python REPL',
        '--start-args', '-i',
        '--end-args', 'exit()',
        '--repl-timeout', '30000'
      ];

      const options = parseCliOptions(argv);

      expect(options.repl).toBe('python3');
      expect(options.replName).toBe('python');
      expect(options.replDescription).toBe('Python REPL');
      expect(options.startArgs).toEqual(['-i']);
      expect(options.endArgs).toEqual(['exit()']);
      expect(options.replTimeout).toBe(30000);
    });

    it('should parse config file option', () => {
      const argv = [
        'node', 'shell-mcp',
        '--config', 'config.json'
      ];

      const options = parseCliOptions(argv);

      expect(options.config).toBe('config.json');
    });

    it('should reject multiple modes', () => {
      const argv = [
        'node', 'shell-mcp',
        '--cmd', 'echo hello',
        '--repl', 'python3'
      ];

      expect(() => parseCliOptions(argv)).toThrow('Cannot specify multiple modes');
    });

    it('should require at least one mode', () => {
      const argv = ['node', 'shell-mcp'];

      expect(() => parseCliOptions(argv)).toThrow('Must specify one of');
    });
  });

  describe('buildConfigFromCli', () => {
    it('should build config from single command options', () => {
      const options = {
        cmd: 'echo $MESSAGE',
        name: 'test_echo',
        description: 'Test echo',
        args: ['MESSAGE:string:Message to echo'],
        timeout: 5000
      };

      const config = buildConfigFromCli(options);

      expect(config.tools).toBeDefined();
      expect(config.tools!.test_echo).toEqual({
        cmd: 'echo $MESSAGE',
        name: 'test_echo',
        description: 'Test echo',
        args: {
          MESSAGE: {
            type: 'string',
            description: 'Message to echo',
            optional: false
          }
        },
        timeout: 5000
      });
    });

    it('should build config from REPL options', () => {
      const options = {
        repl: 'python3',
        replName: 'python',
        replDescription: 'Python REPL',
        startArgs: ['-i'],
        endArgs: ['exit()'],
        replTimeout: 30000
      };

      const config = buildConfigFromCli(options);

      expect(config.repls).toBeDefined();
      expect(config.repls!.python).toEqual({
        command: 'python3',
        name: 'python',
        description: 'Python REPL',
        timeout: 30000,
        startArgs: ['-i'],
        endArgs: ['exit()'],
        prompt: undefined
      });
    });

    it('should handle invalid argument format', () => {
      const options = {
        cmd: 'echo hello',
        args: ['invalid_format']
      };

      const config = buildConfigFromCli(options);

      expect(config.tools!.command.args).toEqual({});
    });
  });
});
