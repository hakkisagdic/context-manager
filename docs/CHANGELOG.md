# Changelog

All notable changes to the Context Manager will be documented in this file.

## [1.2.0] - 2025-10-13

### Added
- 🎯 **GitIngest Format Export** - Generate single-file digest for LLM consumption
  - New `GitIngestFormatter` class for digest generation
  - `--gitingest` / `-g` CLI flag for digest export
  - Creates `digest.txt` with project summary, tree structure, and file contents
  - Format inspired by [GitIngest](https://github.com/coderamp-labs/gitingest) v0.3.1
  - Pure JavaScript implementation with zero additional dependencies
  - Respects all `.gitignore` and calculator filter rules
  - Files sorted by token count (largest first)
  - Token estimates formatted as "1.2k" or "1.5M"
- 📄 **Version Tracking** - Added `docs/GITINGEST_VERSION.md` for format tracking
- 🧪 **GitIngest Tests** - New `test/test-gitingest.js` with 10 comprehensive tests
- 📦 **New npm scripts**:
  - `test:gitingest` - Run GitIngest integration tests
  - `analyze:gitingest` - Quick digest generation
  - Updated `test:comprehensive` to include GitIngest tests
- 📚 **Documentation Updates**:
  - README.md updated with GitIngest section
  - Examples and use cases for digest format
  - Version tracking documentation

### Changed
- 📤 **Interactive Export Menu** - Added GitIngest as option 4 (was 4 options, now 5)
- 🔧 **Token Output** - Added `token-analysis-report.json` to `.gitignore`

## [1.1.2] - 2025-10-13

### Fixed
- 🐛 **LLM Context Path Generation** - Fixed hardcoded `utility-mcp/src/` prefix in `generateCompactPaths` method
  - Paths now correctly use project-relative structure
  - Root directory files grouped under `/` instead of empty string
  - Eliminates incorrect path prefixes in LLM context exports

### Added
- ✨ **GitHub Actions Manual Trigger** - Added `workflow_dispatch` to npm-publish workflow for manual testing

## [1.1.1] - 2025-10-09

### Fixed
- 🐛 **Package.json bin path** - Fixed bin script path format for npm standards

## [1.1.0] - 2025-10-09

### 🎉 Major Quality & Feature Release

#### Fixed (7 Critical Bugs)
- 🐛 **Method duplication bug** - Fixed duplicate method extraction using Map-based deduplication with `name:line` keys
- 🐛 **NaN in average calculation** - Added conditional check when totalFiles is 0, now shows "N/A"
- 🐛 **Class method detection** - Added shorthand pattern to properly detect class methods
- 🐛 **Special characters support** - Method names with `$` and `_` now properly detected using `[\w$_]+` pattern
- 🐛 **Getter/setter duplication** - Prevented duplicate extraction with processedLines Map tracking
- 🐛 **Configuration paths** - Fixed .calculatorinclude with correct project paths (index.js, context-manager.js, bin/cli.js)
- 🐛 **Test suite paths** - Corrected all test file paths from `token-analysis/` to root directory

#### Added
- ✨ **Comprehensive test suite** - 70+ tests with 100% success rate
  - `test/unit-tests.js` - 34 comprehensive unit tests
  - Enhanced `test/test.js` - 25 tests (improved from 3)
  - Enhanced `test/test-suite.js` - 17+ integration tests
- ✨ **Support section** - Added "Buy Me A Coffee" button and QR code to README files
- ✨ **Turkish documentation** - Complete translation of all 17 documentation files
  - docs/content-tr/ with full Turkish translations
  - Technical terms kept in English for clarity
  - Organized in Temel-Ozellikler/ and Yapilandirma/ directories
- ✨ **CLAUDE.md** - AI assistant guidance documentation for Claude Code
- ✨ **Test documentation** - TEST_SUMMARY.md with detailed test coverage information
- ✨ **Improvement docs** - CODE_IMPROVEMENTS.md and IMPROVEMENTS_COMPLETED.md
- 📦 **New npm scripts**:
  - `test:unit` - Run comprehensive unit tests
  - `test:comprehensive` - Run all test suites
- 📚 **Documentation files**:
  - Kurulum.md, Hizli-Baslangic-Rehberi.md, Arac-Genel-Bakis-ve-Temel-Deger.md
  - CLI-Referans.md, Cikti-Formatlari.md, Kullanim-Senaryolari.md
  - Sorun-Giderme.md, Gelismis-Yapilandirma.md, Programatik-API.md, Katki-Rehberi.md

#### Changed
- 🔧 **Method extraction patterns** - Enhanced regex patterns with better type tagging
  - Support for export functions: `export function name()`
  - Support for async functions: `async function name()`
  - Support for getters/setters: `get/set name()`
  - Support for arrow functions with async
  - Improved shorthand method detection
- 🔧 **Pattern processing order** - Optimized pattern priority to prevent overlaps
- 🔧 **Deduplication strategy** - Dual Map tracking (methodsMap + processedLines)
- 📝 **Error handling** - Better user-facing messages (N/A instead of NaN)
- 🎯 **Test coverage** - Increased from ~60% to ~95%

#### Improved
- 📊 **Test quality** - 100% success rate across all test suites
- 🔍 **Method detection** - Now captures class methods, getters, setters correctly
- 🎯 **Edge case handling** - Tests for empty code, nested functions, Unicode, special chars
- 📈 **Code quality** - Better separation of concerns, clearer pattern definitions

### Technical Details
- **Total Tests:** 70+ (25 basic + 34 unit + 17+ integration)
- **Test Success Rate:** 100% across all suites
- **Bug Fixes:** 7 critical issues resolved
- **Documentation:** 17 new Turkish files + 4 technical docs
- **Code Coverage:** ~95%
- **Performance:** < 30 seconds for all tests

### Breaking Changes
None - Fully backward compatible

## [1.0.3] - 2024-10-09

### Changed
- 📝 **File naming consistency** - Renamed `token-calculator.js` to `context-manager.js` for better alignment with package identity
- 🔧 **Help text update** - Updated direct usage examples to show `node context-manager.js`
- 📋 **Package files** - Added `context-manager.js` to NPM package files list
- 🎯 **Documentation** - Updated file references in README and Turkish documentation

## [1.0.2] - 2024-10-09

### Fixed
- 📝 **Documentation consistency** - Updated all command examples to use `context-manager` instead of old script paths
- 🎯 **Title correction** - Changed from "Token Analysis Tools" to "Context Manager" 
- 🔧 **Help text alignment** - CLI help now matches documentation examples
- 🌍 **Turkish README** - Updated Turkish documentation with consistent command examples
- ✨ **Branding consistency** - All documentation now properly reflects the Context Manager identity

## [1.0.1] - 2024-10-09

### Fixed
- 📝 **Documentation cleanup** - Removed references to deleted `analyze-tokens.js` wrapper script
- 🔧 **Package branding** - Updated from "Code Analyzer" to "Context Manager" 
- 📋 **NPM page accuracy** - Fixed documentation to reflect actual package structure

### Changed
- 🎯 **Package name** - Rebranded to `@hakkisagdic/context-manager` for better LLM focus
- 📦 **CLI command** - Updated to `context-manager` for consistency
- 📖 **Documentation** - Updated all references to use new package name

## [1.0.0] - 2024-10-09

### Added
- 🎉 **Initial release** of Context Manager
- 📊 **File-level analysis** with gitignore support
- 🔧 **Method-level analysis** for JavaScript/TypeScript files
- 📋 **Dual filtering system** (include/exclude patterns)
- 🎯 **Exact token counting** using tiktoken library
- 📤 **Multiple export formats** (JSON, clipboard, file)
- 📦 **NPM package** with CLI and programmatic API
- 🔍 **Pattern matching** with wildcards and regex support
- ⚡ **Performance optimization** (36% smaller codebase)
- 📚 **Documentation** with examples

*Created by Hakkı Sağdıç*

### Features
- File-level token analysis with directory organization
- Method-level granular analysis with line numbers
- LLM context optimization (99.76% size reduction)
- Interactive export selection
- CLI interface with multiple options
- Programmatic API for integration
- Configuration file support (.methodinclude/.methodignore)
- Cross-platform clipboard support
- Detailed reporting with statistics
- Verbose mode for debugging

### CLI Options
- `--save-report, -s` - Save detailed JSON report
- `--verbose, -v` - Show included files and directories
- `--context-export` - Generate LLM context file
- `--context-clipboard` - Copy context to clipboard
- `--method-level, -m` - Enable method-level analysis
- `--help, -h` - Show help message

### Configuration Files
- `.calculatorinclude` - Include only specified files
- `.calculatorignore` - Exclude specified files
- `.methodinclude` - Include only specified methods
- `.methodignore` - Exclude specified methods

### API Classes
- `TokenAnalyzer` - Main analysis class
- `MethodAnalyzer` - Method extraction and analysis
- `MethodFilterParser` - Method filtering logic
- `GitIgnoreParser` - File filtering logic

### Use Cases
- LLM context optimization for AI assistants
- Codebase complexity analysis
- Method-level debugging and analysis
- CI/CD integration for monitoring
- Development workflow optimization

### Technical Details
- Node.js >= 14.0.0 support
- Optional tiktoken dependency for exact counts
- Cross-platform compatibility (macOS, Linux, Windows)
- Pattern matching with glob syntax
- JSON-based configuration and output
- Memory-efficient processing
- Error handling and validation

### Documentation
- Comprehensive README with examples
- API reference documentation
- Configuration guide
- Use case scenarios
- Installation instructions
- Test suite and validation

### Performance
- Analyzes 64 files (181k tokens) in <2 seconds
- Reduces context size by 99.76% for LLM use
- Memory efficient processing
- Optimized regex patterns
- Minimal dependencies

### Package Structure
```
@hakkisagdic/context-manager/
├── index.js              # Main entry point
├── bin/cli.js            # CLI interface
├── token-calculator.js   # Core functionality
├── test/                 # Test suite
├── package.json          # NPM configuration
├── README.md             # Documentation
└── CHANGELOG.md          # This file
```

---

## Development Notes

### Code Quality
- 36% reduction in code size while adding major features
- Best practices implementation
- Comprehensive error handling
- Clean separation of concerns
- Modular architecture

### Testing
- 15+ test scenarios covered
- 100% success rate in validation
- Method extraction accuracy verified
- CLI functionality validated
- API completeness confirmed

### Future Enhancements
- Support for additional languages (Python, Java, etc.)
- Advanced method complexity analysis
- Integration with popular IDEs
- Web interface for analysis
- Cloud-based processing options