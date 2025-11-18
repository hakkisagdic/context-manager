/**
 * Property-Based Testing Helpers
 * Utilities for working with fast-check property tests
 */

import fc from 'fast-check';

/**
 * Default property test configuration
 */
export const DEFAULT_CONFIG = {
    numRuns: 100,
    verbose: false,
    seed: undefined
};

/**
 * Run a property test with default configuration
 */
export function runProperty(property, config = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    return fc.assert(property, finalConfig);
}

/**
 * Create a tagged property test
 * @param {string} featureName - Name of the feature being tested
 * @param {number} propertyNumber - Property number from design doc
 * @param {string} description - Property description
 * @param {Function} propertyFn - Property test function
 */
export function taggedProperty(featureName, propertyNumber, description, propertyFn) {
    const tag = `Feature: ${featureName}, Property ${propertyNumber}: ${description}`;
    console.log(`\n${tag}`);
    return propertyFn;
}

/**
 * Helper to verify round-trip property
 */
export function roundTripProperty(encode, decode, arb) {
    return fc.property(arb, (value) => {
        const encoded = encode(value);
        const decoded = decode(encoded);
        return JSON.stringify(decoded) === JSON.stringify(value);
    });
}

/**
 * Helper to verify invariant property
 */
export function invariantProperty(transform, invariant, arb) {
    return fc.property(arb, (value) => {
        const before = invariant(value);
        const transformed = transform(value);
        const after = invariant(transformed);
        return before === after;
    });
}

/**
 * Helper to verify idempotence property
 */
export function idempotenceProperty(fn, arb) {
    return fc.property(arb, (value) => {
        const once = fn(value);
        const twice = fn(once);
        return JSON.stringify(once) === JSON.stringify(twice);
    });
}
