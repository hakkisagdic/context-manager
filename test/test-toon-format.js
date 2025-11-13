/**
 * Test TOON Format Encoder
 * v2.3.0 - Phase 1 Feature
 */

import ToonFormatter from '../lib/formatters/toon-formatter.js';
import FormatRegistry from '../lib/formatters/format-registry.js';

console.log('🧪 Testing TOON Format Encoder\n');

// Test 1: Basic Object Encoding
console.log('Test 1: Basic Object Encoding');
const formatter = new ToonFormatter();

const testData = {
    project: {
        root: 'context-manager',
        totalFiles: 64,
        totalTokens: 181480
    }
};

const toonOutput = formatter.encode(testData);
console.log('TOON Output:');
console.log(toonOutput);
console.log();

// Test 2: Tabular Format (Array of Objects)
console.log('Test 2: Tabular Format (Methods)');
const methodData = [
    { name: 'handleRequest', line: 15, tokens: 234 },
    { name: 'validateInput', line: 45, tokens: 156 },
    { name: 'processData', line: 72, tokens: 189 }
];

const tabularOutput = formatter.encodeTabular(methodData);
console.log('Tabular Output:');
console.log(tabularOutput);
console.log();

// Test 3: Token Savings Comparison
console.log('Test 3: Token Savings vs JSON');
const comparison = formatter.compareWithJSON(testData);
console.log(`TOON size: ${comparison.toonSize} chars`);
console.log(`JSON size: ${comparison.jsonSize} chars`);
console.log(`Reduction: ${comparison.reduction}`);
console.log(`Savings: ${comparison.savings} chars`);
console.log();

// Test 4: Format Registry
console.log('Test 4: Format Registry');
const registry = new FormatRegistry();
const formats = registry.listFormats();
console.log('Available formats:', formats.join(', '));
console.log();

// Test 5: Encode with Different Formats
console.log('Test 5: Multi-Format Encoding');
const sampleData = {
    project: {
        root: 'test-project',
        totalFiles: 10,
        totalTokens: 5000
    },
    paths: {
        'src/': ['index.js', 'utils.js'],
        'test/': ['test.js']
    }
};

console.log('--- TOON Format ---');
const toon = registry.encode('toon', sampleData);
console.log(toon.substring(0, 200) + '...');
console.log();

console.log('--- JSON Format ---');
const json = registry.encode('json', sampleData);
console.log(json.substring(0, 200) + '...');
console.log();

console.log('--- YAML Format ---');
const yaml = registry.encode('yaml', sampleData);
console.log(yaml.substring(0, 200) + '...');
console.log();

console.log('--- Markdown Format ---');
const markdown = registry.encode('markdown', sampleData);
console.log(markdown.substring(0, 200) + '...');
console.log();

console.log('✅ All TOON format tests completed!');
