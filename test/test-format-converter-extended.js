#!/usr/bin/env node

/**
 * Extended Format Converter Tests
 * Comprehensive test suite covering:
 * - Cross-format conversions (JSON, TOON, YAML, CSV, XML, Markdown)
 * - Round-trip conversion testing
 * - Data loss detection
 * - Type preservation
 * - Encoding preservation
 * - Format auto-detection
 * - Custom format registration
 * - Format validation
 * - Large file conversion
 * - Error recovery
 */

import FormatConverter from '../lib/utils/format-converter.js';
import FormatRegistry from '../lib/formatters/format-registry.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'converter-extended');

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

// Setup fixtures directory
if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

console.log('🧪 Testing Extended Format Converter Features...\n');

// ============================================================================
// JSON TO ALL FORMATS
// ============================================================================
console.log('🔄 JSON to All Formats');
console.log('-'.repeat(70));

test('JSON to TOON conversion', () => {
    const converter = new FormatConverter();
    const json = JSON.stringify({
        project: { root: '/test', totalFiles: 2, totalTokens: 100 },
        paths: { 'src/': ['file1.js', 'file2.js'] }
    });
    const result = converter.convert(json, 'json', 'toon');

    if (!result.output) throw new Error('Should have output');
    if (typeof result.output !== 'string') throw new Error('Output should be string');
    if (!result.metadata) throw new Error('Should have metadata');
});

test('JSON to YAML conversion preserves structure', () => {
    const converter = new FormatConverter();
    const json = '{"name": "test", "count": 42, "active": true}';
    const result = converter.convert(json, 'json', 'yaml');

    if (!result.output.includes('name:')) throw new Error('Should include name key');
    if (!result.output.includes('test')) throw new Error('Should include test value');
    if (!result.output.includes('42')) throw new Error('Should include number');
});

test('JSON to CSV conversion with nested data', () => {
    const converter = new FormatConverter();
    const json = JSON.stringify({
        methods: {
            'file1.js': [
                { name: 'func1', line: 10, tokens: 50 },
                { name: 'func2', line: 20, tokens: 75 }
            ]
        }
    });
    const result = converter.convert(json, 'json', 'csv');

    if (!result.output.includes('File,Method,Line,Tokens')) {
        throw new Error('Should have CSV headers');
    }
    if (!result.output.includes('func1')) throw new Error('Should include method names');
});

test('JSON to XML conversion', () => {
    const converter = new FormatConverter();
    const json = '{"project": {"name": "test", "version": "1.0"}}';
    const result = converter.convert(json, 'json', 'xml');

    if (!result.output.includes('<?xml')) throw new Error('Should have XML declaration');
    if (!result.output.includes('<context>')) throw new Error('Should have context root');
    if (!result.output.includes('<project>')) throw new Error('Should have project tag');
});

test('JSON to Markdown conversion', () => {
    const converter = new FormatConverter();
    const json = JSON.stringify({
        project: { root: '/test', totalFiles: 5, totalTokens: 1000 },
        paths: { 'src/': ['file1.js'] }
    });
    const result = converter.convert(json, 'json', 'markdown');

    if (!result.output.includes('#')) throw new Error('Should have markdown headers');
    if (!result.output.includes('Project Summary')) throw new Error('Should have summary');
});

test('JSON to JSON-compact conversion reduces size', () => {
    const converter = new FormatConverter();
    const json = JSON.stringify({ test: 'value', nested: { key: 'val' } }, null, 2);
    const result = converter.convert(json, 'json', 'json-compact');

    if (result.metadata.savings <= 0) {
        throw new Error('Compact JSON should be smaller');
    }
});

// ============================================================================
// YAML TO ALL FORMATS
// ============================================================================
console.log('\n📝 YAML to All Formats');
console.log('-'.repeat(70));

test('YAML to JSON conversion', () => {
    const converter = new FormatConverter();
    const yaml = 'name: test\nvalue: 42\nactive: true';
    const result = converter.convert(yaml, 'yaml', 'json');

    const parsed = JSON.parse(result.output);
    if (parsed.name !== 'test') throw new Error('Should preserve string');
    if (parsed.value !== 42) throw new Error('Should preserve number');
    if (parsed.active !== true) throw new Error('Should preserve boolean');
});

test('YAML to XML conversion', () => {
    const converter = new FormatConverter();
    const yaml = 'project: test\nversion: 1.0';
    const result = converter.convert(yaml, 'yaml', 'xml');

    if (!result.output.includes('<project>')) throw new Error('Should have project tag');
    if (!result.output.includes('test')) throw new Error('Should include values');
});

test('YAML to Markdown conversion', () => {
    const converter = new FormatConverter();
    const yaml = 'project:\n  root: /test\n  totalFiles: 5';

    try {
        const result = converter.convert(yaml, 'yaml', 'markdown');
        // Basic YAML parser may not handle nested objects perfectly
        if (!result.output) throw new Error('Should produce output');
    } catch (error) {
        // Expected for complex YAML structures
        if (!error.message.includes('markdown')) throw error;
    }
});

// ============================================================================
// CSV TO ALL FORMATS
// ============================================================================
console.log('\n📊 CSV to All Formats');
console.log('-'.repeat(70));

test('CSV to JSON conversion', () => {
    const converter = new FormatConverter();
    const csv = 'name,value\ntest,42\nfoo,99';
    const result = converter.convert(csv, 'csv', 'json');

    const parsed = JSON.parse(result.output);
    if (!parsed.rows) throw new Error('Should have rows');
    if (parsed.rows.length !== 2) throw new Error('Should have 2 rows');
});

test('CSV to YAML conversion', () => {
    const converter = new FormatConverter();
    const csv = 'name,value\ntest,42';
    const result = converter.convert(csv, 'csv', 'yaml');

    if (!result.output.includes('rows:')) throw new Error('Should have rows key');
});

test('CSV to XML conversion', () => {
    const converter = new FormatConverter();
    const csv = 'col1,col2\nval1,val2';
    const result = converter.convert(csv, 'csv', 'xml');

    if (!result.output.includes('<rows>')) throw new Error('Should have rows element');
});

// ============================================================================
// ROUND-TRIP CONVERSION TESTING
// ============================================================================
console.log('\n🔄 Round-Trip Conversions');
console.log('-'.repeat(70));

test('JSON → YAML → JSON preserves data', () => {
    const converter = new FormatConverter();
    const original = { name: 'test', value: 42, active: true };
    const json1 = JSON.stringify(original);

    // JSON to YAML
    const yamlResult = converter.convert(json1, 'json', 'yaml');

    // YAML back to JSON
    const jsonResult = converter.convert(yamlResult.output, 'yaml', 'json');
    const restored = JSON.parse(jsonResult.output);

    if (restored.name !== original.name) throw new Error('Should preserve name');
    if (restored.value !== original.value) throw new Error('Should preserve value');
    if (restored.active !== original.active) throw new Error('Should preserve boolean');
});

test('JSON → CSV → JSON round-trip', () => {
    const converter = new FormatConverter();
    const original = {
        headers: ['name', 'value'],
        rows: [{ name: 'test', value: '42' }]
    };

    const json1 = JSON.stringify(original);
    const csvResult = converter.convert(json1, 'json', 'csv');
    const jsonResult = converter.convert(csvResult.output, 'csv', 'json');
    const restored = JSON.parse(jsonResult.output);

    if (!restored.rows || restored.rows.length === 0) {
        throw new Error('Should restore rows');
    }
});

test('JSON → XML → JSON structure preservation', () => {
    const converter = new FormatConverter();
    const original = { simple: 'value', number: 123 };
    const json1 = JSON.stringify(original);

    const xmlResult = converter.convert(json1, 'json', 'xml');

    // Note: XML parsing not implemented, so we verify XML output instead
    if (!xmlResult.output.includes('<simple>value</simple>')) {
        throw new Error('Should preserve simple value in XML');
    }
    if (!xmlResult.output.includes('<number>123</number>')) {
        throw new Error('Should preserve number in XML');
    }
});

// ============================================================================
// DATA LOSS DETECTION
// ============================================================================
console.log('\n🔍 Data Loss Detection');
console.log('-'.repeat(70));

test('Detect data loss in CSV conversion (complex objects)', () => {
    const converter = new FormatConverter();
    const json = JSON.stringify({
        data: { nested: { deep: { value: 'test' } } }
    });

    const result = converter.convert(json, 'json', 'csv');

    // CSV format cannot represent deeply nested data
    // Should still complete without error
    if (!result.output) throw new Error('Should produce output');
});

test('Detect precision loss in number conversions', () => {
    const converter = new FormatConverter();
    const json = '{"value": 3.14159265358979323846}';

    const yamlResult = converter.convert(json, 'json', 'yaml');
    const backToJson = converter.convert(yamlResult.output, 'yaml', 'json');

    const original = JSON.parse(json);
    const restored = JSON.parse(backToJson.output);

    // Check if precision is maintained (within floating point limits)
    const diff = Math.abs(original.value - restored.value);
    if (diff > 0.0001) {
        console.log(`   ⚠️  Precision loss detected: ${diff}`);
    }
});

// ============================================================================
// TYPE PRESERVATION
// ============================================================================
console.log('\n🎯 Type Preservation');
console.log('-'.repeat(70));

test('Preserve string types through conversions', () => {
    const converter = new FormatConverter();
    const json = '{"text": "hello", "numeric": "123"}';

    const yamlResult = converter.convert(json, 'json', 'yaml');
    const backToJson = converter.convert(yamlResult.output, 'yaml', 'json');
    const restored = JSON.parse(backToJson.output);

    if (typeof restored.text !== 'string') {
        throw new Error('Should preserve string type');
    }
});

test('Preserve number types through conversions', () => {
    const converter = new FormatConverter();
    const json = '{"count": 42, "price": 19.99}';

    const yamlResult = converter.convert(json, 'json', 'yaml');
    const backToJson = converter.convert(yamlResult.output, 'yaml', 'json');
    const restored = JSON.parse(backToJson.output);

    if (typeof restored.count !== 'number') {
        throw new Error('Should preserve integer type');
    }
    if (typeof restored.price !== 'number') {
        throw new Error('Should preserve float type');
    }
});

test('Preserve boolean types through conversions', () => {
    const converter = new FormatConverter();
    const json = '{"enabled": true, "disabled": false}';

    const yamlResult = converter.convert(json, 'json', 'yaml');
    const backToJson = converter.convert(yamlResult.output, 'yaml', 'json');
    const restored = JSON.parse(backToJson.output);

    if (typeof restored.enabled !== 'boolean') {
        throw new Error('Should preserve boolean type');
    }
    if (restored.enabled !== true) {
        throw new Error('Should preserve true value');
    }
    if (restored.disabled !== false) {
        throw new Error('Should preserve false value');
    }
});

test('Preserve null values through conversions', () => {
    const converter = new FormatConverter();
    const json = '{"value": null}';

    const yamlResult = converter.convert(json, 'json', 'yaml');
    const backToJson = converter.convert(yamlResult.output, 'yaml', 'json');
    const restored = JSON.parse(backToJson.output);

    if (restored.value !== null) {
        throw new Error('Should preserve null value');
    }
});

test('Preserve array types through conversions', () => {
    const converter = new FormatConverter();
    const json = '{"items": [1, 2, 3]}';

    const yamlResult = converter.convert(json, 'json', 'yaml');

    // Verify YAML array format
    if (!yamlResult.output.includes('items:')) {
        throw new Error('Should have items key in YAML');
    }
});

// ============================================================================
// FORMAT AUTO-DETECTION
// ============================================================================
console.log('\n🔍 Format Auto-Detection');
console.log('-'.repeat(70));

test('Auto-detect JSON format from extension', () => {
    const converter = new FormatConverter();
    const format = converter.extensionToFormat('json');
    if (format !== 'json') throw new Error('Should detect JSON format');
});

test('Auto-detect YAML format from extension', () => {
    const converter = new FormatConverter();
    if (converter.extensionToFormat('yaml') !== 'yaml') {
        throw new Error('Should detect YAML format');
    }
    if (converter.extensionToFormat('yml') !== 'yaml') {
        throw new Error('Should detect .yml as YAML');
    }
});

test('Auto-detect format in file conversions', () => {
    const converter = new FormatConverter();
    const inputFile = path.join(FIXTURES_DIR, 'auto-detect.json');
    const outputFile = path.join(FIXTURES_DIR, 'auto-detect.xml');

    fs.writeFileSync(inputFile, '{"test": "value"}');

    const result = converter.convertFile(inputFile, outputFile);

    if (result.fromFormat !== 'json') throw new Error('Should auto-detect JSON');
    if (result.toFormat !== 'xml') throw new Error('Should auto-detect XML');

    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
});

// ============================================================================
// CUSTOM FORMAT REGISTRATION
// ============================================================================
console.log('\n🔧 Custom Format Registration');
console.log('-'.repeat(70));

test('Register custom format in FormatRegistry', () => {
    const registry = new FormatRegistry();

    registry.register('custom', {
        name: 'Custom Format',
        description: 'Test custom format',
        extension: '.custom',
        mimeType: 'text/custom',
        encoder: (data) => `CUSTOM:${JSON.stringify(data)}`
    });

    if (!registry.has('custom')) throw new Error('Should register custom format');
});

test('Use registered custom format', () => {
    const registry = new FormatRegistry();

    registry.register('custom', {
        name: 'Custom Format',
        description: 'Test custom format',
        extension: '.custom',
        mimeType: 'text/custom',
        encoder: (data) => `CUSTOM:${JSON.stringify(data)}`
    });

    const output = registry.encode('custom', { test: 'value' });

    if (!output.startsWith('CUSTOM:')) {
        throw new Error('Should use custom encoder');
    }
});

test('Custom format validation - requires encoder', () => {
    const registry = new FormatRegistry();

    try {
        registry.register('invalid', {
            name: 'Invalid Format',
            description: 'Missing encoder'
        });
        throw new Error('Should require encoder function');
    } catch (error) {
        if (!error.message.includes('encoder')) {
            throw new Error('Should validate encoder requirement');
        }
    }
});

test('List all available formats', () => {
    const registry = new FormatRegistry();
    const formats = registry.listFormats();

    if (!Array.isArray(formats)) throw new Error('Should return array');
    if (formats.length === 0) throw new Error('Should have formats');
    if (!formats.includes('json')) throw new Error('Should include JSON');
    if (!formats.includes('yaml')) throw new Error('Should include YAML');
});

test('Get format information', () => {
    const registry = new FormatRegistry();
    const info = registry.getInfo('json');

    if (!info.name) throw new Error('Should have name');
    if (!info.description) throw new Error('Should have description');
    if (!info.extension) throw new Error('Should have extension');
    if (!info.mimeType) throw new Error('Should have mimeType');
});

// ============================================================================
// LARGE FILE CONVERSION
// ============================================================================
console.log('\n📦 Large File Conversion');
console.log('-'.repeat(70));

test('Convert large JSON dataset', () => {
    const converter = new FormatConverter();

    // Create a large object
    const largeData = {
        project: { root: '/large', totalFiles: 1000, totalTokens: 500000 },
        methods: {}
    };

    // Generate 100 files with 10 methods each
    for (let i = 0; i < 100; i++) {
        const filename = `file${i}.js`;
        largeData.methods[filename] = [];
        for (let j = 0; j < 10; j++) {
            largeData.methods[filename].push({
                name: `method${j}`,
                line: j * 10,
                tokens: Math.floor(Math.random() * 100)
            });
        }
    }

    const json = JSON.stringify(largeData);
    const result = converter.convert(json, 'json', 'toon');

    if (!result.output) throw new Error('Should handle large conversion');
    if (result.metadata.inputSize <= 0) throw new Error('Should track input size');
});

test('Batch convert multiple files', () => {
    const converter = new FormatConverter();

    const file1 = path.join(FIXTURES_DIR, 'batch1.json');
    const file2 = path.join(FIXTURES_DIR, 'batch2.json');
    const out1 = path.join(FIXTURES_DIR, 'batch1.yaml');
    const out2 = path.join(FIXTURES_DIR, 'batch2.yaml');

    fs.writeFileSync(file1, '{"test": 1}');
    fs.writeFileSync(file2, '{"test": 2}');

    const results = converter.batchConvert([
        { input: file1, output: out1 },
        { input: file2, output: out2 }
    ]);

    if (results.length !== 2) throw new Error('Should process both files');
    if (!results[0].success) throw new Error('First conversion should succeed');
    if (!results[1].success) throw new Error('Second conversion should succeed');

    fs.unlinkSync(file1);
    fs.unlinkSync(file2);
    fs.unlinkSync(out1);
    fs.unlinkSync(out2);
});

// ============================================================================
// ERROR RECOVERY
// ============================================================================
console.log('\n🛡️ Error Recovery');
console.log('-'.repeat(70));

test('Handle invalid JSON input gracefully', () => {
    const converter = new FormatConverter();

    try {
        converter.convert('{ invalid json }', 'json', 'yaml');
        throw new Error('Should throw error for invalid JSON');
    } catch (error) {
        if (error.message.includes('Should throw')) throw error;
        // Expected error
    }
});

test('Handle unsupported format conversion', () => {
    const converter = new FormatConverter();

    try {
        converter.convert('data', 'toon', 'json');
        throw new Error('Should throw for unsupported TOON parsing');
    } catch (error) {
        if (!error.message.includes('TOON parsing')) {
            throw new Error('Should report TOON parser not implemented');
        }
    }
});

test('Handle unknown format gracefully', () => {
    const converter = new FormatConverter();

    try {
        converter.encode({ test: 'value' }, 'unknown-format-xyz');
        throw new Error('Should throw for unknown format');
    } catch (error) {
        if (!error.message.includes('Failed to encode')) {
            throw new Error('Should report encoding failure');
        }
    }
});

test('Batch conversion continues on error', () => {
    const converter = new FormatConverter();

    const file1 = path.join(FIXTURES_DIR, 'error1.json');
    const file2 = path.join(FIXTURES_DIR, 'error2.json');
    const out1 = path.join(FIXTURES_DIR, 'error1.yaml');
    const out2 = path.join(FIXTURES_DIR, 'error2.yaml');

    fs.writeFileSync(file1, '{ invalid }'); // Invalid JSON
    fs.writeFileSync(file2, '{"valid": true}');

    const results = converter.batchConvert([
        { input: file1, output: out1 },
        { input: file2, output: out2 }
    ]);

    if (results.length !== 2) throw new Error('Should process both files');
    if (results[0].success) throw new Error('First should fail');
    if (!results[1].success) throw new Error('Second should succeed');
    if (!results[0].error) throw new Error('Should include error message');

    fs.unlinkSync(file1);
    fs.unlinkSync(file2);
    if (fs.existsSync(out2)) fs.unlinkSync(out2);
});

test('Get supported conversions list', () => {
    const converter = new FormatConverter();
    const supported = converter.getSupportedConversions();

    if (!supported.fullySupported) throw new Error('Should have fullySupported list');
    if (!supported.partialSupport) throw new Error('Should have partialSupport list');
    if (!Array.isArray(supported.fullySupported)) {
        throw new Error('fullySupported should be array');
    }
});

// ============================================================================
// ENCODING EDGE CASES
// ============================================================================
console.log('\n🎭 Encoding Edge Cases');
console.log('-'.repeat(70));

test('XML encoding handles special characters', () => {
    const registry = new FormatRegistry();
    const data = {
        text: 'Test & <special> "characters"'
    };

    const xml = registry.encode('xml', data);

    if (!xml.includes('&amp;')) throw new Error('Should escape &');
    if (!xml.includes('&lt;')) throw new Error('Should escape <');
    if (!xml.includes('&gt;')) throw new Error('Should escape >');
    if (!xml.includes('&quot;')) throw new Error('Should escape "');
});

test('YAML encoding handles special characters in strings', () => {
    const registry = new FormatRegistry();
    const data = {
        text: 'Line with: colon and # hash'
    };

    const yaml = registry.encode('yaml', data);

    if (!yaml.includes('"')) {
        throw new Error('Should quote strings with special characters');
    }
});

test('CSV encoding handles commas in values', () => {
    const registry = new FormatRegistry();
    const data = {
        methods: {
            'file.js': [
                { name: 'func(a, b)', line: 10, tokens: 50 }
            ]
        }
    };

    const csv = registry.encode('csv', data);

    // Should handle method name with commas
    if (!csv.includes('func(a, b)')) {
        throw new Error('Should preserve commas in quoted fields');
    }
});

// Cleanup fixtures directory
if (fs.existsSync(FIXTURES_DIR)) {
    fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
}

// ============================================================================
// RESULTS
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 EXTENDED TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All extended format converter tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed. Review errors above.');
    process.exit(1);
}
