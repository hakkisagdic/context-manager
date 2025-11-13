#!/usr/bin/env node

/**
 * Rust Support Test Suite
 * Tests method extraction from Rust files
 */

import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import MethodAnalyzer from '../lib/analyzers/method-analyzer.js';

console.log('🧪 Running Rust Support Tests...\n');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`✅ PASS: ${testName}`);
        passed++;
    } else {
        console.log(`❌ FAIL: ${testName}`);
        failed++;
    }
}

// Test 1: Rust file detection
console.log('📋 Test 1: File Type Detection');
import FileUtils from '../lib/utils/file-utils.js';

assert(
    FileUtils.isCode('test.rs'),
    'Rust files should be recognized as code'
);

assert(
    FileUtils.isText('main.rs'),
    'Rust files should be recognized as text'
);

assert(
    FileUtils.getType('lib.rs') === 'code',
    'Rust files should have "code" type'
);

console.log();

// Test 2: Method extraction from Rust file
console.log('📋 Test 2: Rust Method Extraction');
const analyzer = new MethodAnalyzer();
const rustFilePath = path.join(__dirname, 'fixtures', 'sample.rs');

if (fs.existsSync(rustFilePath)) {
    const content = fs.readFileSync(rustFilePath, 'utf8');
    const methods = analyzer.extractMethods(content, rustFilePath);

    console.log(`Found ${methods.length} methods/functions in sample.rs`);
    console.log('Methods:', methods.map(m => m.name).join(', '));

    // Expected methods:
    // new, add, get_value, fetch_data, raw_pointer_operation,
    // calculate_sum, process_data, async_operation, const_operation, main

    assert(
        methods.length >= 10,
        'Should extract at least 10 methods from sample.rs'
    );

    assert(
        methods.some(m => m.name === 'new'),
        'Should extract "new" constructor method'
    );

    assert(
        methods.some(m => m.name === 'add'),
        'Should extract "add" method'
    );

    assert(
        methods.some(m => m.name === 'get_value'),
        'Should extract "get_value" method'
    );

    assert(
        methods.some(m => m.name === 'fetch_data'),
        'Should extract "fetch_data" async method'
    );

    assert(
        methods.some(m => m.name === 'raw_pointer_operation'),
        'Should extract "raw_pointer_operation" unsafe method'
    );

    assert(
        methods.some(m => m.name === 'calculate_sum'),
        'Should extract "calculate_sum" free function'
    );

    assert(
        methods.some(m => m.name === 'process_data'),
        'Should extract "process_data" generic function'
    );

    assert(
        methods.some(m => m.name === 'async_operation'),
        'Should extract "async_operation" async free function'
    );

    assert(
        methods.some(m => m.name === 'const_operation'),
        'Should extract "const_operation" const function'
    );

    assert(
        methods.some(m => m.name === 'main'),
        'Should extract "main" function'
    );

    // Verify line numbers are present
    assert(
        methods.every(m => m.line > 0),
        'All methods should have valid line numbers'
    );

    // Verify no Rust keywords are extracted as methods
    const rustKeywords = ['fn', 'pub', 'async', 'unsafe', 'const', 'impl', 'struct'];
    const methodNames = methods.map(m => m.name);
    assert(
        !rustKeywords.some(keyword => methodNames.includes(keyword)),
        'Should not extract Rust keywords as methods'
    );

} else {
    console.log('⚠️  Warning: test/fixtures/sample.rs not found');
    failed++;
}

console.log();

// Test 3: Empty Rust file handling
console.log('📋 Test 3: Edge Cases');

const emptyContent = '// Empty Rust file\n';
const emptyMethods = analyzer.extractMethods(emptyContent, 'empty.rs');

assert(
    emptyMethods.length === 0,
    'Empty Rust file should return no methods'
);

// Test 4: Rust file with only comments
const commentsOnly = `
// This is a comment
/* Multi-line
   comment */
`;
const commentMethods = analyzer.extractMethods(commentsOnly, 'comments.rs');

assert(
    commentMethods.length === 0,
    'File with only comments should return no methods'
);

console.log();

// Summary
console.log('='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
    console.log('\n🎉 All Rust support tests passed!');
    process.exit(0);
} else {
    console.log('\n💥 Some tests failed!');
    process.exit(1);
}
