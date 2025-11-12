# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.0] - 2025-01-XX

### Added - Phase 1 Core Enhancements

#### 🎨 Preset System
- **8 predefined configuration profiles** for common use cases:
  - `default` - Standard analysis with balanced settings
  - `review` - Code review focused (100k token budget)
  - `llm-explain` - Ultra-compact for LLM consumption (50k tokens)
  - `pair-program` - Interactive development context
  - `security-audit` - Security-relevant code patterns
  - `documentation` - Public API surfaces
  - `minimal` - Entry points only (10k tokens)
  - `full` - Complete codebase analysis
- New CLI commands:
  - `--list-presets` - Display all available presets
  - `--preset <id>` - Apply a preset configuration
  - `--preset-info <id>` - Show detailed preset information
- Automatic filter file generation from presets
- Preset cleanup after analysis

#### 🎯 Token Budget Fitter
- **Intelligent file selection** to fit within LLM context windows
- **5 fitting strategies**:
  - `auto` - Automatically select best strategy
  - `shrink-docs` - Remove documentation files
  - `balanced` - Optimize token/file ratio
  - `methods-only` - Extract methods from large files
  - `top-n` - Select most important files
- New CLI options:
  - `--target-tokens <number>` - Set token budget (e.g., 100000, 50k)
  - `--fit-strategy <name>` - Choose fitting strategy
- **Importance scoring** for file prioritization:
  - Entry points get highest priority
  - Core directories weighted higher
  - Test files weighted lower
  - Custom priority patterns support
- Visual feedback showing:
  - Files selected and total tokens
  - Reduction percentage
  - Strategy used
  - Recommendations for optimization

#### 🔍 Rule Tracer (Debug Tool)
- **Real-time filter decision tracking**
- Records file and method inclusion/exclusion decisions
- Pattern usage analysis
- New CLI option:
  - `--trace-rules` - Enable rule tracing
- Detailed trace reports showing:
  - Which patterns matched which files
  - Pattern effectiveness statistics
  - Unused patterns detection
  - Decision reasons (gitignore, contextignore, etc.)

### Changed

- **CLI output enhancement**: Token budget fitting results now displayed to users
- **Export integration**: Token budget fitting applied before all exports (JSON, YAML, CSV, GitIngest)
- **Parser integration**: GitIgnoreParser and MethodFilterParser now support rule tracing
- **Test suite expansion**: Added 93 new tests for Phase 1 features (100% pass rate)
- **API exports**: Added Phase 1 modules to public API:
  - `PresetManager`
  - `TokenBudgetFitter`
  - `FitStrategies`
  - `RuleTracer`
  - Error classes: `PresetNotFoundError`, `InvalidPresetError`, `PresetLoadError`, `TokenBudgetError`, `ImpossibleFitError`

### Fixed

- **Strategy recommendation algorithm**: Fixed `overBudgetPercent` calculation (was dividing by `totalTokens`, now correctly divides by `targetTokens`)
- **CLI feedback**: Token budget results now properly displayed to users
- **Methods-only threshold**: Adjusted from 70% to 100% for better strategy selection

### Developer Experience

- New npm scripts:
  - `npm run test:phase1` - Run all Phase 1 tests
  - `npm run test:phase1:presets` - Test preset system
  - `npm run test:phase1:budget` - Test token budget fitter
  - `npm run test:phase1:tracer` - Test rule tracer
- Comprehensive documentation in new modules:
  - `lib/presets/README.md` - Preset system guide
  - `lib/optimizers/README.md` - Token budget optimization guide
  - `lib/debug/README.md` - Rule tracer usage guide

### Performance

- Token budget fitting executes in <100ms for typical codebases
- Preset application is instantaneous
- Rule tracing adds negligible overhead (<5% performance impact)

### Backward Compatibility

- ✅ **100% backward compatible** - All existing commands work unchanged
- No breaking changes to API or CLI
- Existing workflows unaffected

---

## [3.0.0] - 2025-01-09

### Added - Platform Foundation

#### Plugin Architecture
- Modular plugin system with lazy loading
- `PluginManager` for plugin lifecycle management
- Base classes: `LanguagePlugin`, `ExporterPlugin`
- Hot-reload support for plugins

#### Git Integration
- `GitClient` - Git operations wrapper
- `DiffAnalyzer` - Change impact analysis
- `BlameTracker` - Author attribution
- New CLI options:
  - `--changed-only` - Analyze only changed files
  - `--changed-since <branch>` - Compare against branch

#### REST API Server
- 6 HTTP endpoints for programmatic access
- `npm run serve` to start API server (port 3000)
- JSON response format
- CORS support

#### Watch Mode
- Real-time file monitoring with `FileWatcher`
- `IncrementalAnalyzer` with smart caching
- Auto-analysis on file changes
- `npm run watch` command

#### Performance Improvements
- `CacheManager` with >80% hit rate
- Parallel processing (5-10x faster)
- Disk/memory caching system
- Scans 2491 files in ~100ms

### Changed
- Architecture refactored into modular core (`Scanner`, `Analyzer`, `ContextBuilder`, `Reporter`)
- Package renamed to `@hakkisagdic/context-manager`

---

## [2.3.8] - 2024-12-XX

### Added
- Wizard profiles system with named configurations
- Profile save/load functionality

---

## [2.3.7] - 2024-12-XX

### Added
- LLM auto-detection feature
- `--auto-detect-llm` flag
- `--list-llms` command

---

## [2.3.0-2.3.6] - 2024-12-XX

### Added
- Modern stack migration
- Config file rename support
- Enhanced logging system
- GitIngest format support

---

## [2.2.0] - 2024-11-XX

### Added
- Support for 7 new programming languages:
  - C#, Go, Java, Ruby, Kotlin, Swift, Scala
- Total language support: 14+ languages

---

## [2.1.0] - 2024-11-XX

### Added
- Multi-language support
- GitIngest format
- Method-level analysis

---

## [2.0.0] - 2024-10-XX

### Added
- TOON format support (40-50% token reduction)
- Multiple output formats (JSON, YAML, CSV, XML)

---

## [1.0.0] - 2024-XX-XX

### Added
- Initial release
- Basic token calculation
- .gitignore support
- JavaScript/TypeScript support

---

[3.1.0]: https://github.com/hakkisagdic/context-manager/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/hakkisagdic/context-manager/compare/v2.3.8...v3.0.0
[2.3.8]: https://github.com/hakkisagdic/context-manager/releases/tag/v2.3.8
