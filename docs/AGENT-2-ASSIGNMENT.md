# 🎯 Agent 2 Assignment: Parsers & Optimizers

**Phase:** 1 (Quick Wins)
**Duration:** 1.5 weeks
**Modules:** 5
**Lines to Cover:** 349
**Priority:** 🔴 HIGH

---

## 📋 Your Mission

Increase coverage for parsers and optimizer modules that handle pattern matching, filtering, and token budget optimization.

**Your Modules:**
1. `lib/parsers/gitignore-parser.js` - GitIgnore pattern matching (55.60% → 95%)
2. `lib/parsers/method-filter-parser.js` - Method filtering patterns (70.93% → 95%)
3. `lib/optimizers/fit-strategies.js` - Token budget strategies (83.22% → 95%)
4. `lib/analyzers/go-method-analyzer.js` - Go method extraction (79.39% → 95%)
5. `lib/presets/preset-manager.js` - Preset management (79.95% → 95%)

---

## 📊 Module Priority

| Module | Lines Missing | Effort | Start Here |
|--------|---------------|--------|------------|
| gitignore-parser.js | 111 | 4h | ⭐ 1st |
| preset-manager.js | 84 | 3h | ⭐ 2nd |
| fit-strategies.js | 51 | 2h | 3rd |
| go-method-analyzer.js | 34 | 2h | 4th |
| method-filter-parser.js | 25 | 1h | 5th |

---

## 🚀 Quick Start

```bash
git checkout -b agent-2/phase1-parsers-optimizers
npm install

# Create test files
touch test/test-gitignore-parser-extended.js
touch test/test-method-filter-extended.js
touch test/test-fit-strategies-extended.js
touch test/test-go-method-analyzer-extended.js
touch test/test-preset-manager-extended.js
```

---

## 📝 Module 1: gitignore-parser.js (PRIORITY 1)

**Effort:** 4 hours | **Lines:** 111

### Key Test Areas
1. **Glob Patterns:** `**/*.js`, `*.log`, `dir/*/file`
2. **Negation:** `!important.txt`
3. **Directory patterns:** `build/`, `node_modules/`
4. **Escaping:** `\#file`, `\!special`
5. **Performance:** 1000+ patterns
6. **Edge cases:** Empty patterns, comments, whitespace

### Example Test
```javascript
test('GitIgnore: Negation pattern precedence', () => {
    const parser = new GitIgnoreParser();
    parser.addPattern('*.log');
    parser.addPattern('!important.log');

    assertTrue(parser.shouldIgnore('debug.log'));
    assertFalse(parser.shouldIgnore('important.log'));
});
```

---

## 📝 Module 2: preset-manager.js (PRIORITY 2)

**Effort:** 3 hours | **Lines:** 84

### Key Test Areas
1. **Preset Loading:** Load all 8 presets from presets.json
2. **Preset Validation:** Required fields, schema validation
3. **Preset Application:** Generate filter files
4. **Preset Cleanup:** Remove temporary files
5. **Custom Presets:** User-defined presets
6. **Error Handling:** Invalid preset, missing file

### Critical Tests
- [ ] Load 'review' preset correctly
- [ ] Load 'llm-explain' preset correctly
- [ ] Apply preset generates .contextinclude file
- [ ] Cleanup removes temporary files
- [ ] Invalid preset throws PresetNotFoundError

---

## 📝 Module 3: fit-strategies.js

**Effort:** 2 hours | **Lines:** 51

### Key Test Areas
1. **Auto Strategy:** Selects best strategy automatically
2. **Shrink-Docs:** Removes .md, docs/ files first
3. **Balanced:** Optimizes token/file ratio
4. **Methods-Only:** Extracts methods from large files
5. **Top-N:** Selects N most important files

### Example Test
```javascript
test('FitStrategy: shrink-docs removes documentation', () => {
    const files = [
        { path: 'README.md', tokens: 1000 },
        { path: 'src/index.js', tokens: 500 },
        { path: 'docs/api.md', tokens: 2000 }
    ];

    const result = shrinkDocs(files, 1500);

    // Should remove docs but keep code
    assertTrue(result.some(f => f.path === 'src/index.js'));
    assertFalse(result.some(f => f.path === 'README.md'));
});
```

---

## 📝 Module 4: go-method-analyzer.js

**Effort:** 2 hours | **Lines:** 34

### Key Test Areas
1. **Functions:** `func Add(a, b int) int {}`
2. **Methods:** `func (r *Receiver) Method() {}`
3. **Interfaces:** Method signatures in interfaces
4. **Generics:** `func Sort[T any](list []T) {}`
5. **Edge Cases:** Anonymous functions, closures

---

## 📝 Module 5: method-filter-parser.js

**Effort:** 1 hour | **Lines:** 25

### Key Test Areas
1. **Include Mode:** .methodinclude patterns
2. **Exclude Mode:** .methodignore patterns
3. **Wildcards:** `get*`, `*Handler`
4. **Class Scope:** `MyClass.*`

---

## 🎯 Success Criteria

- ✅ All 5 modules ≥ 95% line coverage
- ✅ All tests pass
- ✅ PR created with detailed test coverage report

**Timeline:** Complete by end of Week 2
