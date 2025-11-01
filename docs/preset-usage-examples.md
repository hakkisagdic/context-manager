# Preset Usage Examples

Quick reference guide for using presets in context-manager.

feat: Add preset system for recipe-based analysis workflows

Implements a comprehensive preset system with 8 pre-configured analysis recipes for common use cases. Presets eliminate manual configuration and provide optimized token budgets for different workflows.

Key Features:
• 8 presets: default, review, llm-explain, pair-program, security-audit, documentation, minimal, full
• CLI flags: --preset <name>, --list-presets, --preset-info <name>
• Token-optimized configurations (20k-150k ranges)
• Method-level filtering per preset
• Programmatic API via PresetManager class

Popular presets:
• llm-explain: Ultra-compact (50k tokens) for ChatGPT/Claude context
• review: Code review focus (100k tokens) with auto-digest generation
• security-audit: Security-focused analysis (120k tokens)

Usage:
  context-manager --preset llm-explain
  context-manager --list-presets

Fully backward compatible. No breaking changes.

Tests: 14 new tests, 100% pass rate
Docs: Complete preset documentation and usage examples
TL;DR: Adds preset recipes (like "llm-explain", "review", "security-audit") so users don't need to manually configure filters. Just run context-manager --preset llm-explain and get optimized LLM context automatically.

## Quick Start

```bash
# List all available presets
context-manager --list-presets

# Get information about a specific preset
context-manager --preset-info llm-explain

# Use a preset
context-manager --preset review
```

---

## Common Workflows

### 1. LLM Assistance (Most Popular)

**Goal:** Get ultra-compact context for ChatGPT/Claude

```bash
# Best for: Quick AI assistance, minimal token usage
context-manager --preset llm-explain

# What it does:
# ✅ Extracts methods only (no full files)
# ✅ Excludes tests, docs, configs
# ✅ Filters out debug/test methods
# ✅ Auto-copies to clipboard
# ✅ Target: 50k tokens
```

**Result:** Context is in your clipboard, ready to paste into AI assistant.

---

### 2. Code Review

**Goal:** Generate digest for code review or pull request

```bash
# Best for: Code reviews, PR analysis
context-manager --preset review

# What it does:
# ✅ Focuses on src/ and lib/ code
# ✅ Excludes tests and documentation
# ✅ Method-level analysis enabled
# ✅ Generates digest.txt
# ✅ Saves detailed report
# ✅ Target: 100k tokens
```

**Output Files:**
- `digest.txt` - GitIngest-style digest for sharing
- `token-analysis-report.json` - Detailed statistics

---

### 3. Security Audit

**Goal:** Analyze security-relevant code

```bash
# Best for: Security reviews, pre-release checks
context-manager --preset security-audit

# What it does:
# ✅ Includes auth*, security*, validate* files
# ✅ Filters for security-related methods
# ✅ Includes API handlers and middleware
# ✅ Generates comprehensive report
# ✅ Target: 120k tokens
```

**Use cases:**
- Pre-release security checks
- Authentication code review
- Input validation analysis
- API endpoint security

---

### 4. Pair Programming

**Goal:** Interactive development context

```bash
# Best for: Pair programming sessions
context-manager --preset pair-program

# What it does:
# ✅ Includes recent code changes
# ✅ Core logic focused
# ✅ Verbose output for discussion
# ✅ Method-level analysis
# ✅ Target: 80k tokens
```

---

### 5. Documentation Generation

**Goal:** Create API documentation context

```bash
# Best for: API docs, public interface analysis
context-manager --preset documentation

# What it does:
# ✅ Includes public APIs and interfaces
# ✅ Includes markdown documentation
# ✅ Excludes internal/private methods
# ✅ Target: 150k tokens
```

---

### 6. Quick Project Overview

**Goal:** Minimal entry point analysis

```bash
# Best for: Quick understanding, architecture at a glance
context-manager --preset minimal

# What it does:
# ✅ Only entry points (index.js, main.js, app.js)
# ✅ Minimal token usage
# ✅ Ultra-fast analysis
# ✅ Target: 20k tokens
```

---

### 7. Complete Analysis

**Goal:** Full codebase snapshot

```bash
# Best for: Complete analysis, archival
context-manager --preset full

# What it does:
# ✅ Everything except node_modules/.git
# ✅ Includes tests, docs, configs
# ✅ No token limit
# ✅ File-level (not method-level)
```

---

## Customizing Presets

### Override Preset Options

You can override any preset option with command-line flags:

```bash
# Use review preset but make it verbose
context-manager --preset review --verbose

# Use llm-explain but save a report too
context-manager --preset llm-explain --save-report

# Use security-audit without saving report
context-manager --preset security-audit --no-save-report
```

### Combine Multiple Exports

```bash
# Generate digest AND save report
context-manager --preset review -s

# Generate digest AND export to file
context-manager --preset llm-explain --context-export

# All outputs
context-manager --preset review -s --context-export --context-clipboard
```

---

## Real-World Examples

### Example 1: Daily LLM Workflow

```bash
# Morning: Get context for AI assistant
context-manager --preset llm-explain

# Paste into ChatGPT/Claude:
# "Here's my codebase context. Help me implement feature X"

# Result: AI understands your codebase in < 50k tokens
```

---

### Example 2: PR Review Process

```bash
# Step 1: Generate review digest
context-manager --preset review

# Step 2: Share digest.txt with reviewer
# digest.txt contains complete code context

# Step 3: Reviewer uses digest for thorough review
# All relevant code in one place
```

---

### Example 3: Security Audit Before Release

```bash
# Run security-focused analysis
context-manager --preset security-audit

# Review generated files:
# - digest.txt: All security-relevant code
# - token-analysis-report.json: Detailed stats

# Check for:
# - Unvalidated inputs
# - Missing authentication
# - Insecure API endpoints
```

---

### Example 4: Onboarding New Developer

```bash
# Generate documentation context
context-manager --preset documentation

# Share with new developer:
# - digest.txt: Complete API overview
# - llm-context.json: Structured data

# New dev gets instant project understanding
```

---

## Programmatic Usage

```javascript
const { PresetManager, TokenCalculator } = require('@hakkisagdic/context-manager');

// Initialize preset manager
const presetManager = new PresetManager();

// List available presets
const presets = presetManager.listPresets();
console.log('Available presets:', presets);

// Get a preset
const reviewPreset = presetManager.getPreset('review');
console.log('Review preset:', reviewPreset);

// Apply preset to options
const options = presetManager.applyPreset('llm-explain', {
  verbose: true  // Override preset option
});

// Use with TokenCalculator
const calculator = new TokenCalculator('./src', options);
calculator.run();
```

---

## Tips & Best Practices

### 1. Start with Presets
Don't manually configure filters. Use presets first:
```bash
# ❌ Avoid: Manual configuration
context-manager --method-level --gitingest --save-report --context-export

# ✅ Better: Use preset
context-manager --preset review
```

### 2. Choose by Token Budget

| Token Limit | Preset | Use Case |
|-------------|--------|----------|
| 20k | `minimal` | Entry points only |
| 50k | `llm-explain` | AI assistance |
| 80k | `pair-program` | Development |
| 100k | `review` | Code review |
| 120k | `security-audit` | Security focus |
| 150k | `documentation` | API docs |
| No limit | `full` | Complete snapshot |

### 3. Workflow-Specific Presets

**Daily Development:**
```bash
context-manager --preset llm-explain
```

**Weekly Code Review:**
```bash
context-manager --preset review
```

**Pre-Release:**
```bash
context-manager --preset security-audit
```

**Onboarding:**
```bash
context-manager --preset documentation
```

---

## Troubleshooting

### "Preset not found"
```bash
# Check available presets
context-manager --list-presets

# Verify preset name (case-sensitive)
context-manager --preset review  # ✅ correct
context-manager --preset Review  # ❌ wrong (capital R)
```

### "Too many tokens"
```bash
# Use a more restrictive preset
context-manager --preset minimal

# Or manually limit tokens (future feature)
context-manager --preset review --target-tokens 50000
```

### "Too few files"
```bash
# Check what's included
context-manager --preset review --verbose

# Use less restrictive preset
context-manager --preset default
```

### "Method filters not working"
```bash
# Ensure method-level is enabled
context-manager --preset llm-explain  # Has method-level

# Check preset info
context-manager --preset-info llm-explain
```

---

## Performance Tips

1. **Use presets** - Faster than manual configuration
2. **Start with `minimal`** - Quick first pass
3. **Use `--gitingest-from-report`** - Reuse analysis
4. **Cache results** - Save reports for later

```bash
# Step 1: Analyze once, save report
context-manager --preset review --save-report

# Step 2: Generate different formats from report (instant)
context-manager --gitingest-from-report token-analysis-report.json
```

---

## Next Steps

1. Try the most popular preset:
   ```bash
   context-manager --preset llm-explain
   ```

2. Explore all presets:
   ```bash
   context-manager --list-presets
   ```

3. Get detailed info:
   ```bash
   context-manager --preset-info review
   ```

4. Customize if needed:
   ```bash
   context-manager --preset review --verbose
   ```

---

## Related Documentation

- [Preset System README](../lib/presets/README.md) - Detailed preset documentation
- [Future Planned Steps](future_planned_steps.md) - Roadmap and upcoming features
- [Main README](../README.md) - General usage guide

---

*Last updated: 2025-10-31*
