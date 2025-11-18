/**
 * Example Property-Based Test
 * Demonstrates the property testing infrastructure
 */

import fc from 'fast-check';
import { runProperty, taggedProperty } from '../helpers/property-test-helpers.js';

// Feature: comprehensive-test-validation, Property 0: Example property
export default async function() {
    console.log('Running example property test...');
    
    // Property: String concatenation is associative
    const property = fc.property(
        fc.string(),
        fc.string(),
        fc.string(),
        (a, b, c) => {
            const left = (a + b) + c;
            const right = a + (b + c);
            return left === right;
        }
    );
    
    await runProperty(property, { numRuns: 100 });
    console.log('✓ Example property test passed');
}
