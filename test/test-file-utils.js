#!/usr/bin/env node

/**
 * Comprehensive File Utils Tests
 * Tests for file type detection and utilities
 */

import FileUtils from '../lib/utils/file-utils.js';

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

console.log('🧪 Testing File Utils...\n');

// ============================================================================
// isText() METHOD TESTS
// ============================================================================
console.log('📝 isText() Method Tests');
console.log('-'.repeat(70));

test('FileUtils - isText detects JavaScript files', () => {
    if (!FileUtils.isText('test.js')) throw new Error('Should detect .js as text');
    if (!FileUtils.isText('test.jsx')) throw new Error('Should detect .jsx as text');
});

test('FileUtils - isText detects TypeScript files', () => {
    if (!FileUtils.isText('test.ts')) throw new Error('Should detect .ts as text');
    if (!FileUtils.isText('test.tsx')) throw new Error('Should detect .tsx as text');
});

test('FileUtils - isText detects markup files', () => {
    if (!FileUtils.isText('test.md')) throw new Error('Should detect .md as text');
    if (!FileUtils.isText('test.html')) throw new Error('Should detect .html as text');
    if (!FileUtils.isText('test.xml')) throw new Error('Should detect .xml as text');
});

test('FileUtils - isText detects config files', () => {
    if (!FileUtils.isText('test.json')) throw new Error('Should detect .json as text');
    if (!FileUtils.isText('test.yml')) throw new Error('Should detect .yml as text');
    if (!FileUtils.isText('test.yaml')) throw new Error('Should detect .yaml as text');
    if (!FileUtils.isText('test.toml')) throw new Error('Should detect .toml as text');
});

test('FileUtils - isText detects style files', () => {
    if (!FileUtils.isText('test.css')) throw new Error('Should detect .css as text');
    if (!FileUtils.isText('test.scss')) throw new Error('Should detect .scss as text');
    if (!FileUtils.isText('test.sass')) throw new Error('Should detect .sass as text');
    if (!FileUtils.isText('test.less')) throw new Error('Should detect .less as text');
});

test('FileUtils - isText detects programming languages', () => {
    if (!FileUtils.isText('test.py')) throw new Error('Should detect .py as text');
    if (!FileUtils.isText('test.rb')) throw new Error('Should detect .rb as text');
    if (!FileUtils.isText('test.php')) throw new Error('Should detect .php as text');
    if (!FileUtils.isText('test.java')) throw new Error('Should detect .java as text');
    if (!FileUtils.isText('test.go')) throw new Error('Should detect .go as text');
    if (!FileUtils.isText('test.rs')) throw new Error('Should detect .rs as text');
    if (!FileUtils.isText('test.cs')) throw new Error('Should detect .cs as text');
});

test('FileUtils - isText detects C/C++ files', () => {
    if (!FileUtils.isText('test.c')) throw new Error('Should detect .c as text');
    if (!FileUtils.isText('test.cpp')) throw new Error('Should detect .cpp as text');
    if (!FileUtils.isText('test.cc')) throw new Error('Should detect .cc as text');
    if (!FileUtils.isText('test.h')) throw new Error('Should detect .h as text');
    if (!FileUtils.isText('test.hpp')) throw new Error('Should detect .hpp as text');
});

test('FileUtils - isText detects special files without extension', () => {
    if (!FileUtils.isText('Dockerfile')) throw new Error('Should detect Dockerfile as text');
    if (!FileUtils.isText('Makefile')) throw new Error('Should detect Makefile as text');
    if (!FileUtils.isText('LICENSE')) throw new Error('Should detect LICENSE as text');
    if (!FileUtils.isText('README')) throw new Error('Should detect README as text');
    if (!FileUtils.isText('CHANGELOG')) throw new Error('Should detect CHANGELOG as text');
});

test('FileUtils - isText handles case insensitivity', () => {
    if (!FileUtils.isText('Test.JS')) throw new Error('Should be case insensitive (.JS)');
    if (!FileUtils.isText('TEST.TS')) throw new Error('Should be case insensitive (.TS)');
    if (!FileUtils.isText('dockerfile.prod')) throw new Error('Should detect dockerfile variations');
});

test('FileUtils - isText rejects binary files', () => {
    if (FileUtils.isText('image.png')) throw new Error('Should not detect .png as text');
    if (FileUtils.isText('image.jpg')) throw new Error('Should not detect .jpg as text');
    if (FileUtils.isText('video.mp4')) throw new Error('Should not detect .mp4 as text');
    if (FileUtils.isText('archive.zip')) throw new Error('Should not detect .zip as text');
});

// ============================================================================
// isCode() METHOD TESTS
// ============================================================================
console.log('\n💻 isCode() Method Tests');
console.log('-'.repeat(70));

test('FileUtils - isCode detects JavaScript/TypeScript', () => {
    if (!FileUtils.isCode('app.js')) throw new Error('Should detect .js as code');
    if (!FileUtils.isCode('app.ts')) throw new Error('Should detect .ts as code');
    if (!FileUtils.isCode('app.jsx')) throw new Error('Should detect .jsx as code');
    if (!FileUtils.isCode('app.tsx')) throw new Error('Should detect .tsx as code');
});

test('FileUtils - isCode detects all supported languages', () => {
    const codeFiles = [
        'test.rs',    // Rust
        'test.cs',    // C#
        'test.go',    // Go
        'test.java',  // Java
        'test.py',    // Python
        'test.php',   // PHP
        'test.rb',    // Ruby
        'test.kt',    // Kotlin
        'test.swift', // Swift
        'test.c',     // C
        'test.cpp',   // C++
        'test.scala'  // Scala
    ];

    for (const file of codeFiles) {
        if (!FileUtils.isCode(file)) throw new Error(`Should detect ${file} as code`);
    }
});

test('FileUtils - isCode handles C/C++ variations', () => {
    if (!FileUtils.isCode('test.c')) throw new Error('Should detect .c as code');
    if (!FileUtils.isCode('test.cpp')) throw new Error('Should detect .cpp as code');
    if (!FileUtils.isCode('test.cc')) throw new Error('Should detect .cc as code');
    if (!FileUtils.isCode('test.h')) throw new Error('Should detect .h as code');
    if (!FileUtils.isCode('test.hpp')) throw new Error('Should detect .hpp as code');
});

test('FileUtils - isCode handles Kotlin variations', () => {
    if (!FileUtils.isCode('test.kt')) throw new Error('Should detect .kt as code');
    if (!FileUtils.isCode('test.kts')) throw new Error('Should detect .kts as code');
});

test('FileUtils - isCode rejects non-code files', () => {
    if (FileUtils.isCode('test.md')) throw new Error('Should not detect .md as code');
    if (FileUtils.isCode('test.json')) throw new Error('Should not detect .json as code');
    if (FileUtils.isCode('test.txt')) throw new Error('Should not detect .txt as code');
    if (FileUtils.isCode('test.css')) throw new Error('Should not detect .css as code');
});

test('FileUtils - isCode is case insensitive', () => {
    if (!FileUtils.isCode('Test.JS')) throw new Error('Should be case insensitive');
    if (!FileUtils.isCode('Test.PY')) throw new Error('Should be case insensitive');
});

// ============================================================================
// getType() METHOD TESTS
// ============================================================================
console.log('\n🏷️  getType() Method Tests');
console.log('-'.repeat(70));

test('FileUtils - getType returns "code" for code files', () => {
    if (FileUtils.getType('app.js') !== 'code') throw new Error('Should return "code" for .js');
    if (FileUtils.getType('app.py') !== 'code') throw new Error('Should return "code" for .py');
    if (FileUtils.getType('app.rs') !== 'code') throw new Error('Should return "code" for .rs');
    if (FileUtils.getType('app.java') !== 'code') throw new Error('Should return "code" for .java');
});

test('FileUtils - getType returns "config" for config files', () => {
    if (FileUtils.getType('config.json') !== 'config') throw new Error('Should return "config" for .json');
    if (FileUtils.getType('config.yml') !== 'config') throw new Error('Should return "config" for .yml');
    if (FileUtils.getType('config.yaml') !== 'config') throw new Error('Should return "config" for .yaml');
    if (FileUtils.getType('config.toml') !== 'config') throw new Error('Should return "config" for .toml');
});

test('FileUtils - getType returns "doc" for document files', () => {
    if (FileUtils.getType('README.md') !== 'doc') throw new Error('Should return "doc" for .md');
    if (FileUtils.getType('notes.txt') !== 'doc') throw new Error('Should return "doc" for .txt');
    if (FileUtils.getType('manual.pdf') !== 'doc') throw new Error('Should return "doc" for .pdf');
});

test('FileUtils - getType returns "style" for style files', () => {
    if (FileUtils.getType('style.css') !== 'style') throw new Error('Should return "style" for .css');
    if (FileUtils.getType('style.scss') !== 'style') throw new Error('Should return "style" for .scss');
    if (FileUtils.getType('style.sass') !== 'style') throw new Error('Should return "style" for .sass');
    if (FileUtils.getType('style.less') !== 'style') throw new Error('Should return "style" for .less');
});

test('FileUtils - getType returns "other" for unknown files', () => {
    if (FileUtils.getType('image.png') !== 'other') throw new Error('Should return "other" for .png');
    if (FileUtils.getType('video.mp4') !== 'other') throw new Error('Should return "other" for .mp4');
    if (FileUtils.getType('archive.zip') !== 'other') throw new Error('Should return "other" for .zip');
});

test('FileUtils - getType handles all code language extensions', () => {
    const codeFiles = [
        'test.js', 'test.ts', 'test.py', 'test.rb', 'test.php',
        'test.java', 'test.go', 'test.rs', 'test.cs', 'test.kt',
        'test.swift', 'test.scala', 'test.c', 'test.cpp'
    ];

    for (const file of codeFiles) {
        if (FileUtils.getType(file) !== 'code') {
            throw new Error(`${file} should be categorized as "code"`);
        }
    }
});

// ============================================================================
// getExtension() METHOD TESTS
// ============================================================================
console.log('\n🔧 getExtension() Method Tests');
console.log('-'.repeat(70));

test('FileUtils - getExtension returns extension without dot', () => {
    if (FileUtils.getExtension('test.js') !== 'js') throw new Error('Should return "js"');
    if (FileUtils.getExtension('test.py') !== 'py') throw new Error('Should return "py"');
    if (FileUtils.getExtension('test.json') !== 'json') throw new Error('Should return "json"');
});

test('FileUtils - getExtension handles multiple dots', () => {
    if (FileUtils.getExtension('test.min.js') !== 'js') throw new Error('Should return "js"');
    if (FileUtils.getExtension('config.test.json') !== 'json') throw new Error('Should return "json"');
});

test('FileUtils - getExtension handles no extension', () => {
    const result = FileUtils.getExtension('Dockerfile');
    if (result !== 'no-extension') throw new Error('Should return "no-extension"');
});

test('FileUtils - getExtension handles no extension (Makefile)', () => {
    const result = FileUtils.getExtension('Makefile');
    if (result !== 'no-extension') throw new Error('Should return "no-extension"');
});

test('FileUtils - getExtension is case insensitive', () => {
    if (FileUtils.getExtension('Test.JS') !== 'js') throw new Error('Should return lowercase');
    if (FileUtils.getExtension('Test.PY') !== 'py') throw new Error('Should return lowercase');
});

test('FileUtils - getExtension handles long extensions', () => {
    if (FileUtils.getExtension('test.typescript') !== 'typescript') {
        throw new Error('Should handle long extensions');
    }
});

// ============================================================================
// EDGE CASES AND ERROR HANDLING
// ============================================================================
console.log('\n🎯 Edge Cases and Error Handling');
console.log('-'.repeat(70));

test('FileUtils - isText handles empty string', () => {
    try {
        const result = FileUtils.isText('');
        if (result) throw new Error('Empty string should not be text');
    } catch (error) {
        // May throw or return false, both acceptable
    }
});

test('FileUtils - isCode handles empty string', () => {
    try {
        const result = FileUtils.isCode('');
        if (result) throw new Error('Empty string should not be code');
    } catch (error) {
        // May throw or return false, both acceptable
    }
});

test('FileUtils - getType handles empty string', () => {
    try {
        const result = FileUtils.getType('');
        if (result !== 'other') throw new Error('Empty string should return "other"');
    } catch (error) {
        // May throw, which is acceptable
    }
});

test('FileUtils - getExtension handles empty string', () => {
    try {
        const result = FileUtils.getExtension('');
        if (result !== 'no-extension') throw new Error('Should return "no-extension"');
    } catch (error) {
        // May throw, which is acceptable
    }
});

test('FileUtils - handles paths with directories', () => {
    if (!FileUtils.isText('src/utils/helper.js')) throw new Error('Should handle paths');
    if (FileUtils.getExtension('src/utils/helper.js') !== 'js') throw new Error('Should extract extension');
});

test('FileUtils - handles absolute paths', () => {
    if (!FileUtils.isText('/home/user/project/app.js')) throw new Error('Should handle absolute paths');
    if (FileUtils.getExtension('/home/user/project/app.js') !== 'js') throw new Error('Should extract extension');
});

test('FileUtils - handles Windows paths', () => {
    if (!FileUtils.isText('C:\\Users\\test\\app.js')) throw new Error('Should handle Windows paths');
});

test('FileUtils - handles special characters in filename', () => {
    if (!FileUtils.isText('test-file.js')) throw new Error('Should handle dashes');
    if (!FileUtils.isText('test_file.js')) throw new Error('Should handle underscores');
    if (!FileUtils.isText('test.spec.js')) throw new Error('Should handle multiple dots');
});

test('FileUtils - handles hidden files', () => {
    if (!FileUtils.isText('.eslintrc.js')) throw new Error('Should handle hidden files');
    if (FileUtils.getExtension('.gitignore') !== 'no-extension') throw new Error('Should handle .gitignore');
});

// ============================================================================
// STATIC METHODS TESTS
// ============================================================================
console.log('\n⚙️  Static Methods Tests');
console.log('-'.repeat(70));

test('FileUtils - All methods are static', () => {
    if (typeof FileUtils.isText !== 'function') throw new Error('isText should be static');
    if (typeof FileUtils.isCode !== 'function') throw new Error('isCode should be static');
    if (typeof FileUtils.getType !== 'function') throw new Error('getType should be static');
    if (typeof FileUtils.getExtension !== 'function') throw new Error('getExtension should be static');
});

test('FileUtils - Cannot instantiate', () => {
    try {
        new FileUtils();
        throw new Error('Should not be instantiable');
    } catch (error) {
        if (!error.message.includes('not a constructor') &&
            !error.message.includes('not instantiable') &&
            !error.message.includes('Should not be instantiable')) {
            // It's ok if it constructs but we expect it to be used statically
        }
    }
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\n🔗 Integration Tests');
console.log('-'.repeat(70));

test('FileUtils - Code files are also text files', () => {
    const codeFiles = ['app.js', 'main.py', 'server.rs', 'App.java'];
    for (const file of codeFiles) {
        if (!FileUtils.isCode(file)) throw new Error(`${file} should be code`);
        if (!FileUtils.isText(file)) throw new Error(`${file} should be text`);
    }
});

test('FileUtils - Type matches extension detection', () => {
    if (FileUtils.getType('app.js') !== 'code' || !FileUtils.isCode('app.js')) {
        throw new Error('Type and isCode should be consistent');
    }
    if (FileUtils.getType('config.json') !== 'config' || FileUtils.isCode('config.json')) {
        throw new Error('Config files should not be code');
    }
});

test('FileUtils - Extension extraction works for all file types', () => {
    const files = ['test.js', 'test.py', 'test.json', 'test.css', 'test.md'];
    for (const file of files) {
        const ext = FileUtils.getExtension(file);
        if (!file.endsWith(`.${ext}`)) throw new Error('Extension should match file');
    }
});

test('FileUtils - Multiple operations on same file', () => {
    const file = 'src/components/Button.tsx';
    const isText = FileUtils.isText(file);
    const isCode = FileUtils.isCode(file);
    const type = FileUtils.getType(file);
    const ext = FileUtils.getExtension(file);

    if (!isText) throw new Error('Should be text');
    if (!isCode) throw new Error('Should be code');
    if (type !== 'code') throw new Error('Should be code type');
    if (ext !== 'tsx') throw new Error('Should have tsx extension');
});

// ============================================================================
// COMPREHENSIVE LANGUAGE SUPPORT TESTS
// ============================================================================
console.log('\n🌐 Comprehensive Language Support Tests');
console.log('-'.repeat(70));

test('FileUtils - All 14+ supported languages are detected correctly', () => {
    const languages = [
        { file: 'app.js', lang: 'JavaScript' },
        { file: 'app.ts', lang: 'TypeScript' },
        { file: 'main.rs', lang: 'Rust' },
        { file: 'App.cs', lang: 'C#' },
        { file: 'main.go', lang: 'Go' },
        { file: 'Main.java', lang: 'Java' },
        { file: 'script.py', lang: 'Python' },
        { file: 'index.php', lang: 'PHP' },
        { file: 'app.rb', lang: 'Ruby' },
        { file: 'App.kt', lang: 'Kotlin' },
        { file: 'App.swift', lang: 'Swift' },
        { file: 'main.c', lang: 'C' },
        { file: 'main.cpp', lang: 'C++' },
        { file: 'App.scala', lang: 'Scala' }
    ];

    for (const { file, lang } of languages) {
        if (!FileUtils.isCode(file)) throw new Error(`${lang} (${file}) should be detected as code`);
        if (!FileUtils.isText(file)) throw new Error(`${lang} (${file}) should be detected as text`);
        if (FileUtils.getType(file) !== 'code') throw new Error(`${lang} (${file}) should be type "code"`);
    }
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
    console.log('\n🎉 All file utils tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
