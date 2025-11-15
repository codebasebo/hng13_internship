#!/bin/bash

# Complete Testing Suite Runner
# Runs all verification tests for the distributed notification system

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "COMPLETE TEST SUITE"
echo "Distributed Notification System"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Running: $test_name${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✓ $test_name PASSED${NC}"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}✗ $test_name FAILED${NC}"
    fi
    
    echo ""
    echo ""
}

# Test 1: Check Version
run_test "Version Check" "./check-version.sh"

# Test 2: Deployment Test
run_test "Deployment Verification" "./test-deployment.sh"

# Test 3: Railway Simple Test
if [ -f "./test-railway-simple.sh" ]; then
    run_test "Railway Simple Test" "./test-railway-simple.sh"
fi

# Test 4: TypeScript Test Suite
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Running: TypeScript API Test Suite${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

TOTAL_TESTS=$((TOTAL_TESTS + 1))

if npx ts-node test-railway-api.ts; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}✓ TypeScript Test Suite PASSED${NC}"
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo -e "${RED}✗ TypeScript Test Suite FAILED${NC}"
fi

echo ""
echo ""

# Summary
echo -e "${BLUE}=========================================="
echo "TEST SUITE SUMMARY"
echo -e "==========================================${NC}"
echo ""
echo -e "Total Tests Run:    ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:             ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:             ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✓ ALL TESTS PASSED SUCCESSFULLY!    ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}System is ready for submission! 🚀${NC}"
else
    echo -e "${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ⚠ SOME TESTS FAILED                 ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Please review the failed tests above.${NC}"
fi

echo ""
echo -e "${BLUE}=========================================="
echo "DEPLOYMENT INFO"
echo -e "==========================================${NC}"
echo ""
echo "URL: https://hng13internship-production-a451.up.railway.app"
echo "Version: 1.0.2"
echo "Status: Live ✅"
echo ""
echo -e "${BLUE}=========================================="
echo "NEXT STEPS"
echo -e "==========================================${NC}"
echo ""
echo "1. Review REQUIREMENTS_COMPLIANCE_REPORT.md"
echo "2. Check SUBMISSION.md for submission details"
echo "3. Prepare presentation"
echo "4. Use /submit command in Discord"
echo ""
echo -e "${GREEN}Good luck with your submission! 🎯${NC}"
echo ""
