#!/bin/bash

# Project verification script
# Ensures all components are working correctly

set -e

echo "🔍 Shell MCP Project Verification"
echo "================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Track results
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${BLUE}Testing: $test_name${NC}"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $test_name passed${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ $test_name failed${NC}"
        ((TESTS_FAILED++))
    fi
}

# 1. Check project structure
echo -e "\n${YELLOW}1. Checking project structure...${NC}"
run_test "Source directory exists" "[ -d src ]"
run_test "Tests directory exists" "[ -d tests ]"
run_test "Examples directory exists" "[ -d examples ]"
run_test "Documentation exists" "[ -d docs ]"
run_test "Main entry point exists" "[ -f src/index.ts ]"
run_test "Server module exists" "[ -f src/server.ts ]"
run_test "Package.json exists" "[ -f package.json ]"
run_test "README exists" "[ -f README.md ]"
run_test "LICENSE exists" "[ -f LICENSE ]"

# 2. Check dependencies
echo -e "\n${YELLOW}2. Checking dependencies...${NC}"
run_test "Node modules installed" "[ -d node_modules ]"
run_test "FastMCP dependency" "[ -d node_modules/fastmcp ]"
run_test "TypeScript dependency" "[ -d node_modules/typescript ]"
run_test "Jest dependency" "[ -d node_modules/jest ]"
run_test "Zod dependency" "[ -d node_modules/zod ]"

# 3. Build and compilation
echo -e "\n${YELLOW}3. Testing build process...${NC}"
run_test "TypeScript compilation" "npm run build"
run_test "Dist directory created" "[ -d dist ]"
run_test "Main JS file exists" "[ -f dist/index.js ]"
run_test "Server JS file exists" "[ -f dist/server.js ]"

# 4. Code quality
echo -e "\n${YELLOW}4. Testing code quality...${NC}"
run_test "ESLint passes" "npm run lint"
run_test "TypeScript types valid" "npx tsc --noEmit"

# 5. Unit tests
echo -e "\n${YELLOW}5. Running unit tests...${NC}"
run_test "Jest test suite" "npm test"

# 6. CLI functionality
echo -e "\n${YELLOW}6. Testing CLI functionality...${NC}"
run_test "CLI help command" "timeout 5s node dist/index.js --help"
run_test "CLI version command" "timeout 5s node dist/index.js --version"

# 7. Example configurations
echo -e "\n${YELLOW}7. Validating example configurations...${NC}"
run_test "Basic tools config valid" "[ -f examples/basic-tools.json ] && jq empty examples/basic-tools.json"
run_test "Git tools config valid" "[ -f examples/git-tools.json ] && jq empty examples/git-tools.json"
run_test "Comprehensive config valid" "[ -f examples/comprehensive-config.json ] && jq empty examples/comprehensive-config.json"

# 8. Documentation
echo -e "\n${YELLOW}8. Checking documentation...${NC}"
run_test "Architecture docs exist" "[ -f docs/architecture.md ]"
run_test "Usage guide exists" "[ -f docs/usage-guide.md ]"
run_test "Project summary exists" "[ -f PROJECT_SUMMARY.md ]"

# 9. Scripts
echo -e "\n${YELLOW}9. Validating scripts...${NC}"
run_test "Demo script exists" "[ -f scripts/demo.sh ]"
run_test "Test CLI script exists" "[ -f scripts/test-cli.sh ]"
run_test "Test tools script exists" "[ -f scripts/test-tools.ts ]"

# 10. Package configuration
echo -e "\n${YELLOW}10. Checking package configuration...${NC}"
run_test "Package name correct" "grep -q '\"name\": \"shell-mcp\"' package.json"
run_test "Main entry correct" "grep -q '\"main\": \"dist/index.js\"' package.json"
run_test "Bin entry correct" "grep -q '\"shell-mcp\": \"dist/index.js\"' package.json"
run_test "Scripts defined" "grep -q '\"build\": \"tsc\"' package.json"

# Summary
echo -e "\n${YELLOW}Verification Summary${NC}"
echo "===================="
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All verification tests passed!${NC}"
    echo -e "${GREEN}The Shell MCP project is ready for production use.${NC}"
    
    echo -e "\n${BLUE}Quick Start:${NC}"
    echo "1. npx shell-mcp --cmd 'date' --name get_date"
    echo "2. npx shell-mcp --config examples/basic-tools.json"
    echo "3. npx shell-mcp --repl python"
    
    exit 0
else
    echo -e "\n${RED}❌ Some verification tests failed.${NC}"
    echo -e "${RED}Please review the failed tests above.${NC}"
    exit 1
fi
