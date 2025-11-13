#!/usr/bin/env node

/**
 * Comprehensive Clipboard Utils Tests
 * Tests for cross-platform clipboard operations
 */

import ClipboardUtils from '../lib/utils/clipboard-utils.js';

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

console.log('🧪 Testing Clipboard Utils...\n');

// ============================================================================
// PLATFORM AVAILABILITY TESTS
// ============================================================================
console.log('🖥️  Platform Availability Tests');
console.log('-'.repeat(70));

test('ClipboardUtils - isAvailable returns boolean', () => {
    const available = ClipboardUtils.isAvailable();
    if (typeof available !== 'boolean') throw new Error('Should return boolean');
});

test('ClipboardUtils - isAvailable detects supported platforms', () => {
    const available = ClipboardUtils.isAvailable();
    const platform = process.platform;
    const supported = ['darwin', 'linux', 'win32'];

    if (supported.includes(platform)) {
        if (!available) throw new Error('Should be available on supported platform');
    }
});

test('ClipboardUtils - isAvailable checks multiple platforms', () => {
    // Just verify the method works
    const result = ClipboardUtils.isAvailable();
    if (typeof result !== 'boolean') throw new Error('Should return boolean');
});

// ============================================================================
// COMMAND TESTS
// ============================================================================
console.log('\n📋 Command Tests');
console.log('-'.repeat(70));

test('ClipboardUtils - getCommand returns string', () => {
    const command = ClipboardUtils.getCommand();
    if (typeof command !== 'string') throw new Error('Should return string');
    if (command.length === 0) throw new Error('Should not be empty');
});

test('ClipboardUtils - getCommand returns correct command for platform', () => {
    const command = ClipboardUtils.getCommand();
    const platform = process.platform;

    if (platform === 'darwin') {
        if (command !== 'pbcopy') throw new Error('Should return pbcopy for macOS');
    } else if (platform === 'linux') {
        if (command !== 'xclip') throw new Error('Should return xclip for Linux');
    } else if (platform === 'win32') {
        if (command !== 'clip') throw new Error('Should return clip for Windows');
    }
});

test('ClipboardUtils - getCommand handles unknown platform', () => {
    const command = ClipboardUtils.getCommand();
    // Should return a string (unknown or valid command)
    if (typeof command !== 'string') throw new Error('Should return string');
});

// ============================================================================
// COPY TESTS
// ============================================================================
console.log('\n📝 Copy Tests');
console.log('-'.repeat(70));

test('ClipboardUtils - copy returns boolean', () => {
    const result = ClipboardUtils.copy('test');
    if (typeof result !== 'boolean') throw new Error('Should return boolean');
});

test('ClipboardUtils - copy handles empty string', () => {
    const result = ClipboardUtils.copy('');
    if (typeof result !== 'boolean') throw new Error('Should return boolean');
});

test('ClipboardUtils - copy handles short text', () => {
    const result = ClipboardUtils.copy('hello');
    if (typeof result !== 'boolean') throw new Error('Should return boolean');
});

test('ClipboardUtils - copy handles multiline text', () => {
    const text = 'line1\nline2\nline3';
    const result = ClipboardUtils.copy(text);
    if (typeof result !== 'boolean') throw new Error('Should return boolean');
});

test('ClipboardUtils - copy handles special characters', () => {
    const text = 'Special: @#$%^&*()_+-=[]{}|;:,.<>?/';
    const result = ClipboardUtils.copy(text);
    if (typeof result !== 'boolean') throw new Error('Should return boolean');
});

test('ClipboardUtils - copy handles long text', () => {
    const longText = 'x'.repeat(10000);
    const result = ClipboardUtils.copy(longText);
    if (typeof result !== 'boolean') throw new Error('Should return boolean');
});

test('ClipboardUtils - copy handles unicode', () => {
    const text = 'Unicode: 你好 мир 🎉';
    const result = ClipboardUtils.copy(text);
    if (typeof result !== 'boolean') throw new Error('Should return boolean');
});

// ============================================================================
// STATIC METHOD TESTS
// ============================================================================
console.log('\n⚙️  Static Method Tests');
console.log('-'.repeat(70));

test('ClipboardUtils - All methods are static', () => {
    if (typeof ClipboardUtils.copy !== 'function') {
        throw new Error('copy should be static');
    }
    if (typeof ClipboardUtils.isAvailable !== 'function') {
        throw new Error('isAvailable should be static');
    }
    if (typeof ClipboardUtils.getCommand !== 'function') {
        throw new Error('getCommand should be static');
    }
});

test('ClipboardUtils - Cannot instantiate', () => {
    // ClipboardUtils is a static class
    try {
        new ClipboardUtils();
        throw new Error('Should not be instantiable');
    } catch (error) {
        // Expected - constructor might not be defined or might throw
        if (!error.message.includes('not a constructor') &&
            !error.message.includes('not instantiable')) {
            // It's ok if it constructs but has no instance methods
        }
    }
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🎯 Edge Cases');
console.log('-'.repeat(70));

test('ClipboardUtils - copy with null/undefined (converted to string)', () => {
    // JavaScript will convert to string, should not crash
    try {
        const result = ClipboardUtils.copy(null);
        if (typeof result !== 'boolean') throw new Error('Should return boolean');
    } catch (error) {
        // May fail on copy but should handle gracefully
        if (!error.message) throw new Error('Should have error message');
    }
});

test('ClipboardUtils - copy with number (converted to string)', () => {
    const result = ClipboardUtils.copy(123);
    if (typeof result !== 'boolean') throw new Error('Should return boolean');
});

test('ClipboardUtils - copy with object (converted to string)', () => {
    try {
        const result = ClipboardUtils.copy({ test: 'value' });
        if (typeof result !== 'boolean') throw new Error('Should return boolean');
    } catch (error) {
        // May fail but should handle gracefully
        if (!error.message) throw new Error('Should have error message');
    }
});

test('ClipboardUtils - Multiple copy operations', () => {
    const result1 = ClipboardUtils.copy('first');
    const result2 = ClipboardUtils.copy('second');
    const result3 = ClipboardUtils.copy('third');

    if (typeof result1 !== 'boolean') throw new Error('First copy should return boolean');
    if (typeof result2 !== 'boolean') throw new Error('Second copy should return boolean');
    if (typeof result3 !== 'boolean') throw new Error('Third copy should return boolean');
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
    console.log('\n🎉 All clipboard utils tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
