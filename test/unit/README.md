# Unit Tests Directory

This directory contains unit tests for individual modules and components.

## Coverage Analyzer Tests

### File: `test-coverage-analyzer.js`

Comprehensive unit tests for the CoverageAnalyzer module.

**Test Coverage:**
- ✅ Constructor initialization (3 tests)
- ✅ Module scanning functionality (2 tests)
- ✅ Test file scanning (2 tests)
- ✅ Function detection (5 tests)
- ✅ Coverage calculation (5 tests)
- ✅ Helper methods (5 tests)

**Total: 22 tests, all passing**

### Running Tests

```bash
# Run coverage analyzer unit tests
node test/unit/test-coverage-analyzer.js

# Run demo to see coverage analysis in action
node test/demo-coverage-analyzer.js
```

## Test Structure

Each test file follows this pattern:
1. Import the module under test
2. Import test utilities (TestRunner, assert)
3. Create test runner instance
4. Write test cases using async/await
5. Print summary and exit with appropriate code

## Adding New Tests

To add new unit tests:
1. Create a new file: `test-[module-name].js`
2. Follow the existing test structure
3. Use the TestRunner and assert utilities
4. Ensure all tests are independent and can run in any order
