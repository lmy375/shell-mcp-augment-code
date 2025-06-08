# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-08

### Added
- Initial release of Shell MCP
- Single command execution with argument support
- REPL session management for interactive tools
- Security validation to prevent command injection
- Support for multiple argument types (string, int, float, boolean)
- Configurable timeouts for command execution
- JSON configuration file support
- CLI interface with comprehensive options
- Built-in logging with configurable levels
- Comprehensive test suite
- Documentation and examples

### Features
- **Single Command Mode**: Convert any shell command into an MCP tool
- **REPL Mode**: Wrap interactive command-line tools as MCP tools
- **Security First**: Built-in protection against command injection
- **Flexible Configuration**: Support for both CLI arguments and JSON config files
- **Timeout Handling**: Configurable timeouts to prevent hanging processes
- **Type Safety**: Full TypeScript implementation with type checking

### Security
- Command injection prevention through pattern matching
- File redirection protection
- Directory traversal protection
- Environment variable sanitization
- Process isolation without shell execution

### Supported Tools
- Any single-execution command (date, ls, ps, etc.)
- Interactive REPLs (Python, Node.js, bash, etc.)
- Custom shell scripts and programs
- Base64 encoding/decoding utilities
- Git operations
- System information commands

### Documentation
- Comprehensive README with usage examples
- Architecture documentation
- Security guidelines
- Configuration examples
- API documentation
