# Property-Based Tests

This directory contains property-based tests using fast-check to verify universal properties across random inputs.

## Structure

- `token-calculation.property.js` - Token calculation properties
- `method-extraction.property.js` - Method extraction properties
- `file-filtering.property.js` - File filtering properties
- `format-conversion.property.js` - Format conversion properties
- `git-integration.property.js` - Git integration properties
- `budget-fitting.property.js` - Token budget fitting properties

## Running Property Tests

```bash
npm run test:property
```

## Guidelines

- Each test should run at least 100 iterations
- Use appropriate generators for input data
- Tag tests with feature name and property number
- Format: `// Feature: {feature_name}, Property {number}: {description}`
- Tests should verify universal properties, not specific examples
- Focus on invariants, round-trips, idempotence, and metamorphic properties

## Example

```javascript
import fc from 'fast-check';

// Feature: comprehensive-test-validation, Property 1: Token calculation consistency
test('Token calculation should be consistent for same input', () => {
    fc.assert(
        fc.property(fc.string(), (content) => {
            const tokens1 = calculateTokens(content);
            const tokens2 = calculateTokens(content);
            return tokens1 === tokens2;
        }),
        { numRuns: 100 }
    );
});
```
