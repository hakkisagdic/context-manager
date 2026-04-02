# Context Manager

**AI Development Platform** with plugin architecture, Git integration, REST API, and watch mode. Supporting 14+ programming languages with method-level filtering, automatic LLM optimization, and real-time analysis. Perfect for AI-assisted development workflows.

**v3.0.0** - Platform Foundation Release 🚀

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

### 🎨 User Interface

- 🧙 **Interactive Wizard Mode** - User-friendly guided setup (default)
- 💻 **CLI Mode** - Traditional command-line interface (--cli flag)
- 📤 **Interactive export** - Prompts for export choice when no options specified

### 🔢 Token Analysis

- ✅ **Exact token counting** using tiktoken (GPT-4 compatible)
- 🌍 **Multi-language support** - 14+ languages: JavaScript, TypeScript, Python, PHP, Ruby, Java, Kotlin, C#, Go, Rust, Swift, C/C++, Scala
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

## Usage

```bash
context-manager                    # Interactive wizard (default)
context-manager --cli              # CLI mode
context-manager --cli -s           # Save detailed JSON report
context-manager --cli --context-clipboard  # Copy context to clipboard
context-manager --cli -m           # Method-level analysis
context-manager --cli -g           # GitIngest digest
```

When no export options are specified, the tool prompts for export selection interactively.

## Include vs Exclude Modes

When `.contextinclude` exists, it activates **INCLUDE mode** (ignoring `.contextignore`). Otherwise, **EXCLUDE mode** uses `.contextignore` patterns. See the Configuration section below for details and examples.

### Available Options

- `--save-report`, `-s` - Save detailed JSON report
- `--no-verbose` - Disable file listing (verbose is default)
- `--context-export` - Generate LLM context file list (saves as llm-context.json)
- `--context-clipboard` - Copy LLM context directly to clipboard
- `--detailed-context` - Use detailed context format (8.6k chars, default is compact 1.2k)
- `--method-level`, `-m` - Enable method-level analysis
- `--help`, `-h` - Show help message

## LLM Context Export

The token calculator generates optimized file lists for LLM consumption, with two format options:

### Ultra-Compact Format (Default)

- **Size**: ~2.3k characters (structured JSON)
- **Content**: Project metadata and organized file paths without token counts
- **Perfect for**: LLM consumption, programmatic processing
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
- **Cross-platform clipboard** - Works on macOS, Linux, and Windows

```bash
# Generate minimal LLM context and save to llm-context.json
context-manager --context-export

# Copy minimal context directly to clipboard
context-manager --context-clipboard

# Copy detailed context to clipboard (8.6k chars)
context-manager --detailed-context --context-clipboard

# Combine with regular analysis
context-manager --save-report --context-clipboard
```

## GitIngest Format Export

Generate a single, prompt-friendly text file with your entire codebase for LLM consumption. Inspired by [GitIngest](https://github.com/coderamp-labs/gitingest).

```bash
context-manager --gitingest         # Generate digest.txt
context-manager -g -s               # digest.txt + token-analysis-report.json
context-manager --gitingest-from-report  # Generate from existing JSON (no re-scan)
context-manager --gitingest-from-context # Generate from LLM context file
```

Output includes project summary, directory tree, and complete file contents sorted by token count. See [docs/GITINGEST_VERSION.md](docs/GITINGEST_VERSION.md) for version details.

## Configuration

### File-Level Filtering

**Priority Order:**

1. `.gitignore` (always respected)
2. `.contextinclude` - INCLUDE mode (highest priority for files)
3. `.contextignore` - EXCLUDE mode (fallback for files)

**`.contextinclude`** (INCLUDE mode) - include only matching files:

```bash
utility-mcp/src/**/*.js
!utility-mcp/src/workflows/**
!utility-mcp/src/testing/**
```

**`.contextignore`** (EXCLUDE mode) - exclude matching files:

```bash
**/*.md
**/*.json
**/*.yml
node_modules/**
**/*.test.js
```

Use negation (`!pattern`) to exclude from broad include patterns.

## Output Example

```
🎯 PROJECT TOKEN ANALYSIS REPORT
📊 Total files analyzed: 64
🔢 Total tokens: 181,480
💾 Total size: 0.78 MB
📄 Total lines: 28,721

🏆 TOP 5 LARGEST FILES:
 1. 12,388 tokens - utility-mcp/src/server/CloudStackUtilityMCP.js
 2. 11,007 tokens - utility-mcp/src/handlers/workflow-handlers.js
 3.  7,814 tokens - utility-mcp/src/utils/security.js
```

## Troubleshooting

### Include vs Exclude Mode Issues

- Remove `.contextinclude` to use EXCLUDE mode
- Check if `.contextinclude` exists (takes priority)
- Use verbose mode to see which mode is active

### Patterns Not Working

- Ensure no inline comments in ignore/include pattern files
- Use file patterns (`docs/**`) instead of directory patterns (`docs/`)
- Check pattern syntax: `**` for recursive, `*` for single level

### Token Count Issues

- **Too high**: Review included files with verbose mode, add exclusion patterns
- **Too low**: Check if important files are excluded, review patterns
- **Inconsistent**: Verify which mode is active (include vs exclude)

### Advanced Method Filtering

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

#### Method Pattern Syntax

| Pattern       | Description          | Example                             |
| ------------- | -------------------- | ----------------------------------- |
| `methodName`  | Exact match          | `calculateTokens`                   |
| `*pattern*`   | Contains pattern     | `*Handler` matches `requestHandler` |
| `Class.*`     | All methods in class | `TokenCalculator.*`                 |
| `file.method` | Specific file method | `server.handleRequest`              |
| `!pattern`    | Negation (exclude)   | `!*test*`                           |

## 📊 Use Cases & Examples

### 1. LLM Context Optimization

```bash
# Ultra-compact method-level context
context-manager --method-level --context-clipboard

# Focus on core business logic only
echo "handleRequest\nprocessData\nvalidateInput" > .methodinclude
context-manager --method-level --context-export
```

### 2. Codebase Analysis

```bash
# Analysis with detailed reports
context-manager --save-report --verbose

# Track largest files and methods
context-manager --method-level --save-report
```

### 3. Method-Level Debugging

```bash
# Debug authentication methods only
echo "*auth*\n*login*\n*validate*" > .methodinclude
context-manager --method-level --context-clipboard

# Exclude test and debug methods
echo "*test*\n*debug*\nconsole\nlogger" > .methodignore
context-manager --method-level
```

### 4. CI/CD Integration

```bash
# Daily token analysis for monitoring
context-manager --save-report > reports/analysis-$(date +%Y%m%d).json

# Check method complexity trends
context-manager --method-level --save-report
```

### 5. Code Quality Gates

```bash
# Check if codebase exceeds LLM context limits
TOKENS=$(context-manager --context-export | jq '.project.totalTokens')
if [ $TOKENS -gt 100000 ]; then
  echo "Codebase too large for LLM context!"
  exit 1
fi
```

## 💻 Programmatic API

### Basic Usage

```javascript
const { TokenAnalyzer } = require('@hakkisagdic/context-manager');

// File-level analysis
const analyzer = new TokenAnalyzer('./src', {
  verbose: true,
  saveReport: true,
});

analyzer.run();
```

### Method-Level Analysis

```javascript
const { TokenAnalyzer, MethodAnalyzer } = require('@hakkisagdic/context-manager');

// Method-level analysis with custom filtering
const analyzer = new TokenAnalyzer('./src', {
  methodLevel: true,
  contextExport: true,
  verbose: false,
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
  compactContext: true,
});

// Access results
analyzer.run();
console.log('Analysis complete!');
```

### Custom Method Analysis

```javascript
const { MethodAnalyzer, MethodFilterParser } = require('@hakkisagdic/context-manager');

// Create custom method filter
const filter = new MethodFilterParser('./custom-methods.include', './custom-methods.ignore');

// Analyze specific file
const methodAnalyzer = new MethodAnalyzer();
const methods = methodAnalyzer.extractMethods(content, filePath);

// Filter methods
const filteredMethods = methods.filter((method) =>
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

_Created with ❤️ by Hakkı Sağdıç_
