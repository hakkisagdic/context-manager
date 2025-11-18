# Test Infrastructure Documentation

## Overview

This document describes the test infrastructure for the Context Manager project, including the organization, tools, and best practices for writing and running tests.

## Directory Structure

```
test/
├── unit/                          # Unit tests for individual modules
│   ├── analyzers/                 # Analyzer module tests
│   ├── formatters/                # Formatter module tests
│   ├── parsers/                   # Parser module tests
│   ├── utils/                     # Utility module tests
│   ├── core/                      # Core module tests
│   ├── plugins/                   # Plugin system tests
│   └── ui/                        # UI component tests
│
├── integration/                   # Integration tests
│   ├── api/                       # REST API tests
│   ├── git/                       # Git integration tests
│   ├── watch/                     # Watch mode tests
│   └── workflows/                 # End-to-end workflow tests
│
├── property/                      # Property-based tests
│   ├── token-calculation.property.js
│   ├── method-extraction.property.js
│   ├── file-filtering.property.js
│   └── ...
│
├── fixtures/                      # Test fixtures and data
│   ├── generators/                # Data generators for PBT
│   │   ├── file-generators.js
│   │   ├── code-generators.js
│   │   ├── config-generators.js
│   │   └── context-generators.js
│   └── ...
│
└── helpers/                       # Test utilities
    ├── test-runner.js             # Test runner utilities
    └── property-test-helpers.js   # PBT helper functions
```

## Testing Tools

### 1. fast-check (Property-Based Testing)
- **Version**: ^3.15.0
- **Purpose**: Generate random test inputs to verify universal properties
- **Configuration**: Minimum 100 iterations per property test

### 2. c8 (Code Coverage)
- **Version**: ^10.1.3
- **Purpose**: Track code coverage metrics
- **Usage**: `npm run test:coverage`

## Test Types

### Unit Tests
- Test individual functions and modules in isolation
- Focus on specific examples and edge cases
- Located in `test/unit/`
- Naming: `*.test.js`

### Integration Tests
- Test interactions between multiple components
- Verify data flow and component integration
- Located in `test/integration/`
- Naming: `*.test.js` or `*.integration.js`

### Property-Based Tests
- Test universal properties across random inputs
- Use fast-check for input generation
- Located in `test/property/`
- Naming: `*.property.js`
- Must include feature tag comment

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run property-based tests only
npm run test:property

# Run with coverage
npm run test:coverage
```

## Writing Property-Based Tests

### Template

```javascript
import fc from 'fast-check';
import { runProperty, taggedProperty } from '../helpers/property-test-helpers.js';

// Feature: comprehensive-test-validation, Property 1: Description
export default async function() {
    const property = taggedProperty(
        'comprehensive-test-validation',
        1,
        'Description of property',
        fc.property(
            fc.string(),  // Input generator
            (input) => {
                // Test logic
                const result = functionUnderTest(input);
                return result === expected;
            }
        )
    );
    
    await runProperty(property, { numRuns: 100 });
}
```

### Best Practices

1. **Tag all property tests** with feature name and property number
2. **Run at least 100 iterations** per property
3. **Use appropriate generators** from `test/fixtures/generators/`
4. **Test universal properties**, not specific examples
5. **Focus on invariants**, round-trips, idempotence, and metamorphic properties

## Data Generators

### File Generators
```javascript
import { fileObjectArb, fileSetArb } from './fixtures/generators/file-generators.js';

// Generate a single random file
const file = fc.sample(fileObjectArb(), 1)[0];

// Generate a set of files
const files = fc.sample(fileSetArb({ minFiles: 5, maxFiles: 20 }), 1)[0];
```

### Code Generators
```javascript
import { jsFunctionArb, rustFunctionArb } from './fixtures/generators/code-generators.js';

// Generate random JavaScript function
const jsFunc = fc.sample(jsFunctionArb(), 1)[0];
```

### Config Generators
```javascript
import { presetConfigArb } from './fixtures/generators/config-generators.js';

// Generate random preset configuration
const preset = fc.sample(presetConfigArb(), 1)[0];
```

## Coverage Goals

- **Lines**: 95%+
- **Functions**: 90%+
- **Branches**: 85%+

## CI/CD Integration

Tests are automatically run on:
- Pull requests
- Commits to main branch
- Pre-publish (via `prepublishOnly` script)

## Troubleshooting

### Property Test Failures
1. Check the counterexample provided by fast-check
2. Verify generator constraints match input domain
3. Review property definition for correctness
4. Consider if specification needs adjustment

### Coverage Issues
1. Run `npm run test:coverage` to see detailed report
2. Check HTML report in `coverage/` directory
3. Identify untested code paths
4. Add targeted tests for missing coverage

## Additional Resources

- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Property-Based Testing Guide](https://fsharpforfunandprofit.com/posts/property-based-testing/)
- [c8 Documentation](https://github.com/bcoe/c8)
