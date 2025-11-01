# Token Budget Fitter

Automatically fit your codebase within token limits using intelligent strategies.

## Overview

The Token Budget Fitter solves a critical problem: **how to fit a large codebase into an LLM's context window**. Instead of manually selecting files, the fitter uses smart strategies to automatically choose the most important code that fits within your token budget.

## Features

- 🎯 **Automatic token fitting** - Specify a target, get optimal file selection
- 🧠 **5 intelligent strategies** - Different approaches for different needs
- 📊 **Importance scoring** - Ranks files by relevance (entry points, core code, etc.)
- 🔒 **Entry point preservation** - Always includes critical files like `index.js`
- 📉 **Detailed statistics** - See exactly what was included and excluded
- 🚀 **Fast execution** - Minimal overhead, works with large codebases

---

## Quick Start

### CLI Usage

```bash
# Auto-fit to 50k tokens (recommended)
context-manager --target-tokens 50000

# Use specific strategy
context-manager --target-tokens 100000 --fit-strategy shrink-docs

# Combine with presets
context-manager --preset review --target-tokens 80000

# Verbose output
context-manager --target-tokens 50000 -v
```

### Programmatic Usage

```javascript
const { TokenBudgetFitter, TokenCalculator } = require('@hakkisagdic/context-manager');

// Option 1: Via TokenCalculator
const calculator = new TokenCalculator('./src', {
  targetTokens: 50000,
  fitStrategy: 'auto'
});
calculator.run();

// Option 2: Direct use
const fitter = new TokenBudgetFitter(50000, {
  strategy: 'auto',
  preserveEntryPoints: true
});

const files = [ /* your file list */ ];
const result = fitter.fit(files);

console.log(`Selected ${result.files.length} files`);
console.log(`Total tokens: ${result.totalTokens}`);
console.log(`Reduction: ${result.reduction}%`);
```

---

## Strategies

### 1. `auto` (Recommended)

**Smart automatic selection**

Chooses the best strategy based on your codebase composition:
- If already fits → returns all files
- If 0-50% over → `shrink-docs`
- If 50-100% over → `balanced`
- If 100-200% over → `methods-only`
- If > 200% over → `top-n`

**Best for:** Most use cases, when you're unsure which strategy to use

```bash
context-manager --target-tokens 50000 --fit-strategy auto
```

---

### 2. `shrink-docs`

**Remove documentation first**

Separates docs (`.md`, `.txt`, `docs/`) from code, prioritizes code files.

**Algorithm:**
1. Separate docs from code
2. Include all code files
3. If code exceeds budget, use top-N on code
4. Add docs back if budget allows

**Best for:** Codebases with extensive documentation, when you need code over docs

```bash
context-manager --target-tokens 80000 --fit-strategy shrink-docs
```

**Example:**
```
Input: 100k tokens (70k code + 30k docs)
Target: 80k tokens
Output: 70k code + 10k most important docs
```

---

### 3. `methods-only`

**Extract methods, not full files**

Marks files for method-level extraction (requires re-analysis).

**Algorithm:**
1. Estimates 60% token reduction with method-level
2. Returns all files marked for method extraction
3. Requires `--method-level` flag

**Best for:** Extreme token budgets, when you need <50% of current size

```bash
context-manager --target-tokens 30000 --fit-strategy methods-only --method-level
```

**Estimated reduction:** 40-60% of original size

---

### 4. `top-n`

**Most important files only**

Selects N most important files that fit in budget.

**Importance Criteria:**
- Entry points (`index.js`, `main.js`, `app.js`) → +30 points
- Core directories (`src/`, `lib/`) → +15 points
- Server/handler files → +10 points
- Deep nesting → -2 points per level
- Very large files (>10k tokens) → -10 points
- Utility/helper files → -5 points

**Best for:** Extreme budgets, focusing on absolute essentials

```bash
context-manager --target-tokens 20000 --fit-strategy top-n
```

---

### 5. `balanced`

**Proportional selection from each directory**

Distributes token budget across directories proportionally.

**Algorithm:**
1. Group files by directory
2. Allocate budget proportionally to each directory
3. Select top files from each directory
4. Ensures representation from all parts of codebase

**Best for:** Large codebases, ensuring broad coverage

```bash
context-manager --target-tokens 100000 --fit-strategy balanced
```

---

## Output Format

### CLI Output

```
📊 Token Budget Fitting Summary
==================================================
🎯 Target: 50,000 tokens
📁 Original: 120 files, 185,000 tokens
✂️  Selected: 45 files, 49,500 tokens
📉 Reduction: 73.2%
🚫 Excluded: 75 files
🔧 Strategy: auto (shrink-docs)
📍 Preserved entry points: 3

✅ Successfully fit 45 files (49,500 tokens) within 50,000 target using auto (shrink-docs) strategy
```

### Programmatic Output

```javascript
{
  files: [...],              // Selected file objects
  totalTokens: 49500,        // Total tokens in selection
  excluded: 75,              // Number of excluded files
  strategy: 'auto (shrink-docs)',
  fits: true,                // Whether it fits in budget
  targetTokens: 50000,
  originalCount: 120,
  originalTokens: 185000,
  reduction: '73.2',         // Reduction percentage
  preservedEntryPoints: 3,   // Number of preserved entry points
  message: '✅ Successfully fit...'
}
```

---

## Strategy Selection Guide

| Codebase Size | Target Tokens | Recommended Strategy | Expected Result |
|---------------|---------------|---------------------|-----------------|
| 20k tokens | 50k | `auto` | All files included |
| 100k tokens | 80k | `shrink-docs` | Code + some docs |
| 150k tokens | 80k | `balanced` | Representative sample |
| 200k tokens | 60k | `methods-only` | Methods only |
| 300k tokens | 20k | `top-n` | Entry points + core |

---

## Examples

### Example 1: Standard LLM Context

**Goal:** Fit 180k token codebase into ChatGPT context (128k)

```bash
context-manager --target-tokens 120000 --fit-strategy auto
```

**Result:**
- Strategy chosen: `shrink-docs`
- Selected: 95/120 files
- Total: 118k tokens
- Excluded: 25 files (mostly docs)
- Fits: ✅ Yes

---

### Example 2: Minimal Context for Quick Questions

**Goal:** Ultra-compact context for simple questions

```bash
context-manager --target-tokens 20000 --fit-strategy top-n
```

**Result:**
- Strategy: `top-n`
- Selected: 12 most important files
- Total: 19.8k tokens
- Files: index.js, src/server.js, src/handler.js, lib/core.js, etc.
- Fits: ✅ Yes

---

### Example 3: Pair Programming Session

**Goal:** Balanced view of codebase for development discussion

```bash
context-manager --target-tokens 80000 --fit-strategy balanced
```

**Result:**
- Strategy: `balanced`
- Selected: 65 files from all directories
- Total: 79.5k tokens
- Coverage: All major directories represented
- Fits: ✅ Yes

---

### Example 4: Security Audit

**Goal:** Security-relevant code within budget

```bash
context-manager --preset security-audit --target-tokens 100000
```

**Result:**
- Preset filters applied first (auth*, security*, validate* files)
- Then token budget fitting
- Selected: 45 security-relevant files
- Total: 98k tokens
- Fits: ✅ Yes

---

## Advanced Features

### Entry Point Preservation

By default, entry points are always included:

```javascript
const fitter = new TokenBudgetFitter(50000, {
  preserveEntryPoints: true  // default
});
```

**Preserved files:**
- `index.js`, `index.ts`
- `main.js`, `main.ts`
- `app.js`, `app.ts`

### Custom Importance Scoring

Extend `FitStrategies.calculateImportance()` for custom scoring:

```javascript
const FitStrategies = require('./lib/optimizers/fit-strategies');

// Override importance calculation
const originalCalculate = FitStrategies.calculateImportance;
FitStrategies.calculateImportance = function(file) {
  let score = originalCalculate.call(this, file);

  // Add custom rules
  if (file.relativePath.includes('critical/')) {
    score += 50;
  }

  return score;
};
```

---

## Strategy Recommendation API

Get automatic strategy recommendation:

```javascript
const TokenBudgetFitter = require('./lib/optimizers/token-budget-fitter');

const files = [...];  // your files
const targetTokens = 50000;

const recommendation = TokenBudgetFitter.recommendStrategy(files, targetTokens);
console.log(`Recommended: ${recommendation}`);

// Use recommended strategy
const fitter = new TokenBudgetFitter(targetTokens, {
  strategy: recommendation
});
```

**Recommendation logic:**
```javascript
const ratio = currentTokens / targetTokens;

if (ratio <= 1.0) return 'none (already fits)';
if (ratio <= 1.5) return 'shrink-docs';
if (ratio <= 2.0) return 'balanced';
if (ratio <= 3.0) return 'methods-only';
return 'top-n';
```

---

## File Analysis

Analyze file distribution before fitting:

```javascript
const TokenBudgetFitter = require('./lib/optimizers/token-budget-fitter');

const files = [...];
const stats = TokenBudgetFitter.analyzeFiles(files);

console.log(`Total files: ${stats.totalFiles}`);
console.log(`Total tokens: ${stats.totalTokens}`);
console.log('By extension:', stats.byExtension);
console.log('By directory:', stats.byDirectory);
console.log('Largest files:', stats.largestFiles.slice(0, 5));
```

---

## Best Practices

### 1. Start with `auto`

Let the fitter choose the best strategy:

```bash
context-manager --target-tokens 50000 --fit-strategy auto
```

### 2. Use `--verbose` to understand decisions

See which files were excluded and why:

```bash
context-manager --target-tokens 50000 -v
```

### 3. Combine with presets

Get preset benefits + token fitting:

```bash
context-manager --preset review --target-tokens 80000
```

### 4. Preserve entry points

Always keep critical entry points (enabled by default):

```javascript
const fitter = new TokenBudgetFitter(50000, {
  preserveEntryPoints: true
});
```

### 5. Test different strategies

Try multiple strategies to see what works best:

```bash
context-manager --target-tokens 50000 --fit-strategy shrink-docs
context-manager --target-tokens 50000 --fit-strategy balanced
context-manager --target-tokens 50000 --fit-strategy top-n
```

---

## Troubleshooting

### "Entry points alone exceed target"

**Problem:** Entry points consume more tokens than your budget

**Solution:**
- Increase target tokens
- Disable entry point preservation:
  ```javascript
  const fitter = new TokenBudgetFitter(targetTokens, {
    preserveEntryPoints: false
  });
  ```
- Use method-level extraction

### "Could not fit within budget"

**Problem:** Even aggressive strategies can't fit

**Solution:**
- Use `methods-only` strategy
- Enable method-level analysis: `--method-level`
- Reduce target tokens and accept partial coverage
- Use multiple analysis runs for different parts

### "Too many files excluded"

**Problem:** Losing important code

**Solution:**
- Increase target tokens
- Use `balanced` strategy for better coverage
- Combine with `.calculatorinclude` to prioritize specific files
- Check excluded files with `--verbose`

---

## Performance

- **Overhead:** < 10ms for fitting logic
- **Memory:** Minimal (scores calculated on-demand)
- **Scalability:** Works with 1000+ files
- **Caching:** File analysis cached within run

---

## API Reference

### TokenBudgetFitter

```javascript
class TokenBudgetFitter {
  constructor(targetTokens, options = {})
  fit(files)
  printSummary(result)
  static recommendStrategy(files, targetTokens)
  static analyzeFiles(files)
}
```

### FitStrategies

```javascript
class FitStrategies {
  static auto(files, targetTokens)
  static shrinkDocs(files, targetTokens)
  static methodsOnly(files, targetTokens)
  static topN(files, targetTokens)
  static balanced(files, targetTokens)
  static calculateImportance(file)
  static calculateTotal(files)
  static sortByTokens(files)
}
```

---

## Related Documentation

- [Preset System](../lib/presets/README.md) - Pre-configured analysis recipes
- [Future Roadmap](future_planned_steps.md) - Upcoming features
- [Main README](../README.md) - General usage guide

---

*Last updated: 2025-10-31*
*Version: 2.1.0*
