# Usage Examples

This document provides comprehensive examples of how to use Shell MCP in various scenarios.

## Basic Command Examples

### Simple Commands

```bash
# Get current date
shell-mcp --cmd "date" --name "get_date" --description "Get current date and time"

# List files
shell-mcp --cmd "ls -la" --name "list_files" --description "List files in current directory"

# System information
shell-mcp --cmd "uname -a" --name "system_info" --description "Get system information"
```

### Commands with Arguments

```bash
# Echo with message argument
shell-mcp \
  --cmd "echo \$MESSAGE" \
  --name "echo_message" \
  --description "Echo a custom message" \
  --args "MESSAGE:string:Message to echo"

# Calculator
shell-mcp \
  --cmd "echo \$((\$NUM1 + \$NUM2))" \
  --name "add_numbers" \
  --description "Add two numbers" \
  --args "NUM1:int:First number" \
  --args "NUM2:int:Second number"

# File search
shell-mcp \
  --cmd "find \$PATH -name \$PATTERN -type f" \
  --name "find_files" \
  --description "Search for files by pattern" \
  --args "PATH:string:Directory to search" \
  --args "PATTERN:string:File name pattern"
```

## REPL Examples

### Python REPL

```bash
shell-mcp \
  --repl "python3" \
  --repl-name "python" \
  --repl-description "Python REPL for code execution" \
  --start-args "-i" \
  --end-args "exit()"
```

### Node.js REPL

```bash
shell-mcp \
  --repl "node" \
  --repl-name "nodejs" \
  --repl-description "Node.js REPL for JavaScript execution" \
  --end-args ".exit"
```

### Bash Shell

```bash
shell-mcp \
  --repl "bash" \
  --repl-name "bash" \
  --repl-description "Bash shell for command execution" \
  --start-args "--norc" \
  --end-args "exit"
```

## Configuration File Examples

### Basic Configuration

```json
{
  "tools": {
    "date": {
      "cmd": "date",
      "description": "Get current date and time"
    },
    "whoami": {
      "cmd": "whoami",
      "description": "Get current user"
    }
  }
}
```

### Advanced Configuration

```json
{
  "tools": {
    "git_status": {
      "cmd": "git status --porcelain",
      "description": "Get git repository status",
      "timeout": 10000
    },
    "docker_ps": {
      "cmd": "docker ps --format table",
      "description": "List running Docker containers"
    },
    "disk_usage": {
      "cmd": "du -sh $PATH",
      "description": "Get disk usage for path",
      "args": {
        "PATH": {
          "type": "string",
          "description": "Path to check",
          "optional": true,
          "default": "."
        }
      }
    }
  },
  "repls": {
    "python_data": {
      "command": "python3",
      "description": "Python with data science libraries",
      "startArgs": ["-c", "import pandas as pd; import numpy as np; print('Ready')"],
      "endArgs": ["exit()"],
      "timeout": 60000
    }
  }
}
```

## Claude Desktop Integration

### Single Tool Configuration

```json
{
  "mcpServers": {
    "date-tool": {
      "command": "npx",
      "args": [
        "-y",
        "shell-mcp",
        "--cmd", "date",
        "--name", "get_date",
        "--description", "Get current date and time"
      ]
    }
  }
}
```

### Multi-Tool Configuration

```json
{
  "mcpServers": {
    "shell-tools": {
      "command": "npx",
      "args": [
        "-y",
        "shell-mcp",
        "--config",
        "/path/to/config.json"
      ]
    }
  }
}
```

### Development Tools Configuration

```json
{
  "mcpServers": {
    "dev-tools": {
      "command": "npx",
      "args": [
        "-y", 
        "shell-mcp",
        "--config",
        "/home/user/dev-tools.json"
      ],
      "env": {
        "PATH": "/usr/local/bin:/usr/bin:/bin"
      }
    }
  }
}
```

## Real-World Use Cases

### 1. Development Environment

```json
{
  "tools": {
    "git_status": {
      "cmd": "git status --short",
      "description": "Get git status"
    },
    "npm_test": {
      "cmd": "npm test",
      "description": "Run npm tests",
      "timeout": 120000
    },
    "build_project": {
      "cmd": "npm run build",
      "description": "Build the project",
      "timeout": 300000
    }
  },
  "repls": {
    "node_dev": {
      "command": "node",
      "description": "Node.js development REPL",
      "startArgs": ["--experimental-repl-await"]
    }
  }
}
```

### 2. System Administration

```json
{
  "tools": {
    "system_load": {
      "cmd": "uptime",
      "description": "Check system load"
    },
    "disk_space": {
      "cmd": "df -h",
      "description": "Check disk space"
    },
    "memory_usage": {
      "cmd": "free -h",
      "description": "Check memory usage"
    },
    "process_list": {
      "cmd": "ps aux --sort=-%cpu | head -20",
      "description": "Top CPU-consuming processes"
    }
  }
}
```

### 3. Data Processing

```json
{
  "tools": {
    "csv_head": {
      "cmd": "head -n $LINES $FILE",
      "description": "Show first lines of CSV file",
      "args": {
        "FILE": {
          "type": "string",
          "description": "CSV file path"
        },
        "LINES": {
          "type": "int",
          "description": "Number of lines",
          "optional": true,
          "default": 10
        }
      }
    },
    "json_format": {
      "cmd": "echo '$JSON' | jq .",
      "description": "Format JSON",
      "args": {
        "JSON": {
          "type": "string",
          "description": "JSON string to format"
        }
      }
    }
  },
  "repls": {
    "python_analysis": {
      "command": "python3",
      "description": "Python for data analysis",
      "startArgs": ["-c", "import pandas as pd; import matplotlib.pyplot as plt; print('Data analysis ready')"],
      "timeout": 120000
    }
  }
}
```

## Error Handling Examples

### Timeout Configuration

```json
{
  "tools": {
    "long_running": {
      "cmd": "sleep $SECONDS",
      "description": "Sleep for specified seconds",
      "timeout": 5000,
      "args": {
        "SECONDS": {
          "type": "int",
          "description": "Seconds to sleep"
        }
      }
    }
  }
}
```

### Optional Arguments

```json
{
  "tools": {
    "flexible_search": {
      "cmd": "grep $PATTERN $FILE",
      "description": "Search in file",
      "args": {
        "PATTERN": {
          "type": "string",
          "description": "Search pattern"
        },
        "FILE": {
          "type": "string",
          "description": "File to search",
          "optional": true,
          "default": "/dev/stdin"
        }
      }
    }
  }
}
```

## Testing Your Configuration

```bash
# Test single command
shell-mcp --cmd "echo test" --name "test" &
sleep 2
pkill -f shell-mcp

# Test configuration file
shell-mcp --config examples/config.json &
sleep 2
pkill -f shell-mcp

# Test with debug logging
shell-mcp --config config.json --log-level debug
```
