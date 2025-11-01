# Commit Message: Rule Debugger Implementation

## Title

```
feat(debug): implement Rule Debugger for filter pattern debugging
```

## Summary

Implement comprehensive rule debugging system to help users understand why files and methods are included or excluded from analysis. Includes pattern tracing, pattern analysis, and detailed explanations of filter decisions.

## What Was Implemented

### Core Components

1. **RuleTracer Class** (`lib/debug/rule-tracer.js`, 450+ lines)
   - `traceFile()` - Trace why files are included/excluded
   - `traceMethod()` - Trace method filtering decisions
   - `traceCalculatorRules()` - Trace calculator include/exclude rules
   - `analyzePatterns()` - Analyze all patterns and show matches
   - `testPattern()` - Pattern matching with glob support
   - `matchesMethodPattern()` - Method pattern matching (wildcards, Class.method)
   - `printTrace()`, `printMethodTrace()`, `printPatternAnalysis()` - Formatted output

2. **CLI Integration** (`context-manager.js`)
   - Added `--trace-rules` flag
   - Integrated with TokenCalculator
   - Added debugging section to help text

3. **TokenCalculator Integration** (`lib/analyzers/token-calculator.js`)
   - Added `traceRules()` method
   - Integrated RuleTracer with existing analysis flow

4. **Module Export** (`index.js`)
   - Exported RuleTracer for programmatic usage

### Features

**File-Level Tracing:**
- Shows inclusion/exclusion reason for each file
- Displays matching pattern and line number
- Indicates filter mode (INCLUDE/EXCLUDE)
- Identifies filter type (gitignore/calculator/default)

**Pattern Analysis:**
- Lists all patterns from config files
- Shows match count and example files for each pattern
- Identifies unused patterns (0 matches)
- Separates INCLUDE and EXCLUDE patterns

**Method-Level Tracing:**
- Traces method filtering decisions
- Supports wildcard patterns (`handle*`, `*Helper`)
- Supports Class.method patterns (`Server.*`, `Handler.process`)
- Shows which pattern matched or why method was excluded

**Pattern Matching:**
- Glob pattern support (`**/*.js`, `src/**`, `*.test.js`)
- Wildcard support (`*` for any characters)
- Regex support for advanced patterns
- Proper `**` vs `*` handling (recursive vs single-level)

### Test Coverage

**test/test-rule-tracer.js** - 25 comprehensive tests (100% pass rate):

1. RuleTracer initialization (with/without method filter)
2. File tracing with .gitignore exclusions
3. Calculator EXCLUDE mode tracing
4. Calculator INCLUDE mode tracing
5. INCLUDE mode non-matching files
6. Default inclusion (no rules match)
7. Glob pattern matching (`test/**`, `src/*.js`, `*.test.js`)
8. Regex pattern matching
9. Method tracing without filter
10. Method tracing in INCLUDE mode (match and no-match)
11. Method tracing in EXCLUDE mode (match and no-match)
12. Pattern analysis for INCLUDE mode
13. Pattern analysis for EXCLUDE mode
14. Unused pattern detection
15. Wildcard method pattern matching (`handle*`)
16. Class.method pattern matching (`Server.*`)
17. Exact method name matching
18. Print methods (trace, method trace, pattern analysis)
19. Find matching rule functionality

### Documentation

**docs/RULE_DEBUGGER.md** - Complete user guide:

- Quick start examples
- Understanding trace output
- Filter modes (INCLUDE vs EXCLUDE)
- Pattern matching syntax
- Common use cases and troubleshooting
- API usage examples
- Pattern best practices
- CI/CD integration examples

## Technical Implementation Details

### Priority System

Files are evaluated in priority order:

1. **Priority 1**: `.gitignore` rules (always respected)
2. **Priority 2**: Calculator rules (`.calculatorinclude` or `.calculatorignore`)
3. **Priority 3**: Default (included if no rules matched)

### Pattern Matching Algorithm

Converts glob patterns to regex:

```javascript
// IMPORTANT: Replace ** before * to avoid double replacement
const regexPattern = pattern
    .replace(/\./g, '\\.') // Escape dots
    .replace(/\*\*/g, '<<DOUBLESTAR>>') // Placeholder for **
    .replace(/\*/g, '[^/]*') // * matches anything except /
    .replace(/<<DOUBLESTAR>>/g, '.*') // ** matches anything including /
    .replace(/\?/g, '.'); // ? matches single char
```

### Method Pattern Matching

Supports three pattern types:

1. **Wildcard**: `handle*` → matches `handleRequest`, `handleError`
2. **Class.method**: `Server.*` → matches all methods in files containing "Server"
3. **Exact**: `processData` → exact match only

### Integration Points

- **GitIgnoreParser**: Accesses `patterns` and `calculatorPatterns` directly
- **MethodFilterParser**: Uses `includePatterns` and `ignorePatterns` arrays
- **TokenCalculator**: Calls `traceRules()` when `--trace-rules` flag set

## Files Modified

### New Files (3)

1. `lib/debug/rule-tracer.js` - RuleTracer class (450+ lines)
2. `test/test-rule-tracer.js` - 25 comprehensive tests
3. `docs/RULE_DEBUGGER.md` - Complete documentation

### Modified Files (4)

1. `context-manager.js`
   - Added `--trace-rules` flag parsing
   - Added debugging section to help text
   - Passed flag to TokenCalculator

2. `lib/analyzers/token-calculator.js`
   - Imported RuleTracer
   - Added `traceRules(allFiles)` method
   - Integrated trace output in analysis flow

3. `index.js`
   - Exported RuleTracer class

4. `package.json`
   - Added `test:rule-tracer` script
   - Updated `test:comprehensive` to include rule tracer tests

## Test Results

**Before**: 91 tests passing
**After**: 116 tests passing (91 + 25 new tests)

All existing tests continue to pass with no regressions.

```bash
# Run rule tracer tests
npm run test:rule-tracer
# ✅ Passed: 25/25 tests

# Run all tests
npm run test:comprehensive
# ✅ All 116 tests passing
```

## Usage Examples

### Basic Debugging

```bash
# See why files are included/excluded
context-manager --trace-rules
```

### With Presets

```bash
# Debug preset filters
context-manager --preset llm-explain --trace-rules
```

### With Token Budget

```bash
# See which files selected by token budget fitter
context-manager --target-tokens 50000 --fit-strategy top-n --trace-rules
```

### Programmatic Usage

```javascript
const { RuleTracer, GitIgnoreParser } = require('@hakkisagdic/context-manager');

const parser = new GitIgnoreParser('.gitignore', '.calculatorignore', null);
const tracer = new RuleTracer(parser);

// Trace a file
const trace = tracer.traceFile('/path/to/file.js', '/project/root');
console.log(trace);

// Analyze patterns
const analysis = tracer.analyzePatterns(files);
tracer.printPatternAnalysis(analysis);
```

## Output Examples

### File Trace

```
✅ src/server.js: INCLUDED
   Reason: No exclusion rules matched

❌ test/test.js: EXCLUDED
   Reason: EXCLUDE mode - Matched exclude pattern
   Rule: test/** (line 1)
   Mode: EXCLUDE
```

### Pattern Analysis

```
🔍 Pattern Analysis
======================================================================

✅ INCLUDE Patterns (.calculatorinclude):
----------------------------------------------------------------------
✓ Line 1: src/**
   Matches: 15 files
   Examples: src/server.js, src/handler.js, src/utils/helper.js

⚠️ Line 2: unused-pattern/**
   Matches: 0 files
   ⚠️  No files matched this pattern
```

## Benefits

1. **Transparency** - Users understand exactly why files are filtered
2. **Debugging** - Quick identification of pattern issues
3. **Validation** - Detect unused or incorrect patterns
4. **Documentation** - Self-documenting filter configuration
5. **Education** - Helps users learn filter syntax

## Related Features

- **Preset System** - Pre-configured filter recipes
- **Token Budget Fitter** - Automatic file selection
- **Method Filtering** - Method-level analysis

## Backward Compatibility

- ✅ Zero breaking changes
- ✅ All existing tests pass
- ✅ New flag is optional
- ✅ No changes to existing APIs
- ✅ Additive-only changes

## Phase 0 Status

With this implementation, **Phase 0** from the roadmap is **COMPLETE**:

- ✅ Preset System (Option A)
- ✅ Token Budget Fitter (Option B)
- ✅ Rule Debugger (Option C)

Ready to proceed to Phase 1!

## Commit Footer

```
🎯 Phase 0 Complete: All quick-win features implemented

BREAKING CHANGE: None
Fixes: N/A
Implements: #rule-debugger
Related: #phase-0

🚀 Generated with Claude Code (https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Full Commit Message Template

```
feat(debug): implement Rule Debugger for filter pattern debugging

Implement comprehensive rule debugging system to help users understand
why files and methods are included or excluded from analysis.

Features:
- File-level tracing showing inclusion/exclusion reasons
- Pattern analysis with match counts and examples
- Method-level tracing with pattern matching
- Unused pattern detection
- Glob and wildcard pattern support
- INCLUDE/EXCLUDE mode explanation

Components:
- RuleTracer class (lib/debug/rule-tracer.js, 450+ lines)
- CLI integration with --trace-rules flag
- 25 comprehensive tests (100% pass rate)
- Complete documentation (docs/RULE_DEBUGGER.md)

Test Results:
- Added 25 new tests
- Total: 116 tests passing
- Zero regressions

Usage:
  context-manager --trace-rules
  context-manager --preset review --trace-rules
  context-manager --target-tokens 50000 --trace-rules

🎯 Phase 0 Complete: All quick-win features implemented
- ✅ Preset System
- ✅ Token Budget Fitter
- ✅ Rule Debugger

🚀 Generated with Claude Code (https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```
