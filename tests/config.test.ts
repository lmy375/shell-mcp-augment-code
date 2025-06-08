import { ConfigParser } from '../src/config/parser.js';
import fs from 'fs';
import path from 'path';

describe('ConfigParser', () => {
  const testConfigDir = path.join(__dirname, 'test-configs');
  
  beforeAll(() => {
    if (!fs.existsSync(testConfigDir)) {
      fs.mkdirSync(testConfigDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true });
    }
  });

  describe('parseArgumentString', () => {
    it('should parse basic argument format', () => {
      const result = ConfigParser.parseArgumentString('name:string:Description text');
      expect(result).toEqual({
        type: 'string',
        description: 'Description text',
        optional: false
      });
    });

    it('should parse optional arguments', () => {
      const result = ConfigParser.parseArgumentString('name:int:optional:Optional number');
      expect(result).toEqual({
        type: 'int',
        description: 'Optional number',
        optional: true
      });
    });

    it('should handle quoted descriptions', () => {
      const result = ConfigParser.parseArgumentString('name:string:"Quoted description"');
      expect(result).toEqual({
        type: 'string',
        description: 'Quoted description',
        optional: false
      });
    });

    it('should handle descriptions with colons', () => {
      const result = ConfigParser.parseArgumentString('name:string:URL like http://example.com');
      expect(result).toEqual({
        type: 'string',
        description: 'URL like http://example.com',
        optional: false
      });
    });

    it('should reject invalid formats', () => {
      expect(() => ConfigParser.parseArgumentString('invalid')).toThrow();
      expect(() => ConfigParser.parseArgumentString('name:invalid_type:desc')).toThrow();
    });
  });

  describe('parseConfigFile', () => {
    it('should parse valid config file', () => {
      const config = {
        tools: {
          test_tool: {
            cmd: 'echo $ARG1',
            description: 'Test tool',
            args: {
              ARG1: {
                type: 'string',
                description: 'Test argument'
              }
            }
          }
        },
        repls: {
          test_repl: {
            command: 'python3',
            description: 'Test REPL'
          }
        }
      };

      const configPath = path.join(testConfigDir, 'valid.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      const result = ConfigParser.parseConfigFile(configPath);
      expect(result.tools?.test_tool.cmd).toBe('echo $ARG1');
      expect(result.tools?.test_tool.description).toBe('Test tool');
      expect(result.repls?.test_repl.command).toBe('python3');
      expect(result.repls?.test_repl.description).toBe('Test REPL');
    });

    it('should handle legacy format', () => {
      const config = {
        test_tool: {
          cmd: 'echo hello',
          description: 'Legacy tool'
        }
      };

      const configPath = path.join(testConfigDir, 'legacy.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      const result = ConfigParser.parseConfigFile(configPath);
      expect(result.tools).toBeDefined();
      expect(result.tools!.test_tool).toEqual({
        cmd: 'echo hello',
        description: 'Legacy tool',
        args: {},
        timeout: 30000
      });
    });

    it('should throw error for non-existent file', () => {
      expect(() => ConfigParser.parseConfigFile('non-existent.json')).toThrow();
    });

    it('should throw error for invalid JSON', () => {
      const configPath = path.join(testConfigDir, 'invalid.json');
      fs.writeFileSync(configPath, 'invalid json content');

      expect(() => ConfigParser.parseConfigFile(configPath)).toThrow();
    });
  });
});
