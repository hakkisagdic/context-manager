/**
 * Context Generators for Property-Based Testing
 * Provides utilities to generate random context objects
 */

import fc from 'fast-check';
import { fileSetArb } from './file-generators.js';

/**
 * Generate a random context object
 */
export const contextObjectArb = () => fc.record({
    projectName: fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz-'.split('')), { minLength: 3, maxLength: 30 }),
    files: fileSetArb({ minFiles: 1, maxFiles: 20 }),
    totalTokens: fc.integer({ min: 100, max: 50000 }),
    timestamp: fc.date().map(d => d.toISOString()),
    metadata: fc.record({
        version: fc.constantFrom('1.0.0', '2.0.0', '3.0.0'),
        format: fc.constantFrom('toon', 'gitingest', 'json')
    })
});

/**
 * Generate a random TOON context
 */
export const toonContextArb = () => fc.record({
    header: fc.record({
        version: fc.constant('1.0'),
        timestamp: fc.date().map(d => d.toISOString()),
        projectName: fc.string({ minLength: 3, maxLength: 30 })
    }),
    files: fileSetArb({ minFiles: 1, maxFiles: 15 }),
    summary: fc.string({ minLength: 50, maxLength: 500 })
});

/**
 * Helper: Generate random context
 */
export function generateRandomContext(type = 'standard') {
    const generators = {
        standard: contextObjectArb(),
        toon: toonContextArb()
    };
    
    return fc.sample(generators[type] || contextObjectArb(), 1)[0];
}
