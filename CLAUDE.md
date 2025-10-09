# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**context-manager** is an LLM context optimization tool with method-level filtering and exact token counting. It analyzes JavaScript/TypeScript codebases and generates optimized file/method lists for AI assistant consumption.

**Core Capabilities:**
- File-level and method-level token analysis using tiktoken (GPT-4 compatible)
- Dual filtering system (include/exclude modes) for files and methods
- Multiple output formats: JSON reports, LLM context exports, clipboard integration
- Pattern matching with wildcards and negation support
- CLI tool and programmatic API

## Architecture

### Main Components

**[context-manager.js](context-manager.js)** - Core analysis engine containing:
- `TokenCalculator` - Main orchestrator for file scanning, token counting, and reporting
- `GitIgnoreParser` - Handles .gitignore, .calculatorignore, .calculatorinclude pattern matching
- `MethodAnalyzer` - Extracts methods from JavaScript/TypeScript files using regex patterns
- `MethodFilterParser` - Filters methods based on .methodinclude/.methodignore rules

**[index.js](index.js)** - Module entry point, exports all core classes for programmatic usage

**[bin/cli.js](bin/cli.js)** - CLI wrapper that parses arguments and invokes TokenAnalyzer

### Filtering System

**Priority Order:**
1. `.gitignore` (always respected)
2. `.calculatorinclude` (INCLUDE mode - when exists, ignores .calculatorignore)
3. `.calculatorignore` (EXCLUDE mode - fallback)
4. `.methodinclude` (method-level INCLUDE mode)
5. `.methodignore` (method-level EXCLUDE mode)

**Pattern Syntax:**
- `**/*.js` - Recursive glob
- `!pattern` - Negation
- `*Handler` - Wildcard matching
- `Class.*` - Class method matching

### Token Counting

Uses tiktoken library (cl100k_base encoding) for exact GPT-4 token counts. Falls back to smart estimation (~95% accuracy) based on file extension if tiktoken unavailable.

## Development Commands

### Testing
```bash
npm test           # Run basic tests
npm run test:all   # Run comprehensive test suite
```

### Analysis
```bash
npm run analyze                  # Interactive analysis
npm run analyze:methods          # Method-level analysis
context-manager --save-report    # Detailed JSON report
context-manager -m --context-clipboard  # Method-level to clipboard
```

### Build & Publish
```bash
npm run build          # No-op (no build required)
npm run prepublishOnly # Runs tests before publish
```

## Key Workflows

### File-Level Analysis
1. Scan directory tree recursively
2. Apply .gitignore rules
3. Apply calculator include/exclude rules
4. Calculate tokens for each file
5. Generate statistics and reports

### Method-Level Analysis
1. Extract methods from JS/TS files using regex patterns
2. Filter methods using .methodinclude/.methodignore
3. Calculate tokens per method
4. Generate method-centric context

### LLM Context Export
Generates compact JSON format:
```json
{
  "project": { "root": "...", "totalFiles": 64, "totalTokens": 181480 },
  "paths": { "src/core/": ["server.js", "handler.js"] }
}
```

Method-level format includes method names, line numbers, and token counts per file.

## Important Implementation Details

### Method Extraction Patterns
Uses 4 regex patterns to detect function declarations:
- Named functions: `function name()`
- Object methods: `name: function()`
- Arrow functions: `const name = () =>`
- Async functions: `async name()`

### Configuration File Discovery
Searches in order:
1. Script directory (`__dirname`)
2. Project root (`process.cwd()`)

### Cross-Platform Clipboard
Supports macOS (pbcopy), Linux (xclip/xsel), Windows (clip) via child_process.execSync

### Interactive Export Mode
When no export flags provided, prompts user to choose:
1. Save detailed JSON report
2. Generate LLM context file
3. Copy to clipboard
4. Skip export

## Code Style

- ES6 class syntax for core components
- Regex-based parsing (no AST dependencies)
- Graceful fallbacks (tiktoken optional, clipboard fallback to file)
- Minimal dependencies (only tiktoken as optional)
- No TypeScript, pure JavaScript for maximum portability
