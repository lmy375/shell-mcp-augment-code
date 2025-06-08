# Security Guide

Shell MCP implements comprehensive security measures to prevent command injection and other security vulnerabilities when executing shell commands and managing REPL sessions.

## Security Features

### 1. Command Injection Prevention

Shell MCP blocks dangerous patterns that could lead to command injection:

- **Command chaining**: `;`, `&&`, `||`, `|`
- **Command substitution**: `$()`, backticks
- **File redirection**: `>`, `<`
- **Directory traversal**: `../`, `..\\`
- **Environment variable expansion**: `${}`

### 2. Process Isolation

- Commands are executed using `spawn()` without shell interpretation
- No shell metacharacter processing
- Direct process execution for better security

### 3. Argument Validation

All arguments are validated before execution:

```typescript
// Type validation
switch (config.type) {
  case 'string': // String validation with pattern checking
  case 'int': // Integer validation
  case 'float': // Float validation  
  case 'boolean': // Boolean validation
}
```

### 4. Environment Variable Sanitization

Environment variables are sanitized to prevent injection:

- Variable names must match `^[A-Z_][A-Z0-9_]*$`
- Variable values are checked for dangerous patterns
- Invalid variables are filtered out

## Security Best Practices

### For Administrators

1. **Whitelist Commands**: Only allow known, safe commands
2. **Limit Arguments**: Restrict argument types and values
3. **Use Timeouts**: Set appropriate timeouts to prevent DoS
4. **Monitor Logs**: Review security warnings in logs
5. **Regular Updates**: Keep Shell MCP updated

### For Developers

1. **Validate Input**: Always validate user input before passing to Shell MCP
2. **Principle of Least Privilege**: Run with minimal required permissions
3. **Audit Configuration**: Review configuration files for security
4. **Test Security**: Include security tests in your test suite

## Example Secure Configurations

### Safe Command Examples

```json
{
  "tools": {
    "safe_date": {
      "cmd": "date",
      "description": "Get current date - no arguments needed"
    },
    "safe_echo": {
      "cmd": "echo $MESSAGE",
      "description": "Echo a message safely",
      "args": {
        "MESSAGE": {
          "type": "string",
          "description": "Message to echo"
        }
      }
    }
  }
}
```

### Dangerous Patterns to Avoid

❌ **Never allow these patterns:**

```json
{
  "tools": {
    "dangerous_command": {
      "cmd": "eval $USER_INPUT",  // Command injection risk
      "cmd": "sh -c $COMMAND",    // Shell interpretation risk
      "cmd": "rm -rf $PATH",      // Destructive operations
      "cmd": "cat $FILE > /etc/passwd"  // File system access
    }
  }
}
```

## Security Monitoring

Shell MCP logs security events at different levels:

- **WARN**: Dangerous patterns detected and blocked
- **ERROR**: Security validation failures
- **INFO**: Command execution details

Example log output:
```
[WARN] Dangerous pattern detected in command: "ls; rm -rf /"
[ERROR] Security validation failed: Command injection attempt blocked
```

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** create a public issue
2. Email security details to [security contact]
3. Include steps to reproduce
4. Allow time for investigation and patching

## Security Checklist

Before deploying Shell MCP:

- [ ] Review all configured commands for safety
- [ ] Validate argument types and constraints
- [ ] Set appropriate timeouts
- [ ] Configure logging and monitoring
- [ ] Test with security-focused test cases
- [ ] Review environment variable usage
- [ ] Ensure minimal required permissions
- [ ] Document security considerations for users
