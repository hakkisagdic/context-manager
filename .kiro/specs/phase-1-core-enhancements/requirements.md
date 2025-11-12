# Requirements Document - Phase 1 Core Enhancements

## Introduction

This document outlines the requirements for implementing three critical features for Context Manager: Preset System, Token Budget Fitter, and Rule Debugger/Tracer. These features are essential for improving user experience, optimizing token usage, and providing better debugging capabilities.

## Glossary

- **Context Manager**: The main system that analyzes codebases and generates LLM-ready context
- **Preset**: A predefined configuration that includes filter rules, options, and settings for specific use cases
- **Token Budget**: The maximum number of tokens allowed in the generated context
- **Fitting Strategy**: An algorithm used to reduce token count to fit within budget constraints
- **Rule Tracer**: A debugging tool that explains why files and methods are included or excluded
- **Filter Pattern**: A glob or regex pattern used to include/exclude files or methods

## Requirements

### Requirement 1: Preset System

**User Story:** As a developer, I want to use predefined presets for common use cases, so that I don't have to manually configure filters every time.

#### Acceptance Criteria

1. WHEN the user runs `context-manager --list-presets`, THE Context Manager SHALL display all available presets with their descriptions
2. WHEN the user runs `context-manager --preset <name>`, THE Context Manager SHALL apply the specified preset configuration
3. WHEN the user runs `context-manager --preset-info <name>`, THE Context Manager SHALL display detailed information about the preset
4. WHERE a preset is selected, THE Context Manager SHALL create temporary filter files based on preset configuration
5. WHEN a preset includes token budget settings, THE Context Manager SHALL apply those settings to the analysis

### Requirement 2: Token Budget Fitter

**User Story:** As a developer, I want to automatically fit my codebase analysis within a specific token budget, so that I can ensure it fits within LLM context windows.

#### Acceptance Criteria

1. WHEN the user specifies `--target-tokens <number>`, THE Context Manager SHALL reduce the output to fit within the specified token budget
2. WHEN the user specifies `--fit-strategy <name>`, THE Context Manager SHALL use the specified strategy to reduce tokens
3. WHERE the strategy is "auto", THE Context Manager SHALL automatically select the best strategy based on the codebase
4. WHEN fitting is complete, THE Context Manager SHALL display a detailed report showing what was included and excluded
5. WHERE entry point files are detected, THE Context Manager SHALL preserve them during token reduction

### Requirement 3: Rule Debugger/Tracer

**User Story:** As a developer, I want to understand why specific files and methods are included or excluded, so that I can debug my filter configurations.

#### Acceptance Criteria

1. WHEN the user runs `context-manager --trace-rules`, THE Context Manager SHALL display detailed tracing information for all files
2. WHERE a file is included, THE Context Manager SHALL explain which rule caused the inclusion
3. WHERE a file is excluded, THE Context Manager SHALL explain which rule caused the exclusion
4. WHEN tracing is enabled, THE Context Manager SHALL show pattern analysis with match counts and examples
5. WHERE method filtering is active, THE Context Manager SHALL trace method-level inclusion/exclusion decisions

## Non-Functional Requirements

### Performance
- The Preset System SHALL load presets in less than 100ms
- The Token Budget Fitter SHALL process 1000 files in less than 5 seconds
- The Rule Tracer SHALL add no more than 10% overhead to analysis time

### Compatibility
- All features SHALL be backward compatible with existing CLI flags
- All features SHALL work with the current filter file system (.contextignore, .contextinclude, .methodignore, .methodinclude)
- All features SHALL integrate with the existing wizard mode

### Usability
- Preset names SHALL be descriptive and follow kebab-case naming convention
- Error messages SHALL be clear and actionable
- Documentation SHALL be provided for all new CLI flags

## Dependencies

- Existing Context Manager codebase (v3.0.0)
- Node.js 20.0.0+
- Existing filter parsing system (GitIgnoreParser, MethodFilterParser)
- Existing token calculation system (TokenCalculator)

## Success Criteria

- All acceptance criteria are met
- Test coverage is at least 80% for new code
- Documentation is complete and accurate
- Zero breaking changes to existing functionality
- User feedback is positive (measured through GitHub issues/discussions)
