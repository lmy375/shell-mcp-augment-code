import { SecurityValidator } from '../src/utils/security';

describe('SecurityValidator', () => {
  let validator: SecurityValidator;

  beforeEach(() => {
    validator = new SecurityValidator();
  });

  describe('validateCommand', () => {
    it('should allow safe commands', () => {
      const result = validator.validateCommand('echo hello');
      expect(result.valid).toBe(true);
    });

    it('should block shell operators by default', () => {
      const dangerousCommands = [
        'echo hello && rm -rf /',
        'echo hello || exit 1',
        'echo hello; rm file',
        'echo hello | grep world',
        'echo hello > file.txt',
        'cat < file.txt',
        'echo hello >> file.txt'
      ];

      for (const cmd of dangerousCommands) {
        const result = validator.validateCommand(cmd);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('dangerous operator');
      }
    });

    it('should allow shell operators when configured', () => {
      const permissiveValidator = new SecurityValidator({ allowShellOperators: true });
      const result = permissiveValidator.validateCommand('echo hello && echo world');
      expect(result.valid).toBe(true);
    });

    it('should block directory traversal', () => {
      const commands = [
        'cat ../../../etc/passwd',
        'ls ..\\..\\windows\\system32'
      ];

      for (const cmd of commands) {
        const result = validator.validateCommand(cmd);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('directory traversal');
      }
    });

    it('should block file operations by default', () => {
      const fileOps = [
        'rm file.txt',
        'del file.txt',
        'mv old.txt new.txt',
        'cp source.txt dest.txt'
      ];

      for (const cmd of fileOps) {
        const result = validator.validateCommand(cmd);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('File operation not allowed');
      }
    });

    it('should allow file operations when configured', () => {
      const permissiveValidator = new SecurityValidator({ allowFileOperations: true });
      const result = permissiveValidator.validateCommand('cp source.txt dest.txt');
      expect(result.valid).toBe(true);
    });

    it('should respect blocked commands list', () => {
      const restrictiveValidator = new SecurityValidator({ 
        blockedCommands: ['curl', 'wget'] 
      });
      
      const result = restrictiveValidator.validateCommand('curl http://example.com');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Command is blocked');
    });

    it('should respect allowed commands list', () => {
      const whitelistValidator = new SecurityValidator({ 
        allowedCommands: ['echo', 'date'] 
      });
      
      const allowedResult = whitelistValidator.validateCommand('echo hello');
      expect(allowedResult.valid).toBe(true);

      const blockedResult = whitelistValidator.validateCommand('curl http://example.com');
      expect(blockedResult.valid).toBe(false);
      expect(blockedResult.reason).toContain('not in allowed list');
    });
  });

  describe('validateTimeout', () => {
    it('should allow valid timeouts', () => {
      const result = validator.validateTimeout(30);
      expect(result.valid).toBe(true);
    });

    it('should reject negative timeouts', () => {
      const result = validator.validateTimeout(-1);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('must be positive');
    });

    it('should reject zero timeout', () => {
      const result = validator.validateTimeout(0);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('must be positive');
    });

    it('should respect maximum timeout', () => {
      const restrictiveValidator = new SecurityValidator({ maxTimeout: 60 });
      
      const validResult = restrictiveValidator.validateTimeout(30);
      expect(validResult.valid).toBe(true);

      const invalidResult = restrictiveValidator.validateTimeout(120);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.reason).toContain('exceeds maximum');
    });
  });

  describe('sanitizeInput', () => {
    it('should remove control characters', () => {
      const input = 'hello\x00\x01world\x7f';
      const result = validator.sanitizeInput(input);
      expect(result).toBe('helloworld');
    });

    it('should preserve normal characters', () => {
      const input = 'Hello World 123!@#$%^&*()';
      const result = validator.sanitizeInput(input);
      expect(result).toBe(input);
    });
  });

  describe('escapeShellArgument', () => {
    it('should escape special characters', () => {
      const input = 'hello world "test" $var `cmd`';
      const result = validator.escapeShellArgument(input);
      expect(result).toBe('hello\\ world\\ \\"test\\"\\ \\$var\\ \\`cmd\\`');
    });

    it('should handle normal strings', () => {
      const input = 'normalstring123';
      const result = validator.escapeShellArgument(input);
      expect(result).toBe(input);
    });
  });
});
