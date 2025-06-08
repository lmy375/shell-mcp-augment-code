# Shell MCP Usage Guide

This guide provides comprehensive examples and best practices for using Shell MCP.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Single Command Tools](#single-command-tools)
3. [REPL Sessions](#repl-sessions)
4. [Configuration Files](#configuration-files)
5. [Security Features](#security-features)
6. [Advanced Features](#advanced-features)
7. [Integration Examples](#integration-examples)

## Basic Usage

### Simple Command

Convert a basic shell command into an MCP tool:

```bash
npx shell-mcp --cmd "date" --name get_date --description "Get current date and time"
```

### Command with Parameters

Create a parameterized command:

```bash
npx shell-mcp \
  --cmd "echo 'Hello, $NAME!'" \
  --name greet \
  --description "Greet someone by name" \
  --args "NAME:string:'Name of the person to greet'"
```

## Single Command Tools

### Mathematical Calculator

```bash
npx shell-mcp \
  --cmd "echo \$((\$A + \$B))" \
  --name add \
  --description "Add two numbers" \
  --args "A:int:'First number'" "B:int:'Second number'"
```

### File Operations

```bash
npx shell-mcp \
  --cmd "find \$PATH -name '*\$PATTERN*' -type f | head -n \$LIMIT" \
  --name find_files \
  --description "Search for files by pattern" \
  --args "PATH:string:'Directory to search'" "PATTERN:string:'File pattern'" "LIMIT:int:'Max results'" \
  --allow-file-operations
```

### System Information

```bash
npx shell-mcp \
  --cmd "ps aux | head -n \$COUNT" \
  --name list_processes \
  --description "List running processes" \
  --args "COUNT:int:'Number of processes to show'"
```

### Text Processing

```bash
npx shell-mcp \
  --cmd "echo '\$TEXT' | wc -w" \
  --name count_words \
  --description "Count words in text" \
  --args "TEXT:string:'Text to analyze'"
```

## REPL Sessions

### Python REPL

```bash
npx shell-mcp --repl python --name python_interpreter
```

This creates the following tools:
- `python_interpreter_start_session`
- `python_interpreter_send`
- `python_interpreter_recv`
- `python_interpreter_send_recv`
- `python_interpreter_close_session`

### Node.js REPL

```bash
npx shell-mcp --repl node --name nodejs_repl
```

### Database CLI

```bash
npx shell-mcp --repl "mysql -u user -p database" --name mysql_session
```

### Example REPL Usage Flow

1. Start session: `python_interpreter_start_session()`
2. Send code: `python_interpreter_send(sessionId, "import math")`
3. Execute and get result: `python_interpreter_send_recv(sessionId, "math.sqrt(16)")`
4. Close session: `python_interpreter_close_session(sessionId)`

## Configuration Files

### Basic Configuration

Create a `tools.json` file:

```json
{
  "calculator": {
    "cmd": "echo $(($A + $B))",
    "args": {
      "A": {"type": "int", "description": "First number"},
      "B": {"type": "int", "description": "Second number"}
    },
    "description": "Add two numbers"
  },
  "current_time": {
    "cmd": "date '+%Y-%m-%d %H:%M:%S'",
    "description": "Get formatted current time"
  }
}
```

Run with:
```bash
npx shell-mcp --config tools.json
```

### Advanced Configuration

```json
{
  "file_analyzer": {
    "cmd": "wc -l $FILE && file $FILE && ls -la $FILE",
    "args": {
      "FILE": {
        "type": "string",
        "description": "File path to analyze"
      }
    },
    "description": "Analyze file properties",
    "timeout": 10000
  },
  "log_monitor": {
    "cmd": "tail -n $LINES $LOGFILE | grep -i '$PATTERN'",
    "args": {
      "LOGFILE": {"type": "string", "description": "Log file path"},
      "PATTERN": {"type": "string", "description": "Pattern to search"},
      "LINES": {"type": "int", "default": 100, "description": "Lines to check"}
    },
    "description": "Monitor log files for patterns"
  }
}
```

## Security Features

### Command Restrictions

```bash
npx shell-mcp \
  --cmd "ls $DIR" \
  --name list_dir \
  --args "DIR:string:'Directory to list'" \
  --blocked-commands "rm,del,mv" \
  --max-timeout 30
```

### Whitelist Mode

```bash
npx shell-mcp \
  --cmd "$CMD" \
  --name safe_command \
  --args "CMD:string:'Command to run'" \
  --allowed-commands "echo,date,whoami,pwd"
```

### Disable Dangerous Operations

```bash
npx shell-mcp \
  --cmd "echo $MSG" \
  --name echo_safe \
  --args "MSG:string:'Message'" \
  --no-shell-operators \
  --no-file-operations
```

## Advanced Features

### Environment Management

The enhanced features provide environment management tools:

- `create_environment`: Set up named environments with variables
- `list_environments`: View all environments
- `execute_in_environment`: Run commands in specific environments

### Command History

Track and replay commands:

- `command_history`: View execution history
- `replay_command`: Re-execute previous commands

### File Watching

Monitor file changes:

- `watch_file`: Start monitoring files
- `list_watchers`: View active watchers
- `stop_watcher`: Stop file monitoring

### Batch Processing

Execute multiple commands:

- `batch_execute`: Run commands in sequence or parallel
- `create_command_template`: Create reusable templates

## Integration Examples

### Claude Desktop Configuration

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "shell-tools": {
      "command": "npx",
      "args": [
        "-y",
        "shell-mcp",
        "--config",
        "/path/to/your/config.json"
      ]
    }
  }
}
```

### Development Tools

```json
{
  "git_status": {
    "cmd": "git status --porcelain",
    "description": "Get git repository status"
  },
  "run_tests": {
    "cmd": "npm test -- --testNamePattern='$PATTERN'",
    "args": {
      "PATTERN": {
        "type": "string",
        "description": "Test pattern to run",
        "optional": true
      }
    },
    "description": "Run specific tests"
  },
  "build_project": {
    "cmd": "npm run build",
    "description": "Build the project"
  }
}
```

### System Administration

```json
{
  "disk_usage": {
    "cmd": "df -h $PATH",
    "args": {
      "PATH": {"type": "string", "default": "/", "description": "Path to check"}
    },
    "description": "Check disk usage"
  },
  "service_status": {
    "cmd": "systemctl status $SERVICE",
    "args": {
      "SERVICE": {"type": "string", "description": "Service name"}
    },
    "description": "Check service status"
  },
  "memory_usage": {
    "cmd": "free -h",
    "description": "Show memory usage"
  }
}
```

### Data Processing

```json
{
  "csv_analyze": {
    "cmd": "head -n $LINES $FILE | csvstat",
    "args": {
      "FILE": {"type": "string", "description": "CSV file path"},
      "LINES": {"type": "int", "default": 100, "description": "Lines to analyze"}
    },
    "description": "Analyze CSV file statistics"
  },
  "json_query": {
    "cmd": "cat $FILE | jq '$QUERY'",
    "args": {
      "FILE": {"type": "string", "description": "JSON file path"},
      "QUERY": {"type": "string", "description": "jq query expression"}
    },
    "description": "Query JSON files with jq"
  }
}
```

## Best Practices

### Security

1. Always use the least privileged configuration
2. Prefer whitelisting over blacklisting commands
3. Set appropriate timeouts
4. Validate input parameters
5. Avoid shell operators unless necessary

### Performance

1. Set reasonable timeouts for long-running commands
2. Use batch processing for multiple operations
3. Monitor resource usage with system tools
4. Clean up REPL sessions when done

### Maintainability

1. Use descriptive names and descriptions
2. Document complex command templates
3. Group related tools in configuration files
4. Version your configuration files
5. Test tools before deployment

## Troubleshooting

### Common Issues

1. **Command not found**: Ensure the command exists in PATH
2. **Permission denied**: Check file permissions and user privileges
3. **Timeout errors**: Increase timeout values for slow commands
4. **Security validation failed**: Review security settings and command syntax
5. **REPL session issues**: Ensure the REPL command is available and working

### Debug Mode

Enable debug logging:

```bash
npx shell-mcp --cmd "date" --name test --log-level debug
```

### Testing Tools

Use the provided test scripts:

```bash
# Test CLI functionality
./scripts/test-cli.sh

# Test individual components
npx ts-node scripts/test-tools.ts
```
