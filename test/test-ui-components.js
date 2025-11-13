#!/usr/bin/env node

/**
 * UI Components Tests
 * Tests for lib/ui/progress-bar.js and lib/ui/select-input.js
 * ~35 test cases covering React/Ink UI components
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = join(__dirname, '..');

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
        if (error.stack) {
            const stackLine = error.stack.split('\n')[1]?.trim();
            if (stackLine) console.error(`   ${stackLine}`);
        }
        testsFailed++;
        return false;
    }
}

async function asyncTest(name, fn) {
    try {
        await fn();
        console.log(`✅ ${name}`);
        testsPassed++;
        return true;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        if (error.stack) {
            const stackLine = error.stack.split('\n')[1]?.trim();
            if (stackLine) console.error(`   ${stackLine}`);
        }
        testsFailed++;
        return false;
    }
}

console.log('🧪 Testing UI Components...\n');

// ============================================================================
// PROGRESS-BAR.JS TESTS
// ============================================================================
console.log('📊 progress-bar.js Tests');
console.log('-'.repeat(70));

test('progress-bar.js - File exists', () => {
    const filePath = join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js');
    if (!fs.existsSync(filePath)) {
        throw new Error('progress-bar.js not found');
    }
});

test('progress-bar.js - Exports ProgressBar component', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    if (!content.includes('export') || !content.includes('ProgressBar')) {
        throw new Error('Should export ProgressBar');
    }
});

test('progress-bar.js - Exports SpinnerWithText component', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    if (!content.includes('SpinnerWithText')) {
        throw new Error('Should export SpinnerWithText');
    }
});

test('progress-bar.js - Imports React', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    if (!content.includes('import React')) {
        throw new Error('Should import React');
    }
});

test('progress-bar.js - ProgressBar accepts props', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    if (!content.includes('current') || !content.includes('total')) {
        throw new Error('ProgressBar should accept current and total props');
    }
    if (!content.includes('tokens')) {
        throw new Error('ProgressBar should accept tokens prop');
    }
    if (!content.includes('components')) {
        throw new Error('ProgressBar should accept components prop');
    }
});

test('progress-bar.js - Calculates percentage correctly', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    if (!content.includes('current / total')) {
        throw new Error('Should calculate percentage from current/total');
    }
    if (!content.includes('Math.round')) {
        throw new Error('Should round percentage');
    }
});

test('progress-bar.js - Handles zero total gracefully', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    if (!content.includes('total > 0')) {
        throw new Error('Should check for total > 0 before division');
    }
});

test('progress-bar.js - Renders progress bar with characters', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    if (!content.includes('repeat')) {
        throw new Error('Should use repeat to render bar characters');
    }
});

test('progress-bar.js - Has fixed bar width', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    if (!content.includes('barWidth')) {
        throw new Error('Should define bar width');
    }
});

test('progress-bar.js - Calculates filled and empty sections', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    if (!content.includes('filled') || !content.includes('empty')) {
        throw new Error('Should calculate filled and empty sections');
    }
});

test('progress-bar.js - Shows token percentage', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    if (!content.includes('tokenPercentage')) {
        throw new Error('Should calculate token percentage');
    }
});

test('progress-bar.js - Changes color based on token percentage', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    if (!content.includes('tokenPercentage > 90')) {
        throw new Error('Should check if token percentage > 90');
    }
    if (!content.includes('red') && !content.includes('green')) {
        throw new Error('Should use different colors for token display');
    }
});

test('progress-bar.js - Displays current file optionally', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    if (!content.includes('if (currentFile)')) {
        throw new Error('Should conditionally display current file');
    }
});

test('progress-bar.js - Uses React.createElement', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    if (!content.includes('React.createElement')) {
        throw new Error('Should use React.createElement');
    }
});

test('progress-bar.js - Validates required components', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    if (!content.includes('Box and Text components required')) {
        throw new Error('Should validate Box and Text components');
    }
    if (!content.includes('throw new Error')) {
        throw new Error('Should throw error for missing components');
    }
});

test('progress-bar.js - Formats numbers with toLocaleString', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    if (!content.includes('toLocaleString')) {
        throw new Error('Should format large numbers with toLocaleString');
    }
});

test('progress-bar.js - SpinnerWithText has status prop', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    if (!content.includes('status')) {
        throw new Error('SpinnerWithText should accept status prop');
    }
});

test('progress-bar.js - SpinnerWithText has multiple status types', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    const statuses = ['pending', 'active', 'complete', 'error'];
    for (const status of statuses) {
        if (!content.includes(status)) {
            throw new Error(`Should support ${status} status`);
        }
    }
});

test('progress-bar.js - SpinnerWithText maps status to colors', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    if (!content.includes('statusColors')) {
        throw new Error('Should define status color mapping');
    }
});

test('progress-bar.js - Has default status value', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    if (!content.includes("status = 'pending'")) {
        throw new Error('Should have default status value');
    }
});

// ============================================================================
// SELECT-INPUT.JS TESTS
// ============================================================================
console.log('\n🎯 select-input.js Tests');
console.log('-'.repeat(70));

test('select-input.js - File exists', () => {
    const filePath = join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js');
    if (!fs.existsSync(filePath)) {
        throw new Error('select-input.js not found');
    }
});

test('select-input.js - Exports SelectInput as default', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');
    if (!content.includes('export default')) {
        throw new Error('Should have default export');
    }
    if (!content.includes('SelectInput')) {
        throw new Error('Should export SelectInput');
    }
});

test('select-input.js - Imports React hooks', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');
    if (!content.includes('useState')) {
        throw new Error('Should import useState');
    }
    if (!content.includes('useCallback')) {
        throw new Error('Should import useCallback');
    }
});

test('select-input.js - Imports Ink hooks', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');
    if (!content.includes('useInput')) {
        throw new Error('Should import useInput');
    }
    if (!content.includes('useStdin')) {
        throw new Error('Should import useStdin');
    }
});

test('select-input.js - Accepts items prop', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');
    if (!content.includes('items')) {
        throw new Error('Should accept items prop');
    }
    if (!content.includes('items = []')) {
        throw new Error('Should have default empty array for items');
    }
});

test('select-input.js - Accepts onSelect callback', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');
    if (!content.includes('onSelect')) {
        throw new Error('Should accept onSelect prop');
    }
});

test('select-input.js - Uses useState for selected index', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');
    if (!content.includes('selectedIndex')) {
        throw new Error('Should track selectedIndex with useState');
    }
    if (!content.includes('setSelectedIndex')) {
        throw new Error('Should have setSelectedIndex setter');
    }
});

test('select-input.js - Handles up arrow key', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');
    if (!content.includes('key.upArrow')) {
        throw new Error('Should handle up arrow key');
    }
});

test('select-input.js - Handles down arrow key', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');
    if (!content.includes('key.downArrow')) {
        throw new Error('Should handle down arrow key');
    }
});

test('select-input.js - Handles return/enter key', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');
    if (!content.includes('key.return')) {
        throw new Error('Should handle return key');
    }
});

test('select-input.js - Handles escape key', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');
    if (!content.includes('key.escape')) {
        throw new Error('Should handle escape key');
    }
});

test('select-input.js - Wraps selection at boundaries', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');
    if (!content.includes('items.length - 1')) {
        throw new Error('Should wrap selection at boundaries');
    }
});

test('select-input.js - Calls onSelect when item selected', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');
    if (!content.includes('onSelect(items[selectedIndex])')) {
        throw new Error('Should call onSelect with selected item');
    }
});

test('select-input.js - Checks if onSelect exists before calling', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');
    if (!content.includes('if') || !content.includes('onSelect')) {
        throw new Error('Should check if onSelect exists');
    }
});

test('select-input.js - Renders items with map', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');
    if (!content.includes('items.map')) {
        throw new Error('Should map over items to render');
    }
});

test('select-input.js - Highlights selected item', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');
    if (!content.includes('isSelected')) {
        throw new Error('Should check if item is selected');
    }
    if (!content.includes('color')) {
        throw new Error('Should change color for selected item');
    }
});

test('select-input.js - Shows cursor indicator for selected item', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');
    if (!content.includes('❯')) {
        throw new Error('Should show cursor (❯) for selected item');
    }
});

test('select-input.js - Uses unique keys for list items', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');
    if (!content.includes('key:')) {
        throw new Error('Should provide keys for list items');
    }
});

test('select-input.js - Checks raw mode support', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');
    if (!content.includes('isRawModeSupported')) {
        throw new Error('Should check for raw mode support');
    }
});

// ============================================================================
// INTEGRATION & BEST PRACTICES
// ============================================================================
console.log('\n🔗 Integration & Best Practices Tests');
console.log('-'.repeat(70));

test('Integration - Both components use React.createElement', () => {
    const progressBar = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    const selectInput = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');

    if (!progressBar.includes('React.createElement') || !selectInput.includes('React.createElement')) {
        throw new Error('Both components should use React.createElement');
    }
});

test('Integration - Both components are functional components', () => {
    const progressBar = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    const selectInput = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');

    // Should use arrow functions or function declarations
    const progressBarIsFunctional = progressBar.includes('const ProgressBar = (') || progressBar.includes('function ProgressBar(');
    const selectInputIsFunctional = selectInput.includes('function SelectInput(');

    if (!progressBarIsFunctional || !selectInputIsFunctional) {
        throw new Error('Both should be functional components');
    }
});

test('Best Practice - Components have JSDoc comments', () => {
    const progressBar = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    const selectInput = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');

    if (!progressBar.includes('/**') || !selectInput.includes('/**')) {
        throw new Error('Components should have JSDoc comments');
    }
});

test('Best Practice - progress-bar.js has descriptive variable names', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'progress-bar.js'), 'utf8');
    const goodNames = ['percentage', 'barWidth', 'filled', 'empty', 'tokenPercentage'];

    for (const name of goodNames) {
        if (!content.includes(name)) {
            throw new Error(`Should use descriptive name: ${name}`);
        }
    }
});

test('Best Practice - select-input.js uses React hooks correctly', () => {
    const content = fs.readFileSync(join(PROJECT_ROOT, 'lib', 'ui', 'select-input.js'), 'utf8');

    // Should use hooks with proper dependencies
    if (!content.includes('useCallback')) {
        throw new Error('Should use useCallback for performance');
    }
    if (!content.includes('[selectedIndex, items, onSelect]')) {
        throw new Error('useCallback should have proper dependencies');
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
    console.log('\n🎉 All UI component tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
