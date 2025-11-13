#!/usr/bin/env node

/**
 * Comprehensive Utils Tests - Part 2
 * Tests for clipboard, file, config, token utilities
 */

import ClipboardUtils from '../lib/utils/clipboard-utils.js';
import FileUtils from '../lib/utils/file-utils.js';
import ConfigUtils from '../lib/utils/config-utils.js';
import TokenUtils from '../lib/utils/token-utils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

console.log('🧪 Testing Utils - Part 2...\n');

// ============================================================================
// CLIPBOARD UTILS TESTS
// ============================================================================
console.log('📋 ClipboardUtils Tests');
console.log('-'.repeat(70));

test('ClipboardUtils - isAvailable checks platform', () => {
    const available = ClipboardUtils.isAvailable();
    // Should return boolean
    if (typeof available !== 'boolean') throw new Error('Should return boolean');
    // Current platform should be available (darwin, linux, win32)
    const currentPlatform = process.platform;
    if (['darwin', 'linux', 'win32'].includes(currentPlatform)) {
        if (!available) throw new Error('Should be available on supported platforms');
    }
});

test('ClipboardUtils - getCommand returns platform command', () => {
    const command = ClipboardUtils.getCommand();
    if (typeof command !== 'string') throw new Error('Should return string');

    // Verify it returns correct command for platform
    const expectedCommands = {
        darwin: 'pbcopy',
        linux: 'xclip',
        win32: 'clip'
    };
    const expected = expectedCommands[process.platform];
    if (expected && command !== expected) {
        throw new Error(`Expected ${expected}, got ${command}`);
    }
});

test('ClipboardUtils - getCommand handles unknown platform', () => {
    // Just verify it returns something
    const command = ClipboardUtils.getCommand();
    if (typeof command !== 'string') throw new Error('Should return string');
});

// ============================================================================
// FILE UTILS TESTS
// ============================================================================
console.log('\n📁 FileUtils Tests');
console.log('-'.repeat(70));

test('FileUtils - isText detects JavaScript files', () => {
    if (!FileUtils.isText('test.js')) throw new Error('Should detect .js as text');
    if (!FileUtils.isText('app.jsx')) throw new Error('Should detect .jsx as text');
});

test('FileUtils - isText detects TypeScript files', () => {
    if (!FileUtils.isText('test.ts')) throw new Error('Should detect .ts as text');
    if (!FileUtils.isText('app.tsx')) throw new Error('Should detect .tsx as text');
});

test('FileUtils - isText detects config files', () => {
    if (!FileUtils.isText('config.json')) throw new Error('Should detect .json as text');
    if (!FileUtils.isText('config.yaml')) throw new Error('Should detect .yaml as text');
    if (!FileUtils.isText('config.yml')) throw new Error('Should detect .yml as text');
    if (!FileUtils.isText('config.toml')) throw new Error('Should detect .toml as text');
});

test('FileUtils - isText detects documentation files', () => {
    if (!FileUtils.isText('README.md')) throw new Error('Should detect .md as text');
    if (!FileUtils.isText('notes.txt')) throw new Error('Should detect .txt as text');
});

test('FileUtils - isText detects special files by basename', () => {
    if (!FileUtils.isText('Dockerfile')) throw new Error('Should detect Dockerfile');
    if (!FileUtils.isText('Makefile')) throw new Error('Should detect Makefile');
    if (!FileUtils.isText('LICENSE')) throw new Error('Should detect LICENSE');
});

test('FileUtils - isText rejects binary files', () => {
    if (FileUtils.isText('image.png')) throw new Error('Should reject .png');
    if (FileUtils.isText('app.exe')) throw new Error('Should reject .exe');
    if (FileUtils.isText('data.bin')) throw new Error('Should reject .bin');
});

test('FileUtils - isCode detects JavaScript/TypeScript', () => {
    if (!FileUtils.isCode('test.js')) throw new Error('Should detect .js');
    if (!FileUtils.isCode('test.ts')) throw new Error('Should detect .ts');
    if (!FileUtils.isCode('app.jsx')) throw new Error('Should detect .jsx');
    if (!FileUtils.isCode('app.tsx')) throw new Error('Should detect .tsx');
});

test('FileUtils - isCode detects Rust files', () => {
    if (!FileUtils.isCode('main.rs')) throw new Error('Should detect .rs');
});

test('FileUtils - isCode detects C# files', () => {
    if (!FileUtils.isCode('Program.cs')) throw new Error('Should detect .cs');
});

test('FileUtils - isCode detects Go files', () => {
    if (!FileUtils.isCode('main.go')) throw new Error('Should detect .go');
});

test('FileUtils - isCode detects Java files', () => {
    if (!FileUtils.isCode('Main.java')) throw new Error('Should detect .java');
});

test('FileUtils - isCode detects Python files', () => {
    if (!FileUtils.isCode('script.py')) throw new Error('Should detect .py');
});

test('FileUtils - isCode detects PHP files', () => {
    if (!FileUtils.isCode('index.php')) throw new Error('Should detect .php');
});

test('FileUtils - isCode detects Ruby files', () => {
    if (!FileUtils.isCode('script.rb')) throw new Error('Should detect .rb');
});

test('FileUtils - isCode detects Kotlin files', () => {
    if (!FileUtils.isCode('Main.kt')) throw new Error('Should detect .kt');
    if (!FileUtils.isCode('script.kts')) throw new Error('Should detect .kts');
});

test('FileUtils - isCode detects Swift files', () => {
    if (!FileUtils.isCode('App.swift')) throw new Error('Should detect .swift');
});

test('FileUtils - isCode detects C/C++ files', () => {
    if (!FileUtils.isCode('main.c')) throw new Error('Should detect .c');
    if (!FileUtils.isCode('main.cpp')) throw new Error('Should detect .cpp');
    if (!FileUtils.isCode('main.cc')) throw new Error('Should detect .cc');
    if (!FileUtils.isCode('header.h')) throw new Error('Should detect .h');
    if (!FileUtils.isCode('header.hpp')) throw new Error('Should detect .hpp');
});

test('FileUtils - isCode detects Scala files', () => {
    if (!FileUtils.isCode('App.scala')) throw new Error('Should detect .scala');
});

test('FileUtils - isCode rejects non-code files', () => {
    if (FileUtils.isCode('README.md')) throw new Error('Should reject markdown');
    if (FileUtils.isCode('config.json')) throw new Error('Should reject JSON');
    if (FileUtils.isCode('style.css')) throw new Error('Should reject CSS');
});

test('FileUtils - getType categorizes code files', () => {
    if (FileUtils.getType('test.js') !== 'code') throw new Error('Should categorize .js as code');
    if (FileUtils.getType('main.py') !== 'code') throw new Error('Should categorize .py as code');
    if (FileUtils.getType('App.java') !== 'code') throw new Error('Should categorize .java as code');
});

test('FileUtils - getType categorizes config files', () => {
    if (FileUtils.getType('config.json') !== 'config') throw new Error('Should categorize .json as config');
    if (FileUtils.getType('config.yaml') !== 'config') throw new Error('Should categorize .yaml as config');
    if (FileUtils.getType('config.toml') !== 'config') throw new Error('Should categorize .toml as config');
});

test('FileUtils - getType categorizes doc files', () => {
    if (FileUtils.getType('README.md') !== 'doc') throw new Error('Should categorize .md as doc');
    if (FileUtils.getType('notes.txt') !== 'doc') throw new Error('Should categorize .txt as doc');
});

test('FileUtils - getType categorizes style files', () => {
    if (FileUtils.getType('style.css') !== 'style') throw new Error('Should categorize .css as style');
    if (FileUtils.getType('style.scss') !== 'style') throw new Error('Should categorize .scss as style');
});

test('FileUtils - getType returns other for unknown', () => {
    if (FileUtils.getType('image.png') !== 'other') throw new Error('Should return other for .png');
    if (FileUtils.getType('data.bin') !== 'other') throw new Error('Should return other for .bin');
});

test('FileUtils - getExtension returns extension without dot', () => {
    if (FileUtils.getExtension('test.js') !== 'js') throw new Error('Should return js');
    if (FileUtils.getExtension('config.yaml') !== 'yaml') throw new Error('Should return yaml');
});

test('FileUtils - getExtension handles no extension', () => {
    if (FileUtils.getExtension('Dockerfile') !== 'no-extension') {
        throw new Error('Should return no-extension');
    }
});

test('FileUtils - getExtension handles uppercase extensions', () => {
    const ext = FileUtils.getExtension('Test.JS');
    if (ext !== 'js') throw new Error('Should normalize to lowercase');
});

// ============================================================================
// CONFIG UTILS TESTS
// ============================================================================
console.log('\n⚙️  ConfigUtils Tests');
console.log('-'.repeat(70));

test('ConfigUtils - findConfigFile returns undefined for non-existent', () => {
    const result = ConfigUtils.findConfigFile(process.cwd(), 'nonexistent-config-file-xyz.json');
    if (result !== undefined) throw new Error('Should return undefined for non-existent file');
});

test('ConfigUtils - findConfigFile finds existing file', () => {
    // Try to find package.json which should exist
    const result = ConfigUtils.findConfigFile(process.cwd(), 'package.json');
    if (typeof result !== 'string') throw new Error('Should find package.json');
});

test('ConfigUtils - detectMethodFilters with no filters', () => {
    // Should return false when no method filter files exist
    const hasFilters = ConfigUtils.detectMethodFilters('/nonexistent/path');
    if (typeof hasFilters !== 'boolean') throw new Error('Should return boolean');
});

test('ConfigUtils - initMethodFilter with no filters', () => {
    const parser = ConfigUtils.initMethodFilter('/nonexistent/path');
    if (parser !== null) throw new Error('Should return null when no filters');
});

test('ConfigUtils - initGitIgnore creates parser', () => {
    const parser = ConfigUtils.initGitIgnore(process.cwd());
    if (typeof parser !== 'object') throw new Error('Should return parser object');
    if (typeof parser.isIgnored !== 'function') {
        throw new Error('Parser should have isIgnored method');
    }
});

test('ConfigUtils - getConfigPaths returns object', () => {
    const paths = ConfigUtils.getConfigPaths(process.cwd());
    if (typeof paths !== 'object') throw new Error('Should return object');
    if (!paths.gitignore) throw new Error('Should have gitignore path');
});

// ============================================================================
// TOKEN UTILS TESTS
// ============================================================================
console.log('\n🔢 TokenUtils Tests');
console.log('-'.repeat(70));

test('TokenUtils - calculate for empty string', () => {
    const tokens = TokenUtils.calculate('', 'test.js');
    if (tokens !== 0) throw new Error('Empty string should be 0 tokens');
});

test('TokenUtils - calculate for simple text', () => {
    const text = 'Hello world';
    const tokens = TokenUtils.calculate(text, 'test.js');
    if (tokens <= 0) throw new Error('Should return positive token count');
    if (tokens > 10) throw new Error('Simple text should be few tokens');
});

test('TokenUtils - calculate for code', () => {
    const code = 'function test() { return 42; }';
    const tokens = TokenUtils.calculate(code, 'test.js');
    if (tokens <= 0) throw new Error('Should return positive token count');
});

test('TokenUtils - estimate for long text', () => {
    const text = 'word '.repeat(1000); // 1000 words
    const tokens = TokenUtils.estimate(text, 'test.txt');
    // Should be roughly 1000-1500 tokens
    if (tokens < 800 || tokens > 2000) {
        throw new Error(`Token count seems off: ${tokens}`);
    }
});

test('TokenUtils - estimate with different file types', () => {
    const code = 'const x = 42;';
    const jsTokens = TokenUtils.estimate(code, 'test.js');
    const pyTokens = TokenUtils.estimate(code, 'test.py');
    // Different files may have different estimates
    if (jsTokens <= 0 || pyTokens <= 0) throw new Error('Should calculate tokens');
});

test('TokenUtils - format with small number', () => {
    const formatted = TokenUtils.format(123);
    if (formatted !== '123') throw new Error('Should return plain number');
});

test('TokenUtils - format with K suffix', () => {
    const formatted = TokenUtils.format(5000);
    if (!formatted.includes('K')) throw new Error('Should use K suffix');
});

test('TokenUtils - format with M suffix', () => {
    const formatted = TokenUtils.format(2000000);
    if (!formatted.includes('M')) throw new Error('Should use M suffix');
});

test('TokenUtils - getMethod returns description', () => {
    const method = TokenUtils.getMethod();
    if (typeof method !== 'string') throw new Error('Should return string');
    // Should mention either "Exact" or "Estimated"
    if (!method.includes('Exact') && !method.includes('Estimated')) {
        throw new Error('Should describe counting method');
    }
});

test('TokenUtils - isExact returns boolean', () => {
    const isExact = TokenUtils.isExact();
    if (typeof isExact !== 'boolean') throw new Error('Should return boolean');
});

test('TokenUtils - hasExactCounting alias works', () => {
    const hasExact = TokenUtils.hasExactCounting();
    if (typeof hasExact !== 'boolean') throw new Error('Should return boolean');
    // Should match isExact()
    if (hasExact !== TokenUtils.isExact()) {
        throw new Error('Should match isExact()');
    }
});

test('TokenUtils - calculate handles special characters', () => {
    const text = '!@#$%^&*()_+-={}[]|:;"<>,.?/';
    const tokens = TokenUtils.calculate(text, 'test.js');
    if (tokens <= 0) throw new Error('Should handle special characters');
});

test('TokenUtils - calculate handles unicode', () => {
    const text = 'Hello 世界 🌍';
    const tokens = TokenUtils.calculate(text, 'test.js');
    if (tokens <= 0) throw new Error('Should handle unicode');
});

test('TokenUtils - calculate handles newlines', () => {
    const text = 'Line 1\nLine 2\nLine 3';
    const tokens = TokenUtils.calculate(text, 'test.js');
    if (tokens <= 0) throw new Error('Should handle newlines');
});

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
    console.log('\n🎉 All utils tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
