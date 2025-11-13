# Test Structure Improvements

## Current State

### Test Organization
```
test/
├── test.js                        # Basic tests (25)
├── unit-tests.js                   # Unit tests (40)
├── test-v2.3-features.js          # v2.3 features (32)
├── test-cli-integration.js        # CLI tests (8)
├── test-llm-detection.js          # LLM tests (12)
├── test-v3-features.js            # v3 core tests (12)
├── test-plugin-system.js          # Plugin tests (29) ✨ NEW
├── test-api-server.js             # API tests (22) ✨ NEW
├── test-watch-mode.js             # Watch tests (12) ✨ NEW
├── test-cache-manager.js          # Cache tests (15) ✨ NEW
├── test-git-integration.js        # Git tests (partial)
├── test-gitingest.js              # GitIngest tests
├── test-gitingest-json.js         # GitIngest JSON tests
├── test-toon-format.js            # TOON format tests
├── test-go-analyzer.js            # Go tests
├── test-java-support.js           # Java tests
├── test-rust.js                   # Rust tests
├── test-csharp.js                 # C# tests
├── test-suite.js                  # Integration tests
├── test-wizard.js                 # Wizard tests
├── test-dashboard.js              # Dashboard tests
├── test-ink-ui.js                 # Ink UI tests
├── run-all-tests.js               # Test runner
├── convert-to-esm.js              # ES module converter ✨ NEW
└── fixtures/                      # Test fixtures
    └── watch-test/                # Watch mode fixtures
```

### Test Metrics
- **Total Tests**: 207
- **Total Files**: 22 test files
- **Code Coverage**: ~45%
- **Success Rate**: ~98%

---

## Recommended Improvements

### 1. Test Organization

#### Group by Feature Category
```
test/
├── unit/                          # Unit tests
│   ├── analyzers/
│   │   ├── token-calculator.test.js
│   │   ├── method-analyzer.test.js
│   │   └── go-analyzer.test.js
│   ├── parsers/
│   │   ├── gitignore-parser.test.js
│   │   └── method-filter-parser.test.js
│   └── formatters/
│       ├── toon-formatter.test.js
│       └── gitingest-formatter.test.js
│
├── integration/                   # Integration tests
│   ├── cli.test.js
│   ├── api-server.test.js
│   └── watch-mode.test.js
│
├── e2e/                          # End-to-end tests
│   └── full-workflow.test.js
│
├── v3/                           # v3.0.0 platform tests
│   ├── core/
│   │   ├── scanner.test.js
│   │   ├── analyzer.test.js
│   │   ├── context-builder.test.js
│   │   └── reporter.test.js
│   ├── plugins/
│   │   ├── plugin-manager.test.js
│   │   ├── language-plugin.test.js
│   │   └── exporter-plugin.test.js
│   ├── api/
│   │   └── rest-server.test.js
│   ├── watch/
│   │   ├── file-watcher.test.js
│   │   └── incremental-analyzer.test.js
│   └── cache/
│       └── cache-manager.test.js
│
├── fixtures/                     # Shared test fixtures
│   ├── sample-projects/
│   ├── mock-files/
│   └── expected-outputs/
│
└── helpers/                      # Test utilities
    ├── test-framework.js         # Custom test helpers
    ├── mock-factory.js           # Mock object factory
    └── assertions.js             # Custom assertions
```

### 2. Test Utilities Module

Create `test/helpers/test-framework.js`:
```javascript
/**
 * Shared test utilities and helpers
 */

export class TestFramework {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, fn) {
        // Unified test function
    }

    async asyncTest(name, fn) {
        // Unified async test function
    }

    beforeEach(fn) {
        // Setup before each test
    }

    afterEach(fn) {
        // Cleanup after each test
    }

    report() {
        // Generate test report
    }
}

export function createTempDir() {
    // Create temp directory for tests
}

export function cleanupTempDir(dir) {
    // Cleanup temp directory
}

export function wait(ms) {
    // Wait utility
}
```

### 3. Coverage Reporting

#### Install Coverage Tool
```bash
npm install --save-dev c8
```

#### Update package.json
```json
{
  "scripts": {
    "test:coverage": "c8 npm run test:all",
    "test:coverage:report": "c8 report --reporter=html --reporter=text",
    "test:coverage:ci": "c8 --reporter=lcov npm run test:all"
  }
}
```

#### Add Coverage Config
Create `.c8rc.json`:
```json
{
  "all": true,
  "include": [
    "lib/**/*.js",
    "index.js"
  ],
  "exclude": [
    "test/**",
    "**/*.test.js",
    "node_modules/**"
  ],
  "reporter": [
    "text",
    "html",
    "lcov"
  ],
  "check-coverage": true,
  "lines": 80,
  "functions": 80,
  "branches": 75
}
```

### 4. Test Runner Improvements

Create `test/run-tests.js`:
```javascript
#!/usr/bin/env node

/**
 * Enhanced test runner with parallel execution and reporting
 */

import { spawn } from 'child_process';
import path from 'path';

const testSuites = {
    unit: [
        'test/test.js',
        'test/unit-tests.js'
    ],
    v3: [
        'test/test-v3-features.js',
        'test/test-plugin-system.js',
        'test/test-api-server.js',
        'test/test-watch-mode.js',
        'test/test-cache-manager.js'
    ],
    integration: [
        'test/test-cli-integration.js',
        'test/test-suite.js'
    ]
};

async function runTestSuite(name, tests) {
    console.log(`\n🧪 Running ${name} tests...\n`);

    for (const test of tests) {
        await runTest(test);
    }
}

async function runTest(testFile) {
    return new Promise((resolve, reject) => {
        const child = spawn('node', [testFile], {
            stdio: 'inherit'
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Test failed: ${testFile}`));
            }
        });
    });
}

// Run all test suites
async function main() {
    for (const [name, tests] of Object.entries(testSuites)) {
        try {
            await runTestSuite(name, tests);
        } catch (error) {
            console.error(`❌ ${name} tests failed`);
            process.exit(1);
        }
    }

    console.log('\n✅ All tests passed!');
}

main();
```

### 5. Mock & Fixture System

Create `test/helpers/mock-factory.js`:
```javascript
/**
 * Mock object factory for tests
 */

export function createMockFile(options = {}) {
    return {
        path: options.path || '/mock/file.js',
        relativePath: options.relativePath || 'file.js',
        name: options.name || 'file.js',
        extension: options.extension || '.js',
        size: options.size || 1000,
        modified: options.modified || Date.now(),
        content: options.content || 'function mock() {}'
    };
}

export function createMockAnalysis(options = {}) {
    return {
        tokens: options.tokens || 100,
        lines: options.lines || 50,
        methods: options.methods || [],
        complexity: options.complexity || 5
    };
}

export function createMockServer(options = {}) {
    return {
        port: options.port || 3000,
        host: options.host || 'localhost',
        isRunning: false
    };
}
```

### 6. Continuous Integration Config

Create `.github/workflows/test.yml`:
```yaml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

    - name: Run comprehensive tests
      run: npm run test:comprehensive

    - name: Generate coverage report
      run: npm run test:coverage

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella

  lint:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20.x'

    - name: Install dependencies
      run: npm ci

    - name: Run ESLint
      run: npm run lint || echo "Linter not configured"
```

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 hours)
1. ✅ Add test utilities module
2. ✅ Create mock factory
3. ✅ Setup coverage reporting (c8)
4. ✅ Improve test runner

### Phase 2: Reorganization (2-4 hours)
1. Group tests by category
2. Move fixtures to shared directory
3. Update test imports and paths
4. Update npm scripts

### Phase 3: CI/CD (1-2 hours)
1. Create GitHub Actions workflow
2. Add coverage reporting
3. Add status badges to README
4. Setup automated PR testing

### Phase 4: Advanced (4-8 hours)
1. Add snapshot testing
2. Add performance benchmarks
3. Add mutation testing
4. Visual regression tests for UI

---

## Expected Benefits

### Test Organization
- ✅ Easier to find and maintain tests
- ✅ Clear separation of concerns
- ✅ Reduced duplication
- ✅ Better test discovery

### Code Coverage
- ✅ Automated coverage reports
- ✅ Coverage trends over time
- ✅ Identify untested code paths
- ✅ Coverage badges for README

### CI/CD Integration
- ✅ Automated testing on every PR
- ✅ Matrix testing (Node 18, 20, 22)
- ✅ Faster feedback cycles
- ✅ Prevent regressions

### Developer Experience
- ✅ Faster test execution
- ✅ Better error messages
- ✅ Easier test writing
- ✅ Consistent patterns

---

## Metrics to Track

### Current Baseline
- Total tests: 207
- Coverage: ~45%
- Test execution time: ~60s
- Test files: 22

### Target Goals (3 months)
- Total tests: 300+
- Coverage: 80%+
- Test execution time: <45s
- Test files: organized into categories
- CI/CD: ✅ automated
- Coverage reports: ✅ automated

---

## Next Steps

1. **Immediate**: Add coverage reporting (c8)
2. **This week**: Create test utilities module
3. **This month**: Reorganize test structure
4. **This quarter**: Full CI/CD pipeline

---

## Conclusion

These improvements will:
- Make tests easier to maintain
- Improve code quality
- Catch bugs earlier
- Increase confidence in releases
- Provide better documentation
- Enable faster development

**Estimated Total Effort**: 8-16 hours
**Expected ROI**: High (reduced bugs, faster dev cycles)
