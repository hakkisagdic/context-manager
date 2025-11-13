#!/usr/bin/env node

/**
 * Comprehensive LLM Detector Tests
 * Tests for LLM model detection and optimization
 */

import { LLMDetector } from '../lib/utils/llm-detector.js';

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

console.log('🧪 Testing LLM Detector...\n');

// ============================================================================
// PROFILE LOADING TESTS
// ============================================================================
console.log('📋 Profile Loading Tests');
console.log('-'.repeat(70));

test('LLMDetector - loadProfiles returns object', () => {
    const profiles = LLMDetector.loadProfiles();
    if (typeof profiles !== 'object') throw new Error('Should return object');
    if (!profiles.profiles) throw new Error('Should have profiles property');
});

test('LLMDetector - loadProfiles has default', () => {
    const profiles = LLMDetector.loadProfiles();
    if (!profiles.default) throw new Error('Should have default property');
    if (typeof profiles.default !== 'object') throw new Error('Default should be object');
});

test('LLMDetector - getAllProfiles returns profiles', () => {
    const profiles = LLMDetector.getAllProfiles();
    if (typeof profiles !== 'object') throw new Error('Should return object');
    if (Object.keys(profiles).length === 0) throw new Error('Should have profiles');
});

test('LLMDetector - getAllProfiles includes claude-sonnet-4.5', () => {
    const profiles = LLMDetector.getAllProfiles();
    if (!profiles['claude-sonnet-4.5']) {
        throw new Error('Should include claude-sonnet-4.5');
    }
});

test('LLMDetector - getAllProfiles includes gpt-4o', () => {
    const profiles = LLMDetector.getAllProfiles();
    if (!profiles['gpt-4o']) {
        throw new Error('Should include gpt-4o');
    }
});

test('LLMDetector - getDefaultProfile returns default', () => {
    const defaultProfile = LLMDetector.getDefaultProfile();
    if (typeof defaultProfile !== 'object') throw new Error('Should return object');
    if (!defaultProfile.name) throw new Error('Should have name');
    if (!defaultProfile.contextWindow) throw new Error('Should have contextWindow');
});

test('LLMDetector - profiles are cached', () => {
    const first = LLMDetector.loadProfiles();
    const second = LLMDetector.loadProfiles();
    // Should return same reference (cached)
    if (first !== second) throw new Error('Should cache profiles');
});

// ============================================================================
// PROFILE STRUCTURE TESTS
// ============================================================================
console.log('\n📐 Profile Structure Tests');
console.log('-'.repeat(70));

test('LLMDetector - Profile has required fields', () => {
    const profile = LLMDetector.getProfile('claude-sonnet-4.5');
    if (!profile.name) throw new Error('Should have name');
    if (!profile.contextWindow) throw new Error('Should have contextWindow');
    if (!profile.maxRecommendedInput) throw new Error('Should have maxRecommendedInput');
    if (!profile.preferredFormat) throw new Error('Should have preferredFormat');
});

test('LLMDetector - Profile contextWindow is number', () => {
    const profile = LLMDetector.getProfile('claude-sonnet-4.5');
    if (typeof profile.contextWindow !== 'number') {
        throw new Error('contextWindow should be number');
    }
    if (profile.contextWindow <= 0) throw new Error('contextWindow should be positive');
});

test('LLMDetector - Profile maxRecommendedInput is number', () => {
    const profile = LLMDetector.getProfile('gpt-4o');
    if (typeof profile.maxRecommendedInput !== 'number') {
        throw new Error('maxRecommendedInput should be number');
    }
});

test('LLMDetector - Profile utilizationPercentage is valid', () => {
    const profile = LLMDetector.getProfile('claude-sonnet-4.5');
    if (profile.utilizationPercentage) {
        if (profile.utilizationPercentage < 0 || profile.utilizationPercentage > 1) {
            throw new Error('utilizationPercentage should be between 0 and 1');
        }
    }
});

// ============================================================================
// DETECTION TESTS
// ============================================================================
console.log('\n🔍 Detection Tests');
console.log('-'.repeat(70));

test('LLMDetector - detect returns string', () => {
    const detected = LLMDetector.detect();
    if (typeof detected !== 'string') throw new Error('Should return string');
});

test('LLMDetector - detectFromEnv returns string or null', () => {
    const result = LLMDetector.detectFromEnv();
    if (result !== null && typeof result !== 'string') {
        throw new Error('Should return string or null');
    }
});

test('LLMDetector - detectFromEnv with ANTHROPIC_API_KEY', () => {
    const original = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-key';

    const result = LLMDetector.detectFromEnv();

    // Restore
    if (original) {
        process.env.ANTHROPIC_API_KEY = original;
    } else {
        delete process.env.ANTHROPIC_API_KEY;
    }

    if (result !== 'claude-sonnet-4.5') {
        throw new Error('Should detect claude-sonnet-4.5 from ANTHROPIC_API_KEY');
    }
});

test('LLMDetector - detectFromEnv with OPENAI_API_KEY', () => {
    const original = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = 'test-key';

    const result = LLMDetector.detectFromEnv();

    // Restore
    if (original) {
        process.env.OPENAI_API_KEY = original;
    } else {
        delete process.env.OPENAI_API_KEY;
    }

    if (result !== 'gpt-4o') {
        throw new Error('Should detect gpt-4o from OPENAI_API_KEY');
    }
});

test('LLMDetector - detectFromEnv with CONTEXT_MANAGER_LLM override', () => {
    const original = process.env.CONTEXT_MANAGER_LLM;
    process.env.CONTEXT_MANAGER_LLM = 'custom-model';

    const result = LLMDetector.detectFromEnv();

    // Restore
    if (original) {
        process.env.CONTEXT_MANAGER_LLM = original;
    } else {
        delete process.env.CONTEXT_MANAGER_LLM;
    }

    if (result !== 'custom-model') {
        throw new Error('Should respect CONTEXT_MANAGER_LLM override');
    }
});

test('LLMDetector - detectFromConfig returns string or null', () => {
    const result = LLMDetector.detectFromConfig();
    if (result !== null && typeof result !== 'string') {
        throw new Error('Should return string or null');
    }
});

// ============================================================================
// GET PROFILE TESTS
// ============================================================================
console.log('\n📦 Get Profile Tests');
console.log('-'.repeat(70));

test('LLMDetector - getProfile with valid model', () => {
    const profile = LLMDetector.getProfile('claude-sonnet-4.5');
    if (typeof profile !== 'object') throw new Error('Should return object');
    if (profile.name !== 'Claude Sonnet 4.5') throw new Error('Should have correct name');
});

test('LLMDetector - getProfile with unknown model', () => {
    const profile = LLMDetector.getProfile('unknown-model-xyz');
    if (typeof profile !== 'object') throw new Error('Should return object');
    if (profile.name !== 'unknown-model-xyz') throw new Error('Should use provided name');
});

test('LLMDetector - getProfile with null', () => {
    const profile = LLMDetector.getProfile(null);
    if (typeof profile !== 'object') throw new Error('Should return default profile');
});

test('LLMDetector - getProfile with unknown', () => {
    const profile = LLMDetector.getProfile('unknown');
    if (typeof profile !== 'object') throw new Error('Should return default profile');
});

test('LLMDetector - getProfile returns complete profile', () => {
    const profile = LLMDetector.getProfile('gpt-4o');
    if (!profile.contextWindow) throw new Error('Should have contextWindow');
    if (!profile.maxRecommendedInput) throw new Error('Should have maxRecommendedInput');
    if (!profile.preferredFormat) throw new Error('Should have preferredFormat');
});

// ============================================================================
// RECOMMENDATION TESTS
// ============================================================================
console.log('\n💡 Recommendation Tests');
console.log('-'.repeat(70));

test('LLMDetector - recommendConfiguration returns object', () => {
    const profile = LLMDetector.getProfile('claude-sonnet-4.5');
    const repoStats = { totalTokens: 50000, totalFiles: 100 };
    const config = LLMDetector.recommendConfiguration(profile, repoStats);

    if (typeof config !== 'object') throw new Error('Should return object');
});

test('LLMDetector - recommendConfiguration with small repo', () => {
    const profile = LLMDetector.getProfile('claude-sonnet-4.5');
    const repoStats = { totalTokens: 50000, totalFiles: 100 };
    const config = LLMDetector.recommendConfiguration(profile, repoStats);

    if (!config.fitsInContext) throw new Error('Should fit in context');
    if (config.chunkingEnabled) throw new Error('Should not need chunking');
    if (config.chunksNeeded !== 1) throw new Error('Should need only 1 chunk');
});

test('LLMDetector - recommendConfiguration with large repo', () => {
    const profile = LLMDetector.getProfile('claude-sonnet-4.5');
    const repoStats = { totalTokens: 500000, totalFiles: 1000 };
    const config = LLMDetector.recommendConfiguration(profile, repoStats);

    if (config.fitsInContext) throw new Error('Should not fit in context');
    if (!config.chunkingEnabled) throw new Error('Should need chunking');
    if (config.chunksNeeded < 2) throw new Error('Should need multiple chunks');
});

test('LLMDetector - recommendConfiguration includes format', () => {
    const profile = LLMDetector.getProfile('claude-sonnet-4.5');
    const repoStats = { totalTokens: 50000, totalFiles: 100 };
    const config = LLMDetector.recommendConfiguration(profile, repoStats);

    if (!config.outputFormat) throw new Error('Should have outputFormat');
    if (typeof config.outputFormat !== 'string') throw new Error('outputFormat should be string');
});

test('LLMDetector - recommendConfiguration includes chunkSize', () => {
    const profile = LLMDetector.getProfile('gpt-4o');
    const repoStats = { totalTokens: 50000, totalFiles: 100 };
    const config = LLMDetector.recommendConfiguration(profile, repoStats);

    if (!config.chunkSize) throw new Error('Should have chunkSize');
    if (typeof config.chunkSize !== 'number') throw new Error('chunkSize should be number');
});

test('LLMDetector - recommendConfiguration includes utilization', () => {
    const profile = LLMDetector.getProfile('claude-sonnet-4.5');
    const repoStats = { totalTokens: 50000, totalFiles: 100 };
    const config = LLMDetector.recommendConfiguration(profile, repoStats);

    if (typeof config.utilizationPercentage !== 'number') {
        throw new Error('Should have utilizationPercentage');
    }
    if (typeof config.utilizationActual !== 'number') {
        throw new Error('Should have utilizationActual');
    }
});

// ============================================================================
// CONTEXT FIT ANALYSIS TESTS
// ============================================================================
console.log('\n📊 Context Fit Analysis Tests');
console.log('-'.repeat(70));

test('LLMDetector - analyzeContextFit returns object', () => {
    const profile = LLMDetector.getProfile('claude-sonnet-4.5');
    const repoStats = { totalTokens: 50000, totalFiles: 100 };
    const analysis = LLMDetector.analyzeContextFit(profile, repoStats);

    if (typeof analysis !== 'object') throw new Error('Should return object');
});

test('LLMDetector - analyzeContextFit includes model info', () => {
    const profile = LLMDetector.getProfile('gpt-4o');
    const repoStats = { totalTokens: 50000, totalFiles: 100 };
    const analysis = LLMDetector.analyzeContextFit(profile, repoStats);

    if (!analysis.modelName) throw new Error('Should have modelName');
    if (!analysis.contextWindow) throw new Error('Should have contextWindow');
    if (!analysis.usableContext) throw new Error('Should have usableContext');
});

test('LLMDetector - analyzeContextFit includes repo info', () => {
    const profile = LLMDetector.getProfile('claude-sonnet-4.5');
    const repoStats = { totalTokens: 75000, totalFiles: 150 };
    const analysis = LLMDetector.analyzeContextFit(profile, repoStats);

    if (analysis.repoTokens !== 75000) throw new Error('Should have repoTokens');
    if (analysis.repoFiles !== 150) throw new Error('Should have repoFiles');
});

test('LLMDetector - analyzeContextFit calculates chunks', () => {
    const profile = LLMDetector.getProfile('claude-sonnet-4.5');
    const repoStats = { totalTokens: 50000, totalFiles: 100 };
    const analysis = LLMDetector.analyzeContextFit(profile, repoStats);

    if (typeof analysis.chunksNeeded !== 'number') {
        throw new Error('Should have chunksNeeded');
    }
    if (typeof analysis.fitsInOne !== 'boolean') {
        throw new Error('Should have fitsInOne');
    }
});

test('LLMDetector - analyzeContextFit includes recommendation', () => {
    const profile = LLMDetector.getProfile('gpt-4o');
    const repoStats = { totalTokens: 50000, totalFiles: 100 };
    const analysis = LLMDetector.analyzeContextFit(profile, repoStats);

    if (!analysis.recommendation) throw new Error('Should have recommendation');
    if (typeof analysis.recommendation !== 'string') {
        throw new Error('recommendation should be string');
    }
});

test('LLMDetector - analyzeContextFit utilization is percentage', () => {
    const profile = LLMDetector.getProfile('claude-sonnet-4.5');
    const repoStats = { totalTokens: 50000, totalFiles: 100 };
    const analysis = LLMDetector.analyzeContextFit(profile, repoStats);

    if (typeof analysis.utilizationActual !== 'number') {
        throw new Error('Should have utilizationActual');
    }
    // Utilization should be reasonable
    if (analysis.utilizationActual < 0) throw new Error('utilizationActual should be positive');
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
    console.log('\n🎉 All LLM detector tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
