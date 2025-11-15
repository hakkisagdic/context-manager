/**
 * Comprehensive tests for FormatRegistry
 * Tests all methods and edge cases to achieve 100% coverage
 */

import FormatRegistry from '../lib/formatters/format-registry.js';

let testsPassed = 0;
let testsFailed = 0;

function test(description, fn) {
    try {
        fn();
        console.log(`✅ ${description}`);
        testsPassed++;
    } catch (error) {
        console.error(`❌ ${description}`);
        console.error(`   Error: ${error.message}`);
        testsFailed++;
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

function assertThrows(fn, expectedError) {
    try {
        fn();
        throw new Error('Expected function to throw an error');
    } catch (error) {
        if (expectedError && !error.message.includes(expectedError)) {
            throw new Error(`Expected error message to include "${expectedError}", got "${error.message}"`);
        }
    }
}

function assertIncludes(str, substring, message) {
    if (!str.includes(substring)) {
        throw new Error(message || `Expected "${str}" to include "${substring}"`);
    }
}

function assertType(value, type, message) {
    if (typeof value !== type) {
        throw new Error(message || `Expected type ${type}, got ${typeof value}`);
    }
}

console.log('🧪 COMPREHENSIVE FORMAT REGISTRY TESTS');
console.log('======================================================================\n');

console.log('📦 Constructor & Initialization Tests');
console.log('----------------------------------------------------------------------');

test('FormatRegistry: Instantiation', () => {
    const registry = new FormatRegistry();
    assertType(registry, 'object');
});

test('FormatRegistry: Has formatters map', () => {
    const registry = new FormatRegistry();
    assertEquals(registry.formatters instanceof Map, true);
});

test('FormatRegistry: Registers default formatters', () => {
    const registry = new FormatRegistry();
    assertEquals(registry.has('json'), true);
    assertEquals(registry.has('toon'), true);
    assertEquals(registry.has('yaml'), true);
    assertEquals(registry.has('csv'), true);
    assertEquals(registry.has('xml'), true);
    assertEquals(registry.has('markdown'), true);
    assertEquals(registry.has('gitingest'), true);
    assertEquals(registry.has('json-compact'), true);
});

console.log('\n📋 Registration & Query Methods');
console.log('----------------------------------------------------------------------');

test('FormatRegistry.register: Register custom formatter', () => {
    const registry = new FormatRegistry();
    registry.register('custom', {
        name: 'Custom',
        encoder: (data) => 'custom-output'
    });
    assertEquals(registry.has('custom'), true);
});

test('FormatRegistry.register: Throws error for missing encoder', () => {
    const registry = new FormatRegistry();
    assertThrows(
        () => registry.register('invalid', { name: 'Invalid' }),
        'must have an encoder function'
    );
});

test('FormatRegistry.register: Throws error for non-function encoder', () => {
    const registry = new FormatRegistry();
    assertThrows(
        () => registry.register('invalid', { name: 'Invalid', encoder: 'not-a-function' }),
        'must have an encoder function'
    );
});

test('FormatRegistry.get: Returns formatter', () => {
    const registry = new FormatRegistry();
    const formatter = registry.get('json');
    assertType(formatter, 'object');
    assertType(formatter.encoder, 'function');
});

test('FormatRegistry.get: Throws error for unknown format', () => {
    const registry = new FormatRegistry();
    assertThrows(
        () => registry.get('nonexistent'),
        'Unknown format: nonexistent'
    );
});

test('FormatRegistry.has: Returns true for existing format', () => {
    const registry = new FormatRegistry();
    assertEquals(registry.has('json'), true);
});

test('FormatRegistry.has: Returns false for non-existing format', () => {
    const registry = new FormatRegistry();
    assertEquals(registry.has('nonexistent'), false);
});

test('FormatRegistry.listFormats: Returns array of format names', () => {
    const registry = new FormatRegistry();
    const formats = registry.listFormats();
    assertEquals(Array.isArray(formats), true);
    assertEquals(formats.length > 0, true);
    assertIncludes(formats.join(','), 'json');
    assertIncludes(formats.join(','), 'yaml');
});

test('FormatRegistry.getInfo: Returns format information', () => {
    const registry = new FormatRegistry();
    const info = registry.getInfo('json');
    assertEquals(info.name, 'JSON');
    assertEquals(info.extension, '.json');
    assertEquals(info.mimeType, 'application/json');
    assertType(info.description, 'string');
});

test('FormatRegistry.getAllInfo: Returns all formats info', () => {
    const registry = new FormatRegistry();
    const allInfo = registry.getAllInfo();
    assertType(allInfo, 'object');
    assertType(allInfo.json, 'object');
    assertEquals(allInfo.json.name, 'JSON');
    assertType(allInfo.yaml, 'object');
    assertType(allInfo.toon, 'object');
});

console.log('\n🔧 Encode Method Tests');
console.log('----------------------------------------------------------------------');

test('FormatRegistry.encode: Encodes to JSON', () => {
    const registry = new FormatRegistry();
    const data = { test: 'value' };
    const result = registry.encode('json', data);
    assertIncludes(result, '"test"');
    assertIncludes(result, '"value"');
});

test('FormatRegistry.encode: Encodes to JSON compact', () => {
    const registry = new FormatRegistry();
    const data = { test: 'value' };
    const result = registry.encode('json-compact', data);
    assertEquals(result, '{"test":"value"}');
});

test('FormatRegistry.encode: Encodes to custom format', () => {
    const registry = new FormatRegistry();
    registry.register('test-format', {
        name: 'Test',
        encoder: (data) => `custom:${data.value}`
    });
    const result = registry.encode('test-format', { value: 'hello' });
    assertEquals(result, 'custom:hello');
});

console.log('\n📝 YAML Encoding Tests');
console.log('----------------------------------------------------------------------');

test('FormatRegistry.encodeYAML: Encodes null', () => {
    const registry = new FormatRegistry();
    const result = registry.encodeYAML(null);
    assertEquals(result, 'null');
});

test('FormatRegistry.encodeYAML: Encodes undefined', () => {
    const registry = new FormatRegistry();
    const result = registry.encodeYAML(undefined);
    assertEquals(result, 'null');
});

test('FormatRegistry.encodeYAML: Encodes boolean true', () => {
    const registry = new FormatRegistry();
    const result = registry.encodeYAML(true);
    assertEquals(result, 'true');
});

test('FormatRegistry.encodeYAML: Encodes boolean false', () => {
    const registry = new FormatRegistry();
    const result = registry.encodeYAML(false);
    assertEquals(result, 'false');
});

test('FormatRegistry.encodeYAML: Encodes number', () => {
    const registry = new FormatRegistry();
    const result = registry.encodeYAML(42);
    assertEquals(result, '42');
});

test('FormatRegistry.encodeYAML: Encodes simple string', () => {
    const registry = new FormatRegistry();
    const result = registry.encodeYAML('hello');
    assertEquals(result, 'hello');
});

test('FormatRegistry.encodeYAML: Quotes string with special characters', () => {
    const registry = new FormatRegistry();
    const result = registry.encodeYAML('key: value');
    assertIncludes(result, '"');
});

test('FormatRegistry.encodeYAML: Handles quotes in string', () => {
    const registry = new FormatRegistry();
    const result = registry.encodeYAML('say "hello"');
    // Quotes alone don't trigger special character quoting
    assertEquals(result, 'say "hello"');
});

test('FormatRegistry.encodeYAML: Escapes quotes when string has special chars', () => {
    const registry = new FormatRegistry();
    const result = registry.encodeYAML('key: "value"');
    // String has both colon AND quotes, so it gets quoted and quotes escaped
    assertIncludes(result, '\\"');
});

test('FormatRegistry.encodeYAML: Encodes empty array', () => {
    const registry = new FormatRegistry();
    const result = registry.encodeYAML([]);
    assertEquals(result, '[]');
});

test('FormatRegistry.encodeYAML: Encodes array with items', () => {
    const registry = new FormatRegistry();
    const result = registry.encodeYAML(['item1', 'item2']);
    assertIncludes(result, '- item1');
    assertIncludes(result, '- item2');
});

test('FormatRegistry.encodeYAML: Encodes empty object', () => {
    const registry = new FormatRegistry();
    const result = registry.encodeYAML({});
    assertEquals(result, '{}');
});

test('FormatRegistry.encodeYAML: Encodes object with properties', () => {
    const registry = new FormatRegistry();
    const result = registry.encodeYAML({ name: 'test', value: 42 });
    assertIncludes(result, 'name: test');
    assertIncludes(result, 'value: 42');
});

test('FormatRegistry.encodeYAML: Encodes nested object', () => {
    const registry = new FormatRegistry();
    const result = registry.encodeYAML({
        outer: {
            inner: 'value'
        }
    });
    assertIncludes(result, 'outer:');
    assertIncludes(result, 'inner: value');
});

test('FormatRegistry.encode: Full YAML encoding via registry', () => {
    const registry = new FormatRegistry();
    const data = { test: 'value', count: 10 };
    const result = registry.encode('yaml', data);
    assertIncludes(result, 'test: value');
    assertIncludes(result, 'count: 10');
});

test('FormatRegistry.encodeYAML: Handles unsupported types (Symbol)', () => {
    const registry = new FormatRegistry();
    const sym = Symbol('test');
    const result = registry.encodeYAML(sym);
    assertEquals(result, 'null');
});

test('FormatRegistry.encode: Full TOON encoding via registry', () => {
    const registry = new FormatRegistry();
    const data = {
        project: { root: '/test', totalFiles: 1 },
        paths: { 'src/': ['file.js'] }
    };
    const result = registry.encode('toon', data);
    assertType(result, 'string');
    // TOON format should produce some output
    assertEquals(result.length > 0, true);
});

console.log('\n📄 Markdown Encoding Tests');
console.log('----------------------------------------------------------------------');

test('FormatRegistry.encodeMarkdown: Encodes project summary', () => {
    const registry = new FormatRegistry();
    const data = {
        project: {
            root: '/test/path',
            totalFiles: 10,
            totalTokens: 5000
        }
    };
    const result = registry.encodeMarkdown(data);
    assertIncludes(result, '# /test/path - Context Analysis');
    assertIncludes(result, 'Total Files');
    assertIncludes(result, '10');
    assertIncludes(result, '5,000');
});

test('FormatRegistry.encodeMarkdown: Encodes without project', () => {
    const registry = new FormatRegistry();
    const data = {};
    const result = registry.encodeMarkdown(data);
    assertIncludes(result, '# Project - Context Analysis');
});

test('FormatRegistry.encodeMarkdown: Encodes file paths', () => {
    const registry = new FormatRegistry();
    const data = {
        paths: {
            'src/': ['file1.js', 'file2.js'],
            'test/': ['test1.js']
        }
    };
    const result = registry.encodeMarkdown(data);
    assertIncludes(result, '## File Structure');
    assertIncludes(result, '### src/');
    assertIncludes(result, '- file1.js');
    assertIncludes(result, '- file2.js');
    assertIncludes(result, '### test/');
    assertIncludes(result, '- test1.js');
});

test('FormatRegistry.encodeMarkdown: Encodes methods', () => {
    const registry = new FormatRegistry();
    const data = {
        methods: {
            'file1.js': [
                { name: 'function1', line: 10, tokens: 50 },
                { name: 'function2', line: 20, tokens: 75 }
            ]
        }
    };
    const result = registry.encodeMarkdown(data);
    assertIncludes(result, '## Methods');
    assertIncludes(result, '### file1.js');
    assertIncludes(result, 'function1');
    assertIncludes(result, '10');
    assertIncludes(result, '50');
    assertIncludes(result, 'function2');
});

test('FormatRegistry.encodeMarkdown: Encodes method stats', () => {
    const registry = new FormatRegistry();
    const data = {
        methodStats: {
            totalMethods: 100,
            includedMethods: 80,
            totalMethodTokens: 5000
        }
    };
    const result = registry.encodeMarkdown(data);
    assertIncludes(result, '## Statistics');
    assertIncludes(result, 'Total Methods');
    assertIncludes(result, '100');
    assertIncludes(result, 'Included Methods');
    assertIncludes(result, '80');
    assertIncludes(result, '5000');
});

test('FormatRegistry.encodeMarkdown: Handles missing totalMethodTokens', () => {
    const registry = new FormatRegistry();
    const data = {
        methodStats: {
            totalMethods: 100,
            includedMethods: 80
        }
    };
    const result = registry.encodeMarkdown(data);
    assertIncludes(result, '0');
});

test('FormatRegistry.encode: Full Markdown encoding via registry', () => {
    const registry = new FormatRegistry();
    const data = { project: { root: '/test', totalFiles: 5, totalTokens: 1000 } };
    const result = registry.encode('markdown', data);
    assertIncludes(result, '/test');
});

console.log('\n📊 CSV Encoding Tests');
console.log('----------------------------------------------------------------------');

test('FormatRegistry.encodeCSV: Encodes with headers and rows', () => {
    const registry = new FormatRegistry();
    const data = {
        headers: ['Name', 'Value'],
        rows: [
            { Name: 'Test1', Value: 'Value1' },
            { Name: 'Test2', Value: 'Value2' }
        ]
    };
    const result = registry.encodeCSV(data);
    assertIncludes(result, 'Name,Value');
    assertIncludes(result, 'Test1,Value1');
    assertIncludes(result, 'Test2,Value2');
});

test('FormatRegistry.encodeCSV: Quotes values with commas', () => {
    const registry = new FormatRegistry();
    const data = {
        headers: ['Name', 'Value'],
        rows: [
            { Name: 'Test, Name', Value: 'Value1' }
        ]
    };
    const result = registry.encodeCSV(data);
    assertIncludes(result, '"Test, Name"');
});

test('FormatRegistry.encodeCSV: Escapes quotes in values', () => {
    const registry = new FormatRegistry();
    const data = {
        headers: ['Name', 'Value'],
        rows: [
            { Name: 'Test "quoted"', Value: 'Value1' }
        ]
    };
    const result = registry.encodeCSV(data);
    assertIncludes(result, '""');
});

test('FormatRegistry.encodeCSV: Handles missing values', () => {
    const registry = new FormatRegistry();
    const data = {
        headers: ['Name', 'Value', 'Extra'],
        rows: [
            { Name: 'Test1' }
        ]
    };
    const result = registry.encodeCSV(data);
    assertIncludes(result, 'Test1,,');
});

test('FormatRegistry.encodeCSV: Encodes methods', () => {
    const registry = new FormatRegistry();
    const data = {
        methods: {
            'file1.js': [
                { name: 'func1', line: 10, tokens: 50 },
                { name: 'func2', line: 20, tokens: 75 }
            ]
        }
    };
    const result = registry.encodeCSV(data);
    assertIncludes(result, 'File,Method,Line,Tokens');
    assertIncludes(result, '"file1.js","func1",10,50');
    assertIncludes(result, '"file1.js","func2",20,75');
});

test('FormatRegistry.encodeFilesCSV: Encodes file paths', () => {
    const registry = new FormatRegistry();
    const data = {
        paths: {
            'src/': ['file1.js', 'file2.js'],
            'test/': ['test1.js']
        }
    };
    const result = registry.encodeFilesCSV(data);
    assertIncludes(result, 'Directory,File');
    assertIncludes(result, '"src/","file1.js"');
    assertIncludes(result, '"src/","file2.js"');
    assertIncludes(result, '"test/","test1.js"');
});

test('FormatRegistry.encodeFilesCSV: Handles missing paths', () => {
    const registry = new FormatRegistry();
    const data = {};
    const result = registry.encodeFilesCSV(data);
    assertEquals(result, 'Directory,File\n');
});

test('FormatRegistry.encodeCSV: Falls back to encodeFilesCSV', () => {
    const registry = new FormatRegistry();
    const data = {
        paths: {
            'src/': ['file1.js']
        }
    };
    const result = registry.encodeCSV(data);
    assertIncludes(result, 'Directory,File');
    assertIncludes(result, '"src/","file1.js"');
});

test('FormatRegistry.encode: Full CSV encoding via registry', () => {
    const registry = new FormatRegistry();
    const data = {
        methods: {
            'test.js': [{ name: 'test', line: 1, tokens: 10 }]
        }
    };
    const result = registry.encode('csv', data);
    assertIncludes(result, 'File,Method');
});

console.log('\n🏷️  XML Encoding Tests');
console.log('----------------------------------------------------------------------');

test('FormatRegistry.encodeXML: Adds XML declaration at top level', () => {
    const registry = new FormatRegistry();
    const data = { test: 'value' };
    const result = registry.encodeXML(data);
    assertIncludes(result, '<?xml version="1.0" encoding="UTF-8"?>');
    assertIncludes(result, '<context>');
    assertIncludes(result, '</context>');
});

test('FormatRegistry.encodeXML: Encodes null', () => {
    const registry = new FormatRegistry();
    const data = { value: null };
    const result = registry.encodeXML(data);
    assertIncludes(result, '<value></value>');
});

test('FormatRegistry.encodeXML: Encodes undefined', () => {
    const registry = new FormatRegistry();
    const data = { value: undefined };
    const result = registry.encodeXML(data);
    assertIncludes(result, '<value></value>');
});

test('FormatRegistry.encodeXML: Encodes boolean', () => {
    const registry = new FormatRegistry();
    const data = { flag: true };
    const result = registry.encodeXML(data);
    assertIncludes(result, '<flag>true</flag>');
});

test('FormatRegistry.encodeXML: Encodes number', () => {
    const registry = new FormatRegistry();
    const data = { count: 42 };
    const result = registry.encodeXML(data);
    assertIncludes(result, '<count>42</count>');
});

test('FormatRegistry.encodeXML: Encodes string', () => {
    const registry = new FormatRegistry();
    const data = { name: 'test' };
    const result = registry.encodeXML(data);
    assertIncludes(result, '<name>test</name>');
});

test('FormatRegistry.encodeXML: Escapes XML special characters', () => {
    const registry = new FormatRegistry();
    const data = { text: '<tag>&"special"</tag>' };
    const result = registry.encodeXML(data);
    assertIncludes(result, '&lt;tag&gt;');
    assertIncludes(result, '&amp;');
    assertIncludes(result, '&quot;');
});

test('FormatRegistry.escapeXML: Escapes all special characters', () => {
    const registry = new FormatRegistry();
    const result = registry.escapeXML('<>&"\'');
    assertEquals(result, '&lt;&gt;&amp;&quot;&apos;');
});

test('FormatRegistry.encodeXML: Encodes array', () => {
    const registry = new FormatRegistry();
    const data = { items: ['item1', 'item2'] };
    const result = registry.encodeXML(data);
    assertIncludes(result, '<item>item1</item>');
    assertIncludes(result, '<item>item2</item>');
});

test('FormatRegistry.encodeXML: Encodes nested object', () => {
    const registry = new FormatRegistry();
    const data = {
        outer: {
            inner: 'value'
        }
    };
    const result = registry.encodeXML(data);
    assertIncludes(result, '<outer>');
    assertIncludes(result, '<inner>value</inner>');
    assertIncludes(result, '</outer>');
});

test('FormatRegistry.encodeXML: Encodes object with array', () => {
    const registry = new FormatRegistry();
    const data = {
        list: ['a', 'b']
    };
    const result = registry.encodeXML(data);
    assertIncludes(result, '<list>');
    assertIncludes(result, '<item>a</item>');
    assertIncludes(result, '</list>');
});

test('FormatRegistry.sanitizeXMLTag: Removes invalid characters', () => {
    const registry = new FormatRegistry();
    const result = registry.sanitizeXMLTag('tag:name@value');
    assertEquals(result, 'tag_name_value');
});

test('FormatRegistry.sanitizeXMLTag: Keeps valid characters', () => {
    const registry = new FormatRegistry();
    const result = registry.sanitizeXMLTag('valid-tag_123');
    assertEquals(result, 'valid-tag_123');
});

test('FormatRegistry.encode: Full XML encoding via registry', () => {
    const registry = new FormatRegistry();
    const data = { test: 'value' };
    const result = registry.encode('xml', data);
    assertIncludes(result, '<?xml version');
});

test('FormatRegistry.encodeXML: Handles unsupported types (Symbol)', () => {
    const registry = new FormatRegistry();
    const data = { value: Symbol('test') };
    const result = registry.encodeXML(data);
    // Unsupported types return empty string
    assertIncludes(result, '<value></value>');
});

console.log('\n🔍 Type Detection Tests');
console.log('----------------------------------------------------------------------');

test('FormatRegistry.getType: Detects null', () => {
    const registry = new FormatRegistry();
    const result = registry.getType(null);
    assertEquals(result, 'null');
});

test('FormatRegistry.getType: Detects undefined', () => {
    const registry = new FormatRegistry();
    const result = registry.getType(undefined);
    assertEquals(result, 'undefined');
});

test('FormatRegistry.getType: Detects array', () => {
    const registry = new FormatRegistry();
    const result = registry.getType([]);
    assertEquals(result, 'array');
});

test('FormatRegistry.getType: Detects object', () => {
    const registry = new FormatRegistry();
    const result = registry.getType({});
    assertEquals(result, 'object');
});

test('FormatRegistry.getType: Detects string', () => {
    const registry = new FormatRegistry();
    const result = registry.getType('test');
    assertEquals(result, 'string');
});

test('FormatRegistry.getType: Detects number', () => {
    const registry = new FormatRegistry();
    const result = registry.getType(42);
    assertEquals(result, 'number');
});

test('FormatRegistry.getType: Detects boolean', () => {
    const registry = new FormatRegistry();
    const result = registry.getType(true);
    assertEquals(result, 'boolean');
});

console.log('\n💡 Format Suggestion Tests');
console.log('----------------------------------------------------------------------');

test('FormatRegistry.suggestFormat: Suggests TOON for methods', () => {
    const registry = new FormatRegistry();
    const data = {
        methods: {
            'file.js': [{ name: 'test', line: 1, tokens: 10 }]
        }
    };
    const result = registry.suggestFormat(data);
    assertEquals(result, 'toon');
});

test('FormatRegistry.suggestFormat: Suggests TOON for paths', () => {
    const registry = new FormatRegistry();
    const data = {
        paths: {
            'src/': ['file.js']
        }
    };
    const result = registry.suggestFormat(data);
    assertEquals(result, 'toon');
});

test('FormatRegistry.suggestFormat: Defaults to JSON', () => {
    const registry = new FormatRegistry();
    const data = {
        someOtherData: 'value'
    };
    const result = registry.suggestFormat(data);
    assertEquals(result, 'json');
});

test('FormatRegistry.suggestFormat: Prefers methods over paths', () => {
    const registry = new FormatRegistry();
    const data = {
        methods: { 'file.js': [] },
        paths: { 'src/': [] }
    };
    const result = registry.suggestFormat(data);
    assertEquals(result, 'toon');
});

console.log('\n🔧 GitIngest Format Tests');
console.log('----------------------------------------------------------------------');

test('FormatRegistry.encode: GitIngest throws without formatter option', () => {
    const registry = new FormatRegistry();
    assertThrows(
        () => registry.encode('gitingest', {}),
        'GitIngest format requires a GitIngestFormatter instance'
    );
});

test('FormatRegistry.encode: GitIngest works with formatter option', () => {
    const registry = new FormatRegistry();
    const mockFormatter = {
        generateDigest: () => 'gitingest output'
    };
    const result = registry.encode('gitingest', {}, { formatter: mockFormatter });
    assertEquals(result, 'gitingest output');
});

console.log('\n⚙️  Edge Cases & Integration Tests');
console.log('----------------------------------------------------------------------');

test('FormatRegistry: All default formatters have required properties', () => {
    const registry = new FormatRegistry();
    const formats = registry.listFormats();

    for (const formatName of formats) {
        const info = registry.getInfo(formatName);
        assertType(info.name, 'string');
        assertType(info.description, 'string');
        assertType(info.extension, 'string');
        assertType(info.mimeType, 'string');
    }
});

test('FormatRegistry.encodeYAML: Handles deeply nested structures', () => {
    const registry = new FormatRegistry();
    const data = {
        level1: {
            level2: {
                level3: {
                    value: 'deep'
                }
            }
        }
    };
    const result = registry.encodeYAML(data);
    assertIncludes(result, 'level1:');
    assertIncludes(result, 'level2:');
    assertIncludes(result, 'level3:');
    assertIncludes(result, 'value: deep');
});

test('FormatRegistry.encodeYAML: Handles mixed arrays', () => {
    const registry = new FormatRegistry();
    const data = [1, 'string', true, null, { key: 'value' }];
    const result = registry.encodeYAML(data);
    assertIncludes(result, '- 1');
    assertIncludes(result, '- string');
    assertIncludes(result, '- true');
    assertIncludes(result, '- null');
    assertIncludes(result, 'key: value');
});

test('FormatRegistry.encodeMarkdown: Handles complete data structure', () => {
    const registry = new FormatRegistry();
    const data = {
        project: { root: '/test', totalFiles: 5, totalTokens: 1000 },
        paths: { 'src/': ['file1.js'] },
        methods: { 'file1.js': [{ name: 'test', line: 1, tokens: 10 }] },
        methodStats: { totalMethods: 1, includedMethods: 1, totalMethodTokens: 10 }
    };
    const result = registry.encodeMarkdown(data);
    assertIncludes(result, '/test');
    assertIncludes(result, 'File Structure');
    assertIncludes(result, 'Methods');
    assertIncludes(result, 'Statistics');
});

test('FormatRegistry.encodeXML: Handles complex nested structure', () => {
    const registry = new FormatRegistry();
    const data = {
        project: {
            name: 'test',
            files: ['a', 'b'],
            meta: {
                author: 'dev'
            }
        }
    };
    const result = registry.encodeXML(data);
    assertIncludes(result, '<project>');
    assertIncludes(result, '<name>test</name>');
    assertIncludes(result, '<files>');
    assertIncludes(result, '<item>a</item>');
    assertIncludes(result, '<meta>');
    assertIncludes(result, '<author>dev</author>');
});

console.log('\n======================================================================');
console.log('📊 TEST RESULTS SUMMARY');
console.log('======================================================================');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 ALL FORMAT REGISTRY TESTS PASSED!');
    console.log('📈 FormatRegistry now has comprehensive test coverage.');
} else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed. Please review.`);
    process.exit(1);
}
