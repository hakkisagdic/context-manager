#!/bin/bash

# Quick Test Script for v3.0.0
# Tests essential features with Express.js test repo

echo "🧪 Context Manager v3.0.0 - Quick Test Suite"
echo "=============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"

    echo -n "Testing: $test_name ... "

    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAILED++))
    fi
}

# Check if Express repo exists
if [ ! -d "test-repos/express" ]; then
    echo -e "${RED}❌ Express test repo not found!${NC}"
    echo "Run: git submodule update --init --recursive"
    exit 1
fi

echo "📁 Test Repository: Express.js"
echo ""

# Navigate to Express
cd test-repos/express

# Test 1: Basic Analysis
run_test "Basic Analysis" "context-manager --cli --no-verbose"

# Test 2: Method-Level Analysis
run_test "Method-Level Analysis" "context-manager --cli -m --no-verbose"

# Test 3: TOON Format
run_test "TOON Format Output" "context-manager --cli --output toon --no-verbose"

# Test 4: LLM Model Detection
export ANTHROPIC_API_KEY=sk-test-fake-key
run_test "LLM Auto-Detection" "context-manager --cli --auto-detect-llm --no-verbose"
unset ANTHROPIC_API_KEY

# Test 5: List LLMs
cd ../..
run_test "List LLM Models" "context-manager --list-llms"

# Test 6: Git Integration (Changed Since)
cd test-repos/express
run_test "Git Changed Since" "context-manager --cli --changed-since v5.0.0 --no-verbose"

# Test 7: API Server (background)
cd ../..
echo -n "Testing: API Server ... "
context-manager serve --port 3333 > /dev/null 2>&1 &
SERVER_PID=$!
sleep 2

if curl -s http://localhost:3333/api/v1/docs > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

# Cleanup server
kill $SERVER_PID 2>/dev/null
sleep 1

# Test 8: Core Module Tests
run_test "Core Module Tests" "node test/test-v3-features.js"

# Test 9: LLM Detection Tests
run_test "LLM Detection Tests" "node test/test-llm-detection.js"

# Results
echo ""
echo "=============================================="
echo -e "Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}"
echo "Total: $((PASSED + FAILED)) tests"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
