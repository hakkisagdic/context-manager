#!/usr/bin/env node

/**
 * Comprehensive Format Converter Tests
 * Tests for format conversion between JSON, YAML, CSV, etc.
 */

import FormatConverter from '../lib/utils/format-converter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'converter');

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

console.log('🧪 Testing Format Converter...\n');

// ============================================================================
// BASIC CONVERTER TESTS
// ============================================================================
console.log('🔄 Basic Converter Tests');
console.log('-'.repeat(70));

test('FormatConverter - Constructor creates instance', () => {
    const converter = new FormatConverter();
    if (typeof converter !== 'object') throw new Error('Should create instance');
    if (!converter.registry) throw new Error('Should have registry');
    if (!converter.toonFormatter) throw new Error('Should have toonFormatter');
});

test('FormatConverter - convert returns result object', () => {
    const converter = new FormatConverter();
    const input = '{"test": "value"}';
    const result = converter.convert(input, 'json', 'yaml');

    if (typeof result !== 'object') throw new Error('Should return object');
    if (!result.output) throw new Error('Should have output');
    if (!result.metadata) throw new Error('Should have metadata');
});

test('FormatConverter - convert metadata includes sizes', () => {
    const converter = new FormatConverter();
    const input = '{"test": "value"}';
    const result = converter.convert(input, 'json', 'json');

    if (typeof result.metadata.inputSize !== 'number') {
        throw new Error('Should have inputSize');
    }
    if (typeof result.metadata.outputSize !== 'number') {
        throw new Error('Should have outputSize');
    }
    if (typeof result.metadata.savings !== 'number') {
        throw new Error('Should have savings');
    }
});

test('FormatConverter - convert metadata includes formats', () => {
    const converter = new FormatConverter();
    const input = '{"test": "value"}';
    const result = converter.convert(input, 'json', 'yaml');

    if (result.metadata.fromFormat !== 'json') {
        throw new Error('Should have fromFormat');
    }
    if (result.metadata.toFormat !== 'yaml') {
        throw new Error('Should have toFormat');
    }
});

// ============================================================================
// JSON PARSING TESTS
// ============================================================================
console.log('\n📄 JSON Parsing Tests');
console.log('-'.repeat(70));

test('FormatConverter - parse JSON simple object', () => {
    const converter = new FormatConverter();
    const json = '{"name": "test", "value": 42}';
    const parsed = converter.parse(json, 'json');

    if (typeof parsed !== 'object') throw new Error('Should return object');
    if (parsed.name !== 'test') throw new Error('Should parse name');
    if (parsed.value !== 42) throw new Error('Should parse value');
});

test('FormatConverter - parse JSON array', () => {
    const converter = new FormatConverter();
    const json = '[1, 2, 3]';
    const parsed = converter.parse(json, 'json');

    if (!Array.isArray(parsed)) throw new Error('Should return array');
    if (parsed.length !== 3) throw new Error('Should have 3 items');
});

test('FormatConverter - parse JSON nested object', () => {
    const converter = new FormatConverter();
    const json = '{"outer": {"inner": "value"}}';
    const parsed = converter.parse(json, 'json');

    if (!parsed.outer) throw new Error('Should have outer');
    if (parsed.outer.inner !== 'value') throw new Error('Should parse nested');
});

test('FormatConverter - parse json-compact', () => {
    const converter = new FormatConverter();
    const json = '{"test":"value"}';
    const parsed = converter.parse(json, 'json-compact');

    if (typeof parsed !== 'object') throw new Error('Should parse compact JSON');
});

// ============================================================================
// YAML PARSING TESTS
// ============================================================================
console.log('\n📝 YAML Parsing Tests');
console.log('-'.repeat(70));

test('FormatConverter - parseYAML simple key-value', () => {
    const converter = new FormatConverter();
    const yaml = 'name: test\nvalue: 42';
    const parsed = converter.parseYAML(yaml);

    if (typeof parsed !== 'object') throw new Error('Should return object');
    if (parsed.name !== 'test') throw new Error('Should parse name');
    if (parsed.value !== 42) throw new Error('Should parse number');
});

test('FormatConverter - parseYAML boolean values', () => {
    const converter = new FormatConverter();
    const yaml = 'enabled: true\ndisabled: false';
    const parsed = converter.parseYAML(yaml);

    if (parsed.enabled !== true) throw new Error('Should parse true');
    if (parsed.disabled !== false) throw new Error('Should parse false');
});

test('FormatConverter - parseYAML null value', () => {
    const converter = new FormatConverter();
    const yaml = 'value: null';
    const parsed = converter.parseYAML(yaml);

    if (parsed.value !== null) throw new Error('Should parse null');
});

test('FormatConverter - parseYAML filters comments', () => {
    const converter = new FormatConverter();
    const yaml = '# Comment\nname: test\n# Another comment';
    const parsed = converter.parseYAML(yaml);

    if (parsed.name !== 'test') throw new Error('Should parse value');
});

test('FormatConverter - parseYAMLValue handles strings', () => {
    const converter = new FormatConverter();
    const value = converter.parseYAMLValue('test');
    if (value !== 'test') throw new Error('Should return string');
});

test('FormatConverter - parseYAMLValue handles quoted strings', () => {
    const converter = new FormatConverter();
    const value = converter.parseYAMLValue('"quoted string"');
    if (value !== 'quoted string') throw new Error('Should remove quotes');
});

test('FormatConverter - parseYAMLValue handles integers', () => {
    const converter = new FormatConverter();
    const value = converter.parseYAMLValue('42');
    if (value !== 42) throw new Error('Should parse integer');
});

test('FormatConverter - parseYAMLValue handles floats', () => {
    const converter = new FormatConverter();
    const value = converter.parseYAMLValue('3.14');
    if (Math.abs(value - 3.14) > 0.001) throw new Error('Should parse float');
});

test('FormatConverter - parseYAMLValue handles negative numbers', () => {
    const converter = new FormatConverter();
    if (converter.parseYAMLValue('-42') !== -42) throw new Error('Should parse negative int');
    if (Math.abs(converter.parseYAMLValue('-3.14') + 3.14) > 0.001) {
        throw new Error('Should parse negative float');
    }
});

// ============================================================================
// CSV PARSING TESTS
// ============================================================================
console.log('\n📊 CSV Parsing Tests');
console.log('-'.repeat(70));

test('FormatConverter - parseCSV simple data', () => {
    const converter = new FormatConverter();
    const csv = 'name,value\ntest,42\nfoo,99';
    const parsed = converter.parseCSV(csv);

    if (!parsed.headers) throw new Error('Should have headers');
    if (!parsed.rows) throw new Error('Should have rows');
    if (parsed.headers.length !== 2) throw new Error('Should have 2 headers');
    if (parsed.rows.length !== 2) throw new Error('Should have 2 rows');
});

test('FormatConverter - parseCSV first row as headers', () => {
    const converter = new FormatConverter();
    const csv = 'col1,col2\nval1,val2';
    const parsed = converter.parseCSV(csv);

    if (parsed.headers[0] !== 'col1') throw new Error('Should have col1 header');
    if (parsed.headers[1] !== 'col2') throw new Error('Should have col2 header');
});

test('FormatConverter - parseCSV rows as objects', () => {
    const converter = new FormatConverter();
    const csv = 'name,value\ntest,42';
    const parsed = converter.parseCSV(csv);

    if (parsed.rows[0].name !== 'test') throw new Error('Should map name');
    if (parsed.rows[0].value !== '42') throw new Error('Should map value');
});

test('FormatConverter - parseCSV empty input', () => {
    const converter = new FormatConverter();
    const parsed = converter.parseCSV('');

    if (!Array.isArray(parsed.rows)) throw new Error('Should have rows array');
    if (parsed.rows.length !== 0) throw new Error('Should be empty');
});

test('FormatConverter - parseCSVLine simple values', () => {
    const converter = new FormatConverter();
    const values = converter.parseCSVLine('a,b,c');

    if (!Array.isArray(values)) throw new Error('Should return array');
    if (values.length !== 3) throw new Error('Should have 3 values');
    if (values[0] !== 'a') throw new Error('Should parse a');
});

test('FormatConverter - parseCSVLine quoted values', () => {
    const converter = new FormatConverter();
    const values = converter.parseCSVLine('"a,b",c');

    if (values.length !== 2) throw new Error('Should have 2 values');
    if (!values[0].includes(',')) throw new Error('Should preserve comma in quotes');
});

test('FormatConverter - parseCSVLine handles spaces', () => {
    const converter = new FormatConverter();
    const values = converter.parseCSVLine('a , b , c');

    if (values[0] !== 'a') throw new Error('Should trim spaces');
    if (values[1] !== 'b') throw new Error('Should trim spaces');
});

// ============================================================================
// ENCODING TESTS
// ============================================================================
console.log('\n🔧 Encoding Tests');
console.log('-'.repeat(70));

test('FormatConverter - encode to JSON', () => {
    const converter = new FormatConverter();
    const data = { test: 'value' };
    const encoded = converter.encode(data, 'json');

    if (typeof encoded !== 'string') throw new Error('Should return string');
    if (!encoded.includes('test')) throw new Error('Should include key');
    if (!encoded.includes('value')) throw new Error('Should include value');
});

test('FormatConverter - encode to YAML', () => {
    const converter = new FormatConverter();
    const data = { test: 'value' };
    const encoded = converter.encode(data, 'yaml');

    if (typeof encoded !== 'string') throw new Error('Should return string');
    if (!encoded.includes('test')) throw new Error('Should include key');
});

test('FormatConverter - encode handles error', () => {
    const converter = new FormatConverter();
    try {
        converter.encode({}, 'invalid-format-xyz');
        throw new Error('Should throw error');
    } catch (error) {
        if (!error.message.includes('Failed to encode')) {
            throw new Error('Should have encode error message');
        }
    }
});

// ============================================================================
// EXTENSION MAPPING TESTS
// ============================================================================
console.log('\n📎 Extension Mapping Tests');
console.log('-'.repeat(70));

test('FormatConverter - extensionToFormat json', () => {
    const converter = new FormatConverter();
    if (converter.extensionToFormat('json') !== 'json') {
        throw new Error('Should map json');
    }
});

test('FormatConverter - extensionToFormat yaml', () => {
    const converter = new FormatConverter();
    if (converter.extensionToFormat('yaml') !== 'yaml') {
        throw new Error('Should map yaml');
    }
    if (converter.extensionToFormat('yml') !== 'yaml') {
        throw new Error('Should map yml to yaml');
    }
});

test('FormatConverter - extensionToFormat csv', () => {
    const converter = new FormatConverter();
    if (converter.extensionToFormat('csv') !== 'csv') {
        throw new Error('Should map csv');
    }
});

test('FormatConverter - extensionToFormat xml', () => {
    const converter = new FormatConverter();
    if (converter.extensionToFormat('xml') !== 'xml') {
        throw new Error('Should map xml');
    }
});

test('FormatConverter - extensionToFormat markdown', () => {
    const converter = new FormatConverter();
    if (converter.extensionToFormat('md') !== 'markdown') {
        throw new Error('Should map md to markdown');
    }
});

test('FormatConverter - extensionToFormat toon', () => {
    const converter = new FormatConverter();
    if (converter.extensionToFormat('toon') !== 'toon') {
        throw new Error('Should map toon');
    }
});

test('FormatConverter - extensionToFormat unknown defaults to json', () => {
    const converter = new FormatConverter();
    const result = converter.extensionToFormat('unknown');
    if (result !== 'json') throw new Error('Should default to json');
});

// ============================================================================
// FILE CONVERSION TESTS
// ============================================================================
console.log('\n📁 File Conversion Tests');
console.log('-'.repeat(70));

test('FormatConverter - convertFile JSON to YAML', () => {
    const converter = new FormatConverter();
    const inputFile = path.join(FIXTURES_DIR, 'test.json');
    const outputFile = path.join(FIXTURES_DIR, 'test.yaml');

    fs.writeFileSync(inputFile, '{"name": "test", "value": 42}');

    const result = converter.convertFile(inputFile, outputFile);

    if (!result.inputFile) throw new Error('Should have inputFile');
    if (!result.outputFile) throw new Error('Should have outputFile');
    if (!fs.existsSync(outputFile)) throw new Error('Should create output file');

    // Cleanup
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
});

test('FormatConverter - convertFile auto-detects formats', () => {
    const converter = new FormatConverter();
    const inputFile = path.join(FIXTURES_DIR, 'auto.json');
    const outputFile = path.join(FIXTURES_DIR, 'auto.yaml');

    fs.writeFileSync(inputFile, '{"test": "value"}');

    const result = converter.convertFile(inputFile, outputFile);

    if (result.fromFormat !== 'json') throw new Error('Should detect JSON');
    if (result.toFormat !== 'yaml') throw new Error('Should detect YAML');

    // Cleanup
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
});

test('FormatConverter - convertFile returns stats', () => {
    const converter = new FormatConverter();
    const inputFile = path.join(FIXTURES_DIR, 'stats-test.json');
    const outputFile = path.join(FIXTURES_DIR, 'stats-out.yaml');

    fs.writeFileSync(inputFile, '{"test": "value"}');

    const result = converter.convertFile(inputFile, outputFile);

    if (typeof result.inputSize !== 'number') throw new Error('Should have inputSize');
    if (typeof result.outputSize !== 'number') throw new Error('Should have outputSize');
    if (typeof result.savings !== 'number') throw new Error('Should have savings');

    // Cleanup
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
});

// Cleanup fixtures directory
if (fs.existsSync(FIXTURES_DIR)) {
    fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
}

// ============================================================================
// RESULTS
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All format converter tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
