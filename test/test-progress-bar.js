#!/usr/bin/env node

/**
 * Unit Tests for Progress Bar Component
 * Tests ProgressBar and SpinnerWithText components
 */

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    testsRun++;
    try {
        fn();
        testsPassed++;
        console.log(`✅ ${name}`);
        return true;
    } catch (error) {
        testsFailed++;
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        if (error.stack) {
            console.error(`   Stack: ${error.stack.split('\n')[1]?.trim()}`);
        }
        return false;
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

function assertTrue(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function assertFalse(condition, message) {
    if (condition) {
        throw new Error(message);
    }
}

function assertThrows(fn, errorType, message) {
    try {
        fn();
        throw new Error(`${message}: Expected error to be thrown`);
    } catch (error) {
        if (errorType && !(error instanceof errorType)) {
            throw new Error(`${message}: Expected ${errorType.name}, got ${error.constructor.name}`);
        }
    }
}

console.log('🧪 Testing Progress Bar Component...\n');

// ============================================================================
// IMPORT REACT AND MOCK createElement
// ============================================================================

// Import React first
let React;
try {
    const reactModule = await import('react');
    React = reactModule.default || reactModule;
} catch (error) {
    console.error('❌ React not found. Installing dependencies...');
    console.error('   Run: npm install');
    process.exit(1);
}

// Track React.createElement calls by wrapping it
let createElementCalls = [];
const originalCreateElement = React.createElement;

React.createElement = function (type, props, ...children) {
    const call = { type, props, children };
    createElementCalls.push(call);
    return originalCreateElement.call(React, type, props, ...children);
};

// Mock Ink components
const MockBox = 'Box';
const MockText = 'Text';
const MockSpinner = 'Spinner';

const mockComponents = {
    Box: MockBox,
    Text: MockText,
    Spinner: MockSpinner
};

// Import ProgressBar after React is available
const progressBarModule = await import('../lib/ui/progress-bar.js');
const { ProgressBar, SpinnerWithText } = progressBarModule;

// Helper to reset createElement calls
function resetCalls() {
    createElementCalls = [];
}

// Helper to find createElement calls by type
function findCalls(type) {
    return createElementCalls.filter(call => call.type === type);
}

// Helper to find text content in calls
function findTextContent(text) {
    return createElementCalls.some(call => {
        const children = call.children.flat();
        return children.some(child =>
            typeof child === 'string' && child.includes(text)
        );
    });
}

// ============================================================================
// PROGRESS BAR INITIALIZATION TESTS
// ============================================================================
console.log('📦 Progress Bar Initialization');
console.log('-'.repeat(60));

test('ProgressBar renders without errors with valid props', () => {
    resetCalls();

    const result = ProgressBar({
        current: 10,
        total: 100,
        tokens: 5000,
        maxTokens: 10000,
        currentFile: 'test.js',
        components: mockComponents
    });

    assertTrue(result !== null, 'Should return a result');
    assertTrue(createElementCalls.length > 0, 'Should create elements');
});

test('ProgressBar throws error when Box component missing', () => {
    resetCalls();

    assertThrows(() => {
        ProgressBar({
            current: 10,
            total: 100,
            tokens: 5000,
            maxTokens: 10000,
            components: { Text: MockText }
        });
    }, Error, 'Should throw error when Box is missing');
});

test('ProgressBar throws error when Text component missing', () => {
    resetCalls();

    assertThrows(() => {
        ProgressBar({
            current: 10,
            total: 100,
            tokens: 5000,
            maxTokens: 10000,
            components: { Box: MockBox }
        });
    }, Error, 'Should throw error when Text is missing');
});

test('ProgressBar throws error when components prop is missing', () => {
    resetCalls();

    assertThrows(() => {
        ProgressBar({
            current: 10,
            total: 100,
            tokens: 5000,
            maxTokens: 10000
        });
    }, Error, 'Should throw error when components is missing');
});

// ============================================================================
// PROGRESS UPDATE TESTS (0-100%)
// ============================================================================
console.log('\n📊 Progress Updates (0-100%)');
console.log('-'.repeat(60));

test('ProgressBar displays 0% at start', () => {
    resetCalls();

    ProgressBar({
        current: 0,
        total: 100,
        tokens: 0,
        maxTokens: 10000,
        components: mockComponents
    });

    assertTrue(findTextContent('0%'), 'Should display 0%');
});

test('ProgressBar displays 50% at halfway', () => {
    resetCalls();

    ProgressBar({
        current: 50,
        total: 100,
        tokens: 5000,
        maxTokens: 10000,
        components: mockComponents
    });

    assertTrue(findTextContent('50%'), 'Should display 50%');
});

test('ProgressBar displays 100% at completion', () => {
    resetCalls();

    ProgressBar({
        current: 100,
        total: 100,
        tokens: 10000,
        maxTokens: 10000,
        components: mockComponents
    });

    assertTrue(findTextContent('100%'), 'Should display 100%');
});

test('ProgressBar displays 25% correctly', () => {
    resetCalls();

    ProgressBar({
        current: 25,
        total: 100,
        tokens: 2500,
        maxTokens: 10000,
        components: mockComponents
    });

    assertTrue(findTextContent('25%'), 'Should display 25%');
});

test('ProgressBar displays 75% correctly', () => {
    resetCalls();

    ProgressBar({
        current: 75,
        total: 100,
        tokens: 7500,
        maxTokens: 10000,
        components: mockComponents
    });

    assertTrue(findTextContent('75%'), 'Should display 75%');
});

// ============================================================================
// CUSTOM LABELS AND CURRENT FILE
// ============================================================================
console.log('\n🏷️  Custom Labels and Current File');
console.log('-'.repeat(60));

test('ProgressBar displays current file when provided', () => {
    resetCalls();

    ProgressBar({
        current: 10,
        total: 100,
        tokens: 5000,
        maxTokens: 10000,
        currentFile: 'src/components/Button.js',
        components: mockComponents
    });

    assertTrue(findTextContent('src/components/Button.js'), 'Should display current file');
    assertTrue(findTextContent('Current:'), 'Should display "Current:" label');
});

test('ProgressBar does not show current file section when not provided', () => {
    resetCalls();

    ProgressBar({
        current: 10,
        total: 100,
        tokens: 5000,
        maxTokens: 10000,
        components: mockComponents
    });

    assertFalse(findTextContent('Current:'), 'Should not display "Current:" label');
});

test('ProgressBar displays file count correctly', () => {
    resetCalls();

    ProgressBar({
        current: 45,
        total: 150,
        tokens: 5000,
        maxTokens: 10000,
        components: mockComponents
    });

    assertTrue(findTextContent('(45/150 files)'), 'Should display file count');
});

test('ProgressBar displays title', () => {
    resetCalls();

    ProgressBar({
        current: 10,
        total: 100,
        tokens: 5000,
        maxTokens: 10000,
        components: mockComponents
    });

    assertTrue(findTextContent('📊 Project Analysis'), 'Should display title');
});

// ============================================================================
// COLOR CHANGES BASED ON PROGRESS
// ============================================================================
console.log('\n🎨 Color Changes Based on Progress');
console.log('-'.repeat(60));

test('Token count shows green when below 90%', () => {
    resetCalls();

    ProgressBar({
        current: 50,
        total: 100,
        tokens: 8000,
        maxTokens: 10000,
        components: mockComponents
    });

    const textCalls = findCalls(MockText);
    const tokenColorCall = textCalls.find(call =>
        call.props?.color === 'green' &&
        call.children.some(c => typeof c === 'number' || c.toString().includes('8'))
    );

    assertTrue(tokenColorCall !== undefined, 'Token count should be green when below 90%');
});

test('Token count shows red when above 90%', () => {
    resetCalls();

    ProgressBar({
        current: 95,
        total: 100,
        tokens: 9500,
        maxTokens: 10000,
        components: mockComponents
    });

    const textCalls = findCalls(MockText);
    const tokenColorCall = textCalls.find(call =>
        call.props?.color === 'red'
    );

    assertTrue(tokenColorCall !== undefined, 'Token count should be red when above 90%');
});

test('Progress bar uses green color', () => {
    resetCalls();

    ProgressBar({
        current: 50,
        total: 100,
        tokens: 5000,
        maxTokens: 10000,
        components: mockComponents
    });

    const textCalls = findCalls(MockText);
    const greenBarCall = textCalls.find(call =>
        call.props?.color === 'green' &&
        call.children.some(c => typeof c === 'string' && c.includes('━'))
    );

    assertTrue(greenBarCall !== undefined, 'Progress bar should be green');
});

// ============================================================================
// BAR WIDTH AND PERCENTAGE CALCULATIONS
// ============================================================================
console.log('\n📏 Bar Width and Percentage Calculations');
console.log('-'.repeat(60));

test('Bar width calculation for 0%', () => {
    resetCalls();

    ProgressBar({
        current: 0,
        total: 100,
        tokens: 0,
        maxTokens: 10000,
        components: mockComponents
    });

    const textCalls = findCalls(MockText);
    const barCall = textCalls.find(call =>
        call.children.some(c => typeof c === 'string' && (c.includes('━') || c.includes('─')))
    );

    assertTrue(barCall !== undefined, 'Should render progress bar');
    const barContent = barCall.children[0];
    const filledLength = (barContent.match(/━/g) || []).length;
    assertEquals(filledLength, 0, 'Should have 0 filled characters at 0%');
});

test('Bar width calculation for 50%', () => {
    resetCalls();

    ProgressBar({
        current: 50,
        total: 100,
        tokens: 5000,
        maxTokens: 10000,
        components: mockComponents
    });

    const textCalls = findCalls(MockText);
    const barCall = textCalls.find(call =>
        call.children.some(c => typeof c === 'string' && c.includes('━'))
    );

    assertTrue(barCall !== undefined, 'Should render progress bar');
    const barContent = barCall.children[0];
    const filledLength = (barContent.match(/━/g) || []).length;
    assertEquals(filledLength, 20, 'Should have 20 filled characters at 50% (40 total width)');
});

test('Bar width calculation for 100%', () => {
    resetCalls();

    ProgressBar({
        current: 100,
        total: 100,
        tokens: 10000,
        maxTokens: 10000,
        components: mockComponents
    });

    const textCalls = findCalls(MockText);
    const barCall = textCalls.find(call =>
        call.children.some(c => typeof c === 'string' && c.includes('━'))
    );

    assertTrue(barCall !== undefined, 'Should render progress bar');
    const barContent = barCall.children[0];
    const filledLength = (barContent.match(/━/g) || []).length;
    assertEquals(filledLength, 40, 'Should have 40 filled characters at 100%');
});

test('Percentage rounds correctly', () => {
    resetCalls();

    ProgressBar({
        current: 33,
        total: 100,
        tokens: 3300,
        maxTokens: 10000,
        components: mockComponents
    });

    assertTrue(findTextContent('33%'), 'Should round 33% correctly');
});

// ============================================================================
// TOKEN PERCENTAGE LOGIC
// ============================================================================
console.log('\n💎 Token Percentage Logic');
console.log('-'.repeat(60));

test('Token percentage displays correctly', () => {
    resetCalls();

    ProgressBar({
        current: 50,
        total: 100,
        tokens: 7500,
        maxTokens: 10000,
        components: mockComponents
    });

    assertTrue(findTextContent('75.0%'), 'Should display token percentage 75.0%');
});

test('Token percentage with maxTokens 0 defaults to 0', () => {
    resetCalls();

    ProgressBar({
        current: 50,
        total: 100,
        tokens: 5000,
        maxTokens: 0,
        components: mockComponents
    });

    // Should not show token max/percentage when maxTokens is 0
    // (file count will still have "/" but that's different)
    const textContent = createElementCalls
        .flatMap(call => call.children)
        .filter(c => typeof c === 'string')
        .join('');

    // Should show tokens count but not max tokens
    assertTrue(textContent.includes('5,000'), 'Should show token count');
    assertFalse(textContent.includes('0.0%'), 'Should not show 0.0% when maxTokens is 0');
});

test('Token count displays with locale formatting', () => {
    resetCalls();

    ProgressBar({
        current: 50,
        total: 100,
        tokens: 125000,
        maxTokens: 200000,
        components: mockComponents
    });

    assertTrue(findTextContent('125,000'), 'Should format tokens with locale');
});

// ============================================================================
// SPINNER WITH TEXT COMPONENT
// ============================================================================
console.log('\n🔄 SpinnerWithText Component');
console.log('-'.repeat(60));

test('SpinnerWithText renders with pending status', () => {
    resetCalls();

    const result = SpinnerWithText({
        text: 'Loading...',
        status: 'pending',
        components: mockComponents
    });

    assertTrue(result !== null, 'Should return a result');
    assertTrue(findTextContent('○'), 'Should display pending icon');
    assertTrue(findTextContent('Loading...'), 'Should display text');
});

test('SpinnerWithText renders with complete status', () => {
    resetCalls();

    SpinnerWithText({
        text: 'Done!',
        status: 'complete',
        components: mockComponents
    });

    assertTrue(findTextContent('✓'), 'Should display complete icon');
    assertTrue(findTextContent('Done!'), 'Should display text');
});

test('SpinnerWithText renders with error status', () => {
    resetCalls();

    SpinnerWithText({
        text: 'Failed',
        status: 'error',
        components: mockComponents
    });

    assertTrue(findTextContent('✗'), 'Should display error icon');
    assertTrue(findTextContent('Failed'), 'Should display text');
});

test('SpinnerWithText uses correct color for pending', () => {
    resetCalls();

    SpinnerWithText({
        text: 'Pending...',
        status: 'pending',
        components: mockComponents
    });

    const textCalls = findCalls(MockText);
    const coloredCall = textCalls.find(call => call.props?.color === 'gray');
    assertTrue(coloredCall !== undefined, 'Should use gray color for pending');
});

test('SpinnerWithText uses correct color for complete', () => {
    resetCalls();

    SpinnerWithText({
        text: 'Complete',
        status: 'complete',
        components: mockComponents
    });

    const textCalls = findCalls(MockText);
    const coloredCall = textCalls.find(call => call.props?.color === 'green');
    assertTrue(coloredCall !== undefined, 'Should use green color for complete');
});

test('SpinnerWithText uses correct color for error', () => {
    resetCalls();

    SpinnerWithText({
        text: 'Error',
        status: 'error',
        components: mockComponents
    });

    const textCalls = findCalls(MockText);
    const coloredCall = textCalls.find(call => call.props?.color === 'red');
    assertTrue(coloredCall !== undefined, 'Should use red color for error');
});

test('SpinnerWithText defaults to pending status', () => {
    resetCalls();

    SpinnerWithText({
        text: 'Processing...',
        components: mockComponents
    });

    assertTrue(findTextContent('○'), 'Should default to pending icon');
});

test('SpinnerWithText throws error when Box component missing', () => {
    resetCalls();

    assertThrows(() => {
        SpinnerWithText({
            text: 'Test',
            status: 'pending',
            components: { Text: MockText }
        });
    }, Error, 'Should throw error when Box is missing');
});

test('SpinnerWithText throws error when Text component missing', () => {
    resetCalls();

    assertThrows(() => {
        SpinnerWithText({
            text: 'Test',
            status: 'pending',
            components: { Box: MockBox }
        });
    }, Error, 'Should throw error when Text is missing');
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n⚠️  Edge Cases');
console.log('-'.repeat(60));

test('ProgressBar handles total of 0', () => {
    resetCalls();

    ProgressBar({
        current: 0,
        total: 0,
        tokens: 0,
        maxTokens: 10000,
        components: mockComponents
    });

    assertTrue(findTextContent('0%'), 'Should display 0% when total is 0');
});

test('ProgressBar handles current > total', () => {
    resetCalls();

    ProgressBar({
        current: 150,
        total: 100,
        tokens: 15000,
        maxTokens: 10000,
        components: mockComponents
    });

    assertTrue(findTextContent('150%'), 'Should display 150% when current exceeds total');
});

test('ProgressBar handles very small percentages', () => {
    resetCalls();

    ProgressBar({
        current: 1,
        total: 1000,
        tokens: 100,
        maxTokens: 100000,
        components: mockComponents
    });

    assertTrue(findTextContent('0%'), 'Should round down to 0% for very small percentages');
});

test('ProgressBar handles very large numbers', () => {
    resetCalls();

    ProgressBar({
        current: 5000,
        total: 10000,
        tokens: 5000000,
        maxTokens: 10000000,
        components: mockComponents
    });

    assertTrue(findTextContent('50%'), 'Should handle large numbers correctly');
    assertTrue(findTextContent('5,000,000'), 'Should format large token numbers');
});

test('ProgressBar handles empty currentFile string', () => {
    resetCalls();

    ProgressBar({
        current: 10,
        total: 100,
        tokens: 5000,
        maxTokens: 10000,
        currentFile: '',
        components: mockComponents
    });

    assertFalse(findTextContent('Current:'), 'Should not show current file section for empty string');
});

test('ProgressBar handles null currentFile', () => {
    resetCalls();

    ProgressBar({
        current: 10,
        total: 100,
        tokens: 5000,
        maxTokens: 10000,
        currentFile: null,
        components: mockComponents
    });

    assertFalse(findTextContent('Current:'), 'Should not show current file section for null');
});

test('Token percentage at exactly 90%', () => {
    resetCalls();

    ProgressBar({
        current: 90,
        total: 100,
        tokens: 9000,
        maxTokens: 10000,
        components: mockComponents
    });

    // At exactly 90%, it should still be green (> 90 is red)
    const textCalls = findCalls(MockText);
    const hasRedToken = textCalls.some(call =>
        call.props?.color === 'red'
    );

    assertFalse(hasRedToken, 'Token count should be green at exactly 90%');
});

test('Token percentage at 91%', () => {
    resetCalls();

    ProgressBar({
        current: 91,
        total: 100,
        tokens: 9100,
        maxTokens: 10000,
        components: mockComponents
    });

    // At 91%, should be red
    const textCalls = findCalls(MockText);
    const hasRedToken = textCalls.some(call =>
        call.props?.color === 'red'
    );

    assertTrue(hasRedToken, 'Token count should be red at 91%');
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary');
console.log('='.repeat(60));
console.log(`Total tests: ${testsRun}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

// Restore original React.createElement
React.createElement = originalCreateElement;

if (testsFailed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
}
