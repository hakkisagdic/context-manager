# Commit Message: Token Budget Fitter

```
feat: Add Token Budget Fitter with 5 intelligent strategies

Implements automatic token budget fitting to solve the critical problem of fitting large codebases into LLM context windows. Uses intelligent file selection strategies to maximize value within token limits.

Key Features:
• 5 fitting strategies: auto, shrink-docs, methods-only, top-n, balanced
• Automatic strategy selection based on codebase composition
• Importance scoring (entry points, core code, server files prioritized)
• Entry point preservation (index.js, main.js always included)
• CLI integration: --target-tokens <number> --fit-strategy <strategy>
• Programmatic API via TokenBudgetFitter and FitStrategies classes
• Detailed statistics and summaries

Strategies:
• auto: Smart automatic selection (recommended)
• shrink-docs: Remove docs first, prioritize code
• methods-only: Extract methods for 60% reduction
• top-n: Select N most important files
• balanced: Proportional selection across directories

Usage:
  context-manager --target-tokens 50000
  context-manager --target-tokens 100000 --fit-strategy shrink-docs
  context-manager --preset review --target-tokens 80000

Programmatic:
  const fitter = new TokenBudgetFitter(50000, { strategy: 'auto' });
  const result = fitter.fit(files);
  console.log(`Fit ${result.files.length} files in ${result.totalTokens} tokens`);

Implementation:
• lib/optimizers/token-budget-fitter.js - Core fitter (230 lines)
• lib/optimizers/fit-strategies.js - 5 strategies (320 lines)
• Integrated with TokenCalculator.run()
• CLI flags: --target-tokens, --fit-strategy

Tests: 18 new tests, 100% pass rate
Total test suite: 91 tests passing

Files changed:
  Added:
    lib/optimizers/token-budget-fitter.js
    lib/optimizers/fit-strategies.js
    test/test-token-budget.js
    docs/TOKEN_BUDGET_FITTER.md

  Modified:
    lib/analyzers/token-calculator.js (added applyTokenBudget method)
    context-manager.js (added CLI support)
    index.js (exported new classes)
    package.json (added test:token-budget script)

Breaking changes: None
Backward compatible: Yes

Solves: Automatic token budget fitting
Enables: LLM context optimization, smart file selection
Next: Rule debugger, delta-aware caching, REST API
```

## Short Version (for git commit)

```
feat: add token budget fitter with 5 strategies

- Auto-fit codebases to token limits using intelligent strategies
- 5 strategies: auto, shrink-docs, methods-only, top-n, balanced
- CLI: --target-tokens <number> --fit-strategy <strategy>
- Importance scoring prioritizes entry points and core code
- 18 new tests, 91 total tests passing
- Fully backward compatible
```

## One-liner

```
feat: add token budget fitter to automatically fit codebases within LLM context limits using 5 intelligent strategies (auto, shrink-docs, methods-only, top-n, balanced)
```
