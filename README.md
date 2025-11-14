# Context Manager

**AI Development Platform** with plugin architecture, Git integration, REST API, and watch mode. Supporting 15+ programming languages with method-level filtering, preset profiles, token budget optimization, and real-time analysis. Perfect for AI-assisted development workflows.

**v3.1.0** - Phase 1 Core Enhancements 🎯

## ☕ Support This Project

If you find this tool helpful, consider buying me a coffee! Your support helps maintain and improve this project.

<p align="center">
  <a href="https://www.buymeacoffee.com/hakkisagdic" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
</p>

<p align="center">
  <img src="docs/qr-code.png" alt="Support QR Code" width="300">
</p>

---

## Files

- **`context-manager.js`** - Main LLM context analysis script with exact token counting
- **`.contextignore`** - Files to exclude from token calculation (EXCLUDE mode)
- **`.contextinclude`** - Files to include in token calculation (INCLUDE mode)
- **`README.md`** - This documentation file
- **`README-tr.md`** - Turkish documentation (Türkçe dokümantasyon)

## Features

### 🚀 Platform Features (v3.0.0)
- 🔌 **Plugin Architecture** - Modular, extensible system for languages and exporters
- 🔀 **Git Integration** - Analyze only changed files, diff analysis, author tracking
- 👁️ **Watch Mode** - Real-time file monitoring and auto-analysis
- 🌐 **REST API** - HTTP server for programmatic access (6 endpoints)
- ⚡ **Performance** - Caching system, parallel processing (5-10x faster)
- 🏗️ **Modular Core** - Scanner, Analyzer, ContextBuilder, Reporter

### 🎯 Phase 1 Core Enhancements (v3.1.0)
- 🎨 **Preset System** - 8 ready-to-use configuration profiles (review, security-audit, llm-explain, etc.)
- 🎯 **Token Budget Fitter** - Intelligent file selection to fit LLM context windows
- 🔍 **Rule Tracer** - Debug tool to track filter decisions and pattern usage
- ⚡ **5 Fitting Strategies** - Auto, shrink-docs, balanced, methods-only, top-n
- 📊 **Smart Prioritization** - Entry points, core files weighted higher
- 🚀 **One-Command Workflows** - `--preset review` for instant code review context

### 🎨 User Interface
- 🧙 **Interactive Wizard Mode** - User-friendly guided setup (default)
- 💻 **CLI Mode** - Traditional command-line interface (--cli flag)
- 📤 **Interactive export** - Prompts for export choice when no options specified

### 🔢 Token Analysis
- ✅ **Exact token counting** using tiktoken (GPT-4 compatible)
- 🌍 **Multi-language support** - 15+ languages: JavaScript, TypeScript, Python, PHP, Ruby, Java, Kotlin, C#, Go, Rust, Swift, C/C++, Scala, SQL (T-SQL, PL/pgSQL, MySQL, PL/SQL)
- 🎯 **Method-level analysis** - Analyze tokens per function/method
- 📊 **Detailed reporting** - by file type, largest files, statistics

### 🎯 Filtering & Configuration
- 🚫 **Dual ignore system** - respects both `.gitignore` and context ignore rules
- 📋 **Include/Exclude modes** - `.contextinclude` takes priority over `.contextignore`
- 🔍 **Method filtering** - `.methodinclude` and `.methodignore` for granular control
- 🎯 **Core application focus** - configured to analyze only essential code files

### 📤 Export Options
- 🤖 **LLM context export** - generate optimized file lists for LLM consumption
- 📋 **Clipboard integration** - copy context directly to clipboard
- 💾 **JSON/YAML/CSV/XML exports** - multiple format options
- 📄 **GitIngest format** - Single-file digest for LLM consumption (inspired by [GitIngest](https://github.com/coderamp-labs/gitingest))
- 🎯 **TOON format** - Ultra-compact format (40-50% token reduction)
- 🔀 **Dual context modes** - compact (default) or detailed format

## Quick Start

### 🧙 Interactive Wizard Mode (Default)
```bash
# Launch interactive wizard (guides you through options)
context-manager
```

The wizard provides a user-friendly interface to:
- Select your use case (Bug Fix, Feature, Code Review, etc.)
- Choose target LLM (Claude, GPT-4, Gemini, etc.)
- Pick output format (TOON, JSON, YAML, etc.)

**Note:** Wizard mode uses Ink terminal UI. If you experience visual artifacts, use CLI mode with `--cli` flag.

### 💻 CLI Mode
```bash
# Use CLI mode instead of wizard
context-manager --cli

# CLI mode with options
context-manager --cli --save-report
context-manager --cli --context-clipboard
context-manager --cli --gitingest
context-manager --cli --method-level

# Any analysis flag automatically enables CLI mode
context-manager -s              # Auto CLI (save report)
context-manager -m              # Auto CLI (method-level)
context-manager --context-export  # Auto CLI (export)

# Combine multiple exports
context-manager --cli -g -s  # GitIngest digest + detailed report
```

### 🎯 Phase 1 Features (v3.1.0)

#### 🎨 Preset System - One-Command Workflows
```bash
# List all available presets
context-manager --list-presets

# Use a preset for code review (100k token budget, method-level, gitingest)
context-manager --preset review

# Ultra-compact LLM context (50k tokens, methods-only strategy)
context-manager --preset llm-explain

# Security-focused analysis
context-manager --preset security-audit

# Get detailed info about a preset
context-manager --preset-info review
```

**8 Built-in Presets:**
- `default` - Standard analysis with balanced settings
- `review` - Code review focus (filters tests/docs, 100k tokens)
- `llm-explain` - Ultra-compact for LLM (50k tokens, methods-only)
- `pair-program` - Interactive development with full details
- `security-audit` - Security patterns (auth, crypto, tokens)
- `documentation` - Public APIs and docs
- `minimal` - Entry points only (10k tokens)
- `full` - Complete codebase analysis

#### 🎯 Token Budget Fitting - Smart File Selection
```bash
# Fit files within 100k token budget
context-manager --target-tokens 100000

# Use specific fitting strategy
context-manager --target-tokens 50000 --fit-strategy balanced

# Shorthand notation (k = 1000)
context-manager --target-tokens 50k --fit-strategy methods-only
```

**5 Fitting Strategies:**
- `auto` - Automatically selects best strategy
- `shrink-docs` - Removes documentation files first
- `balanced` - Optimizes token/file efficiency ratio
- `methods-only` - Extracts only methods from large files (60% reduction)
- `top-n` - Selects most important files by priority

**Example Output:**
```
🎯 Token Budget Fitting
═══════════════════════════════════════
✅ Successfully fit 30 files within 10000 token budget
   Strategy: balanced
   Tokens: 9924 / 10000 (tight fit)
   Reduction: 701348 tokens (98.6%)
   Entry points preserved: 2

💡 Recommendations:
   • Consider increasing token budget for better coverage
   • Try "methods-only" strategy for more aggressive reduction
```

#### 🔍 Rule Tracer - Debug Filter Decisions
```bash
# Enable rule tracing
context-manager --trace-rules

# Combine with other options
context-manager --preset review --trace-rules
```

**Example Output:**
```
📊 Rule Trace Report
═══════════════════════════════════════
Files Processed: 250
  ✅ Included: 180
  ❌ Excluded: 70

Pattern Analysis:
  node_modules/** → 45 matches (.gitignore)
  **/*.test.js → 15 matches (.contextignore)
  src/**/*.js → 120 matches (.contextinclude)

Unused Patterns: 2
  - legacy/** (never matched)
```

### 🤖 LLM Optimization (v2.3.7)
```bash
# Auto-detect LLM from environment
export ANTHROPIC_API_KEY=sk-...
context-manager  # Automatically optimizes for Claude

# Explicit model selection
context-manager --target-model claude-sonnet-4.5
context-manager --target-model gpt-4o
context-manager --target-model gemini-2.0-flash

# List all supported models
context-manager --list-llms

# Context fit analysis
context-manager --cli --target-model claude-sonnet-4.5
# Output:
# 📊 Context Window Analysis:
#    Target Model: Claude Sonnet 4.5
#    Available Context: 200,000 tokens
#    Your Repository: 181,480 tokens
#    ✅ PERFECT FIT! Your entire codebase fits in one context.
```

Supported LLM models (9+ models):
- **Anthropic**: Claude Sonnet 4.5, Claude Opus 4
- **OpenAI**: GPT-4 Turbo, GPT-4o, GPT-4o Mini
- **Google**: Gemini 1.5 Pro, Gemini 2.0 Flash
- **DeepSeek**: DeepSeek Coder, DeepSeek Chat

Custom models supported via `.context-manager/custom-profiles.json`

### 🔀 Git Integration (v3.0.0)
```bash
# Analyze only uncommitted changes
context-manager --changed-only

# Analyze changes since a commit/branch
context-manager --changed-since main
context-manager --changed-since HEAD~5
context-manager --changed-since v2.3.0

# With author information
context-manager --changed-only --with-authors

# Output:
# 🔀 Git Integration - Analyzing Changed Files
# ══════════════════════════════════════════════════════════
#
# 📝 Found 3 changed files
#    Impact: MEDIUM (score: 25)
```

### 👁️ Watch Mode (v3.0.0)
```bash
# Start watch mode
context-manager watch

# With method-level analysis
context-manager watch -m

# Custom debounce (default: 1000ms)
context-manager watch --debounce 2000

# Output:
# 👁️ Watch mode active
# 📝 File change: src/server.js
#    ✅ Analysis complete: 12,450 tokens (45ms)
#    📊 Total: 64 files, 181,530 tokens
```

### 🌐 API Server (v3.0.0)
```bash
# Start API server
context-manager serve

# Custom port and authentication
context-manager serve --port 8080 --auth-token my-secret-token

# API Endpoints:
# GET  /api/v1/analyze       - Full project analysis
# GET  /api/v1/methods       - Extract methods from file
# GET  /api/v1/stats         - Project statistics
# GET  /api/v1/diff          - Git diff analysis
# POST /api/v1/context       - Smart context generation
# GET  /api/v1/docs          - API documentation

# Example API calls:
curl http://localhost:3000/api/v1/analyze
curl http://localhost:3000/api/v1/methods?file=src/server.js
curl http://localhost:3000/api/v1/diff?since=main
```

### Wrapper Script Usage
```bash
# Using the NPM package globally
context-manager
context-manager --save-report
context-manager --context-clipboard
```

## 🧪 Testing & Validation

### Test Repositories

Context Manager includes real-world test repositories for validation:

```bash
# Express.js test repo (git submodule)
cd test-repos/express

# Run full test suite
context-manager --cli -m --target-model claude-sonnet-4.5

# Git integration test
context-manager --changed-since v5.0.0

# Watch mode test
context-manager watch
```

See [test-repos/README.md](test-repos/README.md) for complete testing guide.

### Manual Testing

Complete manual testing guide available at [docs/MANUAL-TESTING-v3.0.md](docs/MANUAL-TESTING-v3.0.md)

Includes:
- ✅ 50+ test scenarios for all v3.0.0 features
- ✅ API endpoint validation
- ✅ Git integration testing
- ✅ Watch mode validation
- ✅ Performance benchmarks

### Automated Tests

```bash
# Run all tests
npm run test:comprehensive

# Run v3.0.0 specific tests
npm run test:v3
npm run test:git
npm run test:plugin
npm run test:api
npm run test:watch
```

## Current Configuration

The tool is configured to focus on **core application logic only**:

### ✅ Included (64 JS files, ~181k tokens)
- Core MCP server implementation (`utility-mcp/src/`)
- Authentication and security layers
- Request handlers and routing
- Transport protocols and communication
- Utilities and validation logic
- Configuration management
- Error handling and monitoring

### 🚫 Excluded via context ignore rules
- Documentation files (`.md`, `.txt`)
- Configuration files (`.json`, `.yml`)
- Infrastructure and deployment files
- Testing and script directories
- Build artifacts and dependencies
- Workflow orchestration files (`utility-mcp/src/workflows/**`)
- Testing utilities (`utility-mcp/src/testing/**`)
- All non-essential supporting files

## Usage

### Basic Analysis
```bash
# Interactive analysis with export selection
context-manager

# Quiet mode (no file listing)
context-manager --no-verbose

# With detailed JSON report
context-manager --save-report

# Generate LLM context file list
context-manager --context-export

# Copy context directly to clipboard
context-manager --context-clipboard
```

### Interactive Export Selection

When you run the tool without specifying export options (`--save-report`, `--context-export`, or `--context-clipboard`), it will automatically prompt you to choose an export option after the analysis:

```bash
# Run analysis and get prompted for export options
context-manager

# The tool will show:
# 📤 Export Options:
# 1) Save detailed JSON report (token-analysis-report.json)
# 2) Generate LLM context file (llm-context.json)
# 3) Copy LLM context to clipboard
# 4) No export (skip)
# 
# 🤔 Which export option would you like? (1-4):
```

This interactive mode ensures you never miss the opportunity to export your analysis results in the format you need.

## Include vs Exclude Modes

The token calculator supports two complementary filtering modes:

### EXCLUDE Mode (.contextignore)
- **Default mode** when only `.contextignore` exists
- Includes all files **except** those matching ignore patterns
- Traditional gitignore-style exclusion logic

### INCLUDE Mode (.contextinclude) 
- **Priority mode** - when `.contextinclude` exists, `.contextignore` is ignored
- Includes **only** files matching include patterns
- More precise control for specific file selection
- Perfect for creating focused analysis sets

### Mode Priority
1. If `.contextinclude` exists → **INCLUDE mode** (ignore `.contextignore`)
2. If only `.contextignore` exists → **EXCLUDE mode**
3. If neither exists → Include all files (respect `.gitignore` only)

### Example Usage
```bash
# EXCLUDE mode: Include everything except patterns in .contextignore
rm .contextinclude  # Remove include file
context-manager

# INCLUDE mode: Include only patterns in .contextinclude
# (automatically ignores .contextignore)
context-manager
```

### Help and Options
```bash
context-manager --help
```

### Available Options
- `--save-report`, `-s` - Save detailed JSON report
- `--no-verbose` - Disable file listing (verbose is default)
- `--context-export` - Generate LLM context file list (saves as llm-context.json)
- `--context-clipboard` - Copy LLM context directly to clipboard
- `--detailed-context` - Use detailed context format (8.6k chars, default is compact 1.2k)
- `--help`, `-h` - Show help message

## LLM Context Export

The token calculator can generate optimized file lists for LLM consumption, with two format options:

### Ultra-Compact Format (Default)
- **Size**: ~2.3k characters (structured JSON)
- **Content**: Project metadata and organized file paths without token counts
- **Format**: Identical to llm-context.json file - complete JSON structure
- **Perfect for**: LLM consumption, programmatic processing, structured data needs
- **Usage**: `--context-clipboard` or `--context-export`

### Detailed Format (Legacy)
- **Size**: ~8.6k characters (comprehensive)
- **Content**: Full paths, categories, importance scores, directory stats
- **Perfect for**: Initial project analysis, comprehensive documentation
- **Usage**: `--detailed-context --context-clipboard`

### Features
- **Smart file selection** - Top files by token count and importance
- **Directory grouping** - Common prefix compression saves space
- **Token abbreviation** - "12k" instead of "12,388 tokens"
- **Extension removal** - ".js" removed to save characters
- **Cross-platform clipboard** - Works on macOS, Linux, and Windows
- **Multiple output formats** - JSON file or clipboard ready text

### Usage

```bash
# Generate minimal LLM context and save to llm-context.json (2.3k chars JSON)
context-manager --context-export

# Copy minimal context directly to clipboard (2.3k chars JSON - identical to file)
context-manager --context-clipboard

# Copy detailed context to clipboard (8.6k chars)
context-manager --detailed-context --context-clipboard

# Combine with regular analysis
context-manager --save-report --context-clipboard
```

### Output Format Examples

**Compact Format (JSON - 2.3k chars):**
```json
{
  "project": {
    "root": "cloudstack-go-mcp-proxy",
    "totalFiles": 64,
    "totalTokens": 181480
  },
  "paths": {
    "utility-mcp/src/server/": [
      "CloudStackUtilityMCP.js"
    ],
    "utility-mcp/src/handlers/": [
      "workflow-handlers.js",
      "tool-handlers.js",
      "analytics-handler.js"
    ],
    "utility-mcp/src/utils/": [
      "security.js",
      "usage-tracker.js",
      "cache-warming.js"
    ]
  }
}
```

**Detailed Format (8.6k chars):**
```
# cloudstack-go-mcp-proxy Codebase Context

**Project:** 64 files, 181,480 tokens

**Core Files (Top 20):**
1. `utility-mcp/src/server/CloudStackUtilityMCP.js` (12,388 tokens, server)
2. `utility-mcp/src/handlers/workflow-handlers.js` (11,007 tokens, handler)
...

**All Files:**
```json
[{"path": "file.js", "t": 1234, "c": "core", "i": 85}]
```

**Use Cases**

**Compact Format (2.3k chars JSON):**
1. **LLM Integration** - Structured data for AI assistants with complete project context
2. **Programmatic Processing** - JSON format for automated tools and scripts  
3. **Context Sharing** - Identical format in clipboard and file exports
4. **Development Workflows** - Consistent structure for CI/CD and automation

**Detailed Format (8.6k chars):**
1. **Architecture Planning** - Comprehensive project overview for major decisions
2. **New Team Member Onboarding** - Complete codebase understanding
3. **Documentation Generation** - Full project structure analysis
4. **Code Review Preparation** - Detailed file relationships and importance

**General Use Cases:**
- Development workflow integration
- CI/CD pipeline context generation
- Automated documentation updates
- Project health monitoring

## GitIngest Format Export

Context-manager now supports generating GitIngest-style digest files - a single, prompt-friendly text file perfect for LLM consumption.

### What is GitIngest Format?

GitIngest format consolidates your entire codebase into a single text file with:
- Project summary and statistics
- Visual directory tree structure
- Complete file contents with clear separators
- Token count estimates

This format is inspired by [GitIngest](https://github.com/coderamp-labs/gitingest), implemented purely in JavaScript with zero additional dependencies.

### Usage

```bash
# Standard workflow - analyze and generate digest in one step
context-manager --gitingest
context-manager -g

# Combine with other exports
context-manager -g -s  # digest.txt + token-analysis-report.json

# Two-step workflow - generate digest from existing JSON (fast, no re-scan)
context-manager -s                                    # Step 1: Create report
context-manager --gitingest-from-report               # Step 2: Generate digest

# Or from LLM context
context-manager --context-export                      # Step 1: Create context
context-manager --gitingest-from-context              # Step 2: Generate digest

# With custom filenames
context-manager --gitingest-from-report my-report.json
context-manager --gitingest-from-context my-context.json
```

**Why use JSON-based digest?**
- ⚡ **Performance**: Instant digest generation without re-scanning
- 🔄 **Reusability**: Generate multiple digests from one analysis
- 📦 **Workflow**: Separate analysis from export steps
- 🎯 **Flexibility**: Use different JSON sources for different purposes

### Output Example

The generated `digest.txt` file looks like:

```
Directory: my-project
Files analyzed: 42

Estimated tokens: 15.2k
Directory structure:
└── my-project/
    ├── src/
    │   ├── index.js
    │   └── utils.js
    └── README.md


================================================
FILE: src/index.js
================================================
[complete file contents here]

================================================
FILE: src/utils.js
================================================
[complete file contents here]
```

### Key Features

- **Single File**: Everything in one file for easy LLM ingestion
- **Tree Visualization**: Clear directory structure
- **Token Estimates**: Formatted as "1.2k" or "1.5M"
- **Sorted Output**: Files sorted by token count (largest first)
- **Filter Compatible**: Respects all `.gitignore` and context ignore rules

### Use Cases

1. **LLM Context Windows**: Paste entire codebase as single context
2. **Code Reviews**: Share complete project snapshot
3. **Documentation**: Single-file project reference
4. **AI Analysis**: Perfect for ChatGPT, Claude, or other LLMs
5. **Archival**: Simple project snapshot format

### Version Tracking

Context-manager implements GitIngest format v0.3.1. See [docs/GITINGEST_VERSION.md](docs/GITINGEST_VERSION.md) for implementation details and version history.

## Configuration

### .contextignore File (EXCLUDE Mode)

The `.contextignore` file is pre-configured for core application analysis:

```bash
# Current focus: Only core JS files in utility-mcp/src/
# Excludes:
**/*.md              # All documentation
**/*.json            # All configuration files
**/*.yml             # All YAML files
infrastructure/**    # Infrastructure code
workflows/**         # Workflow definitions
docs/**              # Documentation directory
token-analysis/**    # Analysis tools themselves
utility-mcp/scripts/** # Utility scripts
utility-mcp/src/workflows/** # Workflow JS files
utility-mcp/src/testing/**   # Testing utilities
```

### .contextinclude File (INCLUDE Mode)

The `.contextinclude` file provides precise file selection:

```bash
# Include only core JavaScript files
# This should produce exactly 64 files

# Include main entry point
utility-mcp/index.js

# Include all src JavaScript files EXCEPT workflows and testing
utility-mcp/src/**/*.js

# Exclude specific subdirectories (using negation)
!utility-mcp/src/workflows/**
!utility-mcp/src/testing/**
```

### Creating Custom Configurations

**For EXCLUDE mode** (edit `.contextignore`):
```bash
# Remove lines to include more file types
# Add patterns to exclude specific files

# Example: Include documentation
# **/*.md    <- comment out or remove this line

# Example: Exclude specific large files
your-large-file.js
specific-directory/**
```

**For INCLUDE mode** (create `.contextinclude`):
```bash
# Include specific files or patterns
src/**/*.js          # All JS files in src
config/*.json        # Config files only
docs/api/**/*.md     # API documentation only

# Use negation to exclude from broad patterns
src/**/*.js
!src/legacy/**       # Exclude legacy code
!src/**/*.test.js    # Exclude test files
```

## Configuration File Priority

1. **`.gitignore`** (project root) - Standard git exclusions (always respected)
2. **`.contextinclude`** (token-analysis/) - INCLUDE mode (highest priority)
3. **`.contextignore`** (token-analysis/) - EXCLUDE mode (used when no include file)
4. **`.contextignore`** (project root) - Fallback EXCLUDE mode location

## Installation

For exact token counting, install tiktoken:

```bash
npm install tiktoken
```

Without tiktoken, the tool uses smart estimation (~95% accuracy).

## Output Example

```
🎯 PROJECT TOKEN ANALYSIS REPORT
================================================================================
📊 Total files analyzed: 64
🔢 Total tokens: 181,480
💾 Total size: 0.78 MB
📄 Total lines: 28,721
📈 Average tokens per file: 2,836
🚫 Files ignored by .gitignore: 11,912
📋 Files ignored by calculator rules: 198

📋 BY FILE TYPE:
--------------------------------------------------------------------------------
Extension         Files      Tokens   Size (KB)     Lines
--------------------------------------------------------------------------------
.js                  64     181,480       799.8    28,721

🏆 TOP 5 LARGEST FILES BY TOKEN COUNT:
--------------------------------------------------------------------------------
 1.   12,388 tokens (6.8%) - utility-mcp/src/server/CloudStackUtilityMCP.js
 2.   11,007 tokens (6.1%) - utility-mcp/src/handlers/workflow-handlers.js
 3.    7,814 tokens (4.3%) - utility-mcp/src/utils/security.js
 4.    6,669 tokens (3.7%) - utility-mcp/src/handlers/tool-handlers.js
 5.    5,640 tokens (3.1%) - utility-mcp/src/ci-cd/pipeline-integration.js
```

## Context Management

Perfect for LLM context window optimization:
- **181k tokens** = Core application logic only
- **Clean analysis** = No noise from docs, configs, or build files
- **Focused development** = Essential code for AI-assisted development
- **Context efficiency** = Maximum useful code per token
- **Dual mode flexibility** = Precise include/exclude control
- **Ultra-minimal export** = 1k chars (89% reduction) for frequent AI interactions
- **Detailed export** = 8.6k chars for comprehensive analysis when needed

## Integration

You can integrate this tool into:
- CI/CD pipelines for code size monitoring
- Pre-commit hooks for token budget checks
- Documentation generation workflows
- Code quality gates
- LLM context preparation workflows
- Development environment setup

## Troubleshooting

### Include vs Exclude Mode Issues
- **INCLUDE mode active**: Remove `.contextinclude` to use EXCLUDE mode
- **Wrong files included**: Check if `.contextinclude` exists (takes priority)
- **Mode confusion**: Use verbose mode to see which mode is active

### Patterns Not Working
- Ensure no inline comments in ignore/include pattern files
- Use file patterns (`docs/**`) instead of directory patterns (`docs/`)
- Test specific patterns with verbose mode
- Check pattern syntax: `**` for recursive, `*` for single level

### Token Count Issues
- **Too high**: Review included files with verbose mode, add exclusion patterns
- **Too low**: Check if important files are excluded, review patterns
- **Inconsistent**: Verify which mode is active (include vs exclude)

### Missing Expected Files
- Check if files are excluded by `.gitignore` (always respected)
- Verify calculator ignore/include patterns
- Ensure files are recognized as text files
- Use verbose mode to see exclusion reasons

# Context Manager

LLM context manager with method-level filtering and token optimization. The ultimate tool for AI-assisted development.

*Created by Hakkı Sağdıç*

## 🚀 Features

✅ **File-level token analysis** - Analyze entire files and directories
🔧 **Method-level analysis** - Extract and analyze specific methods from JavaScript/TypeScript/Rust/C#/Go/Java
📋 **Dual filtering system** - Include/exclude files and methods with pattern matching  
📊 **LLM context optimization** - Generate ultra-compact context for AI assistants  
🎯 **Exact token counting** - Uses tiktoken for GPT-4 compatible counts  
📤 **Multiple export formats** - JSON reports, clipboard, file exports  
📦 **NPM package** - Use programmatically or as global CLI tool  
🔍 **Pattern matching** - Wildcards and regex support for flexible filtering  
⚡ **Performance optimized** - 36% smaller codebase with enhanced functionality  

## 📦 Installation

### Option 1: NPM Package (Recommended)
```bash
# Local installation
npm install @hakkisagdic/context-manager

# Global installation
npm install -g @hakkisagdic/context-manager

# Run globally
context-manager --help
```

### Option 2: Direct Usage
```bash
# Clone and use directly
git clone <repository>
cd token-analysis
node token-calculator.js --help
```

## 🎯 Quick Start

### Basic Analysis
```bash
# Interactive analysis with export selection
context-manager

# File-level analysis with clipboard export
context-manager --context-clipboard

# Method-level analysis
context-manager --method-level --context-export

# Analysis with reports
context-manager --method-level --save-report --verbose
```

### Advanced Usage
```bash
# Focus on specific methods only
echo "calculateTokens\nhandleRequest\n*Validator" > .methodinclude
context-manager --method-level

# Exclude test methods
echo "*test*\n*debug*\nconsole" > .methodignore
context-manager --method-level --context-clipboard
```

## Usage

### Command Line Interface

```bash
# Basic analysis
context-manager

# Method-level analysis
context-manager --method-level

# Save detailed report
context-manager --save-report

# Copy context to clipboard
context-manager --context-clipboard

# Combine options
context-manager --method-level --save-report --verbose
```

### Programmatic Usage

```javascript
const { TokenAnalyzer } = require('@cloudstack/context-manager');

// Basic file-level analysis
const analyzer = new TokenAnalyzer('./src', {
    methodLevel: false,
    verbose: true
});

// Method-level analysis
const methodAnalyzer = new TokenAnalyzer('./src', {
    methodLevel: true,
    saveReport: true
});

analyzer.run();
```

## 🔧 Configuration

### File-Level Filtering

**Priority Order:**
1. `.gitignore` (project root) - Standard git exclusions (always respected)
2. `.contextinclude` - INCLUDE mode (highest priority for files)
3. `.contextignore` - EXCLUDE mode (fallback for files)

**`.contextinclude`** - Include only these files:
```bash
# Include only core JavaScript files
utility-mcp/src/**/*.js
!utility-mcp/src/testing/**
!utility-mcp/src/workflows/**
```

**`.contextignore`** - Exclude these files:  
```bash
# Exclude documentation and config
**/*.md
**/*.json
node_modules/**
test/
**/*.test.js
**/*.spec.js
```

### Method-Level Filtering

**`.methodinclude`** - Include only these methods:
```bash
# Core business logic methods
calculateTokens
generateLLMContext
analyzeFile
handleRequest
validateInput
processData

# Pattern matching
*Handler          # All methods ending with 'Handler'
*Validator        # All methods ending with 'Validator'
*Manager          # All methods ending with 'Manager'
TokenCalculator.* # All methods in TokenCalculator class
```

**`.methodignore`** - Exclude these methods:
```bash
# Utility and debug methods
console
*test*
*debug*
*helper*
print*
main

# File-specific exclusions
server.printStatus
utils.debugLog
```

### Pattern Syntax

| Pattern | Description | Example |
|---------|-------------|----------|
| `methodName` | Exact match | `calculateTokens` |
| `*pattern*` | Contains pattern | `*Handler` matches `requestHandler` |
| `Class.*` | All methods in class | `TokenCalculator.*` |
| `file.method` | Specific file method | `server.handleRequest` |
| `!pattern` | Negation (exclude) | `!*test*` |

## 📤 Output Formats

### 1. File-Level Context (Default)
**Use case:** General codebase analysis, file organization

```json
{
  "project": {
    "root": "my-project",
    "totalFiles": 64,
    "totalTokens": 181480
  },
  "paths": {
    "src/core/": ["server.js", "handler.js"],
    "src/utils/": ["helper.js", "validator.js"]
  }
}
```

### 2. Method-Level Context (`--method-level`)
**Use case:** Focused analysis, debugging specific methods, LLM context optimization

```json
{
  "project": {
    "root": "my-project",
    "totalFiles": 64,
    "totalTokens": 181480
  },
  "methods": {
    "src/server.js": [
      {"name": "handleRequest", "line": 15, "tokens": 234},
      {"name": "validateInput", "line": 45, "tokens": 156}
    ],
    "src/utils.js": [
      {"name": "processData", "line": 12, "tokens": 89}
    ]
  },
  "methodStats": {
    "totalMethods": 150,
    "includedMethods": 23,
    "totalMethodTokens": 5670
  }
}
```

### 3. Detailed Report (JSON)
**Use case:** Comprehensive analysis, CI/CD integration, historical tracking

```json
{
  "metadata": {
    "generatedAt": "2024-01-15T10:30:00.000Z",
    "projectRoot": "/path/to/project",
    "gitignoreRules": ["node_modules/**", "*.log"],
    "calculatorRules": ["src/**/*.js", "!src/test/**"]
  },
  "summary": {
    "totalFiles": 64,
    "totalTokens": 181480,
    "byExtension": {".js": {"count": 64, "tokens": 181480}},
    "largestFiles": [...]
  },
  "files": [...]
}
```

## CLI Options

| Option | Short | Description |
|--------|-------|-------------|
| `--save-report` | `-s` | Save detailed JSON report |
| `--verbose` | `-v` | Show included files and directories |
| `--context-export` | | Generate LLM context file |
| `--context-clipboard` | | Copy context to clipboard |
| `--method-level` | `-m` | Enable method-level analysis |
| `--help` | `-h` | Show help message |

## 📊 Use Cases & Examples

### 1. 🤖 LLM Context Optimization
**Goal:** Generate minimal context for AI assistants

```bash
# Ultra-compact method-level context
code-analyzer --method-level --context-clipboard

# Focus on core business logic only
echo "handleRequest\nprocessData\nvalidateInput" > .methodinclude
code-analyzer --method-level --context-export
```

**Result:** 89% smaller context compared to full codebase

### 2. 📊 Codebase Analysis  
**Goal:** Understand project complexity and structure

```bash
# Analysis with detailed reports
code-analyzer --save-report --verbose

# Track largest files and methods
code-analyzer --method-level --save-report
```

### 3. 🔍 Method-Level Debugging
**Goal:** Focus on specific problematic methods

```bash
# Debug authentication methods only
echo "*auth*\n*login*\n*validate*" > .methodinclude
code-analyzer --method-level --context-clipboard

# Exclude test and debug methods
echo "*test*\n*debug*\nconsole\nlogger" > .methodignore
code-analyzer --method-level
```

### 4. 🚀 CI/CD Integration
**Goal:** Monitor codebase growth and complexity

```bash
# Daily token analysis for monitoring
code-analyzer --save-report > reports/analysis-$(date +%Y%m%d).json

# Check method complexity trends
code-analyzer --method-level --save-report
```

### 5. 📈 Code Quality Gates
**Goal:** Ensure code stays within token budgets

```bash
# Check if codebase exceeds LLM context limits
TOKENS=$(code-analyzer --context-export | jq '.project.totalTokens')
if [ $TOKENS -gt 100000 ]; then
  echo "Codebase too large for LLM context!"
  exit 1
fi
```

## 🛠️ CLI Reference

### Core Options

| Option | Short | Description | Example |
|--------|-------|-------------|----------|
| `--save-report` | `-s` | Save detailed JSON report | `context-manager -s` |
| `--verbose` | `-v` | Show included files/methods | `context-manager -v` |
| `--context-export` | | Generate LLM context file | `context-manager --context-export` |
| `--context-clipboard` | | Copy context to clipboard | `context-manager --context-clipboard` |
| `--method-level` | `-m` | Enable method-level analysis | `context-manager -m` |
| `--help` | `-h` | Show help message | `context-manager -h` |

### Usage Patterns

```bash
# Quick analysis with interactive export
context-manager

# Method-level analysis with all outputs
context-manager --method-level --save-report --context-export --verbose

# LLM-optimized context generation
context-manager --method-level --context-clipboard

# CI/CD monitoring
context-manager --save-report --context-export

# Development debugging
context-manager --method-level --verbose
```

## 💻 Programmatic API

### Basic Usage

```javascript
const { TokenAnalyzer } = require('@hakkisagdic/context-manager');

// File-level analysis
const analyzer = new TokenAnalyzer('./src', {
  verbose: true,
  saveReport: true
});

analyzer.run();
```

### Method-Level Analysis

```javascript
const { TokenAnalyzer, MethodAnalyzer } = require('@hakkisagdic/code-analyzer');

// Method-level analysis with custom filtering
const analyzer = new TokenAnalyzer('./src', {
  methodLevel: true,
  contextExport: true,
  verbose: false
});

analyzer.run();

// Extract methods from specific file
const methodAnalyzer = new MethodAnalyzer();
const methods = methodAnalyzer.extractMethods(fileContent, 'server.js');
```

### Advanced Configuration

```javascript
const analyzer = new TokenAnalyzer('./src', {
  // Enable method-level analysis
  methodLevel: true,
  
  // Output options
  saveReport: true,
  contextExport: true,
  contextToClipboard: true,
  
  // Verbosity
  verbose: true,
  
  // Compact context (for LLM optimization)
  compactContext: true
});

// Access results
analyzer.run();
console.log('Analysis complete!');
```

### Custom Method Analysis

```javascript
const { MethodAnalyzer, MethodFilterParser } = require('@hakkisagdic/context-manager');

// Create custom method filter
const filter = new MethodFilterParser(
  './custom-methods.include',
  './custom-methods.ignore'
);

// Analyze specific file
const methodAnalyzer = new MethodAnalyzer();
const methods = methodAnalyzer.extractMethods(content, filePath);

// Filter methods
const filteredMethods = methods.filter(method => 
  filter.shouldIncludeMethod(method.name, fileName)
);
```

## Requirements

- **Node.js**: >= 14.0.0
- **tiktoken**: ^1.0.0 (optional, for exact token counts)

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create your feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📞 Support

- 🐛 [Report Issues](https://github.com/hakkisagdic/context-manager/issues)
- 📖 [Documentation](https://github.com/hakkisagdic/context-manager#readme)
- 💬 [Discussions](https://github.com/hakkisagdic/context-manager/discussions)

---

*Created with ❤️ by Hakkı Sağdıç*
