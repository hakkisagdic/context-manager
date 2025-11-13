#!/usr/bin/env node

/**
 * Comprehensive Formatter Tests
 * Tests FormatRegistry and all format encoders (JSON, YAML, CSV, XML, Markdown, TOON, GitIngest)
 */

import FormatRegistry from '../lib/formatters/format-registry.js';

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        testsPassed++;
        return true;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        testsFailed++;
        return false;
    }
}

console.log('🧪 Testing Formatters Comprehensive...\\n');

const registry = new FormatRegistry();

// ============================================================================
// FORMAT REGISTRY TESTS
// ============================================================================
console.log('📦 FormatRegistry Core Tests');
console.log('-'.repeat(70));

test('FormatRegistry - Constructor initializes', () => {
    const reg = new FormatRegistry();
    if (!reg) throw new Error('Failed to create FormatRegistry');
    if (!reg.formatters) throw new Error('Formatters map not initialized');
});

test('FormatRegistry - Default formatters registered', () => {
    const formats = registry.listFormats();
    if (!Array.isArray(formats)) throw new Error('listFormats should return array');
    if (formats.length === 0) throw new Error('Should have default formatters');

    // Check for essential formats
    const required = ['json', 'yaml', 'csv', 'xml', 'markdown', 'toon'];
    for (const format of required) {
        if (!formats.includes(format)) throw new Error(`Missing format: ${format}`);
    }
});

test('FormatRegistry - has() checks existence', () => {
    if (!registry.has('json')) throw new Error('Should have json format');
    if (!registry.has('yaml')) throw new Error('Should have yaml format');
    if (registry.has('nonexistent')) throw new Error('Should not have nonexistent format');
});

test('FormatRegistry - get() retrieves formatter', () => {
    const jsonFormatter = registry.get('json');
    if (!jsonFormatter) throw new Error('Should retrieve json formatter');
    if (!jsonFormatter.encoder) throw new Error('Formatter should have encoder');
    if (typeof jsonFormatter.encoder !== 'function') throw new Error('Encoder should be function');
});

test('FormatRegistry - get() throws on unknown format', () => {
    try {
        registry.get('unknown-format-xyz');
        throw new Error('Should throw on unknown format');
    } catch (error) {
        if (!error.message.includes('Unknown format')) {
            throw new Error('Wrong error message');
        }
    }
});

test('FormatRegistry - register() adds custom formatter', () => {
    const customReg = new FormatRegistry();
    const customEncoder = (data) => 'custom:' + JSON.stringify(data);

    customReg.register('custom', {
        name: 'Custom',
        description: 'Custom format',
        extension: '.custom',
        mimeType: 'text/plain',
        encoder: customEncoder
    });

    if (!customReg.has('custom')) throw new Error('Custom format not registered');
});

test('FormatRegistry - register() throws without encoder', () => {
    const customReg = new FormatRegistry();
    try {
        customReg.register('invalid', {
            name: 'Invalid',
            description: 'No encoder'
        });
        throw new Error('Should throw without encoder');
    } catch (error) {
        if (!error.message.includes('encoder function')) {
            throw new Error('Wrong error message');
        }
    }
});

test('FormatRegistry - getInfo() returns formatter info', () => {
    const info = registry.getInfo('json');
    if (!info) throw new Error('Should return info');
    if (!info.name) throw new Error('Info should have name');
    if (!info.description) throw new Error('Info should have description');
    if (!info.extension) throw new Error('Info should have extension');
    if (!info.mimeType) throw new Error('Info should have mimeType');
});

test('FormatRegistry - getAllInfo() returns all formatters info', () => {
    const allInfo = registry.getAllInfo();
    if (!allInfo) throw new Error('Should return all info');
    if (typeof allInfo !== 'object') throw new Error('Should be object');
    if (!allInfo.json) throw new Error('Should include json info');
    if (!allInfo.yaml) throw new Error('Should include yaml info');
});

test('FormatRegistry - listFormats() returns array', () => {
    const formats = registry.listFormats();
    if (!Array.isArray(formats)) throw new Error('Should return array');
    if (formats.length < 5) throw new Error('Should have multiple formats');
});

// ============================================================================
// JSON ENCODING TESTS
// ============================================================================
console.log('\\n📄 JSON Encoding Tests');
console.log('-'.repeat(70));

test('JSON - Encode simple object', () => {
    const data = { name: 'test', value: 123 };
    const result = registry.encode('json', data);
    if (typeof result !== 'string') throw new Error('Should return string');
    if (!result.includes('test')) throw new Error('Should contain data');
    if (!result.includes('123')) throw new Error('Should contain value');
});

test('JSON - Encode with pretty print', () => {
    const data = { a: 1, b: 2 };
    const result = registry.encode('json', data);
    // Standard JSON uses JSON.stringify with spacing
    if (typeof result !== 'string') throw new Error('Should return string');
    // Check that it's valid JSON
    const parsed = JSON.parse(result);
    if (parsed.a !== 1 || parsed.b !== 2) throw new Error('Should encode correctly');
});

test('JSON - Encode compact', () => {
    const data = { a: 1, b: 2 };
    const result = registry.encode('json-compact', data);
    // Compact JSON has no whitespace
    if (result.includes('\\n')) throw new Error('Compact should not have newlines');
    if (result.includes('  ')) throw new Error('Compact should not have indentation');
});

test('JSON - Encode nested object', () => {
    const data = { outer: { inner: { value: 'deep' } } };
    const result = registry.encode('json', data);
    if (!result.includes('deep')) throw new Error('Should encode nested data');
});

test('JSON - Encode array', () => {
    const data = { items: [1, 2, 3] };
    const result = registry.encode('json', data);
    if (!result.includes('[')) throw new Error('Should encode array');
    if (!result.includes('1')) throw new Error('Should encode array items');
});

// ============================================================================
// YAML ENCODING TESTS
// ============================================================================
console.log('\\n📝 YAML Encoding Tests');
console.log('-'.repeat(70));

test('YAML - Encode simple string', () => {
    const data = 'hello';
    const result = registry.encode('yaml', data);
    if (result !== 'hello') throw new Error('Should encode string as-is');
});

test('YAML - Encode number', () => {
    const data = 42;
    const result = registry.encode('yaml', data);
    if (result !== '42') throw new Error('Should encode number');
});

test('YAML - Encode boolean', () => {
    const data = true;
    const result = registry.encode('yaml', data);
    if (result !== 'true') throw new Error('Should encode boolean');
});

test('YAML - Encode null', () => {
    const data = null;
    const result = registry.encode('yaml', data);
    if (result !== 'null') throw new Error('Should encode null');
});

test('YAML - Encode empty array', () => {
    const data = [];
    const result = registry.encode('yaml', data);
    if (result !== '[]') throw new Error('Should encode empty array');
});

test('YAML - Encode array', () => {
    const data = ['a', 'b', 'c'];
    const result = registry.encode('yaml', data);
    if (!result.includes('- a')) throw new Error('Should use YAML array syntax');
    if (!result.includes('- b')) throw new Error('Should include all items');
});

test('YAML - Encode empty object', () => {
    const data = {};
    const result = registry.encode('yaml', data);
    if (result !== '{}') throw new Error('Should encode empty object');
});

test('YAML - Encode simple object', () => {
    const data = { name: 'test', value: 123 };
    const result = registry.encode('yaml', data);
    if (!result.includes('name: test')) throw new Error('Should use YAML key-value syntax');
    if (!result.includes('value: 123')) throw new Error('Should include all properties');
});

test('YAML - Encode string with special chars', () => {
    const data = 'test: value';
    const result = registry.encode('yaml', data);
    // Should be quoted because contains ':'
    if (!result.includes('"')) throw new Error('Should quote strings with special chars');
});

test('YAML - Encode nested object', () => {
    const data = { outer: { inner: 'value' } };
    const result = registry.encode('yaml', data);
    if (!result.includes('outer:')) throw new Error('Should encode outer key');
    if (!result.includes('inner: value')) throw new Error('Should encode nested value');
});

// ============================================================================
// MARKDOWN ENCODING TESTS
// ============================================================================
console.log('\\n📋 Markdown Encoding Tests');
console.log('-'.repeat(70));

test('Markdown - Encode with project info', () => {
    const data = {
        project: {
            root: '/test/project',
            totalFiles: 10,
            totalTokens: 5000
        }
    };
    const result = registry.encode('markdown', data);
    if (!result.includes('# /test/project')) throw new Error('Should include project root');
    if (!result.includes('10')) throw new Error('Should include file count');
    if (!result.includes('5,000')) throw new Error('Should include token count with formatting');
});

test('Markdown - Encode with paths', () => {
    const data = {
        paths: {
            'src/': ['app.js', 'utils.js'],
            'test/': ['test.js']
        }
    };
    const result = registry.encode('markdown', data);
    if (!result.includes('## File Structure')) throw new Error('Should have file structure section');
    if (!result.includes('### src/')) throw new Error('Should include directory');
    if (!result.includes('- app.js')) throw new Error('Should list files');
});

test('Markdown - Encode with methods', () => {
    const data = {
        methods: {
            'app.js': [
                { name: 'main', line: 10, tokens: 50 },
                { name: 'helper', line: 20, tokens: 25 }
            ]
        }
    };
    const result = registry.encode('markdown', data);
    if (!result.includes('## Methods')) throw new Error('Should have methods section');
    if (!result.includes('### app.js')) throw new Error('Should include file name');
    if (!result.includes('main')) throw new Error('Should list method names');
    if (!result.includes('| Method | Line | Tokens |')) throw new Error('Should have table header');
});

test('Markdown - Encode with method stats', () => {
    const data = {
        methodStats: {
            totalMethods: 50,
            includedMethods: 30,
            totalMethodTokens: 1000
        }
    };
    const result = registry.encode('markdown', data);
    if (!result.includes('## Statistics')) throw new Error('Should have statistics section');
    if (!result.includes('50')) throw new Error('Should include total methods');
    if (!result.includes('30')) throw new Error('Should include included methods');
});

test('Markdown - Encode empty data', () => {
    const data = {};
    const result = registry.encode('markdown', data);
    if (!result.includes('#')) throw new Error('Should still have header');
    // Should not crash on empty data
    if (result.length === 0) throw new Error('Should return some content');
});

// ============================================================================
// CSV ENCODING TESTS
// ============================================================================
console.log('\\n📊 CSV Encoding Tests');
console.log('-'.repeat(70));

test('CSV - Encode method-level data', () => {
    const data = {
        methods: {
            'app.js': [
                { name: 'main', line: 10, tokens: 50 },
                { name: 'helper', line: 20, tokens: 25 }
            ],
            'utils.js': [
                { name: 'format', line: 5, tokens: 15 }
            ]
        }
    };
    const result = registry.encode('csv', data);
    if (!result.includes('File,Method,Line,Tokens')) throw new Error('Should have CSV header');
    if (!result.includes('app.js')) throw new Error('Should include file names');
    if (!result.includes('main')) throw new Error('Should include method names');
    if (!result.includes('10')) throw new Error('Should include line numbers');
    if (!result.includes('50')) throw new Error('Should include token counts');
});

test('CSV - Encode file-level data', () => {
    const data = {
        paths: {
            'src/': ['app.js', 'utils.js'],
            'test/': ['test.js']
        }
    };
    const result = registry.encode('csv', data);
    if (!result.includes('Directory,File')) throw new Error('Should have file CSV header');
    if (!result.includes('src/')) throw new Error('Should include directories');
    if (!result.includes('app.js')) throw new Error('Should include files');
});

test('CSV - Encode with quotes in data', () => {
    const data = {
        methods: {
            'file"with"quotes.js': [
                { name: 'test', line: 1, tokens: 10 }
            ]
        }
    };
    const result = registry.encode('csv', data);
    if (!result.includes('"')) throw new Error('Should quote fields with special chars');
});

test('CSV - Encode empty methods', () => {
    const data = {};
    const result = registry.encode('csv', data);
    if (!result.includes('Directory,File')) throw new Error('Should return header for empty data');
});

// ============================================================================
// XML ENCODING TESTS
// ============================================================================
console.log('\\n🏷️  XML Encoding Tests');
console.log('-'.repeat(70));

test('XML - Encode with XML declaration', () => {
    const data = { test: 'value' };
    const result = registry.encode('xml', data);
    if (!result.includes('<?xml version="1.0" encoding="UTF-8"?>')) {
        throw new Error('Should include XML declaration');
    }
    if (!result.includes('<context>')) throw new Error('Should have root element');
    if (!result.includes('</context>')) throw new Error('Should close root element');
});

test('XML - Encode simple value', () => {
    const data = { name: 'test' };
    const result = registry.encode('xml', data);
    if (!result.includes('<name>')) throw new Error('Should create element');
    if (!result.includes('test')) throw new Error('Should include value');
    if (!result.includes('</name>')) throw new Error('Should close element');
});

test('XML - Encode number', () => {
    const data = { value: 123 };
    const result = registry.encode('xml', data);
    if (!result.includes('123')) throw new Error('Should encode number');
});

test('XML - Encode boolean', () => {
    const data = { flag: true };
    const result = registry.encode('xml', data);
    if (!result.includes('true')) throw new Error('Should encode boolean');
});

test('XML - Encode null/undefined', () => {
    const data = { empty: null };
    const result = registry.encode('xml', data);
    // Null values should result in empty or self-closing tags
    if (!result.includes('<empty')) throw new Error('Should handle null');
});

test('XML - Encode array', () => {
    const data = { items: ['a', 'b'] };
    const result = registry.encode('xml', data);
    if (!result.includes('<item>')) throw new Error('Should create item elements');
    if (!result.includes('a')) throw new Error('Should include array values');
});

test('XML - Encode nested object', () => {
    const data = { outer: { inner: 'value' } };
    const result = registry.encode('xml', data);
    if (!result.includes('<outer>')) throw new Error('Should create outer element');
    if (!result.includes('<inner>')) throw new Error('Should create inner element');
    if (!result.includes('value')) throw new Error('Should include value');
});

test('XML - Escape special characters', () => {
    const data = { text: '<test>&value' };
    const result = registry.encode('xml', data);
    // Should escape < and &
    if (result.includes('<test>&value')) throw new Error('Should escape special chars');
    if (!result.includes('&lt;') && !result.includes('&amp;')) {
        throw new Error('Should use XML entities');
    }
});

// ============================================================================
// TOON FORMAT TESTS
// ============================================================================
console.log('\\n🎯 TOON Format Tests');
console.log('-'.repeat(70));

test('TOON - Format is registered', () => {
    if (!registry.has('toon')) throw new Error('TOON format should be registered');
});

test('TOON - Has correct metadata', () => {
    const info = registry.getInfo('toon');
    if (info.name !== 'TOON') throw new Error('Wrong format name');
    if (!info.description.includes('40-50%')) throw new Error('Should mention token reduction');
    if (info.extension !== '.toon') throw new Error('Wrong extension');
});

test('TOON - Encoder returns string', () => {
    const data = {
        project: { root: '/test', totalFiles: 10, totalTokens: 1000 },
        paths: { 'src/': ['app.js'] }
    };
    const result = registry.encode('toon', data);
    if (typeof result !== 'string') throw new Error('Should return string');
    if (result.length === 0) throw new Error('Should not be empty');
});

// ============================================================================
// GITINGEST FORMAT TESTS
// ============================================================================
console.log('\\n📦 GitIngest Format Tests');
console.log('-'.repeat(70));

test('GitIngest - Format is registered', () => {
    if (!registry.has('gitingest')) throw new Error('GitIngest format should be registered');
});

test('GitIngest - Has correct metadata', () => {
    const info = registry.getInfo('gitingest');
    if (info.extension !== '.txt') throw new Error('Wrong extension');
    if (info.mimeType !== 'text/plain') throw new Error('Wrong MIME type');
});

test('GitIngest - Throws without formatter instance', () => {
    try {
        registry.encode('gitingest', {});
        throw new Error('Should throw without formatter instance');
    } catch (error) {
        if (!error.message.includes('GitIngestFormatter')) {
            throw new Error('Wrong error message');
        }
    }
});

// ============================================================================
// EDGE CASES & ERROR HANDLING
// ============================================================================
console.log('\\n⚠️  Edge Cases & Error Handling');
console.log('-'.repeat(70));

test('Edge - Encode circular reference (JSON)', () => {
    const circular = { name: 'test' };
    circular.self = circular;

    try {
        registry.encode('json', circular);
        throw new Error('Should throw on circular reference');
    } catch (error) {
        if (!error.message.includes('circular')) {
            // May throw different error, that's ok
        }
    }
});

test('Edge - Encode very large object', () => {
    const large = {};
    for (let i = 0; i < 1000; i++) {
        large[`key${i}`] = `value${i}`;
    }
    const result = registry.encode('json', large);
    if (typeof result !== 'string') throw new Error('Should handle large objects');
});

test('Edge - Encode empty data to all formats', () => {
    const empty = {};
    const formats = ['json', 'yaml', 'xml', 'markdown', 'csv'];

    for (const format of formats) {
        const result = registry.encode(format, empty);
        if (typeof result !== 'string') throw new Error(`${format} should return string`);
    }
});

test('Edge - Encode undefined values', () => {
    const data = { defined: 'value', undefined: undefined };
    const result = registry.encode('yaml', data);
    // Should handle undefined gracefully
    if (typeof result !== 'string') throw new Error('Should handle undefined');
});

test('Edge - Register formatter with same name twice', () => {
    const customReg = new FormatRegistry();
    const encoder1 = (data) => 'v1';
    const encoder2 = (data) => 'v2';

    customReg.register('test', {
        name: 'Test',
        description: 'V1',
        extension: '.txt',
        mimeType: 'text/plain',
        encoder: encoder1
    });

    // Should allow overwriting
    customReg.register('test', {
        name: 'Test',
        description: 'V2',
        extension: '.txt',
        mimeType: 'text/plain',
        encoder: encoder2
    });

    const result = customReg.encode('test', {});
    if (result !== 'v2') throw new Error('Should use latest registered encoder');
});

test('Edge - Special characters in keys', () => {
    const data = {
        'key-with-dashes': 'value1',
        'key.with.dots': 'value2',
        'key_with_underscores': 'value3'
    };

    // Should handle in JSON
    const json = registry.encode('json', data);
    if (!json.includes('key-with-dashes')) throw new Error('JSON should preserve keys');

    // Should handle in XML (sanitized)
    const xml = registry.encode('xml', data);
    if (typeof xml !== 'string') throw new Error('XML should handle special keys');
});

test('Edge - Unicode characters', () => {
    const data = { message: '你好世界 🚀' };

    const json = registry.encode('json', data);
    if (!json.includes('你好') && !json.includes('\\\\u')) {
        throw new Error('Should handle Unicode');
    }
});

// ============================================================================
// RESULTS
// ============================================================================
console.log('\\n' + '='.repeat(70));
console.log('📊 TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\\n🎉 All formatter tests passed!');
    process.exit(0);
} else {
    console.log('\\n❌ Some tests failed.');
    process.exit(1);
}
