# Shell MCP Architecture

## Overview

Shell MCP is a Model Context Protocol (MCP) server that converts shell commands and REPL sessions into MCP tools. It provides a secure and flexible way to expose command-line functionality to AI models.

## Core Components

### 1. Server (`src/server.ts`)

The main server class that orchestrates the entire system:

- **ShellMcpServer**: Main server class that initializes and manages all components
- Handles configuration loading from files or command-line arguments
- Sets up MCP tools based on configuration
- Manages lifecycle of single command tools and REPL sessions

### 2. Single Command Tools (`src/tools/single-command.ts`)

Handles one-shot command execution:

- **SingleCommandTool**: Wraps individual shell commands as MCP tools
- Supports parameterized commands with argument substitution
- Provides timeout and security validation
- Maps command arguments to MCP tool schemas

### 3. REPL Session Manager (`src/tools/repl-session.ts`)

Manages interactive REPL sessions:

- **ReplSessionManager**: Manages multiple REPL sessions
- Provides session lifecycle management (start, send, receive, close)
- Handles bidirectional communication with REPL processes
- Supports timeout and end-marker detection for output reading

### 4. Security Layer (`src/utils/security.ts`)

Provides comprehensive security validation:

- **SecurityValidator**: Validates commands and arguments
- Prevents command injection attacks
- Blocks dangerous shell operators and file operations
- Supports whitelist/blacklist command filtering
- Sanitizes input and escapes shell arguments

### 5. Logging (`src/utils/logger.ts`)

Centralized logging system:

- **Logger**: Winston-based logging with configurable levels
- Structured logging with timestamps and context
- Console output with color coding
- Debug, info, warn, and error levels

## Data Flow

### Single Command Execution

```
User Request → MCP Tool → SingleCommandTool → Security Validation → Command Execution → Result
```

1. User invokes MCP tool with parameters
2. SingleCommandTool receives the request
3. Command template is populated with user arguments
4. Security validation checks for dangerous patterns
5. Command is executed with timeout protection
6. Results are returned to the user

### REPL Session Flow

```
Start Session → Send Commands → Receive Output → Close Session
```

1. User starts a REPL session
2. Session manager spawns the REPL process
3. User sends commands through the session
4. Output is captured and returned
5. Session can be closed or will timeout

## Security Model

### Command Injection Prevention

- Disables shell execution by default
- Blocks dangerous operators: `&&`, `||`, `;`, `|`, `>`, `<`
- Prevents directory traversal with `../` patterns
- Sanitizes input to remove control characters

### Access Control

- Configurable command whitelist/blacklist
- Optional file operation restrictions
- Timeout limits to prevent resource exhaustion
- Process isolation for REPL sessions

### Input Validation

- Type checking for command arguments
- Length limits and format validation
- Escape sequences for shell arguments
- Null byte and control character filtering

## Configuration

### Command Line Mode

```bash
shell-mcp --cmd "echo $MESSAGE" --name echo --args "MESSAGE:string:'Message to echo'"
```

### REPL Mode

```bash
shell-mcp --repl python
```

### Configuration File Mode

```bash
shell-mcp --config config.json
```

Configuration file format:
```json
{
  "tool_name": {
    "cmd": "command template",
    "args": {
      "ARG_NAME": {
        "type": "string|int|float|boolean|string[]",
        "description": "Argument description",
        "optional": true,
        "default": "default_value"
      }
    },
    "description": "Tool description",
    "timeout": 30000
  }
}
```

## Error Handling

### Command Execution Errors

- Process spawn failures
- Command timeouts
- Non-zero exit codes
- Security validation failures

### REPL Session Errors

- Session startup failures
- Communication timeouts
- Process crashes
- Invalid session IDs

### Recovery Strategies

- Graceful degradation for failed commands
- Session cleanup on errors
- Detailed error reporting
- Automatic resource cleanup

## Performance Considerations

### Resource Management

- Process cleanup on session termination
- Timeout enforcement to prevent hanging
- Memory-efficient output buffering
- Concurrent session support

### Scalability

- Stateless single command execution
- Efficient session management
- Configurable resource limits
- Minimal memory footprint

## Extension Points

### Custom Security Policies

- Pluggable security validators
- Custom command filters
- Environment-specific restrictions

### Output Processing

- Custom output formatters
- Result transformation pipelines
- Error message customization

### Session Management

- Custom REPL implementations
- Session persistence options
- Advanced timeout strategies
