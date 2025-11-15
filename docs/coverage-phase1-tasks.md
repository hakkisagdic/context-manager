# 📋 Phase 1: Quick Wins - Detailed Task Breakdown

**Goal:** Increase coverage from 42.51% to 50%+ by targeting 14 modules with 70-95% coverage

**Duration:** 2 weeks | **Agents:** 3 parallel | **Lines to cover:** 1,253

---

## 🎯 Agent 1: Core Modules & High-Priority Utils

**Target:** 5 modules | **Lines:** 232 | **Duration:** 1.5 weeks

### Module 1: `lib/core/Analyzer.js`
**Current:** 93.88% (169/180 lines) | **Target:** 95%+ | **Effort:** 30min

**Uncovered Lines:** 100-102, 132-133 (11 lines)

**Test Tasks:**
1. ✅ Test parallel file analysis with multiple workers
2. ✅ Test error handling when worker fails during analysis
3. ✅ Test cache hit/miss scenarios with CacheManager
4. ✅ Test analysis with empty file list
5. ✅ Test progress callback with incremental updates

**Test File:** `test/test-core-analyzer-extended.js`

**Example Tests:**
```javascript
// Test 1: Parallel analysis
test('Analyzer handles parallel processing', async () => {
    const analyzer = new Analyzer({ workers: 4 });
    const files = generateLargeFileList(1000);
    const result = await analyzer.analyze(files);
    assertTrue(result.filesAnalyzed === 1000);
});

// Test 2: Worker failure recovery
test('Analyzer recovers from worker failure', async () => {
    const analyzer = new Analyzer();
    // Simulate worker crash mid-analysis
    const result = await analyzer.analyze(filesWithError);
    assertTrue(result.errors.length > 0);
});
```

---

### Module 2: `lib/core/Scanner.js`
**Current:** 88.80% (119/134 lines) | **Target:** 95%+ | **Effort:** 1h

**Uncovered Lines:** 91, 95-97, 125-131 (15 lines)

**Test Tasks:**
1. ✅ Test deep directory scanning (nested 20+ levels)
2. ✅ Test symlink handling (circular, broken, cross-device)
3. ✅ Test .gitignore integration with complex patterns
4. ✅ Test performance with 10,000+ files
5. ✅ Test permission-denied directories (EACCES errors)
6. ✅ Test scanning with maxDepth limit
7. ✅ Test ignore patterns with negation (!pattern)

**Test File:** `test/test-core-scanner-extended.js`

**Example Tests:**
```javascript
// Test deep nesting
test('Scanner handles deeply nested directories', () => {
    const scanner = new Scanner('/path/to/deep/dir');
    const files = scanner.scan({ maxDepth: 50 });
    assertTrue(files.length > 0);
});

// Test circular symlinks
test('Scanner detects and handles circular symlinks', () => {
    const scanner = new Scanner('/path/with/circular/link');
    const files = scanner.scan();
    // Should not hang or crash
    assertTrue(Array.isArray(files));
});
```

---

### Module 3: `lib/utils/token-utils.js`
**Current:** 95.57% (108/113 lines) | **Target:** 96%+ | **Effort:** 30min

**Uncovered Lines:** 14-15, 32-33, 35 (5 lines)

**Test Tasks:**
1. ✅ Test token estimation fallback when tiktoken unavailable
2. ✅ Test token counting for binary files (should skip)
3. ✅ Test token counting for very large files (>10MB)
4. ✅ Test encoding edge cases (invalid UTF-8)
5. ✅ Test tiktoken initialization failure handling

**Test File:** Extend `test/test-token-utils.js`

---

### Module 4: `lib/utils/config-utils.js`
**Current:** 89.69% (87/97 lines) | **Target:** 95%+ | **Effort:** 30min

**Uncovered Lines:** 46-47, 87-94 (10 lines)

**Test Tasks:**
1. ✅ Test config file discovery in parent directories
2. ✅ Test config merge with defaults
3. ✅ Test invalid JSON config handling
4. ✅ Test config validation with schema
5. ✅ Test config file not found scenario

**Test File:** `test/test-config-utils-extended.js`

---

### Module 5: `lib/utils/error-handler.js`
**Current:** 90.34% (131/145 lines) | **Target:** 95%+ | **Effort:** 1h

**Uncovered Lines:** 54, 89-90, 103-104 (14 lines)

**Test Tasks:**
1. ✅ Test custom error classes (PresetNotFoundError, etc.)
2. ✅ Test error logging with different log levels
3. ✅ Test error recovery strategies
4. ✅ Test stack trace formatting
5. ✅ Test error aggregation in batch operations
6. ✅ Test silent mode error handling

**Test File:** Extend `test/test-utils-error-handler.js`

---

## 🎯 Agent 2: Parsers & Optimizers

**Target:** 5 modules | **Lines:** 349 | **Duration:** 1.5 weeks

### Module 6: `lib/parsers/gitignore-parser.js`
**Current:** 55.60% (139/250 lines) | **Target:** 95%+ | **Effort:** 4h

**Uncovered Lines:** 211-222, 239-247 (111 lines)

**Test Tasks:**
1. ✅ Test glob pattern matching (**, *, ?, [abc])
2. ✅ Test negation patterns (!pattern)
3. ✅ Test directory-only patterns (dir/)
4. ✅ Test path normalization (Windows vs Unix)
5. ✅ Test .gitignore comments and empty lines
6. ✅ Test nested .gitignore files (directory-specific)
7. ✅ Test pattern precedence (last match wins)
8. ✅ Test escape sequences (\#, \!, \\)
9. ✅ Test absolute vs relative paths
10. ✅ Test performance with 1000+ patterns

**Test File:** Extend `test/test-gitignore-parser.js` + `test/test-gitignore-comprehensive.js`

**Example Tests:**
```javascript
// Test glob patterns
test('GitIgnoreParser: Complex glob patterns', () => {
    const parser = new GitIgnoreParser();
    parser.addPattern('**/*.test.js');
    parser.addPattern('!important.test.js');

    assertTrue(parser.shouldIgnore('src/foo.test.js'));
    assertFalse(parser.shouldIgnore('important.test.js'));
});

// Test negation
test('GitIgnoreParser: Negation patterns', () => {
    const parser = new GitIgnoreParser();
    parser.addPattern('*.log');
    parser.addPattern('!important.log');

    assertTrue(parser.shouldIgnore('debug.log'));
    assertFalse(parser.shouldIgnore('important.log'));
});
```

---

### Module 7: `lib/parsers/method-filter-parser.js`
**Current:** 70.93% (61/86 lines) | **Target:** 95%+ | **Effort:** 1h

**Uncovered Lines:** 22-24, 56-65, 69-80 (25 lines)

**Test Tasks:**
1. ✅ Test include/exclude mode switching
2. ✅ Test wildcard method patterns (get*, *Handler)
3. ✅ Test class-scoped patterns (MyClass.*)
4. ✅ Test regex-based patterns
5. ✅ Test pattern validation and error messages
6. ✅ Test empty pattern file handling

**Test File:** Extend `test/test-method-filter-parser.js`

---

### Module 8: `lib/optimizers/fit-strategies.js`
**Current:** 83.22% (253/304 lines) | **Target:** 95%+ | **Effort:** 2h

**Uncovered Lines:** 200-201, 242-271 (51 lines)

**Test Tasks:**
1. ✅ Test `auto` strategy selection logic
2. ✅ Test `shrink-docs` removes documentation files
3. ✅ Test `balanced` optimizes token/file ratio
4. ✅ Test `methods-only` extracts methods from large files
5. ✅ Test `top-n` selects most important files
6. ✅ Test edge cases (empty file list, all files over budget)
7. ✅ Test strategy switching when target not met
8. ✅ Test importance scoring algorithm

**Test File:** Extend `test/test-phase1-token-budget.js`

---

### Module 9: `lib/analyzers/go-method-analyzer.js`
**Current:** 79.39% (131/165 lines) | **Target:** 95%+ | **Effort:** 2h

**Uncovered Lines:** 108-113, 139-162 (34 lines)

**Test Tasks:**
1. ✅ Test Go function extraction (func name())
2. ✅ Test Go method extraction (func (r *Receiver) Method())
3. ✅ Test interface method extraction
4. ✅ Test generic function support (Go 1.18+)
5. ✅ Test embedded struct methods
6. ✅ Test edge cases (anonymous functions, closures)

**Test File:** `test/test-go-method-analyzer-extended.js`

---

### Module 10: `lib/presets/preset-manager.js`
**Current:** 79.95% (339/424 lines) | **Target:** 95%+ | **Effort:** 3h

**Uncovered Lines:** 385-386, 419-421 (84 lines)

**Test Tasks:**
1. ✅ Test preset loading from presets.json
2. ✅ Test preset validation (required fields)
3. ✅ Test preset application to configuration
4. ✅ Test custom preset creation
5. ✅ Test preset file generation (.contextinclude, etc.)
6. ✅ Test preset cleanup after analysis
7. ✅ Test preset merging with user config
8. ✅ Test invalid preset handling

**Test File:** Extend `test/test-phase1-presets.js`

---

## 🎯 Agent 3: Formatters & Utils

**Target:** 4 modules | **Lines:** 672 | **Duration:** 1.5 weeks

### Module 11: `lib/formatters/format-registry.js`
**Current:** 77.57% (339/437 lines) | **Target:** 95%+ | **Effort:** 3h

**Uncovered Lines:** 373, 383, 420-434 (98 lines)

**Test Tasks:**
1. ✅ Test format registration (registerFormat)
2. ✅ Test format discovery and listing
3. ✅ Test format validation (required methods)
4. ✅ Test format priority/ordering
5. ✅ Test custom format plugins
6. ✅ Test format alias support
7. ✅ Test format metadata retrieval
8. ✅ Test concurrent format operations

**Test File:** `test/test-formatters-registry-extended.js`

---

### Module 12: `lib/formatters/toon-formatter.js`
**Current:** 83.50% (243/291 lines) | **Target:** 95%+ | **Effort:** 2h

**Uncovered Lines:** 192-193, 277-288 (48 lines)

**Test Tasks:**
1. ✅ Test TOON encoding/decoding round-trip
2. ✅ Test compression ratio calculation
3. ✅ Test metadata embedding
4. ✅ Test large file handling (chunking)
5. ✅ Test invalid TOON format detection
6. ✅ Test version compatibility

**Test File:** Extend `test/test-toon-format.js`

---

### Module 13: `lib/utils/git-utils.js`
**Current:** 84.21% (288/342 lines) | **Target:** 95%+ | **Effort:** 2h

**Uncovered Lines:** 298-299, 308-309 (54 lines)

**Test Tasks:**
1. ✅ Test git repository detection
2. ✅ Test git diff parsing
3. ✅ Test git blame parsing
4. ✅ Test git log parsing with --since flag
5. ✅ Test changed files detection
6. ✅ Test git command error handling
7. ✅ Test non-git directory handling

**Test File:** Extend `test/test-git-utils.js`

---

### Module 14: `lib/utils/llm-detector.js`
**Current:** 78.97% (323/409 lines) | **Target:** 95%+ | **Effort:** 3h

**Uncovered Lines:** 325-328, 375-391 (86 lines)

**Test Tasks:**
1. ✅ Test LLM model detection (GPT-4, Claude, etc.)
2. ✅ Test context window size detection
3. ✅ Test token limit recommendations
4. ✅ Test model capability detection
5. ✅ Test unknown model handling
6. ✅ Test model alias resolution
7. ✅ Test model version comparison

**Test File:** Extend `test/test-llm-detector-extended.js`

---

## 📊 Phase 1 Summary

| Agent | Modules | Lines to Cover | Duration | Start Priority |
|-------|---------|----------------|----------|----------------|
| **Agent 1** | 5 | 232 | 1.5 weeks | 🔴 High |
| **Agent 2** | 5 | 349 | 1.5 weeks | 🔴 High |
| **Agent 3** | 4 | 672 | 1.5 weeks | 🟡 Medium |
| **Total** | **14** | **1,253** | **2 weeks** | - |

**Expected Outcome:** Coverage increases from 42.51% → 50%+

---

## ✅ Completion Criteria

For each module:
1. ✅ Line coverage ≥ 95%
2. ✅ Function coverage ≥ 90%
3. ✅ Branch coverage ≥ 85%
4. ✅ All edge cases covered
5. ✅ Test file committed and pushed
6. ✅ Coverage report updated

---

## 🚀 Getting Started

### Step 1: Setup
```bash
npm install
npm run test:coverage  # Baseline measurement
```

### Step 2: Create Test File
```bash
# Agent 1 example
touch test/test-core-analyzer-extended.js
chmod +x test/test-core-analyzer-extended.js
```

### Step 3: Follow Test Template
See `test/test-utils-comprehensive.js` for structure:
- Use `assert()` and `assertThrows()` helpers
- Organize tests into sections with headers
- Include test summary at end

### Step 4: Run Coverage
```bash
# Test single module
npx c8 --include='lib/core/Analyzer.js' node test/test-core-analyzer-extended.js

# Full coverage check
npm run test:coverage
```

### Step 5: Validate
```bash
npm run test:coverage:check  # Must pass 95% threshold
```

---

## 📝 Notes

- Each agent works on separate files (no conflicts)
- Push commits daily to track progress
- Coverage reports generated in `coverage/index.html`
- Communication channel: GitHub PR comments
