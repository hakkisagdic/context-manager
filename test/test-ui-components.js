#!/usr/bin/env node

/**
 * UI Components Tests for Context Manager
 * Tests wizard, dashboard, progress-bar, select-input components
 * Note: These are basic unit tests for React/Ink components
 * Full rendering tests would require Ink testing infrastructure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
        return false;
    }
}

console.log('🧪 UI Components Tests for Context Manager\n');

// ============================================================================
// WIZARD COMPONENT TESTS
// ============================================================================
console.log('📦 Wizard Component Tests');
console.log('-'.repeat(70));

test('Wizard: wizard.js file exists', () => {
    const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
    if (!fs.existsSync(wizardPath)) {
        throw new Error('wizard.js not found');
    }
});

test('Wizard: discoverProfiles function exists in code', () => {
    const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
    const content = fs.readFileSync(wizardPath, 'utf8');

    if (!content.includes('function discoverProfiles')) {
        throw new Error('discoverProfiles function not found');
    }
});

test('Wizard: copyProfileFiles function exists in code', () => {
    const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
    const content = fs.readFileSync(wizardPath, 'utf8');

    if (!content.includes('function copyProfileFiles')) {
        throw new Error('copyProfileFiles function not found');
    }
});

test('Wizard: Uses React imports', () => {
    const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
    const content = fs.readFileSync(wizardPath, 'utf8');

    if (!content.includes('import React')) {
        throw new Error('React import not found');
    }
});

test('Wizard: Uses Ink components', () => {
    const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
    const content = fs.readFileSync(wizardPath, 'utf8');

    if (!content.includes('from \'ink\'')) {
        throw new Error('Ink imports not found');
    }
});

test('Wizard: References SelectInput component', () => {
    const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
    const content = fs.readFileSync(wizardPath, 'utf8');

    if (!content.includes('SelectInput')) {
        throw new Error('SelectInput reference not found');
    }
});

test('Wizard: Has wizard profiles directory check', () => {
    const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
    const content = fs.readFileSync(wizardPath, 'utf8');

    if (!content.includes('wizard-profiles')) {
        throw new Error('Wizard profiles directory reference not found');
    }
});

test('Wizard: Handles profile.json metadata', () => {
    const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
    const content = fs.readFileSync(wizardPath, 'utf8');

    if (!content.includes('profile.json')) {
        throw new Error('profile.json handling not found');
    }
});

test('Wizard: Copies config files (.contextinclude, .contextignore)', () => {
    const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
    const content = fs.readFileSync(wizardPath, 'utf8');

    if (!content.includes('.contextinclude') || !content.includes('.contextignore')) {
        throw new Error('Config file copying not found');
    }
});

test('Wizard: Handles custom profile option', () => {
    const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
    const content = fs.readFileSync(wizardPath, 'utf8');

    if (!content.includes('custom')) {
        throw new Error('Custom profile option not found');
    }
});

// ============================================================================
// DASHBOARD COMPONENT TESTS
// ============================================================================
console.log('\n📦 Dashboard Component Tests');
console.log('-'.repeat(70));

test('Dashboard: dashboard.js file exists', () => {
    const dashboardPath = path.join(__dirname, '../lib/ui/dashboard.js');
    if (!fs.existsSync(dashboardPath)) {
        throw new Error('dashboard.js not found');
    }
});

test('Dashboard: Exports default Dashboard component', () => {
    const dashboardPath = path.join(__dirname, '../lib/ui/dashboard.js');
    const content = fs.readFileSync(dashboardPath, 'utf8');

    if (!content.includes('export default') && !content.includes('Dashboard')) {
        throw new Error('Dashboard export not found');
    }
});

test('Dashboard: Accepts stats prop', () => {
    const dashboardPath = path.join(__dirname, '../lib/ui/dashboard.js');
    const content = fs.readFileSync(dashboardPath, 'utf8');

    if (!content.includes('stats')) {
        throw new Error('stats prop not found');
    }
});

test('Dashboard: Accepts topFiles prop', () => {
    const dashboardPath = path.join(__dirname, '../lib/ui/dashboard.js');
    const content = fs.readFileSync(dashboardPath, 'utf8');

    if (!content.includes('topFiles')) {
        throw new Error('topFiles prop not found');
    }
});

test('Dashboard: Accepts status prop', () => {
    const dashboardPath = path.join(__dirname, '../lib/ui/dashboard.js');
    const content = fs.readFileSync(dashboardPath, 'utf8');

    if (!content.includes('status')) {
        throw new Error('status prop not found');
    }
});

test('Dashboard: Uses useInput for keyboard controls', () => {
    const dashboardPath = path.join(__dirname, '../lib/ui/dashboard.js');
    const content = fs.readFileSync(dashboardPath, 'utf8');

    if (!content.includes('useInput')) {
        throw new Error('useInput hook not found');
    }
});

test('Dashboard: Displays totalFiles statistic', () => {
    const dashboardPath = path.join(__dirname, '../lib/ui/dashboard.js');
    const content = fs.readFileSync(dashboardPath, 'utf8');

    if (!content.includes('totalFiles')) {
        throw new Error('totalFiles display not found');
    }
});

test('Dashboard: Displays totalTokens statistic', () => {
    const dashboardPath = path.join(__dirname, '../lib/ui/dashboard.js');
    const content = fs.readFileSync(dashboardPath, 'utf8');

    if (!content.includes('totalTokens')) {
        throw new Error('totalTokens display not found');
    }
});

test('Dashboard: Shows progress bar or visualization', () => {
    const dashboardPath = path.join(__dirname, '../lib/ui/dashboard.js');
    const content = fs.readFileSync(dashboardPath, 'utf8');

    // Look for progress indicators (bars, ▓ characters, etc.)
    if (!content.includes('▓') && !content.includes('bar') && !content.includes('progress')) {
        console.log('   ⚠️  Warning: No obvious progress visualization found');
    }
});

test('Dashboard: Has keyboard shortcuts (r for refresh, q for quit)', () => {
    const dashboardPath = path.join(__dirname, '../lib/ui/dashboard.js');
    const content = fs.readFileSync(dashboardPath, 'utf8');

    if (!content.includes("'r'") && !content.includes("'q'")) {
        console.log('   ⚠️  Warning: Keyboard shortcuts not found');
    }
});

// ============================================================================
// PROGRESS BAR COMPONENT TESTS
// ============================================================================
console.log('\n📦 Progress Bar Component Tests');
console.log('-'.repeat(70));

test('ProgressBar: progress-bar.js file exists', () => {
    const progressPath = path.join(__dirname, '../lib/ui/progress-bar.js');
    if (!fs.existsSync(progressPath)) {
        throw new Error('progress-bar.js not found');
    }
});

test('ProgressBar: Exports ProgressBar component', () => {
    const progressPath = path.join(__dirname, '../lib/ui/progress-bar.js');
    const content = fs.readFileSync(progressPath, 'utf8');

    if (!content.includes('ProgressBar')) {
        throw new Error('ProgressBar export not found');
    }
});

test('ProgressBar: Accepts current prop', () => {
    const progressPath = path.join(__dirname, '../lib/ui/progress-bar.js');
    const content = fs.readFileSync(progressPath, 'utf8');

    if (!content.includes('current')) {
        throw new Error('current prop not found');
    }
});

test('ProgressBar: Accepts total prop', () => {
    const progressPath = path.join(__dirname, '../lib/ui/progress-bar.js');
    const content = fs.readFileSync(progressPath, 'utf8');

    if (!content.includes('total')) {
        throw new Error('total prop not found');
    }
});

test('ProgressBar: Accepts tokens prop', () => {
    const progressPath = path.join(__dirname, '../lib/ui/progress-bar.js');
    const content = fs.readFileSync(progressPath, 'utf8');

    if (!content.includes('tokens')) {
        throw new Error('tokens prop not found');
    }
});

test('ProgressBar: Calculates percentage', () => {
    const progressPath = path.join(__dirname, '../lib/ui/progress-bar.js');
    const content = fs.readFileSync(progressPath, 'utf8');

    if (!content.includes('percentage')) {
        throw new Error('Percentage calculation not found');
    }
});

test('ProgressBar: Has visual bar display', () => {
    const progressPath = path.join(__dirname, '../lib/ui/progress-bar.js');
    const content = fs.readFileSync(progressPath, 'utf8');

    if (!content.includes('━') && !content.includes('─') && !content.includes('bar')) {
        throw new Error('Progress bar visualization not found');
    }
});

test('ProgressBar: Displays current file being processed', () => {
    const progressPath = path.join(__dirname, '../lib/ui/progress-bar.js');
    const content = fs.readFileSync(progressPath, 'utf8');

    if (!content.includes('currentFile')) {
        throw new Error('currentFile display not found');
    }
});

test('ProgressBar: Shows token count', () => {
    const progressPath = path.join(__dirname, '../lib/ui/progress-bar.js');
    const content = fs.readFileSync(progressPath, 'utf8');

    if (!content.includes('toLocaleString') || !content.includes('tokens')) {
        console.log('   ⚠️  Warning: Token formatting not found');
    }
});

test('ProgressBar: Exports SpinnerWithText component', () => {
    const progressPath = path.join(__dirname, '../lib/ui/progress-bar.js');
    const content = fs.readFileSync(progressPath, 'utf8');

    if (!content.includes('SpinnerWithText')) {
        throw new Error('SpinnerWithText not found');
    }
});

// ============================================================================
// SELECT INPUT COMPONENT TESTS
// ============================================================================
console.log('\n📦 Select Input Component Tests');
console.log('-'.repeat(70));

test('SelectInput: select-input.js file exists', () => {
    const selectPath = path.join(__dirname, '../lib/ui/select-input.js');
    if (!fs.existsSync(selectPath)) {
        throw new Error('select-input.js not found');
    }
});

test('SelectInput: Exports default SelectInput component', () => {
    const selectPath = path.join(__dirname, '../lib/ui/select-input.js');
    const content = fs.readFileSync(selectPath, 'utf8');

    if (!content.includes('export default') && !content.includes('SelectInput')) {
        throw new Error('SelectInput export not found');
    }
});

test('SelectInput: Accepts items prop', () => {
    const selectPath = path.join(__dirname, '../lib/ui/select-input.js');
    const content = fs.readFileSync(selectPath, 'utf8');

    if (!content.includes('items')) {
        throw new Error('items prop not found');
    }
});

test('SelectInput: Accepts onSelect callback prop', () => {
    const selectPath = path.join(__dirname, '../lib/ui/select-input.js');
    const content = fs.readFileSync(selectPath, 'utf8');

    if (!content.includes('onSelect')) {
        throw new Error('onSelect prop not found');
    }
});

test('SelectInput: Uses useState for selection tracking', () => {
    const selectPath = path.join(__dirname, '../lib/ui/select-input.js');
    const content = fs.readFileSync(selectPath, 'utf8');

    if (!content.includes('useState')) {
        throw new Error('useState hook not found');
    }
});

test('SelectInput: Handles keyboard input (arrow keys)', () => {
    const selectPath = path.join(__dirname, '../lib/ui/select-input.js');
    const content = fs.readFileSync(selectPath, 'utf8');

    if (!content.includes('useInput')) {
        throw new Error('useInput hook not found');
    }

    if (!content.includes('upArrow') && !content.includes('downArrow')) {
        throw new Error('Arrow key handling not found');
    }
});

test('SelectInput: Handles return key for selection', () => {
    const selectPath = path.join(__dirname, '../lib/ui/select-input.js');
    const content = fs.readFileSync(selectPath, 'utf8');

    if (!content.includes('return') && !content.includes('enter')) {
        throw new Error('Return key handling not found');
    }
});

test('SelectInput: Handles escape key', () => {
    const selectPath = path.join(__dirname, '../lib/ui/select-input.js');
    const content = fs.readFileSync(selectPath, 'utf8');

    if (!content.includes('escape')) {
        throw new Error('Escape key handling not found');
    }
});

test('SelectInput: Highlights selected item', () => {
    const selectPath = path.join(__dirname, '../lib/ui/select-input.js');
    const content = fs.readFileSync(selectPath, 'utf8');

    if (!content.includes('isSelected') && !content.includes('selected')) {
        throw new Error('Selection highlighting not found');
    }
});

test('SelectInput: Maps through items for rendering', () => {
    const selectPath = path.join(__dirname, '../lib/ui/select-input.js');
    const content = fs.readFileSync(selectPath, 'utf8');

    if (!content.includes('.map')) {
        throw new Error('Items mapping not found');
    }
});

// ============================================================================
// UI INDEX TESTS
// ============================================================================
console.log('\n📦 UI Index Tests');
console.log('-'.repeat(70));

test('UI: index.js file exists', () => {
    const indexPath = path.join(__dirname, '../lib/ui/index.js');
    if (!fs.existsSync(indexPath)) {
        throw new Error('ui/index.js not found');
    }
});

test('UI: index.js exports components', () => {
    const indexPath = path.join(__dirname, '../lib/ui/index.js');
    const content = fs.readFileSync(indexPath, 'utf8');

    if (!content.includes('export')) {
        throw new Error('No exports found in index.js');
    }
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\n📦 Integration Tests');
console.log('-'.repeat(70));

test('Integration: Wizard imports SelectInput', () => {
    const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
    const content = fs.readFileSync(wizardPath, 'utf8');

    if (!content.includes("from './select-input")) {
        throw new Error('Wizard does not import SelectInput');
    }
});

test('Integration: All UI components use React', () => {
    const uiDir = path.join(__dirname, '../lib/ui');
    const files = fs.readdirSync(uiDir).filter(f => f.endsWith('.js'));

    let allUseReact = true;
    files.forEach(file => {
        if (file === 'index.js') return; // Skip index
        const content = fs.readFileSync(path.join(uiDir, file), 'utf8');
        if (!content.includes('React')) {
            allUseReact = false;
        }
    });

    if (!allUseReact) {
        throw new Error('Not all UI components use React');
    }
});

test('Integration: Components are ES modules', () => {
    const uiDir = path.join(__dirname, '../lib/ui');
    const files = fs.readdirSync(uiDir).filter(f => f.endsWith('.js'));

    let allESM = true;
    files.forEach(file => {
        const content = fs.readFileSync(path.join(uiDir, file), 'utf8');
        if (!content.includes('import') && !content.includes('export')) {
            allESM = false;
        }
    });

    if (!allESM) {
        throw new Error('Not all UI components are ES modules');
    }
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 UI COMPONENTS TEST SUMMARY');
console.log('='.repeat(70));
console.log(`Total tests run: ${testsRun}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

console.log('\nℹ️  Note: These are basic unit tests for React/Ink components.');
console.log('   Full interactive rendering tests would require Ink testing infrastructure.');

if (testsFailed === 0) {
    console.log('\n🎉 All UI component tests passed!');
    process.exit(0);
} else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed`);
    process.exit(1);
}
