# Design Document - Phase 1 Core Enhancements

## Overview

This document describes the design for three core enhancement features: Preset System, Token Budget Fitter, and Rule Debugger/Tracer. These features will be implemented as modular components that integrate seamlessly with the existing Context Manager architecture.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Context Manager CLI                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Core Orchestrator                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Preset     │  │    Token     │  │     Rule     │     │
│  │   Manager    │  │    Budget    │  │    Tracer    │     │
│  │              │  │    Fitter    │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Existing Core Components                        │
│  Scanner → Analyzer → ContextBuilder → Reporter             │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
1. User runs: context-manager --preset review --target-tokens 100k --trace-rules

2. CLI parses flags and initializes components:
   ├─ PresetManager.load('review')
   ├─ TokenBudgetFitter.configure(100000, 'auto')
   └─ RuleTracer.enable()

3. PresetManager applies configuration:
   ├─ Creates temporary filter files
   ├─ Sets analysis options
   └─ Configures token budget

4. Scanner scans files with RuleTracer active:
   ├─ RuleTracer records each file decision
   └─ Returns file list

5. Analyzer processes files:
   ├─ Calculates tokens
   └─ Extracts methods

6. TokenBudgetFitter optimizes:
   ├─ Checks if over budget
   ├─ Applies fitting strategy
   └─ Returns optimized file list

7. Reporter generates output:
   ├─ Includes fit report
   └─ Includes trace information (if enabled)
```

## Components and Interfaces

### 1. Preset System

#### PresetManager Class

```javascript
class PresetManager {
  constructor(presetsPath = '.context-manager/presets.json')
  
  // Load all available presets
  loadPresets(): Preset[]
  
  // Get a specific preset by name
  getPreset(name: string): Preset | null
  
  // Apply a preset configuration
  applyPreset(name: string, projectRoot: string): AppliedPreset
  
  // List all preset names and descriptions
  listPresets(): PresetInfo[]
  
  // Get detailed information about a preset
  getPresetInfo(name: string): PresetDetails | null
  
  // Cleanup temporary files created by preset
  cleanup(appliedPreset: AppliedPreset): void
}
```

#### Preset Data Structure

```javascript
interface Preset {
  id: string;                    // Unique identifier (kebab-case)
  name: string;                  // Display name
  description: string;           // Short description
  icon?: string;                 // Optional emoji icon
  
  filters: {
    include?: string[];          // Include patterns
    exclude?: string[];          // Exclude patterns
    methodInclude?: string[];    // Method include patterns
    methodExclude?: string[];    // Method exclude patterns
  };
  
  options: {
    methodLevel?: boolean;       // Enable method-level analysis
    gitingest?: boolean;         // Generate GitIngest format
    sortBy?: string;             // Sort order (tokens-desc, name, etc.)
    targetTokens?: number;       // Target token budget
    fitStrategy?: string;        // Fitting strategy
  };
  
  metadata?: {
    header?: string;             // Custom header for output
    tags?: string[];             // Tags for categorization
    bestFor?: string[];          // Use case descriptions
  };
}
```

#### File Structure

```
lib/presets/
├── preset-manager.js           # Main PresetManager class
├── presets.json                # Preset definitions
├── preset-validator.js         # Validate preset structure
└── README.md                   # Documentation
```

### 2. Token Budget Fitter

#### TokenBudgetFitter Class

```javascript
class TokenBudgetFitter {
  constructor(targetTokens: number, strategy: string = 'auto')
  
  // Fit files to token budget
  fitToWindow(files: FileInfo[], options: FitOptions): FitResult
  
  // Calculate importance score for a file
  calculateImportance(file: FileInfo): number
  
  // Check if files fit within budget
  checkFit(files: FileInfo[]): boolean
  
  // Get recommended strategy for current situation
  recommendStrategy(files: FileInfo[], targetTokens: number): string
  
  // Generate fit report
  generateReport(result: FitResult): FitReport
}
```

#### FitStrategies Module

```javascript
class FitStrategies {
  // Automatically select best strategy
  static auto(files: FileInfo[], targetTokens: number): FileInfo[]
  
  // Remove documentation and comments first
  static shrinkDocs(files: FileInfo[], targetTokens: number): FileInfo[]
  
  // Extract only methods, exclude full files
  static methodsOnly(files: FileInfo[], targetTokens: number): FileInfo[]
  
  // Select top N files by importance
  static topN(files: FileInfo[], targetTokens: number): FileInfo[]
  
  // Balance coverage vs size
  static balanced(files: FileInfo[], targetTokens: number): FileInfo[]
}
```

#### Data Structures

```javascript
interface FitOptions {
  preserveEntryPoints?: boolean;  // Keep entry points (index.js, main.py, etc.)
  minFiles?: number;              // Minimum number of files to include
  maxFiles?: number;              // Maximum number of files to include
  priorityPatterns?: string[];    // Patterns for high-priority files
}

interface FitResult {
  files: FileInfo[];              // Files that fit within budget
  totalTokens: number;            // Total tokens after fitting
  originalTokens: number;         // Original token count
  reduction: number;              // Token reduction amount
  reductionPercent: number;       // Reduction percentage
  strategy: string;               // Strategy used
  excluded: FileInfo[];           // Files that were excluded
  metadata: {
    entryPointsPreserved: number;
    filesIncluded: number;
    filesExcluded: number;
    averageImportance: number;
  };
}

interface FitReport {
  summary: string;                // Human-readable summary
  details: {
    strategy: string;
    targetTokens: number;
    actualTokens: number;
    fit: 'perfect' | 'good' | 'tight';
  };
  recommendations?: string[];     // Suggestions for improvement
}
```

#### File Structure

```
lib/optimizers/
├── token-budget-fitter.js      # Main TokenBudgetFitter class
├── fit-strategies.js           # Strategy implementations
├── importance-scorer.js        # File importance calculation
└── README.md                   # Documentation
```

### 3. Rule Debugger/Tracer

#### RuleTracer Class

```javascript
class RuleTracer {
  constructor(options: TracerOptions = {})
  
  // Enable tracing
  enable(): void
  
  // Disable tracing
  disable(): void
  
  // Record a file decision
  recordFileDecision(file: string, decision: Decision): void
  
  // Record a method decision
  recordMethodDecision(file: string, method: string, decision: Decision): void
  
  // Get trace results
  getTrace(): TraceResult
  
  // Generate trace report
  generateReport(): TraceReport
  
  // Analyze patterns
  analyzePatterns(patterns: string[]): PatternAnalysis[]
}
```

#### Data Structures

```javascript
interface Decision {
  included: boolean;              // Was it included?
  reason: string;                 // Why was this decision made?
  rule?: string;                  // Which rule matched?
  ruleSource?: string;            // Source file (.gitignore, .contextignore, etc.)
  priority?: number;              // Rule priority
  mode?: 'INCLUDE' | 'EXCLUDE';   // Current mode
}

interface TraceResult {
  files: Map<string, Decision>;   // File decisions
  methods: Map<string, Map<string, Decision>>; // Method decisions
  patterns: PatternAnalysis[];    // Pattern analysis
  summary: {
    totalFiles: number;
    includedFiles: number;
    excludedFiles: number;
    totalMethods: number;
    includedMethods: number;
    excludedMethods: number;
  };
}

interface PatternAnalysis {
  pattern: string;                // The pattern
  source: string;                 // Source file
  matchCount: number;             // Number of matches
  examples: string[];             // Example matches (up to 5)
  unused: boolean;                // Was this pattern used?
}

interface TraceReport {
  fileDecisions: FileDecisionReport[];
  methodDecisions: MethodDecisionReport[];
  patternAnalysis: PatternAnalysis[];
  summary: string;
}
```

#### File Structure

```
lib/debug/
├── rule-tracer.js              # Main RuleTracer class
├── decision-formatter.js       # Format decisions for display
├── pattern-analyzer.js         # Analyze pattern usage
└── README.md                   # Documentation
```

## Data Models

### FileInfo (Enhanced)

```javascript
interface FileInfo {
  path: string;                   // Absolute path
  relativePath: string;           // Relative to project root
  name: string;                   // File name
  extension: string;              // File extension
  size: number;                   // File size in bytes
  tokens: number;                 // Token count
  lines: number;                  // Line count
  
  // New fields for optimization
  importance?: number;            // Importance score (0-100)
  isEntryPoint?: boolean;         // Is this an entry point?
  category?: string;              // File category (core, util, test, etc.)
  
  // New fields for tracing
  decision?: Decision;            // Inclusion/exclusion decision
  
  // Existing fields
  methods?: MethodInfo[];         // Extracted methods
  content?: string;               // File content
}
```

## Error Handling

### Preset System Errors

```javascript
class PresetNotFoundError extends Error {
  constructor(presetName: string) {
    super(`Preset "${presetName}" not found`);
    this.name = 'PresetNotFoundError';
  }
}

class InvalidPresetError extends Error {
  constructor(presetName: string, reason: string) {
    super(`Invalid preset "${presetName}": ${reason}`);
    this.name = 'InvalidPresetError';
  }
}
```

### Token Budget Fitter Errors

```javascript
class TokenBudgetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenBudgetError';
  }
}

class ImpossibleFitError extends TokenBudgetError {
  constructor(targetTokens: number, minTokens: number) {
    super(`Cannot fit within ${targetTokens} tokens. Minimum required: ${minTokens}`);
    this.name = 'ImpossibleFitError';
  }
}
```

### Error Recovery Strategy

1. **Graceful Degradation**: If a preset fails to load, fall back to default configuration
2. **Informative Messages**: Provide clear error messages with actionable suggestions
3. **Partial Success**: If token fitting fails, return the best possible result with warnings
4. **Logging**: Log all errors to help with debugging

## Testing Strategy

### Unit Tests

1. **Preset System**
   - Test preset loading and validation
   - Test preset application and cleanup
   - Test error handling for invalid presets
   - Test preset listing and info retrieval

2. **Token Budget Fitter**
   - Test each fitting strategy independently
   - Test importance scoring algorithm
   - Test edge cases (empty files, very large files)
   - Test strategy recommendation logic

3. **Rule Tracer**
   - Test decision recording
   - Test trace report generation
   - Test pattern analysis
   - Test performance overhead

### Integration Tests

1. Test preset + token budget fitter integration
2. Test preset + rule tracer integration
3. Test all three features working together
4. Test CLI flag combinations

### Performance Tests

1. Benchmark preset loading time (target: < 100ms)
2. Benchmark token fitting for 1000 files (target: < 5s)
3. Benchmark rule tracing overhead (target: < 10%)

## Integration Points

### CLI Integration

```javascript
// In context-manager.js or bin/cli.js

// Preset flags
program
  .option('--preset <name>', 'Use a predefined preset')
  .option('--list-presets', 'List all available presets')
  .option('--preset-info <name>', 'Show detailed preset information');

// Token budget flags
program
  .option('--target-tokens <number>', 'Target token budget')
  .option('--fit-strategy <strategy>', 'Token fitting strategy (auto, shrink-docs, methods-only, top-n, balanced)');

// Rule tracer flags
program
  .option('--trace-rules', 'Enable rule tracing and show detailed decisions');
```

### Wizard Integration

The wizard should be enhanced to:
1. Allow preset selection (already partially implemented)
2. Allow token budget specification
3. Optionally enable rule tracing for debugging

### API Integration

```javascript
// In lib/api/rest/server.js

// New endpoint for presets
GET /api/v1/presets              // List all presets
GET /api/v1/presets/:name        // Get preset details

// Enhanced context endpoint
POST /api/v1/context
{
  "preset": "review",            // Optional preset
  "targetTokens": 100000,        // Optional token budget
  "fitStrategy": "auto",         // Optional strategy
  "traceRules": true             // Optional tracing
}
```

## Performance Considerations

### Preset System
- Cache loaded presets in memory
- Lazy load preset definitions
- Minimize file I/O operations

### Token Budget Fitter
- Use efficient sorting algorithms
- Cache importance scores
- Parallelize file processing where possible

### Rule Tracer
- Use efficient data structures (Map instead of Object)
- Limit trace history size
- Provide option to disable tracing for production use

## Security Considerations

1. **Preset Validation**: Validate all preset configurations before applying
2. **Path Traversal**: Prevent path traversal attacks in preset file paths
3. **Resource Limits**: Limit maximum preset size and complexity
4. **Sanitization**: Sanitize all user inputs in CLI flags

## Backward Compatibility

All new features must:
1. Not break existing CLI flags
2. Not modify existing file formats
3. Work with existing filter files
4. Be optional (disabled by default)
5. Provide migration path if needed

## Documentation Requirements

1. **User Documentation**
   - CLI flag reference
   - Preset creation guide
   - Token budget optimization guide
   - Rule debugging guide

2. **Developer Documentation**
   - API reference for each class
   - Integration examples
   - Extension points for custom strategies

3. **Examples**
   - Example presets for common use cases
   - Example token budget scenarios
   - Example trace output interpretation

## Future Enhancements

1. **Preset System**
   - User-defined custom presets
   - Preset inheritance and composition
   - Preset marketplace/sharing

2. **Token Budget Fitter**
   - Machine learning-based importance scoring
   - Context-aware fitting (preserve related files)
   - Multi-objective optimization

3. **Rule Tracer**
   - Visual trace viewer (web UI)
   - Export trace to JSON/HTML
   - Interactive pattern testing

## Success Metrics

1. **Adoption**: 50%+ of users use presets within first month
2. **Effectiveness**: Token budget fitter achieves 95%+ success rate
3. **Usability**: Rule tracer reduces filter configuration time by 50%
4. **Performance**: All performance targets met
5. **Quality**: Zero critical bugs in first release
