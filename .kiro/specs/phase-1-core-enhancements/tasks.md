# Implementation Plan - Phase 1 Core Enhancements

## Overview

This implementation plan breaks down the development of three core features into discrete, manageable coding tasks. Each task builds incrementally on previous work and includes clear objectives and requirements references.

---

## Task List

- [x] 1. Set up project structure and core interfaces
  - Create directory structure for all three features
  - Define TypeScript-style JSDoc interfaces for type safety
  - Set up module exports in index.js
  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 2. Implement Preset System
  - [ ] 2.1 Create preset data structures and validation
    - Implement Preset interface with JSDoc
    - Create PresetValidator class for schema validation
    - Write validation rules for preset structure
    - _Requirements: 1.1, 1.2_
  
  - [ ] 2.2 Implement PresetManager core functionality
    - Create PresetManager class with constructor
    - Implement loadPresets() method to read presets.json
    - Implement getPreset(name) method with error handling
    - Implement listPresets() method for CLI display
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 2.3 Implement preset application logic
    - Create applyPreset() method to generate temporary filter files
    - Implement file naming strategy (.contextinclude-preset-name)
    - Add cleanup() method to remove temporary files
    - Handle preset options (methodLevel, gitingest, etc.)
    - _Requirements: 1.2, 1.4_
  
  - [ ] 2.4 Create default preset definitions
    - Write presets.json with 8 default presets (default, review, llm-explain, pair-program, security-audit, documentation, minimal, full)
    - Include filter patterns for each preset
    - Add metadata (description, icon, bestFor)
    - _Requirements: 1.1, 1.5_
  
  - [x] 2.5 Integrate with CLI
    - Add --preset flag to CLI parser
    - Add --list-presets flag with formatted output
    - Add --preset-info flag with detailed display
    - Handle preset errors gracefully
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 2.6 Create preset documentation
    - Write lib/presets/README.md with usage examples
    - Document preset structure and creation guide
    - Add troubleshooting section
    - _Requirements: 1.1_

- [ ] 3. Implement Token Budget Fitter
  - [ ] 3.1 Create importance scoring algorithm
    - Implement ImportanceScorer class
    - Create calculateImportance() method with multiple factors
    - Consider file size, extension, path depth, naming patterns
    - Detect entry points (index.js, main.py, app.js, etc.)
    - _Requirements: 2.5_
  
  - [ ] 3.2 Implement fitting strategies
    - Create FitStrategies class with static methods
    - Implement auto() strategy with intelligent selection
    - Implement shrinkDocs() strategy to remove documentation
    - Implement methodsOnly() strategy for method extraction
    - Implement topN() strategy to select most important files
    - Implement balanced() strategy for coverage vs size
    - _Requirements: 2.2, 2.3_
  
  - [ ] 3.3 Create TokenBudgetFitter core class
    - Implement TokenBudgetFitter constructor with configuration
    - Create fitToWindow() method as main entry point
    - Implement checkFit() method to verify token count
    - Add recommendStrategy() method for auto selection
    - _Requirements: 2.1, 2.2_
  
  - [ ] 3.4 Implement fit reporting
    - Create generateReport() method for detailed output
    - Calculate reduction statistics (amount, percentage)
    - Track excluded files and reasons
    - Generate human-readable summary
    - _Requirements: 2.4_
  
  - [x] 3.5 Integrate with CLI
    - Add --target-tokens flag to CLI parser
    - Add --fit-strategy flag with validation
    - Display fit report after analysis
    - Handle impossible fit scenarios gracefully
    - _Requirements: 2.1, 2.2_
  
  - [x] 3.6 Create optimizer documentation
    - Write lib/optimizers/README.md with strategy explanations
    - Document importance scoring factors
    - Add examples for each strategy
    - Include performance tips
    - _Requirements: 2.1_

- [ ] 4. Implement Rule Debugger/Tracer
  - [ ] 4.1 Create decision tracking data structures
    - Implement Decision interface with JSDoc
    - Create TraceResult interface for aggregated data
    - Implement PatternAnalysis interface
    - _Requirements: 3.1_
  
  - [ ] 4.2 Implement RuleTracer core class
    - Create RuleTracer class with enable/disable methods
    - Implement recordFileDecision() method
    - Implement recordMethodDecision() method
    - Use Map for efficient lookups
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ] 4.3 Integrate with file scanning
    - Modify GitIgnoreParser to call RuleTracer
    - Record decisions during shouldIncludeFile()
    - Track rule source and priority
    - Capture matched patterns
    - _Requirements: 3.2, 3.3_
  
  - [ ] 4.4 Integrate with method filtering
    - Modify MethodFilterParser to call RuleTracer
    - Record method-level decisions
    - Track method patterns and matches
    - _Requirements: 3.5_
  
  - [ ] 4.5 Implement pattern analysis
    - Create PatternAnalyzer class
    - Implement analyzePatterns() method
    - Count pattern matches and collect examples
    - Identify unused patterns
    - _Requirements: 3.4_
  
  - [ ] 4.6 Create trace report generation
    - Implement generateReport() method
    - Format file decisions with colors/icons
    - Display pattern analysis with statistics
    - Show summary with counts
    - _Requirements: 3.1, 3.4_
  
  - [x] 4.7 Integrate with CLI
    - Add --trace-rules flag to CLI parser
    - Display trace report after analysis
    - Format output for terminal readability
    - Add verbose mode for detailed traces
    - _Requirements: 3.1_
  
  - [x] 4.8 Create debugger documentation
    - Write lib/debug/README.md with usage guide
    - Document decision reasons and rule priorities
    - Add troubleshooting examples
    - Include pattern syntax reference
    - _Requirements: 3.1_

- [ ] 5. Integration and cross-feature functionality
  - [ ] 5.1 Integrate Preset System with Token Budget Fitter
    - Allow presets to specify targetTokens
    - Apply preset's fitStrategy if specified
    - Merge preset options with CLI flags (CLI takes precedence)
    - _Requirements: 1.5, 2.1_
  
  - [ ] 5.2 Integrate Preset System with Rule Tracer
    - Enable tracing when preset is applied
    - Show which preset rules matched
    - Display preset metadata in trace output
    - _Requirements: 1.1, 3.1_
  
  - [ ] 5.3 Integrate Token Budget Fitter with Rule Tracer
    - Record fitting decisions in trace
    - Show why files were excluded during fitting
    - Display importance scores in trace
    - _Requirements: 2.4, 3.1_
  
  - [ ] 5.4 Update main index.js exports
    - Export PresetManager class
    - Export TokenBudgetFitter class
    - Export FitStrategies class
    - Export RuleTracer class
    - _Requirements: 1.1, 2.1, 3.1_

- [ ] 6. Testing and validation
  - [x] 6.1 Write unit tests for Preset System
    - Test preset loading and validation
    - Test preset application and cleanup
    - Test error handling (invalid presets, missing files)
    - Test listPresets() and getPresetInfo()
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 6.2 Write unit tests for Token Budget Fitter
    - Test each fitting strategy independently
    - Test importance scoring algorithm
    - Test edge cases (empty files, huge files)
    - Test strategy recommendation logic
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 6.3 Write unit tests for Rule Tracer
    - Test decision recording
    - Test trace report generation
    - Test pattern analysis
    - Test performance overhead
    - _Requirements: 3.1, 3.2, 3.4_
  
  - [ ] 6.4 Write integration tests
    - Test preset + token budget fitter
    - Test preset + rule tracer
    - Test all three features together
    - Test CLI flag combinations
    - _Requirements: 1.1, 2.1, 3.1_
  
  - [ ] 6.5 Write performance tests
    - Benchmark preset loading (target: < 100ms)
    - Benchmark token fitting for 1000 files (target: < 5s)
    - Benchmark rule tracing overhead (target: < 10%)
    - _Requirements: Non-functional requirements_

- [ ] 7. Documentation and examples
  - [ ] 7.1 Update main README.md
    - Add section for Preset System
    - Add section for Token Budget Fitter
    - Add section for Rule Debugger
    - Include usage examples for each feature
    - _Requirements: 1.1, 2.1, 3.1_
  
  - [ ] 7.2 Create comprehensive examples
    - Create example presets for different use cases
    - Create example token budget scenarios
    - Create example trace output interpretations
    - _Requirements: 1.1, 2.1, 3.1_
  
  - [ ] 7.3 Update CLI help text
    - Add descriptions for new flags
    - Include examples in help output
    - Document flag combinations
    - _Requirements: 1.1, 2.1, 3.1_

- [ ] 8. Final integration and polish
  - [ ] 8.1 Update wizard mode integration
    - Allow preset selection in wizard
    - Allow token budget specification in wizard
    - Optionally enable tracing in wizard
    - _Requirements: 1.1, 2.1_
  
  - [ ] 8.2 Update API server integration
    - Add /api/v1/presets endpoints
    - Enhance /api/v1/context with new options
    - Add API documentation for new features
    - _Requirements: 1.1, 2.1, 3.1_
  
  - [ ] 8.3 Error handling and edge cases
    - Test all error scenarios
    - Ensure graceful degradation
    - Add helpful error messages
    - _Requirements: All_
  
  - [ ] 8.4 Performance optimization
    - Profile and optimize hot paths
    - Reduce memory usage where possible
    - Optimize file I/O operations
    - _Requirements: Non-functional requirements_
  
  - [ ] 8.5 Final testing and validation
    - Run comprehensive test suite
    - Test on multiple platforms (macOS, Linux, Windows)
    - Verify backward compatibility
    - Check for breaking changes
    - _Requirements: All_

---

## Implementation Notes

### Development Order
1. Start with Preset System (foundational, used by other features)
2. Implement Token Budget Fitter (independent, can be developed in parallel)
3. Implement Rule Tracer (requires integration with existing parsers)
4. Integration and testing

### Testing Strategy
- Write tests alongside implementation (TDD approach)
- Aim for 80%+ code coverage
- Focus on edge cases and error scenarios
- Use real-world test data from test-repos/

### Code Quality
- Follow existing code style and patterns
- Use JSDoc for type annotations
- Add inline comments for complex logic
- Keep functions small and focused

### Git Workflow
- Create feature branch: `feature/phase-1-core-enhancements`
- Commit after each major task completion
- Write descriptive commit messages
- Create PR when all tasks complete

---

## Success Criteria

- [ ] All tasks completed
- [ ] All tests passing (80%+ coverage)
- [ ] Documentation complete and accurate
- [ ] Zero breaking changes
- [ ] Performance targets met
- [ ] Code review approved
- [ ] User acceptance testing passed

---

## Estimated Timeline

- **Week 1**: Tasks 1-2 (Preset System) - 5 days
- **Week 2**: Task 3 (Token Budget Fitter) - 5 days
- **Week 3**: Task 4 (Rule Tracer) - 5 days
- **Week 4**: Tasks 5-8 (Integration, Testing, Documentation) - 5 days

**Total**: 4 weeks (20 working days)

---

## Dependencies

- Node.js 20.0.0+
- Existing Context Manager codebase (v3.0.0)
- Test framework (existing)
- Documentation tools (existing)

---

## Risk Mitigation

1. **Integration Complexity**: Start with simple integration, iterate
2. **Performance Issues**: Profile early, optimize incrementally
3. **Breaking Changes**: Extensive testing, feature flags if needed
4. **Scope Creep**: Stick to requirements, defer enhancements

---

*This implementation plan follows the spec-driven development methodology and ensures all requirements are met through discrete, testable tasks.*
