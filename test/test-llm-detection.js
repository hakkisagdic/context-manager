#!/usr/bin/env node

/**
 * Test LLM Detection (v2.3.7)
 * Basic tests for LLM model detection and profile loading
 */

import { LLMDetector } from '../lib/utils/llm-detector.js';
import assert from 'assert';

console.log('🧪 Testing LLM Detection (v2.3.7)...\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`✅ ${name}`);
        passedTests++;
    } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
    }
}

// Test 1: Profile Loading
test('Should load LLM profiles from JSON', () => {
    const profiles = LLMDetector.getAllProfiles();
    assert(profiles, 'Profiles should exist');
    assert(Object.keys(profiles).length > 0, 'Should have at least one profile');
});

// Test 2: Get Specific Profile
test('Should get Claude Sonnet 4.5 profile', () => {
    const profile = LLMDetector.getProfile('claude-sonnet-4.5');
    assert.strictEqual(profile.name, 'Claude Sonnet 4.5');
    assert.strictEqual(profile.vendor, 'Anthropic');
    assert.strictEqual(profile.contextWindow, 200000);
    assert.strictEqual(profile.preferredFormat, 'toon');
});

// Test 3: Get GPT-4o Profile
test('Should get GPT-4o profile', () => {
    const profile = LLMDetector.getProfile('gpt-4o');
    assert.strictEqual(profile.name, 'GPT-4o');
    assert.strictEqual(profile.vendor, 'OpenAI');
    assert.strictEqual(profile.contextWindow, 128000);
});

// Test 4: Unknown Model Fallback
test('Should return default profile for unknown model', () => {
    const profile = LLMDetector.getProfile('unknown-model');
    assert(profile, 'Should return a profile');
    assert(profile.contextWindow > 0, 'Should have valid context window');
});

// Test 5: List All Models
test('Should list all available models', () => {
    const models = LLMDetector.listProfiles();
    assert(Array.isArray(models), 'Should return an array');
    assert(models.length > 0, 'Should have models');
    assert(models.includes('claude-sonnet-4.5'), 'Should include Claude');
    assert(models.includes('gpt-4o'), 'Should include GPT-4o');
    assert(models.includes('gemini-2.0-flash'), 'Should include Gemini');
});

// Test 6: Get Model List with Details
test('Should get model list with details', () => {
    const modelList = LLMDetector.getModelList();
    assert(Array.isArray(modelList), 'Should return an array');
    assert(modelList.length > 0, 'Should have models');

    const claude = modelList.find(m => m.id === 'claude-sonnet-4.5');
    assert(claude, 'Should find Claude model');
    assert.strictEqual(claude.vendor, 'Anthropic');
    assert(claude.contextWindow > 0, 'Should have context window');
});

// Test 7: Environment Detection (without keys)
test('Should detect "unknown" when no env keys present', () => {
    // Clean environment
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.CONTEXT_MANAGER_LLM;

    const detected = LLMDetector.detect();
    assert.strictEqual(detected, 'unknown');
});

// Test 8: Recommend Configuration
test('Should recommend configuration for small repo', () => {
    const profile = LLMDetector.getProfile('claude-sonnet-4.5');
    const stats = { totalTokens: 50000, totalFiles: 20 };
    const config = LLMDetector.recommendConfiguration(profile, stats);

    assert.strictEqual(config.chunkingEnabled, false, 'Should not need chunking');
    assert.strictEqual(config.fitsInContext, true, 'Should fit in context');
    assert.strictEqual(config.outputFormat, 'toon', 'Should recommend TOON');
});

// Test 9: Recommend Configuration for Large Repo
test('Should recommend chunking for large repo', () => {
    const profile = LLMDetector.getProfile('gpt-4o');
    const stats = { totalTokens: 500000, totalFiles: 200 };
    const config = LLMDetector.recommendConfiguration(profile, stats);

    assert.strictEqual(config.chunkingEnabled, true, 'Should need chunking');
    assert.strictEqual(config.fitsInContext, false, 'Should not fit in one context');
    assert(config.chunksNeeded > 1, 'Should need multiple chunks');
});

// Test 10: Context Fit Analysis
test('Should analyze context fit', () => {
    const profile = LLMDetector.getProfile('gemini-2.0-flash');
    const stats = { totalTokens: 100000, totalFiles: 50 };
    const analysis = LLMDetector.analyzeContextFit(profile, stats);

    assert(analysis.modelName, 'Should have model name');
    assert(analysis.contextWindow > 0, 'Should have context window');
    assert(analysis.repoTokens === 100000, 'Should have repo tokens');
    assert(typeof analysis.fitsInOne === 'boolean', 'Should have fit status');
    assert(analysis.recommendation, 'Should have recommendation');
});

// Test 11: Format Analysis Output
test('Should format analysis for display', () => {
    const profile = LLMDetector.getProfile('claude-sonnet-4.5');
    const stats = { totalTokens: 181480, totalFiles: 64 };
    const analysis = LLMDetector.analyzeContextFit(profile, stats);
    const formatted = LLMDetector.formatAnalysis(analysis);

    assert(typeof formatted === 'string', 'Should return string');
    assert(formatted.includes('Context Window Analysis'), 'Should have title');
    assert(formatted.includes('Claude Sonnet 4.5'), 'Should have model name');
    assert(formatted.includes('181,480'), 'Should format numbers');
});

// Test 12: Performance Test
test('Should load profiles in < 100ms', () => {
    const start = Date.now();
    const profiles = LLMDetector.getAllProfiles();
    const elapsed = Date.now() - start;

    assert(profiles, 'Should load profiles');
    assert(elapsed < 100, `Loading took ${elapsed}ms, should be < 100ms`);
});

// Results
console.log('\n' + '='.repeat(50));
console.log(`Tests: ${passedTests}/${totalTests} passed`);

if (passedTests === totalTests) {
    console.log('✅ All LLM detection tests passed!');
    process.exit(0);
} else {
    console.log(`❌ ${totalTests - passedTests} tests failed`);
    process.exit(1);
}
