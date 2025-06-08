# Shell MCP

A powerful MCP (Model Context Protocol) server that converts shell commands and REPL sessions into MCP tools, enabling AI models to interact with command-line tools and interactive environments safely and efficiently.

## Features

- **Single Command Tools**: Convert any shell command into an MCP tool
- **REPL Session Management**: Wrap interactive tools (Python, Node.js, bash, etc.) as MCP sessions
- **Security First**: Comprehensive security validation to prevent command injection
- **Flexible Configuration**: Support for command-line, configuration files, and programmatic setup
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Timeout Protection**: Configurable timeouts to prevent hanging processes
- **Comprehensive Logging**: Structured logging with configurable levels

## Installation

### Using npx (Recommended)

```bash
npx shell-mcp --cmd "date" --name get_date --description "Get current date and time"
```

### Using uvx (Python users)

```bash
uvx shell-mcp --repl python
```

### Global Installation

```bash
npm install -g shell-mcp
```

## Quick Start

### Single Command Example

Convert the `date` command into an MCP tool:

```bash
shell-mcp --cmd "date" --name get_date --description "Get current date and time"
```

### Parameterized Command Example

Create an addition calculator:

```bash
shell-mcp --cmd "echo \$((\$OPND1 + \$OPND2))" \
  --name add \
  --description "Add two numbers" \
  --args "OPND1:int:'First operand'" "OPND2:int:'Second operand'"
```

### REPL Session Example

Wrap Python as an interactive MCP session:

```bash
shell-mcp --repl python
```

### Configuration File Example

Create a `config.json` file:

```json
{
  "add": {
    "cmd": "echo $(($OPND1 + $OPND2))",
    "args": {
      "OPND1": {
        "type": "int",
        "description": "The first operand to add"
      },
      "OPND2": {
        "type": "int", 
        "description": "The second operand to add"
      }
    },
    "description": "Add two numbers"
  },
  "date": {
    "cmd": "date",
    "description": "Get current date and time"
  }
}
```

Then run:

```bash
shell-mcp --config config.json
```

## MCP Client Configuration

### Claude Desktop Configuration

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
        "--cmd",
        "date",
        "--name",
        "get_date",
        "--description", 
        "Get current date and time"
      ]
    }
  }
}
```

### REPL Configuration

```json
{
  "mcpServers": {
    "python-repl": {
      "command": "npx",
      "args": [
        "-y",
        "shell-mcp", 
        "--repl",
        "python"
      ]
    }
  }
}
```

## Command Line Options

### Global Options

- `--config <path>`: Path to configuration file
- `--log-level <level>`: Set log level (error, warn, info, debug)
- `--timeout <seconds>`: Default timeout for command execution
- `--max-timeout <seconds>`: Maximum allowed timeout

### Single Command Mode

- `--cmd <command>`: Command to wrap as MCP tool
- `--name <name>`: Name for the tool
- `--description <desc>`: Description for the tool  
- `--args <args...>`: Arguments in format "NAME:type:description"

### REPL Mode

- `--repl <command>`: REPL command to wrap as MCP session tools

### Security Options

- `--allow-shell-operators`: Allow shell operators like &&, ||, etc.
- `--allow-file-operations`: Allow file operations like rm, mv, etc.
- `--blocked-commands <commands...>`: List of blocked commands
- `--allowed-commands <commands...>`: List of allowed commands (whitelist)

## Argument Types

When defining command arguments, use these type specifiers:

- `string`: Text string
- `int`: Integer number
- `float`: Floating point number  
- `boolean`: True/false value
- `string[]`: Array of strings

Example:
```bash
--args "MESSAGE:string:'Message to display'" "COUNT:int:'Number of times to repeat'"
```

## Security Features

Shell MCP includes comprehensive security measures:

### Command Injection Prevention

- Blocks dangerous shell operators (`&&`, `||`, `;`, `|`, `>`, `<`)
- Prevents directory traversal (`../`, `..\\`)
- Sanitizes input to remove control characters
- Uses process spawning instead of shell execution

### Access Control

- Configurable command whitelist/blacklist
- Optional restrictions on file operations
- Timeout limits to prevent resource exhaustion
- Process isolation for REPL sessions

### Safe Defaults

- Shell operators disabled by default
- File operations restricted by default
- Conservative timeout limits
- Input sanitization always enabled

## REPL Session Tools

When using `--repl`, Shell MCP creates these tools:

- `{name}_start_session`: Start a new REPL session
- `{name}_send`: Send a command to the session
- `{name}_recv`: Receive output from the session
- `{name}_send_recv`: Send command and receive output in one call
- `{name}_close_session`: Close the session

### Example REPL Usage

1. Start a Python session: `python_start_session()`
2. Send code: `python_send(sessionId, "x = 5")`
3. Get result: `python_send_recv(sessionId, "print(x * 2)")`
4. Close session: `python_close_session(sessionId)`

## Examples

### Git Integration

```bash
shell-mcp --cmd "git status" --name git_status --description "Get git repository status"
```

### File Operations (with security override)

```bash
shell-mcp --cmd "ls -la \$PATH" \
  --name list_files \
  --description "List files in directory" \
  --args "PATH:string:'Directory path to list'" \
  --allow-file-operations
```

### Database Query

```bash
shell-mcp --repl "mysql -u user -p database"
```

### Node.js REPL

```bash
shell-mcp --repl "node" --name nodejs
```

## Development

### Building from Source

```bash
git clone https://github.com/lmy375/shell-mcp-argument-code.git
cd shell-mcp-argument-code
npm install
npm run build
```

### Running Tests

```bash
npm test
```

### Development Mode

```bash
npm run dev -- --cmd "echo hello" --name test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Security

If you discover a security vulnerability, please email the maintainers directly rather than opening a public issue.

## Support

- GitHub Issues: [Report bugs and request features](https://github.com/lmy375/shell-mcp-argument-code/issues)
- Documentation: [Architecture docs](docs/architecture.md)
- Examples: See the `examples/` directory for more use cases
