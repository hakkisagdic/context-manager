# 🎯 Agent 1 Assignment: Core Modules & High-Priority Utils

**Phase:** 1 (Quick Wins)
**Duration:** 1.5 weeks
**Modules:** 5
**Lines to Cover:** 232
**Priority:** 🔴 HIGH

---

## 📋 Your Mission

Increase coverage for 5 critical core modules from 88-95% to 95%+. These are high-priority modules used throughout the codebase.

**Your Modules:**
1. `lib/core/Analyzer.js` - Parallel file analysis engine
2. `lib/core/Scanner.js` - Directory tree scanner
3. `lib/utils/token-utils.js` - Token counting utilities
4. `lib/utils/config-utils.js` - Configuration management
5. `lib/utils/error-handler.js` - Error handling framework

---

## 📊 Current Status

| Module | Current Coverage | Target | Lines Missing | Priority |
|--------|------------------|--------|---------------|----------|
| `Analyzer.js` | 93.88% | 95%+ | 11 | 🔴 Critical |
| `Scanner.js` | 88.80% | 95%+ | 15 | 🔴 Critical |
| `token-utils.js` | 95.57% | 96%+ | 5 | 🟢 Easy |
| `config-utils.js` | 89.69% | 95%+ | 10 | 🟡 Medium |
| `error-handler.js` | 90.34% | 95%+ | 14 | 🟡 Medium |

---

## 🚀 Getting Started

### Step 1: Clone & Setup
```bash
cd /home/user/context-manager
git checkout -b agent-1/phase1-core-modules
npm install
```

### Step 2: Baseline Measurement
```bash
npm run test:coverage
```

Check your current coverage in `coverage/index.html` for your modules.

### Step 3: Create Test Files
```bash
# Create your test files
touch test/test-core-analyzer-extended.js
touch test/test-core-scanner-extended.js
touch test/test-token-utils-extended.js
touch test/test-config-utils-extended.js
touch test/test-error-handler-extended.js

# Make executable
chmod +x test/test-*.js
```

### Step 4: Copy Test Template
```bash
cp docs/test-template.js test/test-core-analyzer-extended.js
# Edit and customize for Analyzer module
```

---

## 📝 Module 1: lib/core/Analyzer.js

**File:** `test/test-core-analyzer-extended.js`

### 🎯 Coverage Goal
- Current: 93.88% (169/180 lines)
- Target: 95%+
- Missing: 11 lines (100-102, 132-133)

### ✅ Test Checklist

#### Basic Functionality
- [ ] Test Analyzer instantiation with default options
- [ ] Test Analyzer with custom options (workers, cache)
- [ ] Test analyze() with empty file list
- [ ] Test analyze() with single file
- [ ] Test analyze() with multiple files

#### Parallel Processing
- [ ] Test parallel analysis with 2 workers
- [ ] Test parallel analysis with 4 workers
- [ ] Test parallel analysis with 100+ files
- [ ] Test worker pool management
- [ ] Test worker failure recovery

#### Cache Integration
- [ ] Test cache hit scenario (file already analyzed)
- [ ] Test cache miss scenario (new file)
- [ ] Test cache invalidation on file change
- [ ] Test analysis without cache (cache disabled)
- [ ] Test CacheManager integration

#### Error Handling
- [ ] Test analysis with non-existent file
- [ ] Test analysis with permission-denied file
- [ ] Test analysis with corrupted file
- [ ] Test worker crash during analysis
- [ ] Test timeout handling

#### Progress Callbacks
- [ ] Test progress callback called correctly
- [ ] Test progress with 0%, 50%, 100% updates
- [ ] Test progress callback with errors
- [ ] Test progress callback disabled (null)

#### Performance
- [ ] Test analysis of 1000+ files
- [ ] Test memory usage stays stable
- [ ] Test analysis completes in reasonable time

### 📌 Uncovered Lines Analysis

**Lines 100-102:** Error handling when worker fails
```javascript
// Line 100-102 example test
test('Analyzer handles worker failure gracefully', async () => {
    const analyzer = new Analyzer({ workers: 2 });
    // Simulate worker crash
    const files = ['valid.js', 'will-crash.js'];
    const result = await analyzer.analyze(files);

    assertTrue(result.errors.length > 0, 'Should report errors');
    assertTrue(result.filesAnalyzed >= 1, 'Should analyze valid files');
});
```

**Lines 132-133:** Cache integration edge case
```javascript
// Line 132-133 example test
test('Analyzer with disabled cache', async () => {
    const analyzer = new Analyzer({ cache: false });
    const files = ['test.js'];
    const result = await analyzer.analyze(files);

    assertTrue(result.fromCache === false, 'Should not use cache');
});
```

---

## 📝 Module 2: lib/core/Scanner.js

**File:** `test/test-core-scanner-extended.js`

### 🎯 Coverage Goal
- Current: 88.80% (119/134 lines)
- Target: 95%+
- Missing: 15 lines (91, 95-97, 125-131)

### ✅ Test Checklist

#### Basic Functionality
- [ ] Test Scanner instantiation
- [ ] Test scan() returns array of files
- [ ] Test scan() with valid directory
- [ ] Test scan() with invalid directory

#### Deep Directory Scanning
- [ ] Test nested directories (5 levels deep)
- [ ] Test nested directories (20+ levels deep)
- [ ] Test maxDepth option (limit to 3 levels)
- [ ] Test maxDepth option with deeper nesting

#### Symlink Handling
- [ ] Test directory symlinks (valid)
- [ ] Test file symlinks (valid)
- [ ] Test broken symlinks (should skip)
- [ ] Test circular symlinks (should not hang)
- [ ] Test cross-device symlinks

#### GitIgnore Integration
- [ ] Test .gitignore patterns respected
- [ ] Test multiple .gitignore files (nested)
- [ ] Test .gitignore with negation patterns
- [ ] Test .gitignore comments ignored
- [ ] Test scanning without .gitignore

#### Performance & Scale
- [ ] Test scanning 1000+ files
- [ ] Test scanning 10,000+ files
- [ ] Test performance reasonable (<5s for 10k files)
- [ ] Test memory usage stable

#### Error Handling
- [ ] Test permission-denied directories (EACCES)
- [ ] Test permission-denied files (should skip)
- [ ] Test non-existent directory
- [ ] Test empty directory
- [ ] Test directory with only ignored files

#### Edge Cases
- [ ] Test directory with spaces in name
- [ ] Test directory with special characters
- [ ] Test directory with very long path (255+ chars)
- [ ] Test scanning current directory ('.')
- [ ] Test scanning parent directory ('..')

### 📌 Uncovered Lines Analysis

**Line 91:** Symlink cycle detection
```javascript
test('Scanner detects circular symlinks', () => {
    // Create circular symlink test structure
    const scanner = new Scanner('./test/fixtures/circular-symlink');
    const files = scanner.scan();

    assertTrue(Array.isArray(files), 'Should return array');
    assertTrue(files.length >= 0, 'Should not hang');
});
```

**Lines 95-97:** MaxDepth edge case
```javascript
test('Scanner respects maxDepth limit', () => {
    const scanner = new Scanner('./test/fixtures/deep-nested');
    const files = scanner.scan({ maxDepth: 3 });

    // Verify no files deeper than 3 levels
    files.forEach(file => {
        const depth = file.split(path.sep).length;
        assertTrue(depth <= 3, `File ${file} exceeds maxDepth`);
    });
});
```

---

## 📝 Module 3: lib/utils/token-utils.js

**File:** Extend `test/test-token-utils.js`

### 🎯 Coverage Goal
- Current: 95.57% (108/113 lines)
- Target: 96%+
- Missing: 5 lines (14-15, 32-33, 35)

### ✅ Test Checklist

#### Token Counting
- [x] Test basic token counting (existing)
- [x] Test JavaScript file tokens (existing)
- [ ] Test TypeScript file tokens
- [ ] Test very large file (>10MB)
- [ ] Test empty file (0 tokens)

#### Tiktoken Fallback
- [ ] Test estimation when tiktoken unavailable
- [ ] Test tiktoken initialization failure
- [ ] Test fallback accuracy vs tiktoken

#### Error Handling
- [ ] Test binary file (should skip or estimate)
- [ ] Test invalid UTF-8 encoding
- [ ] Test null/undefined input

### 📌 Uncovered Lines Analysis

**Lines 14-15:** Tiktoken unavailable fallback
```javascript
test('TokenUtils falls back when tiktoken unavailable', () => {
    // Mock tiktoken as unavailable
    const result = TokenUtils.countTokens('test content', { useTiktoken: false });

    assertTrue(result > 0, 'Should estimate tokens');
    assertTrue(typeof result === 'number', 'Should return number');
});
```

---

## 📝 Module 4: lib/utils/config-utils.js

**File:** `test/test-config-utils-extended.js`

### 🎯 Coverage Goal
- Current: 89.69% (87/97 lines)
- Target: 95%+
- Missing: 10 lines (46-47, 87-94)

### ✅ Test Checklist

#### Config Loading
- [ ] Test load config from current directory
- [ ] Test load config from parent directory
- [ ] Test config discovery (walk up tree)
- [ ] Test no config found (use defaults)

#### Config Parsing
- [ ] Test valid JSON config
- [ ] Test invalid JSON (should error)
- [ ] Test empty config file
- [ ] Test config with comments (if supported)

#### Config Merging
- [ ] Test merge user config with defaults
- [ ] Test override default values
- [ ] Test nested config objects

#### Validation
- [ ] Test config validation passes
- [ ] Test config validation fails
- [ ] Test required fields missing

---

## 📝 Module 5: lib/utils/error-handler.js

**File:** Extend `test/test-utils-error-handler.js`

### 🎯 Coverage Goal
- Current: 90.34% (131/145 lines)
- Target: 95%+
- Missing: 14 lines (54, 89-90, 103-104)

### ✅ Test Checklist

#### Custom Error Classes
- [ ] Test PresetNotFoundError
- [ ] Test InvalidPresetError
- [ ] Test PresetLoadError
- [ ] Test TokenBudgetError
- [ ] Test ImpossibleFitError

#### Error Logging
- [ ] Test error logged at correct level
- [ ] Test error with stack trace
- [ ] Test error aggregation (multiple errors)

#### Error Recovery
- [ ] Test recovery strategies
- [ ] Test fallback on error
- [ ] Test silent mode (no logging)

---

## 🎯 Success Criteria

For **EACH** module:
- ✅ Line coverage ≥ 95%
- ✅ Function coverage ≥ 90%
- ✅ Branch coverage ≥ 85%
- ✅ All uncovered lines now covered
- ✅ Test file committed to branch
- ✅ Coverage report shows improvement

---

## 📤 Submission

### Step 1: Run Tests
```bash
# Test each module individually
npx c8 --include='lib/core/Analyzer.js' node test/test-core-analyzer-extended.js
npx c8 --include='lib/core/Scanner.js' node test/test-core-scanner-extended.js
# ... etc

# Full coverage
npm run test:coverage
```

### Step 2: Verify Coverage
```bash
npm run test:coverage:check
```

Should see:
```
✅ All files meet coverage thresholds (95% lines)
```

### Step 3: Commit & Push
```bash
git add test/test-*.js
git commit -m "test: increase coverage for core modules to 95%+

- Add comprehensive tests for Analyzer.js (93.88% -> 96%)
- Add comprehensive tests for Scanner.js (88.80% -> 96%)
- Add tests for token-utils.js (95.57% -> 97%)
- Add tests for config-utils.js (89.69% -> 96%)
- Add tests for error-handler.js (90.34% -> 96%)

Closes #phase1-agent1"

git push -u origin agent-1/phase1-core-modules
```

### Step 4: Create Pull Request
Create PR with title: **"Phase 1 Agent 1: Core Modules Coverage 95%+"**

---

## 📚 Resources

- **Test Template:** `docs/test-template.js`
- **Detailed Tasks:** `docs/coverage-phase1-tasks.md`
- **Existing Tests:** Look at `test/test-*.js` for examples
- **Coverage Reports:** `coverage/index.html` (after running npm run test:coverage)

---

## 💬 Questions?

If you get stuck or need clarification:
1. Check existing test files for patterns
2. Review the test template
3. Ask in the PR comments
4. Check coverage report to see what lines are uncovered

---

## ⏱️ Timeline

**Week 1:**
- Days 1-2: Analyzer.js + Scanner.js (main effort)
- Days 3-4: token-utils.js + config-utils.js
- Day 5: error-handler.js

**Week 2:**
- Days 1-2: Fix failing tests, increase coverage
- Day 3: Final verification and cleanup
- Day 4: PR submission

---

Good luck! 🚀
