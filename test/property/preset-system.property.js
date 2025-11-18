/**
 * Property-Based Tests for Preset System
 * Tests preset configuration properties from comprehensive-test-validation spec
 */

import fc from 'fast-check';
import { runProperty } from '../helpers/property-test-helpers.js';
import PresetManager from '../../lib/presets/preset-manager.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Property 25: Preset configuration application
 * Feature: comprehensive-test-validation, Property 25: Preset configuration application
 * Validates: Requirements 6.2, 6.5
 * 
 * For any valid preset, loading it should apply all defined configuration settings
 */
export async function testPresetConfigurationApplication() {
    console.log('\n🧪 Property 25: Preset configuration application');
    console.log('   Feature: comprehensive-test-validation, Property 25: Preset configuration application');
    console.log('   Validates: Requirements 6.2, 6.5');
    
    // Generator for valid preset configurations
    const presetGenerator = fc.record({
        id: fc.stringMatching(/^[a-z][a-z0-9-]*$/), // kebab-case id
        name: fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length >= 3),
        description: fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length >= 10),
        icon: fc.option(fc.constantFrom('⚙️', '👀', '💡', '🔒', '📚'), { nil: undefined }),
        filters: fc.record({
            include: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { minLength: 0, maxLength: 5 }), { nil: undefined }),
            exclude: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { minLength: 0, maxLength: 5 }), { nil: undefined }),
            methodInclude: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { minLength: 0, maxLength: 3 }), { nil: undefined }),
            methodExclude: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { minLength: 0, maxLength: 3 }), { nil: undefined })
        }),
        options: fc.record({
            methodLevel: fc.option(fc.boolean(), { nil: undefined }),
            gitingest: fc.option(fc.boolean(), { nil: undefined }),
            sortBy: fc.option(fc.constantFrom('name', 'tokens-desc', 'importance'), { nil: undefined }),
            targetTokens: fc.option(fc.integer({ min: 1000, max: 200000 }), { nil: undefined }),
            fitStrategy: fc.option(fc.constantFrom('auto', 'shrink-docs', 'balanced', 'methods-only', 'top-n'), { nil: undefined })
        }),
        metadata: fc.option(fc.record({
            header: fc.option(fc.string({ minLength: 10, maxLength: 50 }), { nil: undefined }),
            tags: fc.option(fc.array(fc.string({ minLength: 2, maxLength: 15 }), { minLength: 1, maxLength: 5 }), { nil: undefined }),
            bestFor: fc.option(fc.array(fc.string({ minLength: 10, maxLength: 50 }), { minLength: 1, maxLength: 3 }), { nil: undefined })
        }), { nil: undefined })
    });
    
    const property = fc.asyncProperty(
        presetGenerator,
        async (presetConfig) => {
            // Create a temporary directory for testing
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'preset-test-'));
            
            try {
                // Debug: log the preset config
                // console.log('Testing preset:', JSON.stringify(presetConfig, null, 2));
                // Create a temporary presets.json file with our generated preset
                const presetsPath = path.join(tempDir, 'presets.json');
                const presetsData = {
                    version: '1.0.0',
                    presets: [presetConfig]
                };
                fs.writeFileSync(presetsPath, JSON.stringify(presetsData, null, 2), 'utf-8');
                
                // Create PresetManager with custom path
                const manager = new PresetManager(presetsPath);
                
                // Load presets
                const loadedPresets = manager.loadPresets();
                
                // Verify preset was loaded
                if (loadedPresets.length !== 1) {
                    return false;
                }
                
                // Get the preset
                const preset = manager.getPreset(presetConfig.id);
                if (!preset) {
                    return false;
                }
                
                // Verify all configuration fields are preserved
                if (preset.id !== presetConfig.id) return false;
                if (preset.name !== presetConfig.name) return false;
                if (preset.description !== presetConfig.description) return false;
                if (preset.icon !== presetConfig.icon) return false;
                
                // Verify filters
                if (!deepEqual(preset.filters, presetConfig.filters)) return false;
                
                // Verify options
                if (!deepEqual(preset.options, presetConfig.options)) return false;
                
                // Verify metadata (if present)
                if (presetConfig.metadata && !deepEqual(preset.metadata, presetConfig.metadata)) return false;
                
                // Apply the preset to a test directory
                const projectDir = path.join(tempDir, 'project');
                fs.mkdirSync(projectDir, { recursive: true });
                
                const applied = manager.applyPreset(presetConfig.id, projectDir);
                
                // Verify applied preset information
                if (applied.presetId !== presetConfig.id) return false;
                if (applied.projectRoot !== projectDir) return false;
                
                // Verify options are returned
                if (!deepEqual(applied.options, presetConfig.options)) return false;
                
                // Verify filter files are created based on configuration
                if (presetConfig.filters.include && presetConfig.filters.include.length > 0) {
                    const includePath = path.join(projectDir, '.contextinclude');
                    if (!fs.existsSync(includePath)) return false;
                    
                    const includeContent = fs.readFileSync(includePath, 'utf-8');
                    const includeLines = includeContent.split('\n').filter(line => line.trim());
                    if (!arraysEqual(includeLines, presetConfig.filters.include)) return false;
                }
                
                if (presetConfig.filters.exclude && presetConfig.filters.exclude.length > 0) {
                    const excludePath = path.join(projectDir, '.contextignore');
                    if (!fs.existsSync(excludePath)) return false;
                    
                    const excludeContent = fs.readFileSync(excludePath, 'utf-8');
                    const excludeLines = excludeContent.split('\n').filter(line => line.trim());
                    if (!arraysEqual(excludeLines, presetConfig.filters.exclude)) return false;
                }
                
                if (presetConfig.filters.methodInclude && presetConfig.filters.methodInclude.length > 0) {
                    const methodIncludePath = path.join(projectDir, '.methodinclude');
                    if (!fs.existsSync(methodIncludePath)) return false;
                    
                    const methodIncludeContent = fs.readFileSync(methodIncludePath, 'utf-8');
                    const methodIncludeLines = methodIncludeContent.split('\n').filter(line => line.trim());
                    if (!arraysEqual(methodIncludeLines, presetConfig.filters.methodInclude)) return false;
                }
                
                if (presetConfig.filters.methodExclude && presetConfig.filters.methodExclude.length > 0) {
                    const methodExcludePath = path.join(projectDir, '.methodignore');
                    if (!fs.existsSync(methodExcludePath)) return false;
                    
                    const methodExcludeContent = fs.readFileSync(methodExcludePath, 'utf-8');
                    const methodExcludeLines = methodExcludeContent.split('\n').filter(line => line.trim());
                    if (!arraysEqual(methodExcludeLines, presetConfig.filters.methodExclude)) return false;
                }
                
                // Cleanup
                manager.cleanup(applied);
                
                // Verify cleanup removed temporary files
                for (const tempFile of applied.tempFiles) {
                    if (fs.existsSync(tempFile)) return false;
                }
                
                return true;
            } finally {
                // Clean up temp directory
                try {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                } catch (error) {
                    // Ignore cleanup errors
                }
            }
        }
    );
    
    await runProperty(property, { numRuns: 100 });
    console.log('   ✓ Preset configuration is correctly applied');
}

/**
 * Helper function to remove undefined values from an object (recursively)
 */
function removeUndefined(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(removeUndefined);
    
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            result[key] = removeUndefined(value);
        }
    }
    return result;
}

/**
 * Helper function to deeply compare two objects
 */
function deepEqual(obj1, obj2) {
    // Normalize by removing undefined values (JSON serialization removes them)
    const normalized1 = removeUndefined(obj1);
    const normalized2 = removeUndefined(obj2);
    
    if (normalized1 === normalized2) return true;
    if (normalized1 == null || normalized2 == null) return false;
    if (typeof normalized1 !== 'object' || typeof normalized2 !== 'object') return normalized1 === normalized2;
    
    const keys1 = Object.keys(normalized1);
    const keys2 = Object.keys(normalized2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!deepEqual(normalized1[key], normalized2[key])) return false;
    }
    
    return true;
}

/**
 * Helper function to compare two arrays
 */
function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}

// Export all tests
export default async function runAllPresetSystemProperties() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 Preset System Property-Based Tests');
    console.log('='.repeat(80));
    
    await testPresetConfigurationApplication();
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ All preset system property tests passed!');
    console.log('='.repeat(80) + '\n');
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllPresetSystemProperties().catch(error => {
        console.error('❌ Property tests failed:', error);
        process.exit(1);
    });
}
