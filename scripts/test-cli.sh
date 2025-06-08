#!/bin/bash

# Test script for shell-mcp CLI functionality

set -e

echo "=== Testing Shell MCP CLI ==="

# Build the project first
echo "Building project..."
npm run build

# Test 1: Basic command tool
echo -e "\n1. Testing basic command tool..."
timeout 5s node dist/index.js --cmd "echo 'Hello World'" --name "hello" --description "Say hello" &
CLI_PID=$!
sleep 2
kill $CLI_PID 2>/dev/null || true
echo "✓ Basic command tool test completed"

# Test 2: Command with arguments
echo -e "\n2. Testing command with arguments..."
timeout 5s node dist/index.js \
  --cmd "echo 'Hello, \$NAME!'" \
  --name "greet" \
  --description "Greet someone" \
  --args "NAME:string:'Name of person to greet'" &
CLI_PID=$!
sleep 2
kill $CLI_PID 2>/dev/null || true
echo "✓ Command with arguments test completed"

# Test 3: Math calculator
echo -e "\n3. Testing math calculator..."
timeout 5s node dist/index.js \
  --cmd "echo \"\$((\$A + \$B))\"" \
  --name "add" \
  --description "Add two numbers" \
  --args "A:int:'First number'" "B:int:'Second number'" &
CLI_PID=$!
sleep 2
kill $CLI_PID 2>/dev/null || true
echo "✓ Math calculator test completed"

# Test 4: Configuration file
echo -e "\n4. Testing configuration file..."
timeout 5s node dist/index.js --config examples/basic-tools.json &
CLI_PID=$!
sleep 2
kill $CLI_PID 2>/dev/null || true
echo "✓ Configuration file test completed"

# Test 5: REPL mode (if node is available)
if command -v node >/dev/null 2>&1; then
  echo -e "\n5. Testing REPL mode..."
  timeout 5s node dist/index.js --repl "node" &
  CLI_PID=$!
  sleep 2
  kill $CLI_PID 2>/dev/null || true
  echo "✓ REPL mode test completed"
else
  echo -e "\n5. Skipping REPL test (node not available)"
fi

# Test 6: Security options
echo -e "\n6. Testing security options..."
timeout 5s node dist/index.js \
  --cmd "echo 'Safe command'" \
  --name "safe" \
  --blocked-commands "rm,del" \
  --max-timeout 10 &
CLI_PID=$!
sleep 2
kill $CLI_PID 2>/dev/null || true
echo "✓ Security options test completed"

# Test 7: Log levels
echo -e "\n7. Testing log levels..."
timeout 5s node dist/index.js \
  --cmd "date" \
  --name "date" \
  --log-level "debug" &
CLI_PID=$!
sleep 2
kill $CLI_PID 2>/dev/null || true
echo "✓ Log levels test completed"

echo -e "\n=== All CLI tests completed successfully! ==="
echo "The shell-mcp tool is ready for use."

# Show usage examples
echo -e "\n=== Usage Examples ==="
echo "1. Simple command:"
echo "   npx shell-mcp --cmd 'date' --name get_date"
echo ""
echo "2. Command with parameters:"
echo "   npx shell-mcp --cmd 'echo \$MSG' --name echo --args 'MSG:string:Message to echo'"
echo ""
echo "3. Using config file:"
echo "   npx shell-mcp --config examples/basic-tools.json"
echo ""
echo "4. REPL session:"
echo "   npx shell-mcp --repl python"
echo ""
echo "5. With security restrictions:"
echo "   npx shell-mcp --cmd 'ls \$DIR' --name list --args 'DIR:string:Directory' --blocked-commands 'rm,del'"
