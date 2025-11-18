/**
 * Example Integration Test
 * Demonstrates the integration testing infrastructure
 */

import { TestRunner, assert } from '../helpers/test-runner.js';

export default async function() {
    const runner = new TestRunner('Example Integration Tests');
    
    await runner.test('Example test case', async () => {
        // Simple example test
        const result = 1 + 1;
        assert.equal(result, 2, 'Basic arithmetic should work');
    });
    
    await runner.test('Another example test', async () => {
        const obj = { foo: 'bar' };
        assert.ok(obj.foo === 'bar', 'Object property should match');
    });
    
    return runner.summary();
}
