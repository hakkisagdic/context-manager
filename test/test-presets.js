#!/usr/bin/env node

/**
 * Preset System Tests
 * Tests for preset manager and CLI integration
 */

const PresetManager = require('../lib/presets/preset-manager');
const assert = require('assert');

console.log('🧪 Running Preset System Tests...\n');

let passedTests = 0;
let totalTests = 0;

function test(description, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`✅ ${description}`);
    } catch (error) {
        console.error(`❌ ${description}`);
        console.error(`   Error: ${error.message}`);
    }
}

// Test 1: PresetManager loads presets
test('PresetManager loads presets from JSON', () => {
    const manager = new PresetManager();
    const presets = manager.listPresets();
    assert(presets.length > 0, 'Should load at least one preset');
    assert(presets.some(p => p.name === 'default'), 'Should include default preset');
    assert(presets.some(p => p.name === 'llm-explain'), 'Should include llm-explain preset');
});

// Test 2: Get preset by name
test('Get preset by name returns correct configuration', () => {
    const manager = new PresetManager();
    const preset = manager.getPreset('review');
    assert(preset !== null, 'Should return preset');
    assert(preset.name === 'Code Review', 'Should have correct name');
    assert(preset.options.methodLevel === true, 'Should have method level enabled');
});

// Test 3: Check preset exists
test('hasPreset returns true for existing presets', () => {
    const manager = new PresetManager();
    assert(manager.hasPreset('default'), 'Should find default preset');
    assert(manager.hasPreset('llm-explain'), 'Should find llm-explain preset');
    assert(!manager.hasPreset('nonexistent'), 'Should not find nonexistent preset');
});

// Test 4: Apply preset merges options correctly
test('applyPreset merges user options with preset', () => {
    const manager = new PresetManager();
    const options = manager.applyPreset('review', { verbose: true });
    assert(options.methodLevel === true, 'Should keep preset methodLevel');
    assert(options.verbose === true, 'Should override with user verbose');
    assert(options.preset === 'review', 'Should set preset name');
});

// Test 5: Validate preset configuration
test('validatePreset checks preset structure', () => {
    const manager = new PresetManager();
    const result = manager.validatePreset('default');
    assert(result.valid === true, 'Default preset should be valid');
    assert(result.errors.length === 0, 'Should have no errors');
});

// Test 6: List presets returns all presets
test('listPresets returns all available presets', () => {
    const manager = new PresetManager();
    const presets = manager.listPresets();
    const presetNames = presets.map(p => p.name);
    assert(presetNames.includes('default'), 'Should include default');
    assert(presetNames.includes('review'), 'Should include review');
    assert(presetNames.includes('llm-explain'), 'Should include llm-explain');
    assert(presetNames.includes('security-audit'), 'Should include security-audit');
    assert(presetNames.includes('minimal'), 'Should include minimal');
});

// Test 7: Preset has correct filters
test('Preset filters are correctly structured', () => {
    const manager = new PresetManager();
    const preset = manager.getPreset('llm-explain');
    assert(Array.isArray(preset.filters.exclude), 'Should have exclude array');
    assert(Array.isArray(preset.filters.include), 'Should have include array');
    assert(preset.filters.exclude.length > 0, 'Should have exclude patterns');
    assert(preset.filters.include.length > 0, 'Should have include patterns');
});

// Test 8: Preset has method filters
test('Preset method filters are correctly structured', () => {
    const manager = new PresetManager();
    const preset = manager.getPreset('llm-explain');
    assert(preset.methodFilters !== undefined, 'Should have methodFilters');
    assert(Array.isArray(preset.methodFilters.exclude), 'Should have method exclude array');
    assert(preset.methodFilters.exclude.includes('*test*'), 'Should exclude test methods');
});

// Test 9: Security audit preset has correct patterns
test('Security audit preset has security-focused patterns', () => {
    const manager = new PresetManager();
    const preset = manager.getPreset('security-audit');
    assert(preset.filters.include.some(p => p.includes('auth')), 'Should include auth patterns');
    assert(preset.filters.include.some(p => p.includes('security')), 'Should include security patterns');
    assert(preset.methodFilters.include.some(p => p.includes('auth')), 'Should include auth methods');
});

// Test 10: Minimal preset has strict filters
test('Minimal preset has minimal include patterns', () => {
    const manager = new PresetManager();
    const preset = manager.getPreset('minimal');
    assert(preset.maxTokens === 20000, 'Should have 20k token limit');
    assert(preset.filters.include.length <= 10, 'Should have few include patterns');
    assert(preset.filters.include.includes('index.js'), 'Should include index.js');
});

// Test 11: Full preset has minimal exclusions
test('Full preset excludes only node_modules and .git', () => {
    const manager = new PresetManager();
    const preset = manager.getPreset('full');
    assert(preset.maxTokens === null, 'Should have no token limit');
    assert(preset.filters.exclude.length <= 5, 'Should have few exclusions');
    assert(preset.options.methodLevel === false, 'Should not use method level');
});

// Test 12: Apply nonexistent preset throws error
test('Applying nonexistent preset throws error', () => {
    const manager = new PresetManager();
    let errorThrown = false;
    try {
        manager.applyPreset('nonexistent-preset');
    } catch (error) {
        errorThrown = true;
        assert(error.message.includes('not found'), 'Error should mention preset not found');
    }
    assert(errorThrown, 'Should throw error for nonexistent preset');
});

// Test 13: Preset options override correctly
test('User options override preset options', () => {
    const manager = new PresetManager();
    const preset = manager.getPreset('llm-explain');
    assert(preset.options.verbose === false, 'Preset should have verbose=false');

    const options = manager.applyPreset('llm-explain', { verbose: true });
    assert(options.verbose === true, 'User option should override');
    assert(options.methodLevel === true, 'Preset option should remain');
});

// Test 14: Review preset configuration
test('Review preset has correct configuration', () => {
    const manager = new PresetManager();
    const preset = manager.getPreset('review');
    assert(preset.maxTokens === 100000, 'Should have 100k token limit');
    assert(preset.options.methodLevel === true, 'Should use method level');
    assert(preset.options.gitingest === true, 'Should generate gitingest');
    assert(preset.options.saveReport === true, 'Should save report');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
if (passedTests === totalTests) {
    console.log('🎉 All tests passed!');
    process.exit(0);
} else {
    console.log(`❌ Failed: ${totalTests - passedTests} tests`);
    process.exit(1);
}
