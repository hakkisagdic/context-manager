#!/usr/bin/env node

/**
 * Comprehensive Test Suite for v2.3.x Features
 * Tests TOON format, format conversion, chunking, and error handling
 */

import ToonFormatter from '../lib/formatters/toon-formatter.js';
import FormatRegistry from '../lib/formatters/format-registry.js';
import FormatConverter from '../lib/utils/format-converter.js';
import ErrorHandler from '../lib/utils/error-handler.js';
import GitIngestFormatter from '../lib/formatters/gitingest-formatter.js';

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    testsRun++;
    try {
        fn();
        testsPassed++;
        console.log(`✅ ${name}`);
        return true;
    } catch (error) {
        testsFailed++;
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        if (error.stack) {
            console.error(`   Stack: ${error.stack.split('\n')[1]}`);
        }
        return false;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

console.log('🧪 Testing v2.3.x Features\n');

// ============================================================================
// v2.3.1 - TOON FORMATTER TESTS
// ============================================================================
console.log('📦 v2.3.1 - TOON Formatter Tests');
console.log('-'.repeat(70));

test('ToonFormatter: Basic object encoding', () => {
    const formatter = new ToonFormatter();
    const data = { name: 'test', value: 123 };
    const output = formatter.encode(data);
    assert(output.includes('name:'), 'Should contain name field');
    assert(output.includes('test'), 'Should contain test value');
});

test('ToonFormatter: Array encoding', () => {
    const formatter = new ToonFormatter();
    const data = [1, 2, 3];
    const output = formatter.encode(data);
    assert(output.includes('['), 'Should have opening bracket');
    assert(output.includes(']'), 'Should have closing bracket');
});

test('ToonFormatter: Tabular format', () => {
    const formatter = new ToonFormatter();
    const data = [
        { name: 'func1', line: 10, tokens: 100 },
        { name: 'func2', line: 20, tokens: 200 }
    ];
    const output = formatter.encodeTabular(data);
    // Note: Keys are sorted alphabetically, so expect {line,name,tokens} not {name,line,tokens}
    assert(output.includes('{line,name,tokens}:'), 'Should have field declaration');
    assert(output.includes('func1'), 'Should include first function');
    assert(output.includes('func2'), 'Should include second function');
});

test('ToonFormatter: validate() - balanced braces', () => {
    const formatter = new ToonFormatter();
    const validToon = '{\n  key: value\n}';
    const result = formatter.validate(validToon);
    assert(result.valid === true, 'Should validate correct TOON');
    assert(result.errors.length === 0, 'Should have no errors');
});

test('ToonFormatter: validate() - unbalanced braces', () => {
    const formatter = new ToonFormatter();
    const invalidToon = '{\n  key: value\n';
    const result = formatter.validate(invalidToon);
    assert(result.valid === false, 'Should reject unbalanced braces');
    assert(result.errors.length > 0, 'Should have errors');
});

test('ToonFormatter: estimateTokens()', () => {
    const formatter = new ToonFormatter();
    const toonString = 'test'.repeat(100); // 400 chars
    const estimate = formatter.estimateTokens(toonString);
    assert(estimate === 100, `Should estimate ~100 tokens, got ${estimate}`);
});

test('ToonFormatter: optimize()', () => {
    const formatter = new ToonFormatter();
    const input = 'line1  \nline2  \n\n\n\nline3';
    const output = formatter.optimize(input);
    assert(!output.includes('  \n'), 'Should remove trailing spaces');
    assert(!output.includes('\n\n\n\n'), 'Should limit blank lines');
});

test('ToonFormatter: minify()', () => {
    const formatter = new ToonFormatter();
    const input = '  line1  \n  line2  \n  \n  line3  ';
    const output = formatter.minify(input);
    assert(!output.startsWith(' '), 'Should trim leading spaces');
    assert(!output.endsWith(' '), 'Should trim trailing spaces');
    assert(!output.includes('\n\n'), 'Should remove blank lines');
});

test('ToonFormatter: compareWithJSON()', () => {
    const formatter = new ToonFormatter();
    const data = { project: { files: 10, tokens: 5000 } };
    const comparison = formatter.compareWithJSON(data);
    assert(comparison.toonSize > 0, 'Should have TOON size');
    assert(comparison.jsonSize > 0, 'Should have JSON size');
    assert(comparison.savingsPercentage !== undefined, 'Should calculate savings percentage');
    assert(comparison.savings !== undefined, 'Should calculate savings');
    assert(comparison.toonTokens > 0, 'Should have TOON tokens');
    assert(comparison.jsonTokens > 0, 'Should have JSON tokens');
});

// ============================================================================
// v2.3.2 - FORMAT REGISTRY TESTS
// ============================================================================
console.log('\n📦 v2.3.2 - Format Registry Tests');
console.log('-'.repeat(70));

test('FormatRegistry: List all formats', () => {
    const registry = new FormatRegistry();
    const formats = registry.listFormats();
    assert(formats.length >= 7, `Should have at least 7 formats, got ${formats.length}`);
    assert(formats.includes('toon'), 'Should include TOON');
    assert(formats.includes('json'), 'Should include JSON');
    assert(formats.includes('yaml'), 'Should include YAML');
});

test('FormatRegistry: Get format info', () => {
    const registry = new FormatRegistry();
    const info = registry.getInfo('toon');
    assert(info.name, 'Should have name');
    assert(info.description, 'Should have description');
    assert(info.extension, 'Should have extension');
    assert(info.mimeType, 'Should have mimeType');
});

test('FormatRegistry: Encode to TOON', () => {
    const registry = new FormatRegistry();
    const data = { test: 'value' };
    const output = registry.encode('toon', data);
    assert(output.includes('test:'), 'Should encode to TOON format');
});

test('FormatRegistry: Encode to JSON', () => {
    const registry = new FormatRegistry();
    const data = { test: 'value' };
    const output = registry.encode('json', data);
    const parsed = JSON.parse(output);
    assert(parsed.test === 'value', 'Should encode to valid JSON');
});

test('FormatRegistry: Encode to YAML', () => {
    const registry = new FormatRegistry();
    const data = { test: 'value', number: 123 };
    const output = registry.encode('yaml', data);
    assert(output.includes('test:'), 'Should have YAML key');
    assert(output.includes('value'), 'Should have value');
});

test('FormatRegistry: Encode to CSV', () => {
    const registry = new FormatRegistry();
    const data = {
        methods: {
            'file.js': [
                { name: 'func1', line: 10, tokens: 100 },
                { name: 'func2', line: 20, tokens: 200 }
            ]
        }
    };
    const output = registry.encode('csv', data);
    assert(output.includes('File,Method,Line,Tokens'), 'Should have CSV header');
    assert(output.includes('func1'), 'Should include function names');
});

test('FormatRegistry: Encode to XML', () => {
    const registry = new FormatRegistry();
    const data = { test: 'value' };
    const output = registry.encode('xml', data);
    assert(output.includes('<?xml'), 'Should have XML declaration');
    assert(output.includes('<context>'), 'Should have root element');
    assert(output.includes('</context>'), 'Should close root element');
});

test('FormatRegistry: Encode to Markdown', () => {
    const registry = new FormatRegistry();
    const data = {
        project: { root: 'test-project', totalFiles: 10, totalTokens: 5000 }
    };
    const output = registry.encode('markdown', data);
    assert(output.includes('# test-project'), 'Should have project heading');
    assert(output.includes('## Project Summary'), 'Should have summary section');
});

// ============================================================================
// v2.3.2 - FORMAT CONVERTER TESTS
// ============================================================================
console.log('\n📦 v2.3.2 - Format Converter Tests');
console.log('-'.repeat(70));

test('FormatConverter: JSON to TOON conversion', () => {
    const converter = new FormatConverter();
    const jsonInput = '{"test": "value", "number": 123}';
    const result = converter.convert(jsonInput, 'json', 'toon');
    assert(result.output, 'Should have output');
    assert(result.output.includes('test:'), 'Should convert to TOON format');
    assert(result.metadata, 'Should have metadata');
    assert(result.metadata.savingsPercentage !== undefined, 'Should calculate savings');
});

test('FormatConverter: JSON to YAML conversion', () => {
    const converter = new FormatConverter();
    const jsonInput = '{"test": "value"}';
    const result = converter.convert(jsonInput, 'json', 'yaml');
    assert(result.output, 'Should have output');
    assert(result.output.includes('test:'), 'Should convert to YAML format');
    assert(result.metadata, 'Should have metadata');
});

test('FormatConverter: CSV parsing', () => {
    const converter = new FormatConverter();
    const csvInput = 'Name,Age\nJohn,30\nJane,25';
    const parsed = converter.parseCSV(csvInput);
    assert(parsed.headers.length === 2, 'Should parse headers');
    assert(parsed.rows.length === 2, 'Should parse rows');
    assert(parsed.rows[0].Name === 'John', 'Should parse data correctly');
});

test('FormatConverter: Extension to format mapping', () => {
    const converter = new FormatConverter();
    assert(converter.extensionToFormat('json') === 'json', 'Should map json');
    assert(converter.extensionToFormat('toon') === 'toon', 'Should map toon');
    assert(converter.extensionToFormat('yaml') === 'yaml', 'Should map yaml');
    assert(converter.extensionToFormat('csv') === 'csv', 'Should map csv');
});

test('FormatConverter: Get supported conversions', () => {
    const converter = new FormatConverter();
    const supported = converter.getSupportedConversions();
    assert(supported.fullySupported.length > 0, 'Should have fully supported conversions');
    assert(Array.isArray(supported.limitations), 'Should list limitations');
    assert(Array.isArray(supported.experimental), 'Should list experimental features');
});

// ============================================================================
// v2.3.3 - GITINGEST CHUNKING TESTS
// ============================================================================
console.log('\n📦 v2.3.3 - GitIngest Chunking Tests');
console.log('-'.repeat(70));

test('GitIngestFormatter: Basic instantiation', () => {
    const formatter = new GitIngestFormatter(
        process.cwd(),
        { totalFiles: 10, totalTokens: 5000 },
        []
    );
    assert(formatter !== null, 'Should create formatter instance');
});

test('GitIngestFormatter: Chunking configuration', () => {
    const options = {
        chunking: {
            enabled: true,
            strategy: 'smart',
            maxTokensPerChunk: 50000,
            overlap: 1000
        }
    };
    const formatter = new GitIngestFormatter(process.cwd(), {}, [], options);
    assert(formatter.chunking.enabled === true, 'Should enable chunking');
    assert(formatter.chunking.strategy === 'smart', 'Should set strategy');
    assert(formatter.chunking.maxTokensPerChunk === 50000, 'Should set max tokens');
    assert(formatter.chunking.overlap === 1000, 'Should set overlap');
});

test('GitIngestFormatter: Chunk overlap enabled', () => {
    const options = {
        chunking: { enabled: true, overlap: 500 }
    };
    const formatter = new GitIngestFormatter(process.cwd(), {}, [], options);
    assert(formatter.chunking.overlap === 500, 'Should configure overlap');
});

test('GitIngestFormatter: Metadata inclusion', () => {
    const options = {
        chunking: { includeMetadata: true, crossReferences: true }
    };
    const formatter = new GitIngestFormatter(process.cwd(), {}, [], options);
    assert(formatter.chunking.includeMetadata === true, 'Should include metadata');
    assert(formatter.chunking.crossReferences === true, 'Should include cross-refs');
});

// ============================================================================
// v2.3.4 - ERROR HANDLER TESTS
// ============================================================================
console.log('\n📦 v2.3.4 - Error Handler Tests');
console.log('-'.repeat(70));

test('ErrorHandler: Instance creation', () => {
    const handler = new ErrorHandler();
    assert(handler !== null, 'Should create error handler');
});

test('ErrorHandler: Verbose mode', () => {
    const handler = new ErrorHandler({ verbose: true });
    assert(handler.verbose === true, 'Should set verbose mode');
});

test('ErrorHandler: Format validation - valid format', () => {
    const handler = new ErrorHandler();
    const formats = ['json', 'toon', 'yaml'];
    // Should not throw
    handler.validateFormat('json', formats);
    handler.validateFormat('toon', formats);
});

test('ErrorHandler: Format validation - invalid format', () => {
    const handler = new ErrorHandler();
    const formats = ['json', 'toon'];
    let errorThrown = false;
    try {
        handler.validateFormat('invalid', formats);
    } catch (error) {
        errorThrown = true;
        assert(error.message.includes('Unsupported format'), 'Should throw unsupported format error');
    }
    assert(errorThrown, 'Should throw error for invalid format');
});

test('ErrorHandler: Create user message', () => {
    const handler = new ErrorHandler();
    const error = new Error('Test error');
    error.code = 'ENOENT';
    const message = handler.createUserMessage(error, 'File operation');
    assert(message.includes('File not found'), 'Should create user-friendly message');
    assert(message.includes('File operation'), 'Should include context');
});

test('ErrorHandler: Wrap async function', () => {
    const handler = new ErrorHandler();
    const asyncFn = async () => { return 'success'; };
    const wrapped = handler.wrapAsync(asyncFn, 'Test context');
    assert(typeof wrapped === 'function', 'Should return wrapped function');
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(70));
console.log(`Total tests run: ${testsRun}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
} else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed`);
    process.exit(1);
}
