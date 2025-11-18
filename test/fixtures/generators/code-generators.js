/**
 * Code Generators for Property-Based Testing
 * Provides utilities to generate random code snippets in various languages
 */

import fc from 'fast-check';

/**
 * Generate a random JavaScript function
 */
export const jsFunctionArb = () => fc.record({
    name: fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 3, maxLength: 15 }),
    params: fc.array(
        fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 1, maxLength: 10 }),
        { minLength: 0, maxLength: 5 }
    ),
    body: fc.array(fc.string({ minLength: 10, maxLength: 80 }), { minLength: 1, maxLength: 10 })
}).map(({ name, params, body }) => {
    return `function ${name}(${params.join(', ')}) {\n${body.map(line => '  ' + line).join('\n')}\n}`;
});

/**
 * Generate a random method name
 */
export const methodNameArb = () => fc.stringOf(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'.split('')),
    { minLength: 3, maxLength: 20 }
);

/**
 * Generate random method parameters
 */
export const methodParamsArb = () => fc.array(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 1, maxLength: 10 }),
    { minLength: 0, maxLength: 5 }
);

/**
 * Generate a random Rust function
 */
export const rustFunctionArb = () => fc.record({
    name: methodNameArb(),
    params: methodParamsArb(),
    returnType: fc.constantFrom('i32', 'String', 'bool', '()', 'Vec<String>')
}).map(({ name, params, returnType }) => {
    const paramStr = params.map(p => `${p}: &str`).join(', ');
    return `fn ${name}(${paramStr}) -> ${returnType} {\n    todo!()\n}`;
});

/**
 * Generate a random Go function
 */
export const goFunctionArb = () => fc.record({
    name: methodNameArb(),
    params: methodParamsArb(),
    returnType: fc.constantFrom('int', 'string', 'bool', 'error')
}).map(({ name, params, returnType }) => {
    const paramStr = params.map(p => `${p} string`).join(', ');
    return `func ${name}(${paramStr}) ${returnType} {\n    return nil\n}`;
});

/**
 * Generate a random SQL procedure
 */
export const sqlProcedureArb = () => fc.record({
    name: methodNameArb(),
    params: methodParamsArb()
}).map(({ name, params }) => {
    const paramStr = params.map(p => `@${p} VARCHAR(100)`).join(', ');
    return `CREATE PROCEDURE ${name}(${paramStr})\nAS\nBEGIN\n    SELECT 1;\nEND`;
});

/**
 * Helper: Generate random code snippet
 */
export function generateCodeSnippet(language = 'javascript') {
    const generators = {
        javascript: jsFunctionArb(),
        rust: rustFunctionArb(),
        go: goFunctionArb(),
        sql: sqlProcedureArb()
    };
    
    return fc.sample(generators[language] || jsFunctionArb(), 1)[0];
}
