/**
 * Comprehensive tests for FormatRegistry
 * Testing all formatters, encoders, and utility methods
 */

import FormatRegistry from '../lib/formatters/format-registry.js';

// Test runner utilities
const tests = [];
const failedTests = [];
let totalTests = 0;
let passedTests = 0;

function test(description, testFn) {
    tests.push({ description, testFn });
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

function assertThrows(fn, expectedMessage, message) {
    let threw = false;
    let error = null;
    try {
        fn();
    } catch (e) {
        threw = true;
        error = e;
        if (expectedMessage && !e.message.includes(expectedMessage)) {
            throw new Error(message || `Expected error message to include "${expectedMessage}", got "${e.message}"`);
        }
    }
    if (!threw) {
        throw new Error(message || 'Expected function to throw an error');
    }
}

function assertContains(str, substring, message) {
    if (!str.includes(substring)) {
        throw new Error(message || `Expected "${str}" to contain "${substring}"`);
    }
}

// ============================================================
// Constructor and Default Formatters Tests
// ============================================================

test('FormatRegistry: Constructor initializes formatters', () => {
    const registry = new FormatRegistry();
    assert(registry.formatters instanceof Map, 'Should have formatters Map');
});

test('FormatRegistry: Registers default formatters', () => {
    const registry = new FormatRegistry();
    const formats = registry.listFormats();
    assert(formats.includes('toon'), 'Should have TOON formatter');
    assert(formats.includes('json'), 'Should have JSON formatter');
    assert(formats.includes('yaml'), 'Should have YAML formatter');
    assert(formats.includes('csv'), 'Should have CSV formatter');
    assert(formats.includes('xml'), 'Should have XML formatter');
    assert(formats.includes('markdown'), 'Should have Markdown formatter');
    assert(formats.includes('gitingest'), 'Should have GitIngest formatter');
    assert(formats.includes('json-compact'), 'Should have JSON Compact formatter');
});

// ============================================================
// Registration and Retrieval Tests
// ============================================================

test('FormatRegistry.register: Registers custom formatter', () => {
    const registry = new FormatRegistry();
    registry.register('custom', {
        name: 'Custom',
        description: 'Custom formatter',
        extension: '.custom',
        mimeType: 'text/custom',
        encoder: (data) => 'custom output'
    });
    assert(registry.has('custom'), 'Should have custom formatter');
});

test('FormatRegistry.register: Throws error if encoder is missing', () => {
    const registry = new FormatRegistry();
    assertThrows(() => {
        registry.register('invalid', {
            name: 'Invalid',
            description: 'No encoder'
        });
    }, 'must have an encoder function');
});

test('FormatRegistry.register: Throws error if encoder is not a function', () => {
    const registry = new FormatRegistry();
    assertThrows(() => {
        registry.register('invalid', {
            name: 'Invalid',
            description: 'Bad encoder',
            encoder: 'not a function'
        });
    }, 'must have an encoder function');
});

test('FormatRegistry.get: Retrieves formatter by name', () => {
    const registry = new FormatRegistry();
    const formatter = registry.get('json');
    assert(formatter, 'Should return formatter');
    assert(formatter.name === 'JSON', 'Should return correct formatter');
});

test('FormatRegistry.get: Throws error for unknown format', () => {
    const registry = new FormatRegistry();
    assertThrows(() => {
        registry.get('unknown');
    }, 'Unknown format: unknown');
});

test('FormatRegistry.has: Returns true for existing format', () => {
    const registry = new FormatRegistry();
    assert(registry.has('json') === true, 'Should return true');
});

test('FormatRegistry.has: Returns false for non-existing format', () => {
    const registry = new FormatRegistry();
    assert(registry.has('unknown') === false, 'Should return false');
});

test('FormatRegistry.listFormats: Returns array of format names', () => {
    const registry = new FormatRegistry();
    const formats = registry.listFormats();
    assert(Array.isArray(formats), 'Should return array');
    assert(formats.length > 0, 'Should have formats');
});

// ============================================================
// Format Info Tests
// ============================================================

test('FormatRegistry.getInfo: Returns formatter info', () => {
    const registry = new FormatRegistry();
    const info = registry.getInfo('json');
    assert(info.name === 'JSON', 'Should have name');
    assert(info.description, 'Should have description');
    assert(info.extension === '.json', 'Should have extension');
    assert(info.mimeType === 'application/json', 'Should have mimeType');
});

test('FormatRegistry.getAllInfo: Returns info for all formatters', () => {
    const registry = new FormatRegistry();
    const allInfo = registry.getAllInfo();
    assert(allInfo.json, 'Should have JSON info');
    assert(allInfo.yaml, 'Should have YAML info');
    assert(allInfo.toon, 'Should have TOON info');
    assert(Object.keys(allInfo).length >= 7, 'Should have all formatters');
});

// ============================================================
// Encoding Tests - JSON
// ============================================================

test('FormatRegistry.encode: JSON format', () => {
    const registry = new FormatRegistry();
    const data = { test: 'value' };
    const output = registry.encode('json', data);
    assertContains(output, '"test"', 'Should contain key');
    assertContains(output, '"value"', 'Should contain value');
});

test('FormatRegistry.encode: JSON Compact format', () => {
    const registry = new FormatRegistry();
    const data = { test: 'value' };
    const output = registry.encode('json-compact', data);
    assertEquals(output, '{"test":"value"}', 'Should be compact');
});

// ============================================================
// Encoding Tests - YAML
// ============================================================

test('FormatRegistry.encodeYAML: Null value', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeYAML(null);
    assertEquals(output, 'null', 'Should encode null');
});

test('FormatRegistry.encodeYAML: Undefined value', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeYAML(undefined);
    assertEquals(output, 'null', 'Should encode undefined as null');
});

test('FormatRegistry.encodeYAML: Boolean value', () => {
    const registry = new FormatRegistry();
    const output1 = registry.encodeYAML(true);
    const output2 = registry.encodeYAML(false);
    assertEquals(output1, 'true', 'Should encode true');
    assertEquals(output2, 'false', 'Should encode false');
});

test('FormatRegistry.encodeYAML: Number value', () => {
    const registry = new FormatRegistry();
    const output1 = registry.encodeYAML(42);
    const output2 = registry.encodeYAML(3.14);
    assertEquals(output1, '42', 'Should encode integer');
    assertEquals(output2, '3.14', 'Should encode float');
});

test('FormatRegistry.encodeYAML: Simple string', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeYAML('simple');
    assertEquals(output, 'simple', 'Should encode simple string');
});

test('FormatRegistry.encodeYAML: String with special characters', () => {
    const registry = new FormatRegistry();
    const specialChars = [':', '\n', '{', '}', '[', ']', ',', '&', '*', '#', '?', '|', '<', '>', '=', '!', '%', '@', '`'];
    for (const char of specialChars) {
        const output = registry.encodeYAML(`test${char}value`);
        assertContains(output, '"', 'Should quote string with special char: ' + char);
    }
});

test('FormatRegistry.encodeYAML: String with quotes', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeYAML('test:"quoted"');
    assertContains(output, '\\"', 'Should escape quotes');
});

test('FormatRegistry.encodeYAML: Empty array', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeYAML([]);
    assertEquals(output, '[]', 'Should encode empty array');
});

test('FormatRegistry.encodeYAML: Array with values', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeYAML([1, 2, 3]);
    assertContains(output, '- 1', 'Should encode array items');
    assertContains(output, '- 2', 'Should encode array items');
    assertContains(output, '- 3', 'Should encode array items');
});

test('FormatRegistry.encodeYAML: Empty object', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeYAML({});
    assertEquals(output, '{}', 'Should encode empty object');
});

test('FormatRegistry.encodeYAML: Object with properties', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeYAML({ name: 'test', value: 42 });
    assertContains(output, 'name: test', 'Should encode object properties');
    assertContains(output, 'value: 42', 'Should encode object properties');
});

test('FormatRegistry.encodeYAML: Nested object', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeYAML({
        outer: {
            inner: 'value'
        }
    });
    assertContains(output, 'outer:', 'Should encode nested object');
    assertContains(output, 'inner: value', 'Should encode nested properties');
});

test('FormatRegistry.encodeYAML: Unknown type returns null', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeYAML(Symbol('test'));
    assertEquals(output, 'null', 'Should return null for unknown types');
});

test('FormatRegistry.encode: YAML format via encode method', () => {
    const registry = new FormatRegistry();
    const data = { test: 'value' };
    const output = registry.encode('yaml', data);
    assertContains(output, 'test: value', 'Should encode as YAML');
});

// ============================================================
// Encoding Tests - Markdown
// ============================================================

test('FormatRegistry.encodeMarkdown: Project summary', () => {
    const registry = new FormatRegistry();
    const data = {
        project: {
            root: '/test/project',
            totalFiles: 10,
            totalTokens: 1000
        }
    };
    const output = registry.encodeMarkdown(data);
    assertContains(output, '# /test/project', 'Should contain project root');
    assertContains(output, 'Total Files', 'Should contain file count');
    assertContains(output, '10', 'Should contain file count value');
    assertContains(output, 'Total Tokens', 'Should contain token count');
});

test('FormatRegistry.encodeMarkdown: File structure', () => {
    const registry = new FormatRegistry();
    const data = {
        paths: {
            'src/': ['index.js', 'app.js'],
            'test/': ['test.js']
        }
    };
    const output = registry.encodeMarkdown(data);
    assertContains(output, 'src/', 'Should contain directory');
    assertContains(output, 'index.js', 'Should contain files');
    assertContains(output, 'test.js', 'Should contain files');
});

test('FormatRegistry.encodeMarkdown: Methods', () => {
    const registry = new FormatRegistry();
    const data = {
        methods: {
            'file.js': [
                { name: 'testMethod', line: 10, tokens: 50 }
            ]
        }
    };
    const output = registry.encodeMarkdown(data);
    assertContains(output, '## Methods', 'Should have methods section');
    assertContains(output, 'testMethod', 'Should contain method name');
    assertContains(output, '10', 'Should contain line number');
    assertContains(output, '50', 'Should contain token count');
});

test('FormatRegistry.encodeMarkdown: Method stats', () => {
    const registry = new FormatRegistry();
    const data = {
        methodStats: {
            totalMethods: 10,
            includedMethods: 8,
            totalMethodTokens: 500
        }
    };
    const output = registry.encodeMarkdown(data);
    assertContains(output, 'Statistics', 'Should have statistics section');
    assertContains(output, '10', 'Should contain total methods');
    assertContains(output, '8', 'Should contain included methods');
    assertContains(output, '500', 'Should contain total tokens');
});

test('FormatRegistry.encodeMarkdown: Empty data with defaults', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeMarkdown({});
    assertContains(output, 'Project', 'Should have default project header');
});

test('FormatRegistry.encode: Markdown format via encode method', () => {
    const registry = new FormatRegistry();
    const data = { project: { root: 'test' } };
    const output = registry.encode('markdown', data);
    assertContains(output, '# test', 'Should encode as Markdown');
});

// ============================================================
// Encoding Tests - CSV
// ============================================================

test('FormatRegistry.encodeCSV: Method-level data', () => {
    const registry = new FormatRegistry();
    const data = {
        methods: {
            'file.js': [
                { name: 'method1', line: 10, tokens: 50 },
                { name: 'method2', line: 20, tokens: 30 }
            ]
        }
    };
    const output = registry.encodeCSV(data);
    assertContains(output, 'File,Method,Line,Tokens', 'Should have CSV header');
    assertContains(output, 'method1', 'Should contain method name');
    assertContains(output, '10', 'Should contain line number');
    assertContains(output, '50', 'Should contain token count');
});

test('FormatRegistry.encodeCSV: Headers and rows format', () => {
    const registry = new FormatRegistry();
    const data = {
        headers: ['Name', 'Value'],
        rows: [
            { Name: 'test1', Value: 'value1' },
            { Name: 'test2', Value: 'value2' }
        ]
    };
    const output = registry.encodeCSV(data);
    assertContains(output, 'Name,Value', 'Should have header row');
    assertContains(output, 'test1,value1', 'Should have data rows');
    assertContains(output, 'test2,value2', 'Should have data rows');
});

test('FormatRegistry.encodeCSV: Escapes commas', () => {
    const registry = new FormatRegistry();
    const data = {
        headers: ['Name'],
        rows: [
            { Name: 'value,with,commas' }
        ]
    };
    const output = registry.encodeCSV(data);
    assertContains(output, '"value,with,commas"', 'Should quote values with commas');
});

test('FormatRegistry.encodeCSV: Escapes quotes', () => {
    const registry = new FormatRegistry();
    const data = {
        headers: ['Name'],
        rows: [
            { Name: 'value"with"quotes' }
        ]
    };
    const output = registry.encodeCSV(data);
    assertContains(output, 'value""with""quotes', 'Should escape quotes');
});

test('FormatRegistry.encodeCSV: Handles missing values', () => {
    const registry = new FormatRegistry();
    const data = {
        headers: ['Name', 'Value'],
        rows: [
            { Name: 'test1' }  // Missing Value
        ]
    };
    const output = registry.encodeCSV(data);
    assertContains(output, 'test1,', 'Should handle missing values');
});

test('FormatRegistry.encodeFilesCSV: File-level data', () => {
    const registry = new FormatRegistry();
    const data = {
        paths: {
            'src/': ['index.js', 'app.js'],
            'test/': ['test.js']
        }
    };
    const output = registry.encodeFilesCSV(data);
    assertContains(output, 'Directory,File', 'Should have CSV header');
    assertContains(output, 'src/', 'Should contain directory');
    assertContains(output, 'index.js', 'Should contain files');
});

test('FormatRegistry.encodeFilesCSV: Empty data', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeFilesCSV({});
    assertEquals(output, 'Directory,File\n', 'Should return header only');
});

test('FormatRegistry.encodeCSV: Falls back to file-level CSV', () => {
    const registry = new FormatRegistry();
    const data = {
        paths: {
            'src/': ['index.js']
        }
    };
    const output = registry.encodeCSV(data);
    assertContains(output, 'Directory,File', 'Should use file-level format');
});

test('FormatRegistry.encode: CSV format via encode method', () => {
    const registry = new FormatRegistry();
    const data = { methods: { 'file.js': [{ name: 'test', line: 1, tokens: 10 }] } };
    const output = registry.encode('csv', data);
    assertContains(output, 'File,Method,Line,Tokens', 'Should encode as CSV');
});

// ============================================================
// Encoding Tests - XML
// ============================================================

test('FormatRegistry.encodeXML: Top level with declaration', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeXML({ test: 'value' });
    assertContains(output, '<?xml version="1.0" encoding="UTF-8"?>', 'Should have XML declaration');
    assertContains(output, '<context>', 'Should have context wrapper');
    assertContains(output, '</context>', 'Should close context wrapper');
});

test('FormatRegistry.encodeXML: Null value', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeXML(null, 1, false);
    assertEquals(output, '', 'Should return empty string for null');
});

test('FormatRegistry.encodeXML: Undefined value', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeXML(undefined, 1, false);
    assertEquals(output, '', 'Should return empty string for undefined');
});

test('FormatRegistry.encodeXML: Boolean value', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeXML(true, 1, false);
    assertEquals(output, 'true', 'Should encode boolean');
});

test('FormatRegistry.encodeXML: Number value', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeXML(42, 1, false);
    assertEquals(output, '42', 'Should encode number');
});

test('FormatRegistry.encodeXML: String value', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeXML('test', 1, false);
    assertEquals(output, 'test', 'Should encode string');
});

test('FormatRegistry.encodeXML: Array value', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeXML([1, 2, 3], 1, false);
    assertContains(output, '<item>1</item>', 'Should encode array items');
    assertContains(output, '<item>2</item>', 'Should encode array items');
    assertContains(output, '<item>3</item>', 'Should encode array items');
});

test('FormatRegistry.encodeXML: Object with simple values', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeXML({ name: 'test', value: 42 }, 1, false);
    assertContains(output, '<name>test</name>', 'Should encode object properties');
    assertContains(output, '<value>42</value>', 'Should encode object properties');
});

test('FormatRegistry.encodeXML: Object with nested object', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeXML({ outer: { inner: 'value' } }, 1, false);
    assertContains(output, '<outer>', 'Should have outer tag');
    assertContains(output, '<inner>value</inner>', 'Should encode nested properties');
    assertContains(output, '</outer>', 'Should close outer tag');
});

test('FormatRegistry.encodeXML: Object with array', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeXML({ items: [1, 2] }, 1, false);
    assertContains(output, '<items>', 'Should have array wrapper');
    assertContains(output, '<item>1</item>', 'Should encode array items');
    assertContains(output, '</items>', 'Should close array wrapper');
});

test('FormatRegistry.encodeXML: Unknown type returns empty string', () => {
    const registry = new FormatRegistry();
    const output = registry.encodeXML(Symbol('test'), 1, false);
    assertEquals(output, '', 'Should return empty string for unknown type');
});

test('FormatRegistry.escapeXML: Escapes ampersand', () => {
    const registry = new FormatRegistry();
    const output = registry.escapeXML('test & value');
    assertEquals(output, 'test &amp; value', 'Should escape ampersand');
});

test('FormatRegistry.escapeXML: Escapes less than', () => {
    const registry = new FormatRegistry();
    const output = registry.escapeXML('test < value');
    assertEquals(output, 'test &lt; value', 'Should escape less than');
});

test('FormatRegistry.escapeXML: Escapes greater than', () => {
    const registry = new FormatRegistry();
    const output = registry.escapeXML('test > value');
    assertEquals(output, 'test &gt; value', 'Should escape greater than');
});

test('FormatRegistry.escapeXML: Escapes double quote', () => {
    const registry = new FormatRegistry();
    const output = registry.escapeXML('test " value');
    assertEquals(output, 'test &quot; value', 'Should escape double quote');
});

test('FormatRegistry.escapeXML: Escapes single quote', () => {
    const registry = new FormatRegistry();
    const output = registry.escapeXML("test ' value");
    assertEquals(output, 'test &apos; value', 'Should escape single quote');
});

test('FormatRegistry.escapeXML: Escapes multiple characters', () => {
    const registry = new FormatRegistry();
    const output = registry.escapeXML('<tag attr="value">content & more</tag>');
    assertContains(output, '&lt;', 'Should escape all special chars');
    assertContains(output, '&gt;', 'Should escape all special chars');
    assertContains(output, '&quot;', 'Should escape all special chars');
    assertContains(output, '&amp;', 'Should escape all special chars');
});

test('FormatRegistry.sanitizeXMLTag: Sanitizes special characters', () => {
    const registry = new FormatRegistry();
    const output = registry.sanitizeXMLTag('invalid.tag@name#123');
    assertEquals(output, 'invalid_tag_name_123', 'Should replace invalid chars with underscore');
});

test('FormatRegistry.sanitizeXMLTag: Preserves valid characters', () => {
    const registry = new FormatRegistry();
    const output = registry.sanitizeXMLTag('valid-tag_name123');
    assertEquals(output, 'valid-tag_name123', 'Should preserve valid chars');
});

test('FormatRegistry.encode: XML format via encode method', () => {
    const registry = new FormatRegistry();
    const data = { test: 'value' };
    const output = registry.encode('xml', data);
    assertContains(output, '<?xml version="1.0"', 'Should encode as XML');
    assertContains(output, '<test>value</test>', 'Should encode data');
});

// ============================================================
// Type Detection Tests
// ============================================================

test('FormatRegistry.getType: Detects null', () => {
    const registry = new FormatRegistry();
    const type = registry.getType(null);
    assertEquals(type, 'null', 'Should detect null');
});

test('FormatRegistry.getType: Detects undefined', () => {
    const registry = new FormatRegistry();
    const type = registry.getType(undefined);
    assertEquals(type, 'undefined', 'Should detect undefined');
});

test('FormatRegistry.getType: Detects array', () => {
    const registry = new FormatRegistry();
    const type = registry.getType([1, 2, 3]);
    assertEquals(type, 'array', 'Should detect array');
});

test('FormatRegistry.getType: Detects object', () => {
    const registry = new FormatRegistry();
    const type = registry.getType({ key: 'value' });
    assertEquals(type, 'object', 'Should detect object');
});

test('FormatRegistry.getType: Detects string', () => {
    const registry = new FormatRegistry();
    const type = registry.getType('test');
    assertEquals(type, 'string', 'Should detect string');
});

test('FormatRegistry.getType: Detects number', () => {
    const registry = new FormatRegistry();
    const type = registry.getType(42);
    assertEquals(type, 'number', 'Should detect number');
});

test('FormatRegistry.getType: Detects boolean', () => {
    const registry = new FormatRegistry();
    const type = registry.getType(true);
    assertEquals(type, 'boolean', 'Should detect boolean');
});

test('FormatRegistry.getType: Detects function', () => {
    const registry = new FormatRegistry();
    const type = registry.getType(() => {});
    assertEquals(type, 'function', 'Should detect function');
});

// ============================================================
// Format Suggestion Tests
// ============================================================

test('FormatRegistry.suggestFormat: Suggests TOON for method data', () => {
    const registry = new FormatRegistry();
    const suggestion = registry.suggestFormat({ methods: {} });
    assertEquals(suggestion, 'toon', 'Should suggest TOON for methods');
});

test('FormatRegistry.suggestFormat: Suggests TOON for path data', () => {
    const registry = new FormatRegistry();
    const suggestion = registry.suggestFormat({ paths: {} });
    assertEquals(suggestion, 'toon', 'Should suggest TOON for paths');
});

test('FormatRegistry.suggestFormat: Suggests JSON by default', () => {
    const registry = new FormatRegistry();
    const suggestion = registry.suggestFormat({});
    assertEquals(suggestion, 'json', 'Should suggest JSON by default');
});

// ============================================================
// GitIngest Format Tests
// ============================================================

test('FormatRegistry.encode: GitIngest throws without formatter instance', () => {
    const registry = new FormatRegistry();
    assertThrows(() => {
        registry.encode('gitingest', {});
    }, 'requires a GitIngestFormatter instance');
});

test('FormatRegistry.encode: GitIngest with formatter option', () => {
    const registry = new FormatRegistry();
    const mockFormatter = {
        generateDigest: () => 'digest content'
    };
    const output = registry.encode('gitingest', {}, { formatter: mockFormatter });
    assertEquals(output, 'digest content', 'Should use formatter instance');
});

// ============================================================
// TOON Format Tests
// ============================================================

test('FormatRegistry: TOON formatter is registered', () => {
    const registry = new FormatRegistry();
    const toonInfo = registry.getInfo('toon');
    assertEquals(toonInfo.name, 'TOON', 'Should have TOON formatter');
    assertEquals(toonInfo.extension, '.toon', 'Should have correct extension');
});

test('FormatRegistry.encode: TOON format encodes data', () => {
    const registry = new FormatRegistry();
    const data = {
        project: { root: '/test', totalFiles: 5, totalTokens: 1000 },
        paths: { 'src/': ['index.js', 'app.js'] }
    };
    const output = registry.encode('toon', data);
    assert(typeof output === 'string', 'Should return string');
    assert(output.length > 0, 'Should not be empty');
});

// ============================================================
// Run all tests
// ============================================================

async function runTests() {
    console.log('🧪 COMPREHENSIVE FORMAT REGISTRY TESTS');
    console.log('======================================================================\n');

    for (const { description, testFn } of tests) {
        totalTests++;
        try {
            await testFn();
            console.log(`✅ ${description}`);
            passedTests++;
        } catch (error) {
            console.log(`❌ ${description}`);
            console.log(`   Error: ${error.message}`);
            failedTests.push({ description, error: error.message });
        }
    }

    console.log('\n======================================================================');
    console.log('📊 COMPREHENSIVE FORMAT REGISTRY TEST RESULTS');
    console.log('======================================================================');
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests.length}`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests.length > 0) {
        console.log('\n❌ Failed Tests:');
        failedTests.forEach(({ description, error }) => {
            console.log(`   - ${description}`);
            console.log(`     ${error}`);
        });
        process.exit(1);
    } else {
        console.log('\n🎉 ALL FORMAT REGISTRY TESTS PASSED!');
        console.log('📈 FormatRegistry now has comprehensive test coverage.');
        process.exit(0);
    }
}

runTests();
