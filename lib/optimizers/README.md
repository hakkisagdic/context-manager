# Token Budget Fitter

The Token Budget Fitter intelligently reduces your codebase analysis to fit within specific token budgets, ensuring compatibility with LLM context windows while preserving the most important code.

## Overview

Modern LLMs have context window limits (e.g., Claude Sonnet 4.5: 200k tokens, GPT-4: 128k tokens). The Token Budget Fitter helps you:

- **Fit large codebases** into LLM context windows
- **Preserve important files** (entry points, core logic)
- **Apply intelligent strategies** for token reduction
- **Generate detailed reports** showing what was included/excluded

## Features

- 🎯 **5 Fitting Strategies** - Auto, shrink-docs, methods-only, top-n, balanced
- 📊 **Importance Scoring** - Intelligent file prioritization
- 🔒 **Entry Point Preservation** - Keep critical files (index.js, main.py, etc.)
- 📈 **Detailed Reports** - See exactly what was included and why
- 💡 **Smart Recommendations** - Get suggestions for better results

## CLI Usage

### Basic Token Budget

```bash
# Fit to 100,000 tokens (auto strategy)
context-manager --target-tokens 100000

# Fit to 100k tokens (shorthand)
context-manager --target-tokens 100k

# Fit to 1.5 million tokens
context-manager --target-tokens 1.5M
```

### Specify Strategy

```bash
# Auto-select best strategy
context-manager --target-tokens 100k --fit-strategy auto

# Remove documentation first
context-manager --target-tokens 100k --fit-strategy shrink-docs

# Extract methods only
context-manager --target-tokens 50k --fit-strategy methods-only

# Select top N most important files
context-manager --target-tokens 80k --fit-strategy top-n

# Balance coverage vs size
context-manager --target-tokens 100k --fit-strategy balanced
```

### Combined with Other Features

```bash
# With preset
context-manager --preset review --target-tokens 80k

# With rule tracing
context-manager --target-tokens 100k --trace-rules

# With specific LLM
context-manager --target-model claude-sonnet-4.5 --target-tokens 200k
```

## Programmatic Usage

```javascript
import { TokenBudgetFitter } from '@hakkisagdic/context-manager';

// Create fitter
const fitter = new TokenBudgetFitter(100000, 'auto');

// Fit files to budget
const result = fitter.fitToWindow(files, {
  preserveEntryPoints: true,
  priorityPatterns: ['src/core/**', 'lib/api/**']
});

console.log(`Fit ${result.files.length} files within budget`);
console.log(`Reduction: ${result.reductionPercent.toFixed(1)}%`);
console.log(`Strategy used: ${result.strategy}`);

// Generate report
const report = fitter.generateReport(result);
console.log(report.summary);

// Check recommendations
if (report.recommendations.length > 0) {
  console.log('Recommendations:');
  report.recommendations.forEach(rec => console.log(`  • ${rec}`));
}
```

## Fitting Strategies

### 1. Auto Strategy (Recommended)

**When to use:** Default choice, automatically selects best strategy

**How it works:**
1. Tries `shrink-docs` if lots of documentation
2. Falls back to `balanced` if moderately over budget
3. Uses `methods-only` if significantly over budget
4. Uses `top-n` as last resort

```bash
context-manager --target-tokens 100k --fit-strategy auto
```

**Example output:**
```
✅ Successfully fit 45 files within 100,000 token budget
   Strategy: shrink-docs
   Tokens: 98,450 / 100,000 (perfect fit)
   Reduction: 82,550 tokens (45.6%)
   Excluded: 19 files
   Entry points preserved: 3
```

### 2. Shrink-Docs Strategy

**When to use:** When you have lots of documentation files

**How it works:**
1. Separates documentation files (.md, docs/, README, etc.)
2. Includes all code files first
3. Adds documentation files until budget is reached
4. Falls back to balanced strategy if code alone doesn't fit

```bash
context-manager --target-tokens 100k --fit-strategy shrink-docs
```

**Best for:**
- Projects with extensive documentation
- When code is more important than docs
- Initial analysis of new projects

### 3. Methods-Only Strategy

**When to use:** When you need maximum compression

**How it works:**
1. Extracts only method signatures and bodies
2. Excludes full file content
3. Estimates ~60% token reduction per file
4. Sorts by importance and includes until budget met

```bash
context-manager --target-tokens 50k --fit-strategy methods-only
```

**Best for:**
- Very tight token budgets
- Understanding code structure
- API surface analysis
- Quick code reviews

**Note:** Files are marked with `methodsOnly: true` flag

### 4. Top-N Strategy

**When to use:** When you want only the most important files

**How it works:**
1. Calculates importance score for each file
2. Sorts by importance (descending)
3. Includes files until budget is reached
4. Stops when budget would be exceeded

```bash
context-manager --target-tokens 80k --fit-strategy top-n
```

**Best for:**
- Focusing on core functionality
- Entry point analysis
- Critical path identification
- Minimal context needs

### 5. Balanced Strategy

**When to use:** When you want good coverage with reasonable size

**How it works:**
1. Calculates efficiency score (importance / tokens)
2. Includes high-efficiency files first
3. Attempts to swap low-efficiency files for entry points
4. Balances coverage vs token count

```bash
context-manager --target-tokens 100k --fit-strategy balanced
```

**Best for:**
- General purpose analysis
- Good coverage of codebase
- When you want representative sample
- Balanced token usage

## Importance Scoring

Files are scored 0-100 based on multiple factors:

### Base Score: 50 points

### Bonuses:
- **Entry point** (+30): index.js, main.py, app.js, etc.
- **Short path** (+10): Fewer directory levels
- **Core directories** (+15): `/core/` directory
- **Important directories** (+10): `src/`, `lib/`, `/api/`
- **File extensions** (+5): .js, .ts files
- **Priority patterns** (+20): Custom patterns from options

### Penalties:
- **Test files** (-20): `/test/`, `*.test.js`
- **Documentation** (-15): `/docs/`, `*.md`
- **Examples** (-10): `/examples/`

### Example Scores:
```
src/index.js           → 95 (entry point + short path + src/)
src/core/api.js        → 85 (core + src/ + .js)
lib/utils/helper.js    → 70 (lib/ + .js + medium path)
docs/README.md         → 35 (docs penalty + .md penalty)
test/unit/api.test.js  → 30 (test penalty + long path)
```

## Fit Result Structure

```javascript
{
  files: [...],              // Files that fit within budget
  totalTokens: 98450,        // Total tokens after fitting
  originalTokens: 181000,    // Original token count
  reduction: 82550,          // Token reduction amount
  reductionPercent: 45.6,    // Reduction percentage
  strategy: 'shrink-docs',   // Strategy used
  excluded: [...],           // Files that were excluded
  metadata: {
    entryPointsPreserved: 3,
    filesIncluded: 45,
    filesExcluded: 19,
    averageImportance: 72.3
  }
}
```

## Fit Report

```javascript
{
  summary: "✅ Successfully fit 45 files within 100,000 token budget...",
  details: {
    strategy: 'shrink-docs',
    targetTokens: 100000,
    actualTokens: 98450,
    fit: 'perfect',          // 'perfect', 'good', or 'tight'
    filesIncluded: 45,
    filesExcluded: 19,
    reduction: 82550,
    reductionPercent: 45.6
  },
  recommendations: [
    'Consider increasing token budget for better coverage',
    'Try "methods-only" strategy for more aggressive reduction'
  ]
}
```

## Fit Quality Levels

- **Perfect** (≤80% utilization): Plenty of room, excellent fit
- **Good** (80-95% utilization): Good fit, some room left
- **Tight** (95-100% utilization): Very tight fit, consider increasing budget

## Advanced Options

### Preserve Entry Points

```javascript
const result = fitter.fitToWindow(files, {
  preserveEntryPoints: true  // Default: true
});
```

Entry points are always preserved, even if slightly over budget (up to 10% overage).

### Priority Patterns

```javascript
const result = fitter.fitToWindow(files, {
  priorityPatterns: [
    'src/core/**',
    'lib/api/**',
    '**/index.js'
  ]
});
```

Files matching priority patterns get +20 importance bonus.

### Min/Max Files

```javascript
const result = fitter.fitToWindow(files, {
  minFiles: 10,   // Ensure at least 10 files
  maxFiles: 100   // Limit to 100 files max
});
```

## Common Use Cases

### 1. Fit to Claude Sonnet 4.5 (200k tokens)

```bash
context-manager --target-model claude-sonnet-4.5 --target-tokens 200k
```

### 2. Fit to GPT-4 (128k tokens)

```bash
context-manager --target-model gpt-4-turbo --target-tokens 128k
```

### 3. Ultra-compact for quick analysis

```bash
context-manager --target-tokens 50k --fit-strategy methods-only
```

### 4. Balanced coverage

```bash
context-manager --target-tokens 100k --fit-strategy balanced
```

### 5. Focus on core files

```bash
context-manager --target-tokens 80k --fit-strategy top-n
```

## Error Handling

### Impossible Fit

```bash
❌ Cannot fit within 10,000 tokens. Minimum required: 45,000
```

**Solution:** Increase token budget or use more aggressive strategy

### Token Budget Error

```bash
❌ Token budget fitting failed: Invalid strategy "invalid"
   Continuing with original file list...
```

**Solution:** Use valid strategy: auto, shrink-docs, methods-only, top-n, balanced

## Tips and Best Practices

1. **Start with auto strategy** - Let the system choose the best approach
2. **Use presets** - Combine with presets for optimal results
3. **Check fit quality** - Aim for "perfect" or "good" fit
4. **Review excluded files** - Use `--trace-rules` to see what was excluded
5. **Adjust budget** - If fit is too tight, increase token budget
6. **Use methods-only sparingly** - Only when absolutely necessary
7. **Preserve entry points** - Always keep this enabled (default)
8. **Monitor recommendations** - Follow suggestions in fit report

## Examples

### Example 1: Code Review with Budget

```bash
# Review changed files, fit to 80k tokens
context-manager --preset review --changed-since main --target-tokens 80k

# Output:
# ✅ Successfully fit 23 files within 80,000 token budget
#    Strategy: balanced
#    Tokens: 78,450 / 80,000 (good fit)
#    Reduction: 45,230 tokens (36.6%)
#    Excluded: 12 files
```

### Example 2: LLM Explain with Tight Budget

```bash
# Ultra-compact context for AI
context-manager --preset llm-explain --target-tokens 50k --fit-strategy methods-only

# Output:
# ✅ Successfully fit 67 files within 50,000 token budget
#    Strategy: methods-only
#    Tokens: 49,850 / 50,000 (tight fit)
#    Reduction: 131,150 tokens (72.5%)
#    Excluded: 0 files (all included as methods-only)
```

### Example 3: Security Audit with Priority

```bash
# Focus on security files
context-manager --preset security-audit --target-tokens 100k --fit-strategy top-n

# Output:
# ✅ Successfully fit 34 files within 100,000 token budget
#    Strategy: top-n
#    Tokens: 98,230 / 100,000 (perfect fit)
#    Entry points preserved: 2
```

## Troubleshooting

### Budget too tight

**Problem:** Can't fit minimum required files

**Solution:**
- Increase token budget
- Use more aggressive strategy (methods-only)
- Use preset with fewer files (minimal)
- Combine with better filters

### Too many files excluded

**Problem:** Important files are being excluded

**Solution:**
- Increase token budget
- Use priority patterns for important files
- Check importance scores with `--trace-rules`
- Use balanced strategy instead of top-n

### Fit quality is "tight"

**Problem:** Using 95-100% of budget

**Solution:**
- Increase budget by 10-20%
- Use more aggressive strategy
- Review excluded files for unnecessary inclusions

### Strategy not working as expected

**Problem:** Wrong strategy being selected

**Solution:**
- Specify strategy explicitly instead of auto
- Check file composition (docs vs code ratio)
- Use `--trace-rules` to understand decisions

## Performance

- **Sorting:** O(n log n) where n = number of files
- **Importance calculation:** O(n) - cached per file
- **Strategy application:** O(n) - single pass
- **Typical performance:** < 5 seconds for 1000 files

## Version History

- **v3.1.0**: Initial release
  - 5 fitting strategies
  - Importance scoring algorithm
  - Entry point preservation
  - Detailed fit reports
  - CLI integration

## See Also

- [Preset System](../presets/README.md) - Predefined configurations
- [Rule Tracer](../debug/README.md) - Debug filter rules
- [Main README](../../README.md) - Context Manager documentation
