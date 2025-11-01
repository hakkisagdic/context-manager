#!/usr/bin/env node

/**
 * Java Support Test Suite
 * Tests method extraction and analysis for Java files
 */

const fs = require('fs');
const path = require('path');
const MethodAnalyzer = require('../lib/analyzers/method-analyzer');
const FileUtils = require('../lib/utils/file-utils');
const TokenUtils = require('../lib/utils/token-utils');

console.log('🧪 Java Support Test Suite');
console.log('='.repeat(60));

// Test 1: File Type Detection
console.log('\n📋 Test 1: File Type Detection');
console.log('-'.repeat(60));

const javaFile = '/code/test/fixtures/SampleClass.java';
const isText = FileUtils.isText(javaFile);
const isCode = FileUtils.isCode(javaFile);
const fileType = FileUtils.getType(javaFile);

console.log(`✓ Is text file: ${isText ? 'YES' : 'NO'}`);
console.log(`✓ Is code file (supports method extraction): ${isCode ? 'YES' : 'NO'}`);
console.log(`✓ File type category: ${fileType}`);

if (!isText || !isCode || fileType !== 'code') {
    console.log('❌ FAILED: Java file not properly detected');
    process.exit(1);
}

// Test 2: Token Estimation
console.log('\n📊 Test 2: Token Estimation for Java');
console.log('-'.repeat(60));

const javaContent = fs.readFileSync(javaFile, 'utf8');
const tokens = TokenUtils.estimate(javaContent, javaFile);
const lines = javaContent.split('\n').length;

console.log(`✓ File: SampleClass.java`);
console.log(`✓ Lines: ${lines}`);
console.log(`✓ Estimated tokens: ${tokens}`);
console.log(`✓ Chars per token: ${(javaContent.length / tokens).toFixed(2)}`);

// Test 3: Method Extraction
console.log('\n🔍 Test 3: Java Method Extraction');
console.log('-'.repeat(60));

const analyzer = new MethodAnalyzer();
const methods = analyzer.extractMethods(javaContent, javaFile);

console.log(`✓ Total methods found: ${methods.length}\n`);

if (methods.length === 0) {
    console.log('❌ FAILED: No methods extracted from Java file');
    process.exit(1);
}

// Expected methods in SampleClass.java
const expectedMethods = [
    'SampleClass',      // Constructor
    'getName',          // Public getter
    'setName',          // Public setter
    'calculateSum',     // Static method
    'validateAge',      // Private method
    'isAdult',          // Protected method
    'createList',       // Generic method
    'incrementAge',     // Synchronized method
    'riskyOperation',   // Method with throws
    'getFullInfo'       // Final method
];

console.log('Expected Methods:');
expectedMethods.forEach((name, i) => {
    console.log(`  ${i + 1}. ${name}`);
});

console.log('\nExtracted Methods:');
methods.forEach((method, i) => {
    console.log(`  ${i + 1}. ${method.name} (line ${method.line})`);
});

// Test 4: Method Coverage
console.log('\n✅ Test 4: Method Coverage Check');
console.log('-'.repeat(60));

const extractedNames = methods.map(m => m.name);
const missing = expectedMethods.filter(name => !extractedNames.includes(name));
const extra = extractedNames.filter(name => !expectedMethods.includes(name));

if (missing.length > 0) {
    console.log(`⚠️  Missing methods: ${missing.join(', ')}`);
}

if (extra.length > 0) {
    console.log(`⚠️  Extra methods: ${extra.join(', ')}`);
}

const coverage = ((expectedMethods.length - missing.length) / expectedMethods.length * 100).toFixed(1);
console.log(`\n📈 Coverage: ${coverage}% (${expectedMethods.length - missing.length}/${expectedMethods.length} methods)`);

// Test 5: Method Details
console.log('\n📝 Test 5: Detailed Method Information');
console.log('-'.repeat(60));

methods.slice(0, 3).forEach((method, i) => {
    console.log(`\n${i + 1}. Method: ${method.name}`);
    console.log(`   Line: ${method.line}`);
    console.log(`   File: ${method.file}`);
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('🎉 Test Summary');
console.log('='.repeat(60));

const allPassed = isText && isCode &&
                  fileType === 'code' &&
                  methods.length > 0 &&
                  coverage >= 80;

if (allPassed) {
    console.log('✅ All tests passed!');
    console.log(`✅ Successfully extracted ${methods.length} methods from Java file`);
    console.log(`✅ Method coverage: ${coverage}%`);
    process.exit(0);
} else {
    console.log('❌ Some tests failed');
    process.exit(1);
}
