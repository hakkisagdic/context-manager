# Interactive Wizard & Dashboard

**Version:** 3.0.0
**Status:** Built-in Features (Ink/React bundled since v2.3.6)
**Last Updated:** April 3, 2026

---

## Overview

Context Manager v3.0.0 includes two powerful interactive features:

1. **Wizard** - Guided step-by-step configuration for context generation
2. **Dashboard** - Real-time analysis with visual statistics

These features use Ink (terminal UI framework) which is bundled with the package since v2.3.6.

---

## Quick Start

```bash
# Install dependencies
npm install

# Try wizard
context-manager --wizard

# Try dashboard
context-manager --dashboard
```

If dependencies are missing:

```
⚠️  Interactive features require additional dependencies.
   Install: npm install
   Falling back to standard mode...
```

---

## Wizard

### What is the Wizard?

The wizard provides a **step-by-step guided experience** for configuring your context generation. Perfect for:

- First-time users
- Complex configurations
- Quick setup for common use cases

### Wizard Flow

#### Step 1: Select Your Use Case

| Use Case       | Includes                      | Best For               |
| -------------- | ----------------------------- | ---------------------- |
| Bug Fix        | Changed files + related code  | Fixing specific issues |
| New Feature    | Core modules + architecture   | Adding functionality   |
| Code Review    | Full context with tests       | Reviewing PRs          |
| Refactoring    | Target modules + dependencies | Code improvements      |
| Security Audit | Security-critical files       | Security review        |
| Documentation  | Code + existing docs          | Writing docs           |
| Custom         | Full customization            | Special cases          |

#### Step 2: Select Target AI Model

- Claude Opus (200k tokens)
- Claude Sonnet (200k tokens)
- GPT-4 Turbo (128k tokens)
- GPT-4 (8k tokens)
- Gemini Pro (1M tokens)
- Custom (specify token limit)

#### Step 3: Choose What to Include

- Changed files (git diff)
- Related files (imports/dependencies)
- Tests
- Documentation
- Core modules
- Configuration files

#### Step 4: Select Output Format

| Format    | Token Efficiency        | Use Case           |
| --------- | ----------------------- | ------------------ |
| TOON      | Best (40-50% reduction) | LLM-optimized      |
| JSON      | Standard                | Widely compatible  |
| YAML      | Good                    | Human-readable     |
| GitIngest | Good                    | Single-file digest |
| Markdown  | Standard                | Documentation      |

#### Step 5: Review & Confirm

Summary shows use case, target model, file count, format, and estimated tokens. Confirm to start analysis.

### After Wizard Completion

```
✅ Analysis complete!

Generated: context-bug-fix.toon
Size: 12,450 tokens
Files included: 45

📋 Next steps:
1. Copy to clipboard? (y/n) y
✅ Copied to clipboard!
```

---

## Dashboard

### What is the Dashboard?

The dashboard provides **real-time visual feedback** during analysis. Features:

- Live progress bars
- File-by-file status
- Token counting in real-time
- Top files/directories
- Language distribution
- Keyboard controls

### How to Use

```bash
# Start dashboard
context-manager --dashboard

# With watch mode (auto-refresh on file changes)
context-manager --dashboard --watch
```

### Dashboard Interface

```
┌──────────────────────────────────────────────────────────┐
│  Live Analysis Dashboard                                │
├──────────────────────────────────────────────────────────┤
│  📊 Project Analysis                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 67% (43/64 files) │
│                                                          │
│  Current: src/analyzers/method-analyzer.js              │
│  Tokens: 181,480 / 200,000 (90.7%)                      │
│  Time Elapsed: 2.3s                                     │
│                                                          │
│  ✓ Scanning files                                       │
│  ✓ Extracting methods                                   │
│  ⣾ Calculating tokens                                   │
│  ○ Generating output                                    │
│                                                          │
│  [R] Refresh  [S] Save  [E] Export  [Q] Quit           │
└──────────────────────────────────────────────────────────┘
```

### Dashboard Stats View

After analysis completes:

- Files, Methods, Tokens summary
- Language distribution
- Largest files ranking

### Dashboard Controls

| Key     | Action               |
| ------- | -------------------- |
| `R`     | Refresh (watch mode) |
| `S`     | Save report          |
| `E`     | Export format        |
| `Q`     | Quit                 |
| `↑↓`    | Scroll file list     |
| `Space` | Expand/collapse      |

### Watch Mode

```bash
context-manager --dashboard --watch
```

Auto-refreshes when files change. Perfect for live coding sessions.

---

## Interactive Demo

Test all Ink UI components with the built-in demo:

```bash
npm run test:ink
```

### Demo Menu

```
╔══════════════════════════════════════════════════════════╗
║ 🎨 Ink UI Test Screen                                   ║
║                                                          ║
║ Select a test to run:                                    ║
║                                                          ║
║ ❯ 🎨 Test Colors                                         ║
║   📊 Test Progress Bar                                   ║
║   🔄 Test Spinners                                       ║
║   📝 Test Input                                          ║
║   🧙 Test Wizard                                         ║
║   📈 Test Dashboard                                      ║
║   ❌ Exit                                                 ║
╚══════════════════════════════════════════════════════════╝
```

### Test Options

1. **Test Colors** - Color palette and text styles
2. **Test Progress Bar** - Animated progress display
3. **Test Spinners** - Multiple spinner types (dots, line, status)
4. **Test Input** - Interactive text input with live feedback
5. **Test Wizard** - Full wizard flow (3 steps)
6. **Test Dashboard** - Live stats dashboard

---

## Troubleshooting

### Dependencies Missing

```bash
# Install all dependencies
npm install
```

### Terminal Display Issues

**Symptoms:** Weird characters, broken layout, no colors

**Solutions:**

1. Use standard CLI: `context-manager --simple`
2. Update terminal (iTerm2, Windows Terminal)
3. Check TERM variable: `echo $TERM` (should be xterm-256color)

### "Raw mode is not supported"

**Error:**

```
ERROR Raw mode is not supported on the current process.stdin
```

**Works in:**

- iTerm2 (macOS)
- Terminal.app (macOS)
- gnome-terminal (Linux)
- Windows Terminal
- PowerShell

**Does NOT work in:**

- VSCode integrated terminal
- CI/CD pipelines
- Piped input/output

### Wizard Freezes

1. Press `Esc` to cancel
2. Use `Ctrl+C` to force quit
3. Check terminal size (min 80x24)
4. Disable tmux/screen temporarily

---

## Fallback to Standard Mode

If interactive features don't work, use standard CLI:

```bash
# CLI with flags
context-manager --output toon --method-level --context-clipboard

# Verbose mode
context-manager --verbose --save-report
```

---

## v3.0.0 Features

The wizard and dashboard are part of the v3.0.0 platform:

- **Plugin Architecture** - Modular system for languages and exporters
- **Git Integration** - Changed files, diff analysis, author tracking
- **Watch Mode** - Real-time file monitoring and auto-analysis
- **REST API** - HTTP server with 6 endpoints
- **Performance** - Caching system and parallel processing
- **LLM Optimization** - Auto-detect target LLM and optimize context

---

## Related Files

| File                  | Description                           |
| --------------------- | ------------------------------------- |
| `bin/cli.js`          | CLI entry point with wizard/dashboard |
| `lib/ui/wizard.js`    | Wizard component                      |
| `lib/ui/dashboard.js` | Dashboard component                   |
| `test/test-ink-ui.js` | Interactive demo app                  |

---

**Version:** 3.0.0
**Ink Version:** 6.x (bundled)
**Last Updated:** April 3, 2026
**Maintainer:** Hakkı Sağdıç
