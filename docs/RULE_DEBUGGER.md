# Rule Debugger - Debug Filter Rules

## Overview

The Rule Debugger helps you understand why files and methods are included or excluded in your analysis. It shows which patterns match, which don't, and helps identify unused or conflicting rules.

## Quick Start

```bash
# Debug filter rules
context-manager --trace-rules

# Combine with other options
context-manager --trace-rules --preset review
context-manager --trace-rules --target-tokens 50000
```

## Features

### 1. File-Level Tracing

Shows why specific files are included or excluded:

```
✅ src/server.js: INCLUDED
   Reason: No exclusion rules matched

❌ test/test.js: EXCLUDED
   Reason: EXCLUDE mode - Matched exclude pattern
   Rule: test/** (line 1)
   Mode: EXCLUDE
```

### 2. Pattern Analysis

Analyzes all patterns and shows what they match:

```
🔍 Pattern Analysis
======================================================================

✅ INCLUDE Patterns (.calculatorinclude):
----------------------------------------------------------------------
✓ Line 1: src/**
   Matches: 15 files
   Examples: src/server.js, src/handler.js, src/utils/helper.js

⚠️ Line 2: lib/**/*.ts
   Matches: 0 files
   ⚠️  No files matched this pattern
```

### 3. Method-Level Tracing

Debug method filtering decisions:

```
✅ handleRequest (in server.js): INCLUDED
   Reason: INCLUDE mode - Matched include pattern
   Rule: handle* (line 1)
   Mode: INCLUDE
```

## Understanding Trace Output

### File Trace Fields

- **File**: Relative path from project root
- **Status**: ✅ INCLUDED or ❌ EXCLUDED
- **Reason**: Why the file was included/excluded
- **Rule**: The pattern that matched (if any)
- **Mode**: INCLUDE or EXCLUDE mode
- **Type**: gitignore, calculator, or default

### Priority Order

Files are evaluated in this order:

1. **Priority 1 - .gitignore**: Always respected first
2. **Priority 2 - Calculator rules**: .calculatorinclude or .calculatorignore
3. **Priority 3 - Default**: Included if no rules matched

## Filter Modes

### INCLUDE Mode

When `.calculatorinclude` exists:

- ✅ **INCLUDED** - File matches include pattern
- ❌ **EXCLUDED** - File doesn't match any include pattern

```bash
# .calculatorinclude
src/**
lib/**
index.js
```

**Result**: Only `src/`, `lib/`, and `index.js` files included

### EXCLUDE Mode

When only `.calculatorignore` exists:

- ✅ **INCLUDED** - File doesn't match exclude pattern
- ❌ **EXCLUDED** - File matches exclude pattern

```bash
# .calculatorignore
test/**
docs/**
*.md
```

**Result**: All files except `test/`, `docs/`, and `*.md` included

## Pattern Matching

### Glob Patterns

```bash
*.js           # All .js files in root
src/*.js       # All .js files in src/ (not recursive)
src/**/*.js    # All .js files in src/ (recursive)
**/*.test.js   # All .test.js files anywhere
```

### Method Patterns

```bash
handle*        # Methods starting with "handle"
*Helper        # Methods ending with "Helper"
Server.*       # All methods in files containing "Server"
Server.start   # Specific method in Server files
processData    # Exact method name
```

## Common Use Cases

### 1. Debug Why Files Are Excluded

**Problem**: "Why isn't `src/config.js` showing up?"

```bash
context-manager --trace-rules
```

Look for `src/config.js` in the trace output to see which rule excluded it.

### 2. Find Unused Patterns

**Problem**: "Are all my patterns being used?"

```bash
context-manager --trace-rules
```

Check the "Pattern Analysis" section for patterns with 0 matches.

### 3. Debug INCLUDE vs EXCLUDE Mode

**Problem**: "Nothing is being included!"

```bash
context-manager --trace-rules
```

Check the top of the output:
- `📅 Calculator include rules loaded` = INCLUDE mode
- `📋 Calculator ignore rules loaded` = EXCLUDE mode

**Fix**: In INCLUDE mode, at least one pattern must match for files to be included.

### 4. Verify Method Filtering

**Problem**: "Why isn't `handleRequest` method showing up?"

```bash
context-manager --trace-rules --method-level
```

Look for method trace output showing which pattern matched or didn't match.

## Pattern Analysis Output

### Pattern Information

```
✓ Line 1: src/**
   Matches: 15 files
   Examples: src/server.js, src/handler.js, src/utils/helper.js
```

- **✓** or **⚠️** - Pattern used or unused
- **Line**: Line number in the config file
- **Matches**: Number of files matching this pattern
- **Examples**: Sample matching files (up to 3)

### Unused Patterns

```
⚠️  Unused Patterns (no files matched):
----------------------------------------------------------------------
   EXCLUDE - Line 3: build/**
   INCLUDE - Line 5: dist/**
```

**Why patterns might be unused:**

1. **No matching files exist** - Pattern is correct but no files match
2. **Pattern syntax error** - Typo or incorrect glob syntax
3. **Already excluded** - Files matched by .gitignore won't show up
4. **Wrong mode** - Pattern in wrong file (include vs ignore)

## Troubleshooting

### No Files Included in INCLUDE Mode

**Symptom**: All files excluded

**Cause**: No patterns in `.calculatorinclude` match any files

**Fix**:
```bash
# Check what patterns match
context-manager --trace-rules

# Add broader patterns
echo "**/*.js" >> .calculatorinclude
```

### Patterns Not Matching

**Symptom**: Pattern has 0 matches but should match files

**Common causes:**

1. **Case sensitivity** - Pattern is case-sensitive on Linux
2. **Path format** - Use forward slashes `/` not backslashes `\`
3. **Glob syntax** - `src/*.js` doesn't match subdirectories, use `src/**/*.js`
4. **Already excluded** - Files excluded by .gitignore won't match calculator patterns

### Files Excluded Unexpectedly

**Symptom**: File you want is excluded

**Debug steps:**

1. Run `--trace-rules` and find the file in output
2. Check the "Reason" field
3. If "Excluded by .gitignore" - add negation to .gitignore: `!filename`
4. If "EXCLUDE mode - Matched pattern" - remove from .calculatorignore
5. If "INCLUDE mode - No pattern matched" - add pattern to .calculatorinclude

## API Usage

### Programmatic Rule Tracing

```javascript
const { RuleTracer, GitIgnoreParser, MethodFilterParser } = require('@hakkisagdic/context-manager');

// Initialize parsers
const gitIgnoreParser = new GitIgnoreParser('.gitignore', '.calculatorignore', null);
const methodFilter = new MethodFilterParser('.methodinclude', null);

// Create tracer
const tracer = new RuleTracer(gitIgnoreParser, methodFilter);

// Trace a file
const trace = tracer.traceFile('/path/to/file.js', '/project/root');
console.log(trace);
// {
//   file: 'src/file.js',
//   included: true,
//   reason: 'No exclusion rules matched',
//   rule: null,
//   type: 'default'
// }

// Trace a method
const methodTrace = tracer.traceMethod('handleRequest', 'server.js');
tracer.printMethodTrace(methodTrace);

// Analyze all patterns
const files = [
    { relativePath: 'src/server.js' },
    { relativePath: 'test/test.js' }
];
const analysis = tracer.analyzePatterns(files);
tracer.printPatternAnalysis(analysis);
```

### Custom Trace Handling

```javascript
// Get trace without printing
const trace = tracer.traceFile(filePath, projectRoot);

// Custom handling
if (!trace.included && trace.type === 'calculator') {
    console.log(`${trace.file} excluded by: ${trace.rule.pattern}`);
}

// Batch analyze files
const traces = files.map(f => tracer.traceFile(f, root));
const excluded = traces.filter(t => !t.included);
console.log(`${excluded.length} files excluded`);
```

## Advanced Examples

### Debug Preset Filters

```bash
# See what a preset filters
context-manager --preset llm-explain --trace-rules
```

### Combine with Token Budget

```bash
# See which files are selected for token budget
context-manager --target-tokens 50000 --fit-strategy top-n --trace-rules
```

### Export Analysis

```bash
# Trace and save report
context-manager --trace-rules --save-report
```

The JSON report will include trace information for debugging.

## Pattern Best Practices

### 1. Start Broad, Then Narrow

```bash
# ❌ Too specific first
src/services/api/v1/handlers/*.js

# ✅ Start broad
src/**
# Then add excludes if needed
```

### 2. Use INCLUDE Mode for Focused Analysis

```bash
# .calculatorinclude - More predictable
src/**
lib/**
index.js
```

Versus:

```bash
# .calculatorignore - Everything EXCEPT these
test/**
docs/**
*.md
# ... easy to forget something
```

### 3. Order Patterns by Specificity

```bash
# .calculatorinclude
index.js           # Most specific
src/core/**        # Specific directory
src/**             # Broad directory
**/*.js            # Most broad
```

### 4. Comment Your Patterns

```bash
# .calculatorinclude

# Entry points
index.js
main.js

# Core application code
src/**

# Utility libraries
lib/utils/**
```

## Integration with Workflow

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for unused patterns
output=$(context-manager --trace-rules --quiet)
if echo "$output" | grep -q "Unused Patterns"; then
    echo "⚠️  Warning: Unused filter patterns detected"
    echo "$output" | grep -A 10 "Unused Patterns"
fi
```

### CI/CD Validation

```bash
# Validate filter patterns in CI
npm run analyze:validate

# .github/workflows/validate.yml
- name: Validate Filter Patterns
  run: |
    npm run context-manager -- --trace-rules | grep -q "⚠️  No files matched"
    if [ $? -eq 0 ]; then
      echo "Error: Some patterns match no files"
      exit 1
    fi
```

## Related Documentation

- [Preset System](PRESETS.md) - Pre-configured filter recipes
- [Token Budget Fitter](TOKEN_BUDGET_FITTER.md) - Automatic file selection
- [Method Filtering](../README.md#method-level-analysis) - Filter specific methods
- [GitIngest Format](GITINGEST_VERSION.md) - Single-file digest format

## Summary

The Rule Debugger is essential for:

- 🔍 **Understanding** - Why files/methods are included or excluded
- 🐛 **Debugging** - Pattern syntax and matching issues
- 🧹 **Cleanup** - Finding unused or redundant patterns
- ✅ **Validation** - Ensuring filters work as expected

Use `--trace-rules` whenever your filter rules aren't behaving as expected!
