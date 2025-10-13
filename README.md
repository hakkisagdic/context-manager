# Context Manager

LLM context optimization tool with method-level filtering and token analysis. Perfect for AI-assisted development workflows.

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
- **`.calculatorignore`** - Files to exclude from token calculation (EXCLUDE mode)
- **`.calculatorinclude`** - Files to include in token calculation (INCLUDE mode)
- **`README.md`** - This documentation file
- **`README-tr.md`** - Turkish documentation (Türkçe dokümantasyon)

## Features

- ✅ **Exact token counting** using tiktoken (GPT-4 compatible)
- 🚫 **Dual ignore system** - respects both `.gitignore` and calculator ignore rules
- 📋 **Include/Exclude modes** - `.calculatorinclude` takes priority over `.calculatorignore`
- 📊 **Detailed reporting** - by file type, largest files, statistics
- 💾 **Optional JSON export** - detailed analysis reports
- 🔍 **Verbose mode (default)** - shows all included files for transparency
- 🎯 **Core application focus** - configured to analyze only essential JS files
- 📈 **Context optimization** - perfect for LLM context window management
- 🤖 **LLM context export** - generate optimized file lists for LLM consumption
- 📋 **Clipboard integration** - copy context directly to clipboard
- ⚡ **JSON format** - Structured clipboard output identical to llm-context.json file
- 🎯 **LLM-optimized** - Clean directory structure without token counts
- 🔗 **Consistent exports** - Clipboard and file exports use identical JSON format
- 📤 **Interactive export** - Prompts for export choice when no options specified
- 🔀 **Dual context modes** - compact (default) or detailed format
- 📄 **GitIngest format** - Generate single-file digest for LLM consumption (inspired by [GitIngest](https://github.com/coderamp-labs/gitingest))

## Quick Start

### Core Application Analysis (Default)
```bash
# Interactive analysis with export selection
context-manager

# Analyze with minimal LLM context format
context-manager --context-clipboard

# Save detailed report
context-manager --save-report

# Generate LLM context file
context-manager --context-export

# Generate GitIngest-style digest (single file for LLMs)
context-manager --gitingest

# Method-level analysis
context-manager --method-level

# Combine multiple exports
context-manager -g -s  # GitIngest digest + detailed report

# Use detailed context format (legacy)
context-manager --method-level --detailed-context --context-clipboard
```

### Wrapper Script Usage
```bash
# Using the NPM package globally
context-manager
context-manager --save-report
context-manager --context-clipboard
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

### 🚫 Excluded via calculator ignore rules
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

### EXCLUDE Mode (.calculatorignore)
- **Default mode** when only `.calculatorignore` exists
- Includes all files **except** those matching ignore patterns
- Traditional gitignore-style exclusion logic

### INCLUDE Mode (.calculatorinclude) 
- **Priority mode** - when `.calculatorinclude` exists, `.calculatorignore` is ignored
- Includes **only** files matching include patterns
- More precise control for specific file selection
- Perfect for creating focused analysis sets

### Mode Priority
1. If `.calculatorinclude` exists → **INCLUDE mode** (ignore `.calculatorignore`)
2. If only `.calculatorignore` exists → **EXCLUDE mode**
3. If neither exists → Include all files (respect `.gitignore` only)

### Example Usage
```bash
# EXCLUDE mode: Include everything except patterns in .calculatorignore
rm .calculatorinclude  # Remove include file
context-manager

# INCLUDE mode: Include only patterns in .calculatorinclude
# (automatically ignores .calculatorignore)
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
- **Filter Compatible**: Respects all `.gitignore` and calculator ignore rules

### Use Cases

1. **LLM Context Windows**: Paste entire codebase as single context
2. **Code Reviews**: Share complete project snapshot
3. **Documentation**: Single-file project reference
4. **AI Analysis**: Perfect for ChatGPT, Claude, or other LLMs
5. **Archival**: Simple project snapshot format

### Version Tracking

Context-manager implements GitIngest format v0.3.1. See [docs/GITINGEST_VERSION.md](docs/GITINGEST_VERSION.md) for implementation details and version history.

## Configuration

### .calculatorignore File (EXCLUDE Mode)

The `.calculatorignore` file is pre-configured for core application analysis:

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

### .calculatorinclude File (INCLUDE Mode)

The `.calculatorinclude` file provides precise file selection:

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

**For EXCLUDE mode** (edit `.calculatorignore`):
```bash
# Remove lines to include more file types
# Add patterns to exclude specific files

# Example: Include documentation
# **/*.md    <- comment out or remove this line

# Example: Exclude specific large files
your-large-file.js
specific-directory/**
```

**For INCLUDE mode** (create `.calculatorinclude`):
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
2. **`.calculatorinclude`** (token-analysis/) - INCLUDE mode (highest priority)
3. **`.calculatorignore`** (token-analysis/) - EXCLUDE mode (used when no include file)
4. **`.calculatorignore`** (project root) - Fallback EXCLUDE mode location

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
- **INCLUDE mode active**: Remove `.calculatorinclude` to use EXCLUDE mode
- **Wrong files included**: Check if `.calculatorinclude` exists (takes priority)
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
🔧 **Method-level analysis** - Extract and analyze specific methods from JavaScript/TypeScript  
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
2. `.calculatorinclude` - INCLUDE mode (highest priority for files)
3. `.calculatorignore` - EXCLUDE mode (fallback for files)

**`.calculatorinclude`** - Include only these files:
```bash
# Include only core JavaScript files
utility-mcp/src/**/*.js
!utility-mcp/src/testing/**
!utility-mcp/src/workflows/**
```

**`.calculatorignore`** - Exclude these files:  
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
