#!/usr/bin/env node

/**
 * Extended LLM Detector Tests
 * Tests for configuration recommendations, context fit analysis, and advanced features
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

console.log('🧪 Testing LLMDetector Extended...\n');

// ============================================================================
// RECOMMEND CONFIGURATION TESTS
// ============================================================================
console.log('⚙️  recommendConfiguration() Tests');
console.log('-'.repeat(70));

test('LLMDetector - recommendConfiguration with small repo (fits in context)', () => {
    const profile = {
        name: 'gpt-4',
        maxRecommendedInput: 100000,
        preferredFormat: 'toon',
        chunkStrategy: 'sliding-window',
        utilizationPercentage: 0.6
    };

    const repoStats = {
        totalTokens: 50000,
        totalFiles: 100
    };

    const config = LLMDetector.recommendConfiguration(profile, repoStats);

    if (!config) throw new Error('Should return configuration');
    if (config.targetModel !== 'gpt-4') throw new Error('Should set target model');
    if (config.outputFormat !== 'toon') throw new Error('Should set output format');
    if (config.chunkingEnabled !== false) throw new Error('Should not enable chunking for small repo');
    if (config.chunksNeeded !== 1) throw new Error('Should need only 1 chunk');
    if (config.fitsInContext !== true) throw new Error('Should fit in context');
});

test('LLMDetector - recommendConfiguration with large repo (requires chunking)', () => {
    const profile = {
        name: 'gpt-4',
        maxRecommendedInput: 100000,
        preferredFormat: 'json',
        chunkStrategy: 'file-based',
        utilizationPercentage: 0.6
    };

    const repoStats = {
        totalTokens: 250000, // 2.5x max input
        totalFiles: 500
    };

    const config = LLMDetector.recommendConfiguration(profile, repoStats);

    if (config.chunkingEnabled !== true) throw new Error('Should enable chunking for large repo');
    if (config.chunksNeeded < 2) throw new Error('Should need multiple chunks');
    if (config.fitsInContext !== false) throw new Error('Should not fit in context');
    if (config.chunkStrategy !== 'file-based') throw new Error('Should use profile chunk strategy');
});

test('LLMDetector - recommendConfiguration calculates chunksNeeded correctly', () => {
    const profile = {
        name: 'claude-2',
        maxRecommendedInput: 50000,
        preferredFormat: 'toon',
        chunkStrategy: 'sliding-window'
    };

    const repoStats = {
        totalTokens: 175000, // 3.5x max input
        totalFiles: 350
    };

    const config = LLMDetector.recommendConfiguration(profile, repoStats);

    // Math.ceil(175000 / 50000) = 4 chunks
    if (config.chunksNeeded !== 4) throw new Error('Should calculate chunks needed correctly');
});

test('LLMDetector - recommendConfiguration with zero utilization percentage', () => {
    const profile = {
        name: 'test-model',
        maxRecommendedInput: 100000,
        preferredFormat: 'json',
        chunkStrategy: 'file-based'
        // No utilizationPercentage
    };

    const repoStats = {
        totalTokens: 50000,
        totalFiles: 100
    };

    const config = LLMDetector.recommendConfiguration(profile, repoStats);

    // Should default to 60%
    if (config.utilizationPercentage !== 60) throw new Error('Should default utilization to 60%');
});

test('LLMDetector - recommendConfiguration sets chunkSize', () => {
    const profile = {
        name: 'gpt-4',
        maxRecommendedInput: 80000,
        preferredFormat: 'toon',
        chunkStrategy: 'sliding-window'
    };

    const repoStats = {
        totalTokens: 150000,
        totalFiles: 200
    };

    const config = LLMDetector.recommendConfiguration(profile, repoStats);

    if (config.chunkSize !== 80000) throw new Error('Should set chunk size to maxRecommendedInput');
});

// ============================================================================
// ANALYZE CONTEXT FIT TESTS
// ============================================================================
console.log('\n📊 analyzeContextFit() Tests');
console.log('-'.repeat(70));

test('LLMDetector - analyzeContextFit with repo that fits', () => {
    const profile = {
        name: 'gpt-4',
        contextWindow: 128000,
        maxRecommendedInput: 76800, // 60% of 128k
        utilizationPercentage: 0.6
    };

    const repoStats = {
        totalTokens: 50000,
        totalFiles: 100
    };

    const analysis = LLMDetector.analyzeContextFit(profile, repoStats);

    if (!analysis) throw new Error('Should return analysis');
    if (analysis.modelName !== 'gpt-4') throw new Error('Should set model name');
    if (analysis.contextWindow !== 128000) throw new Error('Should set context window');
    if (analysis.usableContext !== 76800) throw new Error('Should set usable context');
    if (analysis.fitsInOne !== true) throw new Error('Should fit in one chunk');
    if (analysis.chunksNeeded !== 1) throw new Error('Should need 1 chunk');
});

test('LLMDetector - analyzeContextFit calculates reserved system tokens', () => {
    const profile = {
        name: 'claude-2',
        contextWindow: 100000,
        maxRecommendedInput: 60000, // 60%
        utilizationPercentage: 0.6
    };

    const repoStats = {
        totalTokens: 50000,
        totalFiles: 100
    };

    const analysis = LLMDetector.analyzeContextFit(profile, repoStats);

    // Reserved = contextWindow - usableContext = 100000 - 60000 = 40000
    if (analysis.reservedForSystem !== 40000) throw new Error('Should calculate reserved system tokens');
});

test('LLMDetector - analyzeContextFit with large repo needing chunks', () => {
    const profile = {
        name: 'gpt-3.5',
        contextWindow: 16000,
        maxRecommendedInput: 9600, // 60%
        utilizationPercentage: 0.6
    };

    const repoStats = {
        totalTokens: 30000, // More than usable context
        totalFiles: 200
    };

    const analysis = LLMDetector.analyzeContextFit(profile, repoStats);

    if (analysis.fitsInOne !== false) throw new Error('Should not fit in one');
    // Math.ceil(30000 / 9600) = 4 chunks
    if (analysis.chunksNeeded !== 4) throw new Error('Should need 4 chunks');
});

test('LLMDetector - analyzeContextFit calculates utilization percentage', () => {
    const profile = {
        name: 'test-model',
        contextWindow: 100000,
        maxRecommendedInput: 60000,
        utilizationPercentage: 0.6
    };

    const repoStats = {
        totalTokens: 50000,
        totalFiles: 100
    };

    const analysis = LLMDetector.analyzeContextFit(profile, repoStats);

    // Should round 0.6 to 60%
    if (analysis.utilizationPercentage !== 60) throw new Error('Should calculate utilization percentage');
});

test('LLMDetector - analyzeContextFit calculates actual utilization', () => {
    const profile = {
        name: 'test-model',
        contextWindow: 100000,
        maxRecommendedInput: 60000,
        utilizationPercentage: 0.6
    };

    const repoStats = {
        totalTokens: 30000, // 50% of usable context
        totalFiles: 100
    };

    const analysis = LLMDetector.analyzeContextFit(profile, repoStats);

    // (30000 / 60000) * 100 = 50%
    if (analysis.utilizationActual !== 50) throw new Error('Should calculate actual utilization');
});

test('LLMDetector - analyzeContextFit defaults utilizationPercentage', () => {
    const profile = {
        name: 'test-model',
        contextWindow: 100000,
        maxRecommendedInput: 60000
        // No utilizationPercentage
    };

    const repoStats = {
        totalTokens: 50000,
        totalFiles: 100
    };

    const analysis = LLMDetector.analyzeContextFit(profile, repoStats);

    // Should default to 0.6 = 60%
    if (analysis.utilizationPercentage !== 60) throw new Error('Should default to 60%');
});

test('LLMDetector - analyzeContextFit includes repo stats', () => {
    const profile = {
        name: 'gpt-4',
        contextWindow: 128000,
        maxRecommendedInput: 76800,
        utilizationPercentage: 0.6
    };

    const repoStats = {
        totalTokens: 50000,
        totalFiles: 250
    };

    const analysis = LLMDetector.analyzeContextFit(profile, repoStats);

    if (analysis.repoTokens !== 50000) throw new Error('Should include repo tokens');
    if (analysis.repoFiles !== 250) throw new Error('Should include repo files');
});

test('LLMDetector - analyzeContextFit includes recommendation', () => {
    const profile = {
        name: 'gpt-4',
        contextWindow: 128000,
        maxRecommendedInput: 76800,
        utilizationPercentage: 0.6
    };

    const repoStats = {
        totalTokens: 50000,
        totalFiles: 100
    };

    const analysis = LLMDetector.analyzeContextFit(profile, repoStats);

    if (!analysis.recommendation) throw new Error('Should include recommendation');
    if (typeof analysis.recommendation !== 'string') throw new Error('Recommendation should be string');
});

// ============================================================================
// GET RECOMMENDATION TESTS
// ============================================================================
console.log('\n💡 getRecommendation() Tests');
console.log('-'.repeat(70));

test('LLMDetector - getRecommendation for repo that fits well', () => {
    // fitsInOne=true, chunksNeeded=1, utilizationActual=50%
    const rec = LLMDetector.getRecommendation(true, 1, 50);

    if (typeof rec !== 'string') throw new Error('Should return string');
    if (rec.length === 0) throw new Error('Should not be empty');
    if (!rec.toLowerCase().includes('fit')) throw new Error('Should mention fit status');
});

test('LLMDetector - getRecommendation for repo needing chunking', () => {
    // fitsInOne=false, chunksNeeded=5, utilizationActual=250%
    const rec = LLMDetector.getRecommendation(false, 5, 250);

    if (typeof rec !== 'string') throw new Error('Should return string');
    if (rec.length === 0) throw new Error('Should not be empty');
});

test('LLMDetector - getRecommendation handles edge cases', () => {
    // Edge case: exactly at limit (100% utilization)
    const rec1 = LLMDetector.getRecommendation(true, 1, 100);
    if (typeof rec1 !== 'string') throw new Error('Should handle 100% utilization');

    // Edge case: very high utilization
    const rec2 = LLMDetector.getRecommendation(false, 10, 1000);
    if (typeof rec2 !== 'string') throw new Error('Should handle very high utilization');
});

// ============================================================================
// DETECT FROM CONFIG TESTS
// ============================================================================
console.log('\n📋 detectFromConfig() Tests');
console.log('-'.repeat(70));

test('LLMDetector - detectFromConfig returns null when no config', () => {
    // Assuming no config file exists in test environment
    const detected = LLMDetector.detectFromConfig();

    // Should return null or a string (depends on environment)
    if (detected !== null && typeof detected !== 'string') {
        throw new Error('Should return null or string');
    }
});

// ============================================================================
// GET PROFILE TESTS (EXTENDED)
// ============================================================================
console.log('\n🎯 getProfile() Extended Tests');
console.log('-'.repeat(70));

test('LLMDetector - getProfile with unknown model', () => {
    const profile = LLMDetector.getProfile('unknown');

    if (!profile) throw new Error('Should return default profile');
    if (typeof profile !== 'object') throw new Error('Should return object');
});

test('LLMDetector - getProfile with null', () => {
    const profile = LLMDetector.getProfile(null);

    if (!profile) throw new Error('Should return default profile');
});

test('LLMDetector - getProfile with undefined', () => {
    const profile = LLMDetector.getProfile(undefined);

    if (!profile) throw new Error('Should return default profile');
});

test('LLMDetector - getProfile with invalid model returns default', () => {
    const profile = LLMDetector.getProfile('completely-invalid-model-xyz');

    if (!profile) throw new Error('Should return profile');
    if (!profile.name) throw new Error('Should have name');
    // Should set the requested name even if using default profile
    if (profile.name !== 'completely-invalid-model-xyz') {
        throw new Error('Should set requested model name');
    }
});

test('LLMDetector - getProfile with valid model', () => {
    const profile = LLMDetector.getProfile('gpt-4');

    if (!profile) throw new Error('Should return profile');
    if (profile.name !== 'gpt-4') throw new Error('Should return gpt-4 profile');
    if (!profile.contextWindow) throw new Error('Should have context window');
    if (!profile.maxRecommendedInput) throw new Error('Should have max recommended input');
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\n🔗 Integration Tests');
console.log('-'.repeat(70));

test('LLMDetector - Full workflow: detect, recommend, analyze', () => {
    // Step 1: Get profile
    const profile = LLMDetector.getProfile('gpt-4');

    // Step 2: Mock repo stats
    const repoStats = {
        totalTokens: 80000,
        totalFiles: 200
    };

    // Step 3: Get configuration recommendation
    const config = LLMDetector.recommendConfiguration(profile, repoStats);

    if (!config) throw new Error('Should generate config');

    // Step 4: Analyze context fit
    const analysis = LLMDetector.analyzeContextFit(profile, repoStats);

    if (!analysis) throw new Error('Should generate analysis');

    // Both should agree on chunking
    if (config.chunkingEnabled !== !analysis.fitsInOne) {
        throw new Error('Config and analysis should agree on chunking needs');
    }
});

test('LLMDetector - recommendConfiguration and analyzeContextFit consistency', () => {
    const profile = {
        name: 'test-model',
        contextWindow: 100000,
        maxRecommendedInput: 60000,
        preferredFormat: 'json',
        chunkStrategy: 'sliding-window',
        utilizationPercentage: 0.6
    };

    const repoStats = {
        totalTokens: 120000,
        totalFiles: 300
    };

    const config = LLMDetector.recommendConfiguration(profile, repoStats);
    const analysis = LLMDetector.analyzeContextFit(profile, repoStats);

    // Both should calculate same chunksNeeded
    if (config.chunksNeeded !== analysis.chunksNeeded) {
        throw new Error('Config and analysis should calculate same chunks needed');
    }

    // Both should agree on fitsInContext
    if (config.fitsInContext !== analysis.fitsInOne) {
        throw new Error('Config and analysis should agree on fit status');
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
    console.log('\n🎉 All LLMDetector extended tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
