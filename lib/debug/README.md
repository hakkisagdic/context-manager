# Rule Tracer

The Rule Tracer is a powerful debugging tool that helps you understand why files and methods are included or excluded from your analysis. It provides detailed tracing of filter rule decisions and pattern matching.

## Overview

When working with complex filter configurations (`.contextignore`, `.contextinclude`, `.methodignore`, `.methodinclude`), it can be difficult to understand why certain files or methods are included or excluded. The Rule Tracer solves this by:

- **Tracking every decision** - Records why each file/method was included or excluded
- **Analyzing patterns** - Shows which patterns matched and how often
- **Identifying unused rules** - Highlights patterns that never matched
- **Explaining priorities** - Shows which rule source took precedence

## Features

- 🔍 **File-level tracing** - See why each file was included/excluded
- 🎯 **Method-level tracing** - Debug method filter configurations
- 📊 **Pattern analysis** - Match counts, examples, unused patterns
- 🎨 **Formatted reports** - Easy-to-read terminal output
- 💾 **JSON export** - Export trace data for further analysis
- ⚡ **Performance optimized** - Minimal overhead (< 10%)

## CLI Usage

### Basic Tracing

```bash
# Enable rule tracing
context-manager --trace-rules

# With other options
context-manager --trace-rules --cli
context-manager --trace-rules --preset review
context-manager --trace-rules --target-tokens 100k
```

### Combined with Other Features

```bash
# Trace with preset
context-manager --preset security-audit --trace-rules

# Trace with token budget
context-manager --target-tokens 100k --trace-rules

# Trace changed files
context-manager --changed-since main --trace-rules

# Trace with method-level analysis
context-manager -m --trace-rules
```

## Programmatic Usage

```javascript
import { RuleTracer } from '@hakkisagdic/context-manager';

// Create and enable tracer
const tracer = new RuleTracer();
tracer.enable();

// Record file decision
tracer.recordFileDecision('src/index.js', {
  included: true,
  reason: 'Matched include pattern',
  rule: 'src/**/*.js',
  ruleSource: '.contextinclude',
  mode: 'INCLUDE',
  priority: 1
});

// Record method decision
tracer.recordMethodDecision('src/server.js', 'handleRequest', {
  included: true,
  reason: 'Matched method include pattern',
  rule: '*Handler',
  ruleSource: '.methodinclude',
  mode: 'INCLUDE'
});

// Get trace results
const trace = tracer.getTrace();
console.log('Files analyzed:', trace.summary.totalFiles);
console.log('Files included:', trace.summary.includedFiles);
console.log('Files excluded:', trace.summary.excludedFiles);

// Generate report
const report = tracer.generateReport();
console.log(report);

// Export as JSON
const json = tracer.exportJSON();
fs.writeFileSync('trace.json', JSON.stringify(json, null, 2));
```

## Trace Report Format

### Report Structure

```
🔍 RULE TRACE REPORT
═══════════════════════════════════════════════════════════════════

📊 Summary:
   Total Files: 64
   ✅ Included: 45
   ❌ Excluded: 19
   Total Methods: 234
   ✅ Included: 189
   ❌ Excluded: 45

📁 File Decisions (showing first 20):
────────────────────────────────────────────────────────────────────
✅ src/index.js: INCLUDED
   Reason: Matched include pattern
   Rule: src/**/*.js (.contextinclude)
   Mode: INCLUDE

❌ test/test.js: EXCLUDED
   Reason: Matched exclude pattern
   Rule: **/*.test.js (.contextignore)
   Mode: EXCLUDE

🔍 Pattern Analysis:
────────────────────────────────────────────────────────────────────
✓ src/**/*.js (.contextinclude)
   Matches: 42
   Examples:
     - src/index.js
     - src/server.js
     - src/utils/helper.js
     - src/api/handler.js
     - src/core/manager.js

⚠️  legacy/** (.contextignore)
   Matches: 0 (UNUSED)

═══════════════════════════════════════════════════════════════════
```

## Understanding Decisions

### File Decision Structure

```javascript
{
  included: true,              // Was the file included?
  reason: 'Matched include pattern',  // Why?
  rule: 'src/**/*.js',        // Which pattern matched?
  ruleSource: '.contextinclude',  // Which file?
  mode: 'INCLUDE',            // INCLUDE or EXCLUDE mode?
  priority: 1                 // Rule priority (1=highest)
}
```

### Decision Icons

- ✅ **Included** - File/method was included in analysis
- ❌ **Excluded** - File/method was excluded from analysis
- ✓ **Pattern matched** - Pattern has matches
- ⚠️ **Pattern unused** - Pattern never matched anything

### Rule Sources

1. **`.gitignore`** - Git ignore rules (always respected)
2. **`.contextinclude`** - Include mode (highest priority)
3. **`.contextignore`** - Exclude mode (fallback)
4. **`.methodinclude`** - Method include patterns
5. **`.methodignore`** - Method exclude patterns

### Mode Explanation

**INCLUDE Mode:**
- Active when `.contextinclude` exists
- Only files matching include patterns are included
- `.contextignore` is ignored in this mode

**EXCLUDE Mode:**
- Active when only `.contextignore` exists
- All files are included except those matching exclude patterns
- Default mode if no include file exists

## Pattern Analysis

### Pattern Statistics

For each pattern, the tracer shows:

```
✓ src/**/*.js (.contextinclude)
   Matches: 42
   Examples:
     - src/index.js
     - src/server.js
     - src/utils/helper.js
     - src/api/handler.js
     - src/core/manager.js
```

- **Pattern**: The glob pattern
- **Source**: Which file it came from
- **Matches**: How many files matched
- **Examples**: Up to 5 example matches

### Unused Patterns

```
⚠️  legacy/** (.contextignore)
   Matches: 0 (UNUSED)
```

Unused patterns indicate:
- Pattern never matched any files
- Possible typo in pattern
- Files don't exist in project
- Pattern is too specific

## Common Use Cases

### 1. Debug Why File is Excluded

**Problem:** Expected file is missing from analysis

**Solution:**
```bash
context-manager --trace-rules | grep "myfile.js"
```

**Output:**
```
❌ src/myfile.js: EXCLUDED
   Reason: Matched exclude pattern
   Rule: **/*.js (.contextignore)
   Mode: EXCLUDE
```

**Fix:** Remove or modify the exclude pattern

### 2. Debug Include/Exclude Mode

**Problem:** Not sure which mode is active

**Solution:**
```bash
context-manager --trace-rules
```

**Output:**
```
📊 Summary:
   Mode: INCLUDE (using .contextinclude)
```

**Understanding:**
- If `.contextinclude` exists → INCLUDE mode
- If only `.contextignore` exists → EXCLUDE mode

### 3. Find Unused Patterns

**Problem:** Want to clean up filter files

**Solution:**
```bash
context-manager --trace-rules | grep "UNUSED"
```

**Output:**
```
⚠️  old-code/** (.contextignore)
   Matches: 0 (UNUSED)

⚠️  deprecated/** (.contextignore)
   Matches: 0 (UNUSED)
```

**Action:** Remove unused patterns from filter files

### 4. Debug Method Filtering

**Problem:** Methods not being included as expected

**Solution:**
```bash
context-manager -m --trace-rules
```

**Output:**
```
📊 Summary:
   Total Methods: 234
   ✅ Included: 189
   ❌ Excluded: 45

Method Decisions:
✅ src/server.js:handleRequest: INCLUDED
   Reason: Matched method include pattern
   Rule: *Handler (.methodinclude)

❌ src/server.js:debugLog: EXCLUDED
   Reason: Matched method exclude pattern
   Rule: *debug* (.methodignore)
```

### 5. Verify Preset Filters

**Problem:** Want to see what preset filters do

**Solution:**
```bash
context-manager --preset review --trace-rules
```

**Output:**
```
✅ Applied preset: review
   Temporary files created: 4

📁 File Decisions:
✅ src/api.js: INCLUDED
   Reason: Matched include pattern
   Rule: src/**/*.js (.contextinclude-review)
   Mode: INCLUDE
```

## Trace Data Structure

### TraceResult

```javascript
{
  files: Map<string, Decision>,     // File path → Decision
  methods: Map<string, Map<string, Decision>>,  // File → Method → Decision
  patterns: PatternAnalysis[],      // Pattern statistics
  summary: {
    totalFiles: 64,
    includedFiles: 45,
    excludedFiles: 19,
    totalMethods: 234,
    includedMethods: 189,
    excludedMethods: 45
  }
}
```

### PatternAnalysis

```javascript
{
  pattern: 'src/**/*.js',           // The pattern
  source: '.contextinclude',        // Source file
  matchCount: 42,                   // Number of matches
  examples: [                       // Example matches (max 5)
    'src/index.js',
    'src/server.js',
    'src/utils/helper.js'
  ],
  unused: false                     // Was pattern used?
}
```

## JSON Export

Export trace data for further analysis:

```javascript
const tracer = new RuleTracer();
tracer.enable();

// ... perform analysis ...

// Export to JSON
const json = tracer.exportJSON();
fs.writeFileSync('trace.json', JSON.stringify(json, null, 2));
```

**JSON Structure:**
```json
{
  "summary": {
    "totalFiles": 64,
    "includedFiles": 45,
    "excludedFiles": 19
  },
  "files": [
    {
      "file": "src/index.js",
      "included": true,
      "reason": "Matched include pattern",
      "rule": "src/**/*.js",
      "ruleSource": ".contextinclude"
    }
  ],
  "methods": [
    {
      "file": "src/server.js",
      "methods": [
        {
          "method": "handleRequest",
          "included": true,
          "reason": "Matched method pattern",
          "rule": "*Handler"
        }
      ]
    }
  ],
  "patterns": [
    {
      "pattern": "src/**/*.js",
      "source": ".contextinclude",
      "matchCount": 42,
      "examples": ["src/index.js", "src/server.js"],
      "unused": false
    }
  ]
}
```

## Advanced Features

### Query Specific Decisions

```javascript
// Get decision for specific file
const decision = tracer.getFileDecision('src/index.js');
console.log('Included:', decision.included);
console.log('Reason:', decision.reason);

// Get method decisions for file
const methods = tracer.getMethodDecisions('src/server.js');
for (const [method, decision] of methods.entries()) {
  console.log(`${method}: ${decision.included ? 'INCLUDED' : 'EXCLUDED'}`);
}

// Get pattern statistics
const stats = tracer.getPatternStats('src/**/*.js');
console.log('Matches:', stats.matchCount);
console.log('Examples:', stats.examples);
```

### Clear Trace Data

```javascript
// Clear all trace data
tracer.clear();

// Start fresh tracing
tracer.enable();
```

### Disable Tracing

```javascript
// Disable tracing (stops recording)
tracer.disable();

// Check if enabled
if (tracer.isEnabled()) {
  console.log('Tracing is active');
}
```

## Performance Considerations

### Overhead

- **Memory:** ~1-2 MB for 1000 files
- **CPU:** < 10% overhead during analysis
- **Storage:** Map-based for O(1) lookups

### Optimization Tips

1. **Disable when not needed** - Only enable for debugging
2. **Limit example collection** - Default max 5 examples per pattern
3. **Clear periodically** - Use `tracer.clear()` for long-running processes
4. **Export selectively** - Only export what you need

## Troubleshooting

### No trace output

**Problem:** `--trace-rules` flag not showing output

**Solution:**
- Ensure flag is spelled correctly
- Check that analysis completed successfully
- Verify tracer was enabled before analysis

### Trace report too large

**Problem:** Report is overwhelming with too many files

**Solution:**
- Report shows first 20 files by default
- Use `grep` to filter specific files
- Export to JSON and analyze programmatically

### Pattern not showing in analysis

**Problem:** Expected pattern not in pattern analysis

**Solution:**
- Pattern may not have matched any files
- Check pattern syntax (glob format)
- Verify pattern is in correct filter file

### Decision reason unclear

**Problem:** Decision reason is vague

**Solution:**
- Check rule source to see which file
- Review mode (INCLUDE vs EXCLUDE)
- Check priority to understand precedence

## Tips and Best Practices

1. **Use for debugging only** - Don't enable in production
2. **Start with file-level** - Debug files before methods
3. **Check unused patterns** - Clean up filter files regularly
4. **Export for analysis** - Use JSON export for complex debugging
5. **Combine with presets** - Trace preset behavior
6. **Review examples** - Pattern examples show actual matches
7. **Understand modes** - Know if INCLUDE or EXCLUDE mode is active
8. **Check priorities** - Higher priority rules win

## Examples

### Example 1: Debug Missing Files

```bash
$ context-manager --trace-rules | grep "important.js"

❌ src/important.js: EXCLUDED
   Reason: Matched exclude pattern
   Rule: **/*.js (.contextignore)
   Mode: EXCLUDE
```

**Fix:** Remove `**/*.js` from `.contextignore` or add to `.contextinclude`

### Example 2: Find Unused Patterns

```bash
$ context-manager --trace-rules | grep "UNUSED"

⚠️  legacy/** (.contextignore)
   Matches: 0 (UNUSED)

⚠️  old-code/** (.contextignore)
   Matches: 0 (UNUSED)
```

**Action:** Remove unused patterns from `.contextignore`

### Example 3: Verify Preset Behavior

```bash
$ context-manager --preset security-audit --trace-rules

✅ Applied preset: security-audit

📁 File Decisions:
✅ src/auth.js: INCLUDED
   Reason: Matched include pattern
   Rule: **/*auth*.js (.contextinclude-security-audit)

✅ src/crypto.js: INCLUDED
   Reason: Matched include pattern
   Rule: **/*crypto*.js (.contextinclude-security-audit)
```

### Example 4: Debug Method Filtering

```bash
$ context-manager -m --trace-rules

Method Decisions:
✅ src/api.js:handleRequest: INCLUDED
   Reason: Matched method pattern
   Rule: *Handler (.methodinclude)

❌ src/api.js:_privateMethod: EXCLUDED
   Reason: Matched method pattern
   Rule: _* (.methodignore)
```

## Version History

- **v3.1.0**: Initial release
  - File-level tracing
  - Method-level tracing
  - Pattern analysis
  - JSON export
  - CLI integration

## See Also

- [Preset System](../presets/README.md) - Predefined configurations
- [Token Budget Fitter](../optimizers/README.md) - Optimize token usage
- [Main README](../../README.md) - Context Manager documentation
