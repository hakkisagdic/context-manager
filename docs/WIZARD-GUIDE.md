# Interactive Wizard, Dashboard & UI Demo Guide

**Version:** 3.0.0
**Status:** Production Ready (Requires Additional Dependencies)
**Last Updated:** April 2, 2026

---

## Overview

Context Manager v3.0.0 includes three powerful interactive features:

1. **Interactive Wizard** - Guided configuration for context generation
2. **Live Dashboard** - Real-time analysis with visual stats
3. **UI Demo** - Interactive test screen for all Ink UI components

These features are **optional** and require additional dependencies (React + Ink) to function.

---

## Quick Start

### Install Interactive Features

```bash
cd /path/to/context-manager
npm install
```

This installs all dependencies including:

- `ink@^6.0.0` - React-based terminal UI framework
- `react@^19.0.0` - React library
- `ink-spinner@^5.0.0` - Loading spinners
- `ink-select-input@^5.0.0` - Interactive selection
- `ink-text-input@^5.0.1` - Text input component

### Verify Installation

```bash
# Try wizard
context-manager --wizard

# Try dashboard
context-manager --dashboard

# Try UI demo
npm run test:ink
```

If dependencies are missing, you'll see:

```
 Interactive wizard requires additional dependencies.
   Install: npm install ink react ink-select-input ink-text-input
   Falling back to standard mode...
```

### Requirements

- Node.js 14+
- Ink dependencies installed (`npm install`)
- Interactive terminal (iTerm2, Terminal.app, gnome-terminal)
- Not supported: VSCode integrated terminal (Raw mode not supported)

---

## Interactive Wizard

### What is the Wizard?

The wizard provides a **step-by-step guided experience** for configuring your context generation. Perfect for:

- First-time users
- Complex configurations
- Quick setup for common use cases

### How to Use

```bash
# Start the wizard
context-manager --wizard
```

### Wizard Flow

#### Step 1: Select Your Use Case

```
┌──────────────────────────────────────────────────────────┐
│  Context Generation Wizard                              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  What are you working on today?                         │
│                                                          │
│  ❯ 🐛 Bug Fix                                           │
│    ✨ New Feature                                        │
│    👀 Code Review                                        │
│    ♻️  Refactoring                                       │
│    🔒 Security Audit                                     │
│    📚 Documentation                                      │
│    ⚙️  Custom                                            │
│                                                          │
│  [↑↓] Navigate  [Enter] Select  [Esc] Cancel           │
└──────────────────────────────────────────────────────────┘
```

**Controls:**

- `↑↓` - Navigate options
- `Enter` - Select and continue
- `Esc` - Cancel wizard

**Use Case Templates:**

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

```
┌──────────────────────────────────────────────────────────┐
│  Which AI model will you use?                           │
│                                                          │
│  ❯ Claude Opus (200k tokens)                            │
│    Claude Sonnet (200k tokens)                          │
│    GPT-4 Turbo (128k tokens)                            │
│    GPT-4 (8k tokens)                                    │
│    Gemini Pro (1M tokens)                               │
│    Custom (specify token limit)                         │
└──────────────────────────────────────────────────────────┘
```

**Why this matters:**

- Wizard optimizes output to fit token limits
- Suggests chunking for large projects
- Recommends best format for your model

#### Step 3: Choose What to Include

```
┌──────────────────────────────────────────────────────────┐
│  What should be included in the context?                │
│                                                          │
│  ◉ Changed files (git diff)                             │
│  ◉ Related files (imports/dependencies)                 │
│  ◯ Tests                                                 │
│  ◯ Documentation                                         │
│  ◉ Core modules                                          │
│  ◯ Configuration files                                   │
│                                                          │
│  [Space] Toggle  [Enter] Continue                      │
└──────────────────────────────────────────────────────────┘
```

**Controls:**

- `Space` - Toggle selection
- `Enter` - Continue to next step
- `Esc` - Go back

#### Step 4: Select Output Format

```
┌──────────────────────────────────────────────────────────┐
│  Choose output format:                                  │
│                                                          │
│  ❯ TOON (40-50% more efficient) ⭐ Recommended          │
│    JSON (standard, widely compatible)                   │
│    YAML (human-readable)                                │
│    GitIngest (single file digest)                       │
│    Markdown (documentation-friendly)                    │
└──────────────────────────────────────────────────────────┘
```

**Format Comparison:**

| Format    | Token Efficiency | Readability | Use Case                      |
| --------- | ---------------- | ----------- | ----------------------------- |
| TOON      | Best             | Good        | Most efficient, LLM-optimized |
| JSON      | Medium           | Good        | Standard, widely supported    |
| YAML      | Low              | Best        | Human-readable configs        |
| GitIngest | High             | Good        | Single-file digest            |
| Markdown  | Low              | Best        | Documentation                 |

#### Step 5: Review & Confirm

```
┌──────────────────────────────────────────────────────────┐
│  Configuration Summary                                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Use Case: Bug Fix                                      │
│  Target: Claude Opus (200k tokens)                      │
│  Files: Changed + Related (estimated 45 files)          │
│  Format: TOON                                           │
│  Estimated tokens: 12,450                               │
│                                                          │
│  Within token limit (6.2% of 200k)                      │
│                                                          │
│  [Enter] Start Analysis  [Esc] Go Back                 │
└──────────────────────────────────────────────────────────┘
```

### After Wizard Completion

```bash
Analysis complete!

Generated: context-bug-fix.toon
Size: 12,450 tokens
Files included: 45

Next steps:
1. Copy to clipboard? (y/n) y
Copied to clipboard!

2. Open in editor? (y/n) n

3. Save to different format? (y/n) n

Done! Ready to paste into your AI assistant.
```

---

## Live Dashboard

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
│                                                          │
│  Project Analysis                                       │
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
└──────────────────────────────────────────────────────────┘
```

### Dashboard Stats View

After analysis completes:

```
┌──────────────────────────────────────────────────────────┐
│  Analysis Complete                                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Files: 64        Methods: 347      Tokens: 181,480     │
│  Size: 0.78 MB    Lines: 28,721     Avg: 2,836 tok/file │
│                                                          │
│  Top Languages:                                         │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ JavaScript (100%)      │
│                                                          │
│  Largest Files:                                         │
│  • server.js           12,388 tokens  ▓▓▓▓▓▓▓ (6.8%)    │
│  • workflow-handler.js 11,007 tokens  ▓▓▓▓▓▓ (6.1%)     │
│  • security.js          7,814 tokens  ▓▓▓▓ (4.3%)       │
│                                                          │
│  [R] Refresh  [S] Save  [E] Export  [Q] Quit           │
└──────────────────────────────────────────────────────────┘
```

### Dashboard Controls

| Key     | Action   | Description                     |
| ------- | -------- | ------------------------------- |
| `R`     | Refresh  | Re-run analysis (in watch mode) |
| `S`     | Save     | Save current report to file     |
| `E`     | Export   | Export to different format      |
| `Q`     | Quit     | Exit dashboard                  |
| `↑↓`    | Navigate | Scroll through file list        |
| `Space` | Toggle   | Expand/collapse sections        |

### Watch Mode

Watch mode automatically refreshes when files change:

```bash
context-manager --dashboard --watch
```

```
File changed: src/utils/helper.js
Re-analyzing... (1.2s)
Updated! Tokens: 181,480 → 182,105 (+625)
```

**Perfect for:**

- Live coding sessions
- Watching token count while editing
- Monitoring large refactors
- CI/CD integration with visual feedback

---

## Interactive UI Demo

### Running the Demo

```bash
# NPM script (recommended)
npm run test:ink

# Or directly
node test/test-ink-ui.js
```

### Demo Menu

Launching the test screen shows:

```
╔══════════════════════════════════════════════════════════╗
║  Ink UI Test Screen                                     ║
║                                                          ║
║ Select a test to run:                                    ║
║                                                          ║
║ ❯  Test Colors                                           ║
║    Test Progress Bar                                     ║
║    Test Spinners                                         ║
║    Test Input                                            ║
║    Test Wizard                                           ║
║    Test Dashboard                                        ║
║   ❌ Exit                                                 ║
║                                                          ║
║ [↑↓] Navigate  [Enter] Select  [Q] Quit                 ║
╚══════════════════════════════════════════════════════════╝
```

### Test Options

#### 1. Test Colors

All color palettes and text styles:

```
Color Test

Red Text
Green Text
Yellow Text
Blue Text
Magenta Text
Cyan Text

Bold  Dim
```

Tests: color options (red, green, yellow, blue, magenta, cyan), text styles (bold, dim, italic, underline), color combinations.

#### 2. Test Progress Bar

Animated progress bar:

```
Progress Bar Test

Progress: 67%
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░
Processing...
```

Features: real-time progress (0-100%), visual bar with filled/empty states, auto-completes in ~4 seconds.

#### 3. Test Spinners

Multiple spinner types:

```
Spinner Test

⠋ Scanning files...
⠙ Calculating tokens...
✓ Analysis complete!
```

Spinner types: Dots, Line, Status indicators.

#### 4. Test Input

Interactive text input with live typing, onChange events, placeholder text, and real-time feedback.

#### 5. Test Wizard

Full wizard flow (3 steps):

1. Use Case Selection - 7 options
2. Target Model - 6 AI models
3. Output Format - 6 formats
4. Summary & Complete

#### 6. Test Dashboard

Live stats dashboard showing files, methods, tokens, language distribution, and largest files ranking.

### What's Being Tested

**Components:**

- Box (layout, flexbox, borders, padding)
- Text (colors, styles, formatting)
- SelectInput (navigation, selection)
- TextInput (typing, onChange)
- Spinner (animations, types)
- Newline, Spacer

**Features:**

- State management (useState)
- Effects (useEffect for animations)
- Input handling (useInput)
- Conditional rendering
- Component composition
- Props injection (ESM workaround)

**Custom Components:**

- Wizard (3-step flow)
- Dashboard (live stats)
- ProgressBar (with components prop)

### Success Criteria

The demo is successful when:

1. Menu renders correctly
2. Arrow key navigation works
3. Selections work
4. Each test screen displays
5. Wizard completes all steps
6. Dashboard shows stats
7. Q key exits properly

---

## Platform-Specific Setup

### macOS

```bash
# iTerm2 (recommended)
open -a iTerm
cd /path/to/context-manager
npm run test:ink

# Terminal.app
open -a Terminal
cd /path/to/context-manager
npm run test:ink
```

### Linux

```bash
# GNOME Terminal
gnome-terminal -- bash -c "cd /path/to/context-manager && npm run test:ink"

# Konsole (KDE)
konsole -e "cd /path/to/context-manager && npm run test:ink"
```

### Windows

```powershell
# Windows Terminal (recommended)
wt.exe -d C:\path\to\context-manager npm run test:ink

# PowerShell
cd C:\path\to\context-manager
npm run test:ink
```

---

## Troubleshooting

### "Raw mode is not supported"

```
ERROR Raw mode is not supported on the current process.stdin
```

This error is normal in automated test environments. Interactive features require a real terminal.

**Works on:**

- iTerm2 (macOS)
- Terminal.app (macOS)
- gnome-terminal (Linux)
- Windows Terminal
- PowerShell (Windows)

**Does not work on:**

- VSCode integrated terminal
- CI/CD pipelines
- SSH sessions (in some cases)
- Piped input/output

### Wizard/Dashboard Not Starting

```
 Interactive wizard requires additional dependencies.
```

**Solution:**

```bash
# Install all dependencies
npm install

# Or install specific packages
npm install ink react ink-select-input ink-text-input ink-spinner
```

### Terminal Display Issues

**Symptom:** Weird characters, broken layout, no colors

**Possible Causes:**

1. Terminal doesn't support ANSI colors
2. Old terminal emulator
3. SSH session without proper TTY

**Solutions:**

```bash
# Option 1: Use simple mode
context-manager --simple

# Option 2: Update terminal (macOS)
# Use iTerm2 or latest Terminal.app

# Option 3: Update terminal (Linux)
sudo apt install gnome-terminal  # or similar

# Option 4: Check TERM variable
echo $TERM
# Should be: xterm-256color or similar
```

### React/Ink Errors

```
Error: Cannot find module 'react'
Error: Cannot find module 'ink'
```

**Solution:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Wizard Freezes

**Symptom:** Wizard starts but becomes unresponsive

**Solutions:**

1. Press `Esc` to cancel
2. Use `Ctrl+C` to force quit
3. Check terminal size (min 80x24)
4. Disable terminal multiplexers temporarily (tmux, screen)

### Dependencies Missing

```bash
# List installed packages
npm list --depth=0 | grep -E "ink|react"

# Should show:
# ├── ink@6.0.0
# ├── ink-select-input@5.0.0
# ├── ink-spinner@5.0.0
# ├── ink-text-input@5.0.1
# └── react@19.0.0
```

---

## Fallback to Standard Mode

If interactive features don't work, you can always use standard CLI mode:

```bash
# Instead of wizard, use CLI flags
context-manager --output toon --method-level --context-clipboard

# Instead of dashboard, use verbose mode
context-manager --verbose --save-report

# View report after analysis
cat token-analysis-report.json
```

---

## Pro Tips

### 1. Combine Wizard with Profiles

Save wizard configuration for reuse:

```bash
# After wizard generates config
context-manager --wizard  # Complete wizard
# Save as: bug-fix-profile

# Reuse later
context-manager --profile bug-fix-profile
```

### 2. Dashboard in CI/CD

Use dashboard in CI for visual feedback:

```bash
# In CI script
if [ -t 1 ]; then
  # Interactive terminal detected
  context-manager --dashboard
else
  # Non-interactive (CI)
  context-manager --simple
fi
```

### 3. Custom Terminal Theme

Dashboard adapts to your terminal theme automatically. For best experience:

- Use dark theme for better contrast
- Ensure 256-color support
- Use monospace font (Fira Code, JetBrains Mono)

### 4. Recording a Demo Video

1. Open terminal (iTerm2 recommended)
2. Clear screen: `clear`
3. Start demo: `npm run test:ink`
4. Navigate menu: Colors → Progress → Wizard → Dashboard
5. Stop recording: press `Q`

---

## Testing & Verification

### Test Interactive Features

```bash
# Test wizard (should not fallback)
node bin/cli.js --wizard

# Test dashboard (should not fallback)
node bin/cli.js --dashboard

# Test UI demo
npm run test:ink
```

### Production Usage

After verifying the demo works, use the production commands:

```bash
# Production wizard
context-manager --wizard

# Production dashboard
context-manager --dashboard

# Dashboard with watch mode
context-manager --dashboard --watch
```

---

## Related Files

| File                         | Description            |
| ---------------------------- | ---------------------- |
| `test/test-ink-ui.js`        | Interactive demo app   |
| `test/INK-UI-TEST-README.md` | Demo usage guide       |
| `lib/ui/wizard.js`           | Wizard component       |
| `lib/ui/dashboard.js`        | Dashboard component    |
| `lib/ui/progress-bar.js`     | Progress bar component |

---

## Additional Resources

- **Feature Examples:** [FEATURE-EXAMPLES.md](./FEATURE-EXAMPLES.md)
- **Main README:** [../README.md](../README.md)
- **Changelog:** [CHANGELOG.md](./CHANGELOG.md)
- **Ink Documentation:** https://github.com/vadimdemedes/ink

---

**Version:** 3.0.0
**Ink Version:** 6.x
**React Version:** 19.x
**Requires:** Interactive TTY terminal
**Not Supported:** VSCode integrated terminal, CI/CD
**Maintainer:** Hakkı Sağdıç
