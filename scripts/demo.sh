#!/bin/bash

# Shell MCP Demo Script
# This script demonstrates the key features of shell-mcp

set -e

echo "🚀 Shell MCP Demo"
echo "=================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Build the project
echo -e "\n${BLUE}Building shell-mcp...${NC}"
npm run build

echo -e "\n${GREEN}✓ Build completed successfully!${NC}"

# Demo 1: Simple command
echo -e "\n${YELLOW}Demo 1: Simple Date Command${NC}"
echo "Command: npx shell-mcp --cmd 'date' --name get_date"
echo "This creates an MCP tool that returns the current date and time."
echo -e "${BLUE}Starting server (will run for 3 seconds)...${NC}"
timeout 3s node dist/index.js --cmd "date" --name get_date --description "Get current date and time" &
sleep 3
echo -e "${GREEN}✓ Demo 1 completed${NC}"

# Demo 2: Parameterized command
echo -e "\n${YELLOW}Demo 2: Parameterized Greeting${NC}"
echo "Command: npx shell-mcp --cmd 'echo \"Hello, \$NAME!\"' --name greet --args 'NAME:string:Name to greet'"
echo "This creates an MCP tool that greets someone by name."
echo -e "${BLUE}Starting server (will run for 3 seconds)...${NC}"
timeout 3s node dist/index.js \
  --cmd "echo 'Hello, \$NAME!'" \
  --name greet \
  --description "Greet someone by name" \
  --args "NAME:string:'Name of the person to greet'" &
sleep 3
echo -e "${GREEN}✓ Demo 2 completed${NC}"

# Demo 3: Math calculator
echo -e "\n${YELLOW}Demo 3: Math Calculator${NC}"
echo "Command: npx shell-mcp --cmd 'echo \$((\$A + \$B))' --name add --args 'A:int:First number' 'B:int:Second number'"
echo "This creates an MCP tool that adds two numbers."
echo -e "${BLUE}Starting server (will run for 3 seconds)...${NC}"
timeout 3s node dist/index.js \
  --cmd "echo \"\$((\$A + \$B))\"" \
  --name add \
  --description "Add two numbers" \
  --args "A:int:'First number'" "B:int:'Second number'" &
sleep 3
echo -e "${GREEN}✓ Demo 3 completed${NC}"

# Demo 4: Configuration file
echo -e "\n${YELLOW}Demo 4: Configuration File${NC}"
echo "Using configuration file: examples/basic-tools.json"
echo "This loads multiple tools from a JSON configuration file."
echo -e "${BLUE}Starting server (will run for 3 seconds)...${NC}"
timeout 3s node dist/index.js --config examples/basic-tools.json &
sleep 3
echo -e "${GREEN}✓ Demo 4 completed${NC}"

# Demo 5: REPL session
if command -v node >/dev/null 2>&1; then
  echo -e "\n${YELLOW}Demo 5: Node.js REPL Session${NC}"
  echo "Command: npx shell-mcp --repl node"
  echo "This creates MCP tools for interactive Node.js sessions."
  echo -e "${BLUE}Starting server (will run for 3 seconds)...${NC}"
  timeout 3s node dist/index.js --repl node --name nodejs_repl &
  sleep 3
  echo -e "${GREEN}✓ Demo 5 completed${NC}"
else
  echo -e "\n${YELLOW}Demo 5: Skipped (Node.js not available)${NC}"
fi

# Demo 6: Security features
echo -e "\n${YELLOW}Demo 6: Security Features${NC}"
echo "Command with security restrictions: --blocked-commands 'rm,del' --max-timeout 10"
echo "This demonstrates security features to prevent dangerous operations."
echo -e "${BLUE}Starting server (will run for 3 seconds)...${NC}"
timeout 3s node dist/index.js \
  --cmd "echo 'This is a safe command'" \
  --name safe_echo \
  --description "Safe echo command" \
  --blocked-commands "rm,del" \
  --max-timeout 10 &
sleep 3
echo -e "${GREEN}✓ Demo 6 completed${NC}"

# Show example MCP client configuration
echo -e "\n${YELLOW}MCP Client Configuration Example${NC}"
echo "Add this to your Claude Desktop configuration:"
echo -e "${BLUE}"
cat << 'EOF'
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
EOF
echo -e "${NC}"

# Show available examples
echo -e "\n${YELLOW}Available Example Configurations:${NC}"
echo "• examples/basic-tools.json - Basic utility tools"
echo "• examples/git-tools.json - Git repository tools"
echo "• examples/comprehensive-config.json - Advanced tools"
echo "• examples/config-example.json - System administration tools"

# Show usage patterns
echo -e "\n${YELLOW}Common Usage Patterns:${NC}"
echo "1. Single command: npx shell-mcp --cmd 'date' --name get_date"
echo "2. With parameters: npx shell-mcp --cmd 'echo \$MSG' --name echo --args 'MSG:string:Message'"
echo "3. Config file: npx shell-mcp --config config.json"
echo "4. REPL session: npx shell-mcp --repl python"
echo "5. With security: npx shell-mcp --cmd 'ls' --name list --blocked-commands 'rm,del'"

echo -e "\n${GREEN}🎉 Demo completed successfully!${NC}"
echo -e "\n${BLUE}Next steps:${NC}"
echo "1. Try the examples in the examples/ directory"
echo "2. Read the documentation in docs/"
echo "3. Create your own configuration files"
echo "4. Integrate with your MCP client (Claude Desktop, etc.)"

echo -e "\n${YELLOW}For more information:${NC}"
echo "• README.md - Installation and basic usage"
echo "• docs/usage-guide.md - Comprehensive usage guide"
echo "• docs/architecture.md - Technical architecture details"
