# 🎯 Agent 3 Assignment: Formatters & Utils

**Phase:** 1 (Quick Wins)
**Duration:** 1.5 weeks
**Modules:** 4
**Lines to Cover:** 286
**Priority:** 🟡 MEDIUM

---

## 📋 Your Mission

Increase coverage for formatter modules and high-level utility functions.

**Your Modules:**
1. `lib/formatters/format-registry.js` - Format plugin system (77.57% → 95%)
2. `lib/formatters/toon-formatter.js` - TOON compression format (83.50% → 95%)
3. `lib/utils/git-utils.js` - Git operations wrapper (84.21% → 95%)
4. `lib/utils/llm-detector.js` - LLM model detection (78.97% → 95%)

---

## 📊 Module Priority

| Module | Lines Missing | Effort | Start Here |
|--------|---------------|--------|------------|
| format-registry.js | 98 | 3h | ⭐ 1st |
| llm-detector.js | 86 | 3h | ⭐ 2nd |
| git-utils.js | 54 | 2h | 3rd |
| toon-formatter.js | 48 | 2h | 4th |

---

## 🚀 Quick Start

```bash
git checkout -b agent-3/phase1-formatters-utils
npm install

# Create test files
touch test/test-format-registry-extended.js
touch test/test-toon-formatter-extended.js
touch test/test-git-utils-extended.js
touch test/test-llm-detector-extended.js
```

---

## 📝 Module 1: format-registry.js (PRIORITY 1)

**Effort:** 3 hours | **Lines:** 98

### Key Test Areas
1. **Format Registration**
   - [ ] Register new format
   - [ ] Register duplicate format (should override)
   - [ ] Unregister format
   - [ ] List all formats

2. **Format Discovery**
   - [ ] Get format by name
   - [ ] Get format by extension
   - [ ] Get format metadata
   - [ ] Format not found error

3. **Format Validation**
   - [ ] Validate format has required methods (encode, decode)
   - [ ] Validate format metadata complete
   - [ ] Invalid format throws error

4. **Format Plugins**
   - [ ] Load plugin from file
   - [ ] Plugin initialization
   - [ ] Plugin cleanup

5. **Concurrent Operations**
   - [ ] Multiple formats registered concurrently
   - [ ] Thread-safe operations

### Example Test
```javascript
test('FormatRegistry: Register and retrieve format', () => {
    const registry = new FormatRegistry();

    const customFormat = {
        name: 'custom',
        encode: (data) => JSON.stringify(data),
        decode: (str) => JSON.parse(str)
    };

    registry.register(customFormat);

    const retrieved = registry.get('custom');
    assertEquals(retrieved.name, 'custom', 'Should retrieve format by name');
    assertTrue(typeof retrieved.encode === 'function', 'Should have encode method');
});
```

---

## 📝 Module 2: llm-detector.js (PRIORITY 2)

**Effort:** 3 hours | **Lines:** 86

### Key Test Areas
1. **Model Detection**
   - [ ] Detect GPT-4 model
   - [ ] Detect GPT-3.5 model
   - [ ] Detect Claude 3 models (Opus, Sonnet, Haiku)
   - [ ] Detect Claude 2.1
   - [ ] Detect Gemini models
   - [ ] Detect unknown model (fallback)

2. **Context Window Detection**
   - [ ] GPT-4: 128k context window
   - [ ] GPT-3.5: 16k context window
   - [ ] Claude 3 Opus: 200k context window
   - [ ] Claude 3 Sonnet: 200k context window
   - [ ] Default fallback: 8k context window

3. **Token Limits**
   - [ ] Calculate recommended token budget
   - [ ] Warn when exceeding context window
   - [ ] Suggest alternative models

4. **Model Capabilities**
   - [ ] Detect function calling support
   - [ ] Detect vision support
   - [ ] Detect JSON mode support

5. **Model Aliases**
   - [ ] Resolve 'gpt-4' to specific version
   - [ ] Resolve 'claude' to latest version
   - [ ] Handle model version comparison

### Example Test
```javascript
test('LLMDetector: Detect GPT-4 context window', () => {
    const detector = new LLMDetector();
    const model = detector.detect('gpt-4-turbo-preview');

    assertEquals(model.name, 'GPT-4 Turbo', 'Should identify model');
    assertEquals(model.contextWindow, 128000, 'Should detect 128k context');
    assertTrue(model.supportsFunctionCalling, 'Should support function calling');
});

test('LLMDetector: Detect Claude 3 Opus', () => {
    const detector = new LLMDetector();
    const model = detector.detect('claude-3-opus-20240229');

    assertEquals(model.name, 'Claude 3 Opus', 'Should identify Claude 3 Opus');
    assertEquals(model.contextWindow, 200000, 'Should detect 200k context');
    assertTrue(model.supportsVision, 'Should support vision');
});
```

---

## 📝 Module 3: git-utils.js

**Effort:** 2 hours | **Lines:** 54

### Key Test Areas
1. **Repository Detection**
   - [ ] Detect git repository in current directory
   - [ ] Detect git repository in parent directory
   - [ ] Non-git directory returns false
   - [ ] .git file (submodule) handled correctly

2. **Git Diff Parsing**
   - [ ] Parse unified diff format
   - [ ] Extract added lines
   - [ ] Extract removed lines
   - [ ] Extract modified files

3. **Git Blame**
   - [ ] Parse git blame output
   - [ ] Extract author information
   - [ ] Extract commit hash
   - [ ] Extract line numbers

4. **Changed Files**
   - [ ] Get changed files since commit
   - [ ] Get changed files in working directory
   - [ ] Get staged files
   - [ ] Filter by file extension

5. **Error Handling**
   - [ ] Handle git command not found
   - [ ] Handle non-git directory
   - [ ] Handle invalid commit hash
   - [ ] Handle permission errors

### Example Test
```javascript
test('GitUtils: Detect git repository', () => {
    const gitUtils = new GitUtils();
    const isRepo = gitUtils.isGitRepository('./');

    assertTrue(isRepo, 'Should detect git repository');
});

test('GitUtils: Parse git diff', () => {
    const gitUtils = new GitUtils();
    const diff = `diff --git a/file.js b/file.js
+++ b/file.js
@@ -1,3 +1,4 @@
 line 1
+line 2 (added)
 line 3`;

    const parsed = gitUtils.parseDiff(diff);

    assertTrue(parsed.addedLines.includes('line 2 (added)'));
    assertEquals(parsed.modifiedFiles[0], 'file.js');
});
```

---

## 📝 Module 4: toon-formatter.js

**Effort:** 2 hours | **Lines:** 48

### Key Test Areas
1. **Encoding/Decoding**
   - [ ] Encode JSON to TOON format
   - [ ] Decode TOON back to JSON
   - [ ] Round-trip test (encode → decode → equals original)
   - [ ] Verify compression ratio

2. **Metadata**
   - [ ] Embed metadata in TOON format
   - [ ] Extract metadata from TOON
   - [ ] Validate metadata structure

3. **Large Files**
   - [ ] Handle file > 1MB
   - [ ] Handle file > 10MB
   - [ ] Chunking for large files

4. **Error Handling**
   - [ ] Invalid TOON format throws error
   - [ ] Corrupted data detection
   - [ ] Version mismatch handling

### Example Test
```javascript
test('TOONFormatter: Round-trip encoding', () => {
    const formatter = new TOONFormatter();
    const original = {
        files: ['test.js', 'index.js'],
        tokens: 1000
    };

    const encoded = formatter.encode(original);
    const decoded = formatter.decode(encoded);

    assertObjectEquals(decoded, original, 'Should preserve data');
});

test('TOONFormatter: Compression ratio', () => {
    const formatter = new TOONFormatter();
    const data = { /* large data structure */ };

    const json = JSON.stringify(data);
    const toon = formatter.encode(data);

    const ratio = (1 - (toon.length / json.length)) * 100;
    assertTrue(ratio > 40, `Compression should be >40% (was ${ratio}%)`);
});
```

---

## 🎯 Success Criteria

- ✅ All 4 modules ≥ 95% line coverage
- ✅ All tests pass without errors
- ✅ Compression tests verify >40% reduction
- ✅ LLM detection tests cover all major models
- ✅ Git integration tests pass in CI/CD

**Timeline:** Complete by end of Week 2

---

## 📚 Additional Resources

**LLM Models to Test:**
- OpenAI: gpt-4, gpt-4-turbo, gpt-3.5-turbo
- Anthropic: claude-3-opus, claude-3-sonnet, claude-3-haiku, claude-2.1
- Google: gemini-pro, gemini-ultra
- Unknown/Custom models (fallback behavior)

**Git Commands to Test:**
```bash
git rev-parse --is-inside-work-tree  # Detect repo
git diff HEAD --unified=0            # Get diff
git blame -L 10,20 file.js           # Get blame
git diff --name-only HEAD~1          # Changed files
```

---

Good luck! 🚀
