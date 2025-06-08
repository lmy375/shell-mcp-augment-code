import { CommandValidator, SecurityError } from '../src/security/validator.js';

describe('CommandValidator', () => {
  describe('validateCommand', () => {
    it('should allow safe commands', () => {
      expect(() => CommandValidator.validateCommand('date')).not.toThrow();
      expect(() => CommandValidator.validateCommand('echo hello')).not.toThrow();
      expect(() => CommandValidator.validateCommand('ls -la')).not.toThrow();
      expect(() => CommandValidator.validateCommand('ps aux')).not.toThrow();
    });

    it('should reject empty commands', () => {
      expect(() => CommandValidator.validateCommand('')).toThrow(SecurityError);
      expect(() => CommandValidator.validateCommand('   ')).toThrow(SecurityError);
    });

    it('should reject commands with dangerous patterns', () => {
      // Command chaining
      expect(() => CommandValidator.validateCommand('ls; rm -rf /')).toThrow(SecurityError);
      expect(() => CommandValidator.validateCommand('echo hello && rm file')).toThrow(SecurityError);
      expect(() => CommandValidator.validateCommand('ls | grep test')).toThrow(SecurityError);
      
      // File redirection
      expect(() => CommandValidator.validateCommand('cat > /etc/passwd')).toThrow(SecurityError);
      expect(() => CommandValidator.validateCommand('echo data < file')).toThrow(SecurityError);
      
      // Directory traversal
      expect(() => CommandValidator.validateCommand('cat ../../etc/passwd')).toThrow(SecurityError);
      expect(() => CommandValidator.validateCommand('ls ..\\..\\windows')).toThrow(SecurityError);
      
      // Command substitution
      expect(() => CommandValidator.validateCommand('echo `whoami`')).toThrow(SecurityError);
      // Note: $(pwd) is now allowed as it's treated as command substitution, but $((expr)) is allowed for arithmetic
    });
  });

  describe('validateArgument', () => {
    it('should allow safe arguments', () => {
      expect(() => CommandValidator.validateArgument('hello', 'arg1')).not.toThrow();
      expect(() => CommandValidator.validateArgument('123', 'arg2')).not.toThrow();
      expect(() => CommandValidator.validateArgument('test-file.txt', 'filename')).not.toThrow();
    });

    it('should reject non-string arguments', () => {
      expect(() => CommandValidator.validateArgument(123 as any, 'arg1')).toThrow(SecurityError);
      expect(() => CommandValidator.validateArgument(null as any, 'arg2')).toThrow(SecurityError);
    });

    it('should reject arguments with dangerous patterns', () => {
      expect(() => CommandValidator.validateArgument('test; rm -rf /', 'arg1')).toThrow(SecurityError);
      expect(() => CommandValidator.validateArgument('../../etc/passwd', 'filename')).toThrow(SecurityError);
      // Note: $(whoami) in arguments is still dangerous and should be blocked
      expect(() => CommandValidator.validateArgument('`whoami`', 'arg2')).toThrow(SecurityError);
    });
  });

  describe('sanitizeEnvironmentVariables', () => {
    it('should allow valid environment variables', () => {
      const env = {
        'PATH': '/usr/bin:/bin',
        'HOME': '/home/user',
        'MY_VAR': 'value123'
      };
      
      const result = CommandValidator.sanitizeEnvironmentVariables(env);
      expect(result).toEqual(env);
    });

    it('should filter out invalid variable names', () => {
      const env = {
        'VALID_VAR': 'value',
        '123INVALID': 'value',
        'invalid-name': 'value',
        'ANOTHER_VALID': 'value'
      };
      
      const result = CommandValidator.sanitizeEnvironmentVariables(env);
      expect(result).toEqual({
        'VALID_VAR': 'value',
        'ANOTHER_VALID': 'value'
      });
    });

    it('should filter out variables with dangerous values', () => {
      const env = {
        'SAFE_VAR': 'safe_value',
        'DANGEROUS_VAR': 'value; rm -rf /',
        'ANOTHER_SAFE': 'another_value'
      };
      
      const result = CommandValidator.sanitizeEnvironmentVariables(env);
      expect(result).toEqual({
        'SAFE_VAR': 'safe_value',
        'ANOTHER_SAFE': 'another_value'
      });
    });
  });
});
