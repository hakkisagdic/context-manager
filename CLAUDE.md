# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**context-manager** is a universal LLM context optimization tool with method-level filtering and exact token counting. It analyzes codebases in 14+ programming languages and generates optimized file/method lists for AI assistant consumption.

**Core Capabilities:**
- File-level and method-level token analysis using tiktoken (GPT-4 compatible)
- Multi-language support: JavaScript, TypeScript, Python, PHP, Ruby, Java, Kotlin, C#, Go, Rust, Swift, C/C++, and Scala
- Dual filtering system (include/exclude modes) for files and methods
- Multiple output formats: JSON reports, LLM context exports, clipboard integration
- Pattern matching with wildcards and negation support
- CLI tool and programmatic API

## Architecture

### Main Components

**[context-manager.js](context-manager.js)** - Core analysis engine containing:
- `TokenCalculator` - Main orchestrator for file scanning, token counting, and reporting
- `GitIgnoreParser` - Handles .gitignore, .contextignore, .contextinclude pattern matching
- `MethodAnalyzer` - Extracts methods from 14+ programming languages using regex patterns
- `GoMethodAnalyzer` - Specialized analyzer for Go functions, methods, and interfaces
- `MethodFilterParser` - Filters methods based on .methodinclude/.methodignore rules

**[index.js](index.js)** - Module entry point, exports all core classes for programmatic usage

**[bin/cli.js](bin/cli.js)** - CLI wrapper that parses arguments and invokes TokenAnalyzer

### Filtering System

**Priority Order:**
1. `.gitignore` (always respected)
2. `.contextinclude` (INCLUDE mode - when exists, ignores .contextignore)
3. `.contextignore` (EXCLUDE mode - fallback)
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
3. Apply context include/exclude rules
4. Calculate tokens for each file
5. Generate statistics and reports

### Method-Level Analysis
1. Extract methods from 14+ programming languages using language-specific regex patterns
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

**JavaScript/TypeScript:** Uses 5 regex patterns to detect function declarations:
- Named functions: `function name()`
- Object methods: `name: function()`
- Arrow functions: `const name = () =>`
- Async functions: `async name()`
- Getters/Setters: `get/set name()`
- Class methods: `name() {}`

**Rust:** Uses regex patterns to detect:
- Free functions: `pub fn function_name()` or `fn function_name()`
- Impl methods: `fn method_name()` (inside impl blocks)
- Supports modifiers: `async`, `const`, `unsafe`, `pub`

**C#:** Uses 3 regex patterns to detect methods:
- Standard methods: `public/private/protected/internal static/async returnType MethodName(params)`
- Properties: `Type PropertyName { get; set; }`
- Expression-bodied members: `Type MethodName() => expression`
- Supports generic types, constraints, and all access modifiers

**Go:** Uses 3 regex patterns to detect functions and methods:
- Regular functions: `func FunctionName(params) returnType`
- Methods with receivers: `func (r *Receiver) MethodName(params) returnType`
- Interface methods: `MethodName(params) returnType` (within interface declarations)

**Java:** Uses 2 regex patterns to detect method declarations:
- Methods with modifiers: `public/private/protected static returnType methodName()`
- Constructors: `ClassName()`
- Supports generic types, throws clauses, and access modifiers

**Python:** Uses 2 regex patterns to detect:
- Functions: `def function_name()` or `async def function_name()`
- Decorated methods: `@staticmethod/@classmethod def method_name()`

**PHP:** Uses 2 regex patterns to detect:
- Functions: `function function_name()`
- Methods: `public/private/protected static function method_name()`

**Ruby:** Detects method definitions:
- Methods: `def method_name` or `def self.method_name`
- Supports question/exclamation marks: `method?` and `method!`

**Kotlin:** Detects function definitions:
- Functions: `fun functionName()` with support for `suspend`, `inline` modifiers
- Extension functions: `Type.functionName()`

**Swift:** Uses 2 regex patterns:
- Functions: `func functionName()` with access modifiers
- Initializers: `init()`

**C/C++:** Uses 2 regex patterns:
- Functions: Return type + function name with optional `virtual`, `static`, `inline` modifiers
- Constructors: `ClassName::ClassName()`

**Scala:** Detects methods and functions:
- Methods: `def methodName` with optional `override`
- Lambda assignments: `val name = () => ...`

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
