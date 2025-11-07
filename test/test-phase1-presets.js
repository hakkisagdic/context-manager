#!/usr/bin/env node

/**
 * Unit Tests for Preset System (v3.1.0)
 * Tests PresetManager functionality
 */

import { PresetManager, PresetNotFoundError, InvalidPresetError } from '../index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

console.log('🧪 Testing Preset System (v3.1.0)...\n');

// ============================================================================
// PRESET MANAGER INSTANTIATION
// ============================================================================
console.log('📦 PresetManager Instantiation');
console.log('-'.repeat(60));

test('PresetManager instance creation', () => {
    const manager = new PresetManager();
    assertTrue(manager instanceof PresetManager, 'Should create PresetManager instance');
    assertTrue(typeof manager.loadPresets === 'function', 'Should have loadPresets method');
    assertTrue(typeof manager.getPreset === 'function', 'Should have getPreset method');
    assertTrue(typeof manager.applyPreset === 'function', 'Should have applyPreset method');
});

test('PresetManager with custom path', () => {
    const customPath = path.join(__dirname, '../lib/presets/presets.json');
    const manager = new PresetManager(customPath);
    assertEquals(manager.presetsPath, customPath, 'Should use custom path');
});

// ============================================================================
// PRESET LOADING
// ============================================================================
console.log('\n📋 Preset Loading');
console.log('-'.repeat(60));

test('Load presets from file', () => {
    const manager = new PresetManager();
    const presets = manager.loadPresets();
    assertTrue(Array.isArray(presets), 'Should return array of presets');
    assertTrue(presets.length > 0, 'Should load at least one preset');
});

test('Load presets returns 8 default presets', () => {
    const manager = new PresetManager();
    const presets = manager.loadPresets();
    assertEquals(presets.length, 8, 'Should load exactly 8 presets');
});

test('Loaded presets have required fields', () => {
    const manager = new PresetManager();
    const presets = manager.loadPresets();
    
    presets.forEach(preset => {
        assertTrue(preset.id, 'Preset should have id');
        assertTrue(preset.name, 'Preset should have name');
        assertTrue(preset.description, 'Preset should have description');
        assertTrue(preset.filters, 'Preset should have filters');
        assertTrue(preset.options, 'Preset should have options');
    });
});

test('Presets are cached after first load', () => {
    const manager = new PresetManager();
    const presets1 = manager.loadPresets();
    const presets2 = manager.loadPresets();
    assertEquals(presets1.length, presets2.length, 'Should return same presets');
    assertTrue(manager.loaded, 'Should mark as loaded');
});

// ============================================================================
// PRESET RETRIEVAL
// ============================================================================
console.log('\n🔍 Preset Retrieval');
console.log('-'.repeat(60));

test('Get preset by ID', () => {
    const manager = new PresetManager();
    const preset = manager.getPreset('default');
    assertTrue(preset !== null, 'Should find default preset');
    assertEquals(preset.id, 'default', 'Should return correct preset');
});

test('Get preset by name (case-insensitive)', () => {
    const manager = new PresetManager();
    const preset = manager.getPreset('Review');
    assertTrue(preset !== null, 'Should find preset by name');
    assertEquals(preset.id, 'review', 'Should return review preset');
});

test('Get non-existent preset returns null', () => {
    const manager = new PresetManager();
    const preset = manager.getPreset('non-existent');
    assertEquals(preset, null, 'Should return null for non-existent preset');
});

test('List all presets', () => {
    const manager = new PresetManager();
    const list = manager.listPresets();
    assertTrue(Array.isArray(list), 'Should return array');
    assertEquals(list.length, 8, 'Should list all 8 presets');
    
    list.forEach(item => {
        assertTrue(item.id, 'List item should have id');
        assertTrue(item.name, 'List item should have name');
        assertTrue(item.description, 'List item should have description');
    });
});

test('Get preset info', () => {
    const manager = new PresetManager();
    const info = manager.getPresetInfo('review');
    assertTrue(info !== null, 'Should return preset info');
    assertEquals(info.id, 'review', 'Should return correct preset');
    assertTrue(info.filters, 'Should include filters');
    assertTrue(info.options, 'Should include options');
});

// ============================================================================
// PRESET VALIDATION
// ============================================================================
console.log('\n✅ Preset Validation');
console.log('-'.repeat(60));

test('Validate preset with all required fields', () => {
    const manager = new PresetManager();
    const validPreset = {
        id: 'test',
        name: 'Test Preset',
        description: 'Test description',
        filters: {},
        options: {}
    };
    
    // Should not throw
    manager.validatePreset(validPreset);
    assertTrue(true, 'Should validate correct preset');
});

test('Validate preset throws on missing id', () => {
    const manager = new PresetManager();
    const invalidPreset = {
        name: 'Test',
        description: 'Test',
        filters: {},
        options: {}
    };
    
    assertThrows(
        () => manager.validatePreset(invalidPreset),
        InvalidPresetError,
        'Should throw on missing id'
    );
});

test('Validate preset throws on missing name', () => {
    const manager = new PresetManager();
    const invalidPreset = {
        id: 'test',
        description: 'Test',
        filters: {},
        options: {}
    };
    
    assertThrows(
        () => manager.validatePreset(invalidPreset),
        InvalidPresetError,
        'Should throw on missing name'
    );
});

test('Validate preset throws on missing filters', () => {
    const manager = new PresetManager();
    const invalidPreset = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        options: {}
    };
    
    assertThrows(
        () => manager.validatePreset(invalidPreset),
        InvalidPresetError,
        'Should throw on missing filters'
    );
});

// ============================================================================
// PRESET APPLICATION
// ============================================================================
console.log('\n🎯 Preset Application');
console.log('-'.repeat(60));

test('Apply preset creates temporary files', () => {
    const manager = new PresetManager();
    const testDir = path.join(__dirname, 'fixtures', 'preset-test');
    
    // Create test directory
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }
    
    try {
        const applied = manager.applyPreset('minimal', testDir);
        
        assertTrue(applied.presetId === 'minimal', 'Should return preset ID');
        assertTrue(Array.isArray(applied.tempFiles), 'Should return temp files array');
        assertTrue(applied.options, 'Should return options');
        
        // Cleanup
        manager.cleanup(applied);
        
        // Remove test directory
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    } catch (error) {
        // Cleanup on error
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
        throw error;
    }
});

test('Apply non-existent preset throws error', () => {
    const manager = new PresetManager();
    const testDir = path.join(__dirname, 'fixtures', 'preset-test');
    
    assertThrows(
        () => manager.applyPreset('non-existent', testDir),
        PresetNotFoundError,
        'Should throw PresetNotFoundError'
    );
});

test('Applied preset includes options', () => {
    const manager = new PresetManager();
    const testDir = path.join(__dirname, 'fixtures', 'preset-test');
    
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }
    
    try {
        const applied = manager.applyPreset('review', testDir);
        
        assertTrue(applied.options, 'Should have options');
        assertTrue(typeof applied.options.methodLevel !== 'undefined', 'Should have methodLevel option');
        
        manager.cleanup(applied);
        
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    } catch (error) {
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
        throw error;
    }
});

// ============================================================================
// PRESET CLEANUP
// ============================================================================
console.log('\n🧹 Preset Cleanup');
console.log('-'.repeat(60));

test('Cleanup removes temporary files', () => {
    const manager = new PresetManager();
    const testDir = path.join(__dirname, 'fixtures', 'preset-test');
    
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }
    
    try {
        const applied = manager.applyPreset('minimal', testDir);
        const tempFiles = applied.tempFiles;
        
        // Verify files exist
        tempFiles.forEach(file => {
            assertTrue(fs.existsSync(file), `Temp file should exist: ${file}`);
        });
        
        // Cleanup
        manager.cleanup(applied);
        
        // Verify files are removed
        tempFiles.forEach(file => {
            assertFalse(fs.existsSync(file), `Temp file should be removed: ${file}`);
        });
        
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    } catch (error) {
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
        throw error;
    }
});

test('Cleanup handles null applied preset', () => {
    const manager = new PresetManager();
    
    // Should not throw
    manager.cleanup(null);
    assertTrue(true, 'Should handle null gracefully');
});

// ============================================================================
// SPECIFIC PRESET TESTS
// ============================================================================
console.log('\n🎨 Specific Preset Tests');
console.log('-'.repeat(60));

test('Default preset has correct structure', () => {
    const manager = new PresetManager();
    const preset = manager.getPreset('default');
    
    assertEquals(preset.id, 'default', 'Should have correct ID');
    assertEquals(preset.name, 'Default', 'Should have correct name');
    assertTrue(preset.filters.exclude, 'Should have exclude filters');
    assertTrue(preset.options, 'Should have options');
});

test('Review preset has method-level enabled', () => {
    const manager = new PresetManager();
    const preset = manager.getPreset('review');
    
    assertEquals(preset.options.methodLevel, true, 'Should enable method-level');
    assertEquals(preset.options.gitingest, true, 'Should enable gitingest');
});

test('LLM-explain preset has token budget', () => {
    const manager = new PresetManager();
    const preset = manager.getPreset('llm-explain');
    
    assertTrue(preset.options.targetTokens, 'Should have target tokens');
    assertTrue(preset.options.fitStrategy, 'Should have fit strategy');
});

test('Security-audit preset has security patterns', () => {
    const manager = new PresetManager();
    const preset = manager.getPreset('security-audit');
    
    assertTrue(preset.filters.include, 'Should have include filters');
    assertTrue(preset.filters.methodInclude, 'Should have method include filters');
    
    // Check for security-related patterns
    const hasSecurityPatterns = preset.filters.include.some(pattern => 
        pattern.includes('auth') || pattern.includes('security') || pattern.includes('crypto')
    );
    assertTrue(hasSecurityPatterns, 'Should have security-related patterns');
});

test('Minimal preset has entry points only', () => {
    const manager = new PresetManager();
    const preset = manager.getPreset('minimal');
    
    assertTrue(preset.filters.include, 'Should have include filters');
    assertTrue(preset.options.targetTokens, 'Should have token budget');
    
    // Check for entry point patterns
    const hasEntryPoints = preset.filters.include.some(pattern => 
        pattern.includes('index') || pattern.includes('main')
    );
    assertTrue(hasEntryPoints, 'Should include entry point patterns');
});

// ============================================================================
// ERROR HANDLING
// ============================================================================
console.log('\n❌ Error Handling');
console.log('-'.repeat(60));

test('PresetNotFoundError has correct properties', () => {
    const error = new PresetNotFoundError('test-preset');
    assertEquals(error.name, 'PresetNotFoundError', 'Should have correct name');
    assertEquals(error.presetName, 'test-preset', 'Should store preset name');
    assertTrue(error.message.includes('test-preset'), 'Should include preset name in message');
});

test('InvalidPresetError has correct properties', () => {
    const error = new InvalidPresetError('test-preset', 'missing field');
    assertEquals(error.name, 'InvalidPresetError', 'Should have correct name');
    assertEquals(error.presetName, 'test-preset', 'Should store preset name');
    assertEquals(error.reason, 'missing field', 'Should store reason');
    assertTrue(error.message.includes('test-preset'), 'Should include preset name in message');
    assertTrue(error.message.includes('missing field'), 'Should include reason in message');
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

if (testsFailed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
}
