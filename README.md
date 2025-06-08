# Shell MCP

A powerful MCP (Model Context Protocol) Server that converts shell commands and REPL sessions into MCP tools, enabling AI models to interact with command-line tools and interactive environments safely and efficiently.

## Features

- **Single Command Execution**: Convert any shell command into an MCP tool
- **REPL Session Management**: Wrap interactive command-line tools (Python, Node.js, bash, etc.) as MCP tools
- **Security First**: Built-in protection against command injection and other security vulnerabilities
- **Flexible Configuration**: Support for both CLI arguments and JSON configuration files
- **Timeout Handling**: Configurable timeouts to prevent hanging processes
- **Comprehensive Logging**: Detailed logging for debugging and monitoring

## Installation

### Using npx (Recommended)

```bash
npx shell-mcp --cmd "date" --name "get_date" --description "Get current date and time"
```

### Using uvx (Python users)

```bash
# Install via npm first, then use with uvx
npm install -g shell-mcp
uvx shell-mcp --cmd "date"
```

### Global Installation

```bash
npm install -g shell-mcp
```

## Quick Start

### Single Command Example

Convert the `date` command into an MCP tool:

```bash
shell-mcp --cmd "date" --name "get_date" --description "Get current date and time"
```

### Command with Arguments

Create an addition calculator:

```bash
shell-mcp \
  --cmd "echo \$((\$NUM1 + \$NUM2))" \
  --name "add" \
  --description "Add two numbers" \
  --args "NUM1:int:First number" \
  --args "NUM2:int:Second number"
```

### REPL Session Example

Wrap Python as an MCP tool:

```bash
shell-mcp --repl "python3" --repl-name "python" --repl-description "Python REPL"
```

### Configuration File

Create a `config.json` file:

```json
{
  "tools": {
    "add": {
      "cmd": "echo $(($OPND1 + $OPND2))",
      "description": "Add two numbers",
      "args": {
        "OPND1": {
          "type": "int",
          "description": "The first operand"
        },
        "OPND2": {
          "type": "int", 
          "description": "The second operand"
        }
      }
    },
    "date": {
      "cmd": "date",
      "description": "Get current date and time"
    }
  },
  "repls": {
    "python": {
      "command": "python3",
      "description": "Python REPL",
      "startArgs": ["-i"],
      "endArgs": ["exit()"]
    }
  }
}
```

Then run:

```bash
shell-mcp --config config.json
```

## MCP Client Configuration

### Claude Desktop

Add to your Claude Desktop configuration:

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

### Single Command Configuration

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

## Command Line Options

### Single Command Mode

- `--cmd <command>`: Command to execute
- `--name <name>`: Tool name (optional)
- `--description <desc>`: Tool description (optional)
- `--args <args...>`: Arguments in format "name:type:description"
- `--timeout <ms>`: Command timeout in milliseconds (default: 30000)

### REPL Mode

- `--repl <command>`: REPL command to start
- `--repl-name <name>`: REPL tool name (optional)
- `--repl-description <desc>`: REPL description (optional)
- `--repl-timeout <ms>`: REPL timeout (default: 30000)
- `--start-args <args...>`: Arguments for starting REPL
- `--end-args <args...>`: Arguments for ending REPL
- `--prompt <prompt>`: REPL prompt pattern

### Configuration File Mode

- `--config <file>`: Path to JSON configuration file

### General Options

- `--log-level <level>`: Log level (debug, info, warn, error)

## Argument Types

When defining tool arguments, use these types:

- `string`: Text values
- `int`: Integer numbers
- `float`: Floating-point numbers  
- `boolean`: True/false values

Format: `"name:type:description"` or `"name:type:optional:description"`

## Security Features

Shell MCP includes comprehensive security protections:

- **Command Injection Prevention**: Blocks dangerous patterns like `;`, `&&`, `||`, `|`
- **File Redirection Protection**: Prevents `>`, `<` redirections
- **Directory Traversal Protection**: Blocks `../` patterns
- **Environment Variable Sanitization**: Validates environment variable names and values
- **Process Isolation**: Uses `spawn` without shell for safer execution

## REPL Tools

When using REPL mode, the following tools are automatically created:

- `{name}_start_session`: Start a new REPL session
- `{name}_send`: Send command to session
- `{name}_receive`: Receive output from session  
- `{name}_send_receive`: Send command and receive output in one call
- `{name}_close_session`: Close the session

## Examples

See the `examples/` directory for more configuration examples:

- Basic commands (date, ps, base64)
- Mathematical operations
- Python/Node.js/Bash REPL configurations
- Complex multi-tool setups

## Development

### Building from Source

```bash
git clone <repository>
cd shell-mcp
npm install
npm run build
```

### Running Tests

```bash
npm test
```

### Development Mode

```bash
npm run dev -- --cmd "date"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Security

If you discover a security vulnerability, please email [security contact] instead of using the issue tracker.
