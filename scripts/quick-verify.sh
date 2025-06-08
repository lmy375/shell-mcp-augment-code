#!/bin/bash

# Quick project verification
echo "🔍 Quick Shell MCP Verification"
echo "==============================="

# Check key files exist
echo "✓ Checking project structure..."
[ -f src/index.ts ] && echo "  ✓ Main entry point exists"
[ -f src/server.ts ] && echo "  ✓ Server module exists"
[ -f package.json ] && echo "  ✓ Package.json exists"
[ -f README.md ] && echo "  ✓ README exists"
[ -d tests ] && echo "  ✓ Tests directory exists"
[ -d examples ] && echo "  ✓ Examples directory exists"

# Check build
echo "✓ Checking build..."
[ -d dist ] && echo "  ✓ Dist directory exists"
[ -f dist/index.js ] && echo "  ✓ Compiled JS exists"

# Check dependencies
echo "✓ Checking dependencies..."
[ -d node_modules/fastmcp ] && echo "  ✓ FastMCP installed"
[ -d node_modules/typescript ] && echo "  ✓ TypeScript installed"
[ -d node_modules/jest ] && echo "  ✓ Jest installed"

# Check examples
echo "✓ Checking examples..."
[ -f examples/basic-tools.json ] && echo "  ✓ Basic tools config exists"
[ -f examples/git-tools.json ] && echo "  ✓ Git tools config exists"

echo ""
echo "🎉 Shell MCP project verification completed!"
echo ""
echo "Ready to use:"
echo "  npx shell-mcp --cmd 'date' --name get_date"
echo "  npx shell-mcp --config examples/basic-tools.json"
echo "  npx shell-mcp --repl python"
