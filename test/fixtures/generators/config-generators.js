/**
 * Configuration Generators for Property-Based Testing
 * Provides utilities to generate random configuration objects
 */

import fc from 'fast-check';

/**
 * Generate a random preset configuration
 */
export const presetConfigArb = () => fc.record({
    name: fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz-'.split('')), { minLength: 3, maxLength: 20 }),
    description: fc.string({ minLength: 10, maxLength: 100 }),
    tokenBudget: fc.integer({ min: 1000, max: 100000 }),
    includePatterns: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 0, maxLength: 10 }),
    excludePatterns: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 0, maxLength: 10 }),
    methodLevel: fc.boolean()
});

/**
 * Generate a random LLM profile
 */
export const llmProfileArb = () => fc.record({
    name: fc.constantFrom('gpt-4', 'gpt-3.5-turbo', 'claude-3', 'claude-2'),
    contextWindow: fc.integer({ min: 4000, max: 128000 }),
    tokenLimit: fc.integer({ min: 2000, max: 100000 })
});

/**
 * Generate random filter rules
 */
export const filterRulesArb = () => fc.record({
    include: fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 0, maxLength: 15 }),
    exclude: fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 0, maxLength: 15 })
});

/**
 * Helper: Generate random configuration
 */
export function generateRandomConfig(type = 'preset') {
    const generators = {
        preset: presetConfigArb(),
        llm: llmProfileArb(),
        filter: filterRulesArb()
    };
    
    return fc.sample(generators[type] || presetConfigArb(), 1)[0];
}
