# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**context-manager** is an AI Development Platform with plugin architecture, Git integration, REST API, and real-time analysis capabilities. It provides method-level filtering and exact token counting for 15+ programming languages, generating optimized context for AI assistants.

**Core Capabilities (v3.0.0):**
- **Plugin Architecture**: Modular system for languages and exporters
- **Git Integration**: Analyze changed files, diff analysis, author tracking
- **Watch Mode**: Real-time file monitoring and auto-analysis
- **REST API**: HTTP server with 6 endpoints for programmatic access
- **Performance**: Caching system and parallel processing (5-10x faster)
- **LLM Optimization**: Auto-detect target LLM and optimize context
- **Multi-language**: 15+ languages with method-level analysis
- **Multiple Formats**: TOON (40-50% reduction), JSON, YAML, CSV, XML, GitIngest, Markdown

**Phase 1 Core Enhancements (v3.1.0):**
- **Preset System**: 8 predefined configuration profiles (default, review, llm-explain, pair-program, security-audit, documentation, minimal, full)
- **Token Budget Fitter**: Intelligent file selection to fit LLM context windows with 5 fitting strategies
- **Rule Tracer**: Debug tool for tracking filter decisions and pattern usage
- **Smart Prioritization**: Entry points, core files weighted higher for optimization
- **One-Command Workflows**: Apply presets with `--preset review` for instant configuration

## Architecture

### v3.0.0 Modular Architecture

**Core Modules** (`lib/core/`):
- `Scanner.js` - File system scanning with ignore rules (2491 files in ~100ms)
- `Analyzer.js` - Token & method analysis with parallel processing
- `ContextBuilder.js` - Smart context generation with LLM optimization
- `Reporter.js` - Multi-format report generation

**Plugin System** (`lib/plugins/`):
- `PluginManager.js` - Plugin lifecycle management with lazy loading
- `LanguagePlugin.js` - Base class for language analyzers
- `ExporterPlugin.js` - Base class for format exporters

**Git Integration** (`lib/integrations/git/`):
- `GitClient.js` - Git operations wrapper (diff, blame, history)
- `DiffAnalyzer.js` - Change impact analysis and related files detection
- `BlameTracker.js` - Author attribution and hot spot detection

**Watch Mode** (`lib/watch/`):
- `FileWatcher.js` - Real-time file watching with debounce
- `IncrementalAnalyzer.js` - Incremental analysis with caching

**API Server** (`lib/api/rest/`):
- `server.js` - HTTP/REST API with 6 endpoints

**Performance** (`lib/cache/`):
- `CacheManager.js` - Disk/memory caching system (>80% hit rate)

**Phase 1 Enhancements** (`lib/presets/`, `lib/optimizers/`, `lib/debug/`):
- `PresetManager.js` - Preset configuration management with 8 predefined profiles
- `presets.json` - Preset definitions with filters, options, and metadata
- `TokenBudgetFitter.js` - Intelligent file selection for token budget optimization
- `FitStrategies.js` - 5 fitting strategies (auto, shrink-docs, balanced, methods-only, top-n)
- `RuleTracer.js` - Debug tool for tracking filter decisions and pattern usage

**Legacy Components** (backward compatible):
- `context-manager.js` - Legacy TokenCalculator (still supported)
- `lib/analyzers/` - Token calculator, method analyzer
- `lib/formatters/` - TOON, GitIngest formatters
- `lib/parsers/` - GitIgnore, method filter parsers
- `lib/utils/` - Token, file, clipboard, config, git, logger utils

**Entry Points**:
- `index.js` - Module exports for programmatic API
- `bin/cli.js` - CLI interface with wizard, serve, watch commands

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
npm test                  # Run basic tests
npm run test:all          # Run all test suites
npm run test:v3           # v3.0.0 core tests (12 tests)
npm run test:llm          # LLM detection tests
npm run test:git          # Git integration tests
npm run test:plugin       # Plugin system tests
npm run test:api          # API server tests
npm run test:watch        # Watch mode tests
npm run test:sqlserver    # SQL Server T-SQL support tests (30 tests)
npm run test:sql-dialects # Multi-dialect SQL tests (18 tests, 9 dialects)
npm run test:markup       # Markup language tests (30 tests: HTML, Markdown, XML)
npm run test:phase1       # v3.1.0 Phase 1 tests (presets, budget, tracer)
npm run test:phase1:presets  # Preset system tests
npm run test:phase1:budget   # Token budget fitter tests
npm run test:phase1:tracer   # Rule tracer tests
npm run test:comprehensive # Complete test suite
```

### Analysis
```bash
npm run analyze                   # Interactive wizard (default)
npm run analyze:cli               # CLI mode
npm run analyze:methods           # Method-level analysis
context-manager --save-report     # Detailed JSON report
context-manager -m --context-clipboard  # Method-level to clipboard
```

### v3.0.0 Platform Commands
```bash
npm run serve                     # Start API server (port 3000)
npm run watch                     # Start watch mode
context-manager --changed-only    # Analyze only changed files
context-manager --changed-since main  # Analyze changes since branch
context-manager --list-llms       # List supported LLM models
```

### v3.1.0 Phase 1 Commands
```bash
# Preset System
context-manager --list-presets           # Display all available presets
context-manager --preset review          # Apply code review preset
context-manager --preset llm-explain     # Apply LLM explain preset (ultra-compact)
context-manager --preset security-audit  # Apply security audit preset
context-manager --preset-info <id>       # Show detailed preset information

# Token Budget Optimization
context-manager --target-tokens 100000   # Set token budget (also: 100k, 50k)
context-manager --target-tokens 50k --fit-strategy auto  # Auto-select strategy
context-manager --fit-strategy shrink-docs  # Remove documentation files
context-manager --fit-strategy balanced     # Optimize token/file ratio
context-manager --fit-strategy methods-only # Extract methods from large files
context-manager --fit-strategy top-n        # Select most important files

# Debug & Tracing
context-manager --trace-rules            # Enable rule tracing
context-manager --trace-rules --preset review  # Trace with preset
```

### Build & Publish
```bash
npm run build          # No-op (no build required)
npm run prepublishOnly # Runs tests before publish
```

### Manual Testing
```bash
cd test-repos/express             # Navigate to Express test repo
context-manager --cli -m          # Test with Express.js
./scripts/quick-test-v3.sh        # Run quick test suite (9 tests)
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

### Preset System Workflow (v3.1.0)
1. List available presets: `context-manager --list-presets`
2. View preset details: `context-manager --preset-info review`
3. Apply preset: `context-manager --preset review`
4. Preset automatically generates temporary filter files (.contextinclude, .contextignore, .methodinclude)
5. Analysis runs with preset configuration
6. Cleanup: temporary filter files removed after analysis

**Available Presets:**
- **default**: Standard analysis with balanced settings
- **review**: Code review focused (100k token budget, method-level, GitIngest format)
- **llm-explain**: Ultra-compact for LLM consumption (50k tokens, methods-only strategy)
- **pair-program**: Interactive development context with full details
- **security-audit**: Security-relevant code patterns (auth, crypto, session files)
- **documentation**: Public API surfaces and documentation
- **minimal**: Entry points only (10k tokens, top-n strategy)
- **full**: Complete codebase analysis with all details

### Token Budget Optimization Workflow (v3.1.0)
1. Set target token budget: `--target-tokens 100000` (or use shorthand: `100k`)
2. Choose fitting strategy (optional): `--fit-strategy auto` (default)
3. System analyzes all files and calculates importance scores
4. Fitting algorithm selects optimal file subset
5. Export reflects only selected files within budget

**Importance Scoring:**
- Entry points (index.js, main.js, app.js): Highest priority
- Core directories (src/, lib/): Higher weight
- Test files: Lower weight
- Documentation files: Lower weight
- Custom patterns can be configured

**Fitting Strategies:**
- **auto**: Automatically selects best strategy based on analysis
- **shrink-docs**: Removes documentation files first (.md, docs/)
- **balanced**: Optimizes token-to-file ratio (removes large low-value files)
- **methods-only**: Extracts methods from large files instead of full content
- **top-n**: Selects N most important files to fit budget

### Rule Tracer Workflow (v3.1.0)
1. Enable tracing: `context-manager --trace-rules`
2. Run analysis as normal
3. Tracer records all filter decisions:
   - Files included/excluded and why (gitignore, contextignore, etc.)
   - Methods included/excluded and matching patterns
   - Pattern usage statistics
4. Review trace report showing:
   - Which patterns matched which files/methods
   - Unused patterns (patterns that never matched)
   - Most effective patterns
   - Decision reasons for each file/method

**Use Cases:**
- Debug why specific files are excluded
- Optimize filter patterns
- Understand filter effectiveness
- Identify unused/redundant patterns

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

**HTML:** Extracts structural elements:
- Headings: `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`
- Semantic sections: `<section>`, `<article>`, `<aside>`, `<nav>`, `<header>`, `<footer>`, `<main>` (with id/class)
- Components: `<div id="...">`, `<div class="...">` (divs with identifiers)
- Forms: `<form id="...">`, `<form name="...">`
- Scripts: `<script src="...">`, `<script id="...">`
- Custom elements: `<user-profile>`, `<data-grid>` (web components with hyphenated names)
- Templates: `<template id="...">`
- Supports: .html, .htm extensions

**Markdown:** Extracts document sections:
- Headings: `#`, `##`, `###`, `####`, `#####`, `######` (ATX-style)
- Code blocks: ` ```language ` (fenced code blocks with language identifiers)
- Lists: Ordered (`1.`, `2.`) and unordered (`-`, `*`, `+`)
- Link references: `[ref]: url`
- Supports: .md, .markdown extensions

**XML:** Extracts elements and metadata:
- Root elements: `<root xmlns="...">` (elements with namespace declarations)
- Elements with id: `<element id="...">`
- Elements with name: `<element name="...">`
- Processing instructions: `<?xml-stylesheet ...?>`
- Annotated comments: `<!-- TODO: ... -->`, `<!-- FIXME: ... -->`, `<!-- NOTE: ... -->`
- Namespaced elements: `<ns:element>`, `<build:target>`
- Supports: .xml extension

**SQL (10-Dialect Support with Auto-Detection):**

Automatically detects SQL dialect from content and extracts database objects using dialect-specific patterns. Supports 10 major SQL dialects with intelligent fallback to generic SQL parsing:

**SQL Server (T-SQL):** 9 object types
- Procedures: `CREATE/ALTER PROCEDURE` (supports `PROC`, `CREATE OR ALTER`, temp `#name`)
- Functions: `CREATE/ALTER FUNCTION` (scalar, table-valued, inline)
- Triggers: `CREATE/ALTER TRIGGER` (`AFTER`, `INSTEAD OF`)
- Views: `CREATE/ALTER VIEW` (`CREATE OR ALTER`)
- Types: `CREATE TYPE...AS TABLE`, `CREATE TYPE...FROM`
- Synonyms: `CREATE SYNONYM`
- Sequences: `CREATE SEQUENCE`
- Indexes: `CREATE INDEX` (CLUSTERED/NONCLUSTERED)
- Schema-qualified names: `dbo.ProcedureName`

**PostgreSQL (PL/pgSQL):** 8 object types
- Functions: `CREATE OR REPLACE FUNCTION...LANGUAGE plpgsql`
- Procedures: `CREATE OR REPLACE PROCEDURE`
- Triggers: `CREATE TRIGGER`
- Views: `CREATE OR REPLACE [MATERIALIZED] VIEW`
- Types: `CREATE TYPE` (composite, enum)
- Domains: `CREATE DOMAIN`
- Rules: `CREATE RULE`
- Operators: `CREATE OPERATOR`

**MySQL/MariaDB:** 5 object types
- Procedures: `CREATE PROCEDURE` (supports `DEFINER`, `DELIMITER $$`)
- Functions: `CREATE FUNCTION`
- Triggers: `CREATE TRIGGER`
- Views: `CREATE OR REPLACE VIEW` (supports `ALGORITHM`, `DEFINER`)
- Events: `CREATE EVENT` (Event Scheduler)
- Backtick names: `` `table-name` ``

**Oracle (PL/SQL):** 8 object types
- Procedures: `CREATE OR REPLACE PROCEDURE...IS`
- Functions: `CREATE OR REPLACE FUNCTION...RETURN`
- Triggers: `CREATE OR REPLACE TRIGGER`
- Views: `CREATE OR REPLACE [FORCE] VIEW`
- Packages: `CREATE OR REPLACE PACKAGE`
- Package Bodies: `CREATE OR REPLACE PACKAGE BODY`
- Types: `CREATE OR REPLACE TYPE`
- Type Bodies: `CREATE OR REPLACE TYPE BODY`

**SQLite:** 3 object types
- Triggers: `CREATE [TEMP] TRIGGER` (supports `INSTEAD OF`, `RAISE`)
- Views: `CREATE [TEMP] VIEW` (supports `IF NOT EXISTS`)
- Indexes: `CREATE [UNIQUE] INDEX` (partial, expression-based)

**Snowflake:** 7 object types
- Procedures: `CREATE OR REPLACE PROCEDURE...LANGUAGE [SQL|JAVASCRIPT|PYTHON|JAVA|SCALA]`
- Functions: `CREATE OR REPLACE [SECURE] FUNCTION` (UDF, UDTF)
- Views: `CREATE OR REPLACE [SECURE|MATERIALIZED] VIEW`
- Stages: `CREATE OR REPLACE STAGE` (internal, external S3/Azure)
- Pipes: `CREATE OR REPLACE PIPE` (with AUTO_INGEST)
- Streams: `CREATE OR REPLACE STREAM` (CDC, change tracking)
- Tasks: `CREATE OR REPLACE TASK` (scheduled, DAG-based)

**IBM DB2 (SQL PL):** 5 object types
- Procedures: `CREATE OR REPLACE PROCEDURE...LANGUAGE SQL` (MODE DB2SQL)
- Functions: `CREATE OR REPLACE FUNCTION` (scalar, table, deterministic)
- Triggers: `CREATE OR REPLACE TRIGGER` (MODE DB2SQL, REFERENCING)
- Views: `CREATE OR REPLACE VIEW` (WITH CHECK OPTION)
- Types: `CREATE OR REPLACE TYPE` (structured, distinct)

**Amazon Redshift:** 3 object types
- Procedures: `CREATE OR REPLACE PROCEDURE...LANGUAGE plpgsql` (transaction control)
- Functions: `CREATE OR REPLACE FUNCTION` (SQL, Python UDF, Lambda)
- Views: `CREATE OR REPLACE [MATERIALIZED] VIEW` (late binding, NO SCHEMA BINDING)

**Google BigQuery:** 3 object types
- Procedures: `CREATE OR REPLACE PROCEDURE` (Standard SQL, control flow)
- Functions: `CREATE OR REPLACE FUNCTION` (SQL UDF, JavaScript UDF, TABLE FUNCTION)
- Views: `CREATE OR REPLACE [MATERIALIZED] VIEW` (authorized views, STRUCT/ARRAY support)

**Generic SQL (Fallback):** Basic object extraction when dialect cannot be determined

**Auto-Detection Priority:** Snowflake → MySQL → BigQuery → Oracle → DB2 → Redshift → T-SQL → PostgreSQL → SQLite → Generic

**Detection Markers:**
- **Snowflake**: `LANGUAGE JAVASCRIPT|PYTHON`, `CREATE STAGE|PIPE|STREAM|TASK`, `RUNTIME_VERSION`
- **BigQuery**: `` `project.dataset.table` ``, `TABLE FUNCTION`, `INT64`, `STRUCT<`, triple-quote strings
- **MySQL**: `DELIMITER $$`, `CREATE DEFINER=`, `CREATE EVENT`
- **Oracle**: `CREATE PACKAGE`, `...IS`, `TYPE BODY`
- **DB2**: `MODE DB2SQL`, `DYNAMIC RESULT SETS`, `REFERENCING NEW AS...OLD AS`
- **Redshift**: `LANGUAGE plpythonu`, `WITH NO SCHEMA BINDING`, `DISTKEY|SORTKEY`
- **T-SQL**: `CREATE OR ALTER`, `GO` statement
- **PostgreSQL**: `LANGUAGE plpgsql`, `$$` function delimiters
- **SQLite**: `PRAGMA`, `AUTOINCREMENT`, `RAISE(ABORT)`, temp triggers

### Phase 1 Module Details (v3.1.0)

**PresetManager (`lib/presets/preset-manager.js`):**
- Loads and validates preset configurations from `presets.json`
- Generates temporary filter files from preset definitions
- Manages preset lifecycle (apply, cleanup)
- Exports: `PresetManager`, `PresetNotFoundError`, `InvalidPresetError`, `PresetLoadError`
- Key methods: `loadPresets()`, `getPreset(id)`, `applyPreset(id)`, `cleanupPresetFiles()`

**TokenBudgetFitter (`lib/optimizers/token-budget-fitter.js`):**
- Implements intelligent file selection to fit token budgets
- Calculates importance scores based on file paths and patterns
- Supports 5 fitting strategies via `FitStrategies` module
- Provides recommendations when budget cannot be met
- Exports: `TokenBudgetFitter`, `TokenBudgetError`, `ImpossibleFitError`
- Key methods: `fitToBudget(files, targetTokens, strategy)`, `calculateImportance(file)`
- Performance: <100ms for typical codebases

**FitStrategies (`lib/optimizers/fit-strategies.js`):**
- Implements 5 fitting strategies: auto, shrink-docs, balanced, methods-only, top-n
- Each strategy is a pure function: `(files, targetTokens, options) => selectedFiles`
- Auto strategy automatically selects best approach based on analysis
- Exports strategy functions and strategy metadata

**RuleTracer (`lib/debug/rule-tracer.js`):**
- Records filter decisions for debugging and optimization
- Tracks pattern matches for files and methods
- Provides statistics on pattern effectiveness
- Integrates with `GitIgnoreParser` and `MethodFilterParser`
- Exports: `RuleTracer`
- Key methods: `traceDecision(type, item, decision, reason)`, `getReport()`

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
- Minimal dependencies (only tiktoken as optional, React/Ink for UI)
- No TypeScript, pure JavaScript for maximum portability
- Modular architecture with clear separation of concerns
- Pure functions for strategies and algorithms (v3.1.0)
- Comprehensive error handling with custom error classes

## API Exports (v3.1.0)

The public API (`index.js`) exports all modules for programmatic usage:

**Core Modules:**
- `TokenCalculator`, `MethodAnalyzer`
- `GitIgnoreParser`, `MethodFilterParser`
- `GitIngestFormatter`, `ToonFormatter`, `FormatRegistry`
- `TokenUtils`, `FileUtils`, `ClipboardUtils`, `ConfigUtils`, `FormatConverter`, `ErrorHandler`
- `Logger`, `getLogger`, `createLogger`, `Updater`, `GitUtils`

**Phase 1 Modules (v3.1.0):**
- `PresetManager` - Preset configuration management
- `TokenBudgetFitter` - Token budget optimization
- `FitStrategies` - Fitting strategy implementations
- `RuleTracer` - Filter decision tracking

**Error Classes:**
- `PresetNotFoundError`, `InvalidPresetError`, `PresetLoadError`
- `TokenBudgetError`, `ImpossibleFitError`

**Functions:**
- `generateDigestFromReport`, `generateDigestFromContext`
