# Aykut PR#1 Analysis - Automatic Size Detection Feature

**Document Type:** Product Analysis & Technical Specification
**Created:** 2025-11-05
**Author:** Product Analyst Agent + Engineering Team
**Status:** Approved for Implementation
**Target Version:** v2.3.7
**Related PR:** [#1 - defensive_code-1](https://github.com/hakkisagdic/context-manager/pull/1)

---

## 📋 Executive Summary

A TODO comment in PR#1 (`// TODO büyüklük algılama otomatik olsun` - "size detection should be automatic") sparked a comprehensive product analysis. We identified **5 distinct interpretations** of what "automatic size detection" could mean, and determined that **LLM Model Auto-Detection** should be implemented in **v2.3.7** as a Phase 1 completion feature.

### Key Decisions

- ✅ **Implement:** LLM Model Detection (#5) - P0 Priority
- ✅ **Version:** v2.3.7 (Phase 1 completion patch)
- ✅ **Timeline:** 5-7 days development
- ✅ **Architecture:** Hardcoded profiles with config file extensibility
- 🔮 **Future:** Auto-suggest format (#3) in v2.4.0, auto-chunk size (#1) in v2.4.1

---

## 🔍 Original Context

### PR#1 Comment
```javascript
// TODO büyüklük algılama otomatik olsun
```

**Translation:** "TODO: size detection should be automatic"

**Location:** Turkish documentation (docs/README-tr.md), performance tips section

**Problem:** The comment was vague and accidentally committed to user-facing documentation.

**Our Interpretation:** This sparked a deeper product analysis of what "automatic detection" features would benefit users.

---

## 🎯 Feature Interpretations Analysis

We identified **5 distinct interpretations** of what "automatic size detection" could mean:

### 1. Auto-Detection of Optimal Chunk Size
**Priority:** P1 (Should-Have)
**Target:** v2.4.1
**Complexity:** Medium (2-3 days)

### 2. Auto-Detection of File Size Categories
**Priority:** P2 (Nice-to-Have)
**Target:** v2.5.0+
**Complexity:** Low (1 day)

### 3. Auto-Suggest Best Output Format
**Priority:** P1 (Should-Have)
**Target:** v2.4.0
**Complexity:** Medium (2-3 days)

### 4. Auto-Configure Analysis Depth
**Priority:** P3 (Defer)
**Target:** v3.0+
**Complexity:** High (3-4 days)

### 5. Auto-Detect Target LLM Model ⭐
**Priority:** P0 (Must-Have)
**Target:** v2.3.7
**Complexity:** High (5-7 days)

---

## ⭐ Selected Feature: LLM Model Auto-Detection

### Why This Feature First?

1. **Aligns with Core Value Prop:** "LLM context optimization"
2. **Phase 1 Theme:** "Smart Context Generation"
3. **Immediate User Value:** Optimal configuration without manual setup
4. **Competitive Differentiation:** First tool with multi-LLM awareness
5. **Foundation for Other Features:** Enables format suggestions (#3) and chunk optimization (#1)

### User Story

```
As a developer using Claude/GPT-4 for code analysis,
I want Context Manager to automatically optimize for my LLM's context window,
So that I get the best results without manual configuration.
```

### Acceptance Criteria

- [ ] Wizard mode asks "Which LLM are you using?" (interactive)
- [ ] CLI flag `--target-model <model>` (non-interactive)
- [ ] Auto-detects from environment variables (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)
- [ ] Adjusts chunk size, output format, and strategy based on model
- [ ] Shows "Context Fit Analysis" indicating if repo fits in single context
- [ ] Warns if repository exceeds LLM context window
- [ ] Supports custom models via `.contextmanagerrc.js` config
- [ ] Completes detection in <100ms (performance requirement)

---

## 🏗️ Technical Architecture

### LLM Profile Registry

**File:** `lib/data/llm-profiles.js`

```javascript
export const LLM_PROFILES = {
  'claude-sonnet-4.5': {
    name: 'Claude Sonnet 4.5',
    vendor: 'Anthropic',
    contextWindow: 200000,
    outputWindow: 8192,
    overhead: 10000,
    maxRecommendedInput: 190000,
    preferredFormat: 'toon',
    chunkStrategy: 'smart',
    supportedLanguages: 'all',
    strengths: ['long-context', 'code-generation', 'reasoning']
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    vendor: 'OpenAI',
    contextWindow: 128000,
    outputWindow: 4096,
    overhead: 8000,
    maxRecommendedInput: 120000,
    preferredFormat: 'json',
    chunkStrategy: 'smart',
    supportedLanguages: 'all',
    strengths: ['accuracy', 'json-mode', 'function-calling']
  },
  'gpt-4o': {
    name: 'GPT-4o',
    vendor: 'OpenAI',
    contextWindow: 128000,
    outputWindow: 16384,
    overhead: 8000,
    maxRecommendedInput: 120000,
    preferredFormat: 'json',
    chunkStrategy: 'smart',
    supportedLanguages: 'all',
    strengths: ['speed', 'vision', 'structured-output']
  },
  'gemini-1.5-pro': {
    name: 'Gemini 1.5 Pro',
    vendor: 'Google',
    contextWindow: 1000000,
    outputWindow: 8192,
    overhead: 20000,
    maxRecommendedInput: 980000,
    preferredFormat: 'gitingest',
    chunkStrategy: 'none',
    supportedLanguages: 'all',
    strengths: ['ultra-long-context', 'multimodal', 'analysis']
  },
  'deepseek-coder': {
    name: 'DeepSeek Coder',
    vendor: 'DeepSeek',
    contextWindow: 16000,
    outputWindow: 4096,
    overhead: 2000,
    maxRecommendedInput: 14000,
    preferredFormat: 'json',
    chunkStrategy: 'file',
    supportedLanguages: 'all',
    strengths: ['code-completion', 'efficiency']
  }
};

export const DEFAULT_PROFILE = {
  name: 'Unknown Model',
  contextWindow: 100000,
  overhead: 10000,
  maxRecommendedInput: 90000,
  preferredFormat: 'json',
  chunkStrategy: 'smart'
};
```

### LLM Detector Class

**File:** `lib/utils/llm-detector.js`

```javascript
import { LLM_PROFILES, DEFAULT_PROFILE } from '../data/llm-profiles.js';
import { ConfigUtils } from './config-utils.js';
import { Logger } from './logger.js';

export class LLMDetector {
  /**
   * Auto-detect LLM from environment
   * Performance: Must complete in <100ms
   */
  static detect() {
    const startTime = Date.now();

    try {
      // Check environment variables (fastest)
      const envModel = this.detectFromEnv();
      if (envModel) {
        Logger.debug(`LLM detected from environment: ${envModel}`);
        return envModel;
      }

      // Check user config (slower but still fast)
      const configModel = this.detectFromConfig();
      if (configModel) {
        Logger.debug(`LLM detected from config: ${configModel}`);
        return configModel;
      }

      Logger.debug('No LLM detected, using defaults');
      return 'unknown';

    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed > 100) {
        Logger.warn(`LLM detection took ${elapsed}ms (threshold: 100ms)`);
      }
    }
  }

  /**
   * Detect from environment variables
   * Performance: <1ms
   */
  static detectFromEnv() {
    if (process.env.ANTHROPIC_API_KEY) return 'claude-sonnet-4.5';
    if (process.env.OPENAI_API_KEY) return 'gpt-4-turbo';
    if (process.env.GOOGLE_API_KEY) return 'gemini-1.5-pro';
    if (process.env.DEEPSEEK_API_KEY) return 'deepseek-coder';

    // Check CONTEXT_MANAGER_LLM override
    if (process.env.CONTEXT_MANAGER_LLM) {
      return process.env.CONTEXT_MANAGER_LLM;
    }

    return null;
  }

  /**
   * Detect from user config file
   * Performance: <50ms
   */
  static detectFromConfig() {
    try {
      const config = ConfigUtils.loadUserConfig();
      return config.targetModel || null;
    } catch (error) {
      Logger.debug('No user config found');
      return null;
    }
  }

  /**
   * Get LLM profile by name
   * Supports built-in models + custom user models
   */
  static getProfile(modelName) {
    // Built-in profiles
    if (LLM_PROFILES[modelName]) {
      return LLM_PROFILES[modelName];
    }

    // Custom user models
    const userConfig = ConfigUtils.loadUserConfig();
    if (userConfig.customLLMs && userConfig.customLLMs[modelName]) {
      return userConfig.customLLMs[modelName];
    }

    // Unknown model - use conservative defaults
    Logger.warn(`Unknown LLM model: ${modelName}, using default profile`);
    return DEFAULT_PROFILE;
  }

  /**
   * Recommend configuration based on LLM profile and repository stats
   */
  static recommendConfiguration(profile, repoStats) {
    const { totalTokens } = repoStats;
    const { maxRecommendedInput, preferredFormat, chunkStrategy } = profile;

    const config = {
      targetModel: profile.name,
      outputFormat: preferredFormat,
      chunkingEnabled: totalTokens > maxRecommendedInput,
      chunkStrategy: chunkStrategy,
      chunkSize: Math.floor(maxRecommendedInput * 0.9), // 90% of max
      fitsInContext: totalTokens <= maxRecommendedInput
    };

    return config;
  }

  /**
   * Generate context fit analysis message
   */
  static analyzeContextFit(profile, repoStats) {
    const { totalTokens, totalFiles } = repoStats;
    const { name, contextWindow, overhead, maxRecommendedInput } = profile;

    const available = contextWindow - overhead;
    const fitsInOne = totalTokens <= maxRecommendedInput;
    const chunksNeeded = Math.ceil(totalTokens / maxRecommendedInput);

    return {
      modelName: name,
      contextWindow,
      available,
      overhead,
      repoTokens: totalTokens,
      repoFiles: totalFiles,
      fitsInOne,
      chunksNeeded,
      efficiency: (totalTokens / available) * 100
    };
  }

  /**
   * List all available LLM profiles
   */
  static listProfiles() {
    return Object.keys(LLM_PROFILES);
  }
}
```

### Wizard Integration

**File:** `lib/ui/wizard.js`

Add new step after "Use Case" selection:

```javascript
// Step 2: LLM Model Selection
const llmChoices = [
  {
    value: 'claude-sonnet-4.5',
    label: 'Claude Sonnet 4.5 (200k context)',
    description: 'Best for long-context understanding and code generation'
  },
  {
    value: 'gpt-4-turbo',
    label: 'GPT-4 Turbo (128k context)',
    description: 'Balanced performance with function calling'
  },
  {
    value: 'gpt-4o',
    label: 'GPT-4o (128k context)',
    description: 'Faster GPT-4 with vision support'
  },
  {
    value: 'gemini-1.5-pro',
    label: 'Gemini 1.5 Pro (1M context)',
    description: 'Ultra-long context for large codebases'
  },
  {
    value: 'auto',
    label: 'Auto-detect from environment',
    description: 'Detect from API keys (recommended)'
  },
  {
    value: 'custom',
    label: 'Custom model',
    description: 'Specify custom context window'
  }
];

const selectedModel = await askQuestion({
  question: 'Which LLM are you using?',
  header: 'Target Model',
  choices: llmChoices
});

// If auto-detect selected
if (selectedModel === 'auto') {
  const detected = LLMDetector.detect();
  if (detected !== 'unknown') {
    console.log(`✅ Detected: ${LLM_PROFILES[detected].name}`);
    config.targetModel = detected;
  } else {
    console.log('⚠️  Could not auto-detect. Please select manually.');
    // Loop back to selection
  }
}
```

### CLI Integration

**File:** `bin/cli.js`

```javascript
// New CLI flags
if (args.includes('--target-model')) {
  const modelIndex = args.indexOf('--target-model');
  const modelName = args[modelIndex + 1];
  config.targetModel = modelName;
}

// Auto-detect flag
if (args.includes('--auto-detect-llm')) {
  const detected = LLMDetector.detect();
  config.targetModel = detected;
  console.log(`✅ Auto-detected LLM: ${detected}`);
}

// Help text additions
console.log('LLM Optimization (v2.3.7):');
console.log('  --target-model MODEL     Optimize for specific LLM');
console.log('  --auto-detect-llm        Auto-detect LLM from environment');
console.log('  --list-llms              Show all supported LLMs');
console.log();
console.log('Supported LLMs:');
console.log('  claude-sonnet-4.5        Claude Sonnet 4.5 (200k context)');
console.log('  gpt-4-turbo              GPT-4 Turbo (128k context)');
console.log('  gpt-4o                   GPT-4o (128k context)');
console.log('  gemini-1.5-pro           Gemini 1.5 Pro (1M context)');
console.log('  deepseek-coder           DeepSeek Coder (16k context)');
```

### Context Fit Analysis Display

**File:** `lib/analyzers/token-calculator.js`

Add after analysis completion:

```javascript
// Display context fit analysis if LLM model specified
if (config.targetModel) {
  const profile = LLMDetector.getProfile(config.targetModel);
  const analysis = LLMDetector.analyzeContextFit(profile, this.statistics);

  console.log();
  console.log('📊 Context Window Analysis:');
  console.log('════════════════════════════════════════════════════');
  console.log(`   Target Model: ${analysis.modelName}`);
  console.log(`   Available Context: ${analysis.available.toLocaleString()} tokens`);
  console.log(`   Your Repository: ${analysis.repoTokens.toLocaleString()} tokens`);
  console.log(`   Overhead Estimate: ~${analysis.overhead.toLocaleString()} tokens (prompts, metadata)`);
  console.log();

  if (analysis.fitsInOne) {
    console.log('   ✅ PERFECT FIT! Your entire codebase fits in one context.');
    console.log('   💡 Recommendation: Use single-file export (no chunking needed)');
  } else {
    console.log(`   ⚠️  Repository too large. Need ${analysis.chunksNeeded} chunks.`);
    console.log(`   💡 Recommendation: Enable chunking with --chunk flag`);
    console.log(`   💡 Suggested chunk size: ${Math.floor(analysis.available * 0.9).toLocaleString()} tokens`);
  }

  console.log(`   📈 Context Efficiency: ${analysis.efficiency.toFixed(1)}%`);
  console.log();
}
```

---

## 🧪 Testing Strategy

### Unit Tests

**File:** `test/test-llm-detection.js`

```javascript
import { LLMDetector } from '../lib/utils/llm-detector.js';
import assert from 'assert';

describe('LLM Detection', () => {
  beforeEach(() => {
    // Clean environment
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.CONTEXT_MANAGER_LLM;
  });

  describe('Environment Detection', () => {
    test('detects Claude from ANTHROPIC_API_KEY', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-test-fake-key';
      const model = LLMDetector.detect();
      assert.strictEqual(model, 'claude-sonnet-4.5');
    });

    test('detects GPT-4 from OPENAI_API_KEY', () => {
      process.env.OPENAI_API_KEY = 'sk-test-fake-key';
      const model = LLMDetector.detect();
      assert.strictEqual(model, 'gpt-4-turbo');
    });

    test('detects Gemini from GOOGLE_API_KEY', () => {
      process.env.GOOGLE_API_KEY = 'test-key';
      const model = LLMDetector.detect();
      assert.strictEqual(model, 'gemini-1.5-pro');
    });

    test('respects CONTEXT_MANAGER_LLM override', () => {
      process.env.CONTEXT_MANAGER_LLM = 'gpt-4o';
      const model = LLMDetector.detect();
      assert.strictEqual(model, 'gpt-4o');
    });

    test('returns unknown when no keys present', () => {
      const model = LLMDetector.detect();
      assert.strictEqual(model, 'unknown');
    });
  });

  describe('Profile Loading', () => {
    test('loads built-in Claude profile', () => {
      const profile = LLMDetector.getProfile('claude-sonnet-4.5');
      assert.strictEqual(profile.contextWindow, 200000);
      assert.strictEqual(profile.preferredFormat, 'toon');
    });

    test('loads built-in GPT-4 profile', () => {
      const profile = LLMDetector.getProfile('gpt-4-turbo');
      assert.strictEqual(profile.contextWindow, 128000);
      assert.strictEqual(profile.preferredFormat, 'json');
    });

    test('returns default profile for unknown model', () => {
      const profile = LLMDetector.getProfile('unknown-model');
      assert.strictEqual(profile.contextWindow, 100000);
    });
  });

  describe('Configuration Recommendation', () => {
    test('recommends no chunking for small repos', () => {
      const profile = LLMDetector.getProfile('claude-sonnet-4.5');
      const stats = { totalTokens: 50000, totalFiles: 20 };
      const config = LLMDetector.recommendConfiguration(profile, stats);

      assert.strictEqual(config.chunkingEnabled, false);
      assert.strictEqual(config.fitsInContext, true);
    });

    test('recommends chunking for large repos', () => {
      const profile = LLMDetector.getProfile('gpt-4-turbo');
      const stats = { totalTokens: 500000, totalFiles: 200 };
      const config = LLMDetector.recommendConfiguration(profile, stats);

      assert.strictEqual(config.chunkingEnabled, true);
      assert.strictEqual(config.fitsInContext, false);
      assert(config.chunkSize > 0);
    });
  });

  describe('Performance', () => {
    test('detection completes in <100ms', () => {
      const start = Date.now();
      LLMDetector.detect();
      const elapsed = Date.now() - start;
      assert(elapsed < 100, `Detection took ${elapsed}ms (should be <100ms)`);
    });
  });
});
```

### Integration Tests

**File:** `test/test-llm-integration.js`

```javascript
import { execSync } from 'child_process';
import assert from 'assert';

describe('LLM Integration (CLI)', () => {
  test('--target-model flag works', () => {
    const output = execSync('node bin/cli.js --cli --target-model claude-sonnet-4.5 --no-verbose', {
      encoding: 'utf-8'
    });

    assert(output.includes('Target Model: Claude Sonnet 4.5'));
    assert(output.includes('PERFECT FIT') || output.includes('chunks'));
  });

  test('--list-llms shows all models', () => {
    const output = execSync('node bin/cli.js --list-llms', {
      encoding: 'utf-8'
    });

    assert(output.includes('claude-sonnet-4.5'));
    assert(output.includes('gpt-4-turbo'));
    assert(output.includes('gemini-1.5-pro'));
  });

  test('auto-detection works with env var', () => {
    const output = execSync('ANTHROPIC_API_KEY=test node bin/cli.js --cli --auto-detect-llm --no-verbose', {
      encoding: 'utf-8'
    });

    assert(output.includes('Auto-detected LLM: claude-sonnet-4.5'));
  });
});
```

---

## 📊 Success Metrics

### KPIs (3 months post-release)

- **Adoption:** 60%+ users use LLM detection feature
- **Support:** 30%+ reduction in chunking-related support questions
- **Fit Rate:** 80%+ of repos fit in recommended context window
- **Satisfaction:** User rating >4.5/5 for smart defaults
- **Performance:** <100ms detection time (99th percentile)

### Analytics to Track

1. **Feature Usage:**
   - % of runs with `--target-model` flag
   - % of runs with auto-detection
   - Most popular LLM models

2. **Context Fit:**
   - % of repos that fit in single context
   - Average chunks needed per repo
   - Distribution of repo sizes vs LLM limits

3. **Format Preferences:**
   - Format usage by LLM model
   - TOON adoption rate with Claude
   - JSON usage with GPT-4

---

## 🚀 Implementation Plan

### Phase 1: Core Infrastructure (Days 1-2)

- [ ] Create `lib/data/llm-profiles.js` with 5 model profiles
- [ ] Create `lib/utils/llm-detector.js` with detection logic
- [ ] Add unit tests for LLMDetector class
- [ ] Performance validation (<100ms)

### Phase 2: CLI Integration (Days 3-4)

- [ ] Add `--target-model` flag to CLI
- [ ] Add `--auto-detect-llm` flag
- [ ] Add `--list-llms` command
- [ ] Update help text
- [ ] Add context fit analysis display

### Phase 3: Wizard Integration (Day 5)

- [ ] Add LLM selection step to wizard
- [ ] Add auto-detect option
- [ ] Add custom model option
- [ ] Visual context fit display

### Phase 4: Testing & Documentation (Days 6-7)

- [ ] Complete test suite (unit + integration)
- [ ] Update README with LLM optimization examples
- [ ] Update Turkish documentation
- [ ] Create video demo
- [ ] Performance benchmarking

---

## 📚 Documentation Updates

### README.md Additions

```markdown
## LLM Optimization (v2.3.7+)

Context Manager automatically optimizes for your target LLM model:

### Auto-Detection
```bash
# Detects from environment variables
export ANTHROPIC_API_KEY=sk-...
context-manager  # Auto-detects Claude Sonnet 4.5

# Explicit auto-detection
context-manager --auto-detect-llm
```

### Manual Model Selection
```bash
# Optimize for specific LLM
context-manager --target-model claude-sonnet-4.5
context-manager --target-model gpt-4-turbo
context-manager --target-model gemini-1.5-pro

# List all supported models
context-manager --list-llms
```

### Context Fit Analysis

Context Manager shows if your repository fits in the LLM's context window:

```
📊 Context Window Analysis:
   Target Model: Claude Sonnet 4.5
   Available Context: 200,000 tokens
   Your Repository: 181,480 tokens

   ✅ PERFECT FIT! Your entire codebase fits in one context.
   💡 Recommendation: Use single-file export (no chunking needed)
```

### Custom Models

Define custom LLM models in `.contextmanagerrc.js`:

```javascript
export default {
  customLLMs: {
    'my-custom-gpt': {
      name: 'My Fine-Tuned GPT-4',
      contextWindow: 100000,
      overhead: 5000,
      preferredFormat: 'json',
      chunkStrategy: 'smart'
    }
  }
};
```
```

---

## 🔮 Future Enhancements

### v2.4.0: Auto-Suggest Format

Build on LLM detection to auto-suggest best format:

```bash
✨ Recommended Output Format: TOON
   Reason: Claude Sonnet 4.5 works best with TOON format.
   Token savings: ~72k tokens (40% reduction)
```

### v2.4.1: Auto-Chunk Size

Auto-calculate optimal chunk size:

```bash
✨ Auto-detected chunk size: 180,000 tokens
   Reason: Claude Sonnet 4.5 has 200k context, leaving 20k for prompts.
```

### v3.0+: Remote Model Registry

Fetch latest model specs from API:

```bash
context-manager --update-models  # Fetch latest LLM specs
```

---

## 📋 Appendix

### Engineering Team Decisions

#### 1. Architecture: Hardcoded vs Remote Registry?
**Decision:** Hardcoded for v2.3.7, remote registry in v3.0+
**Rationale:** Zero latency, offline support, simpler maintenance

#### 2. Extensibility: Plugin System for Custom Models?
**Decision:** Config file support for v2.3.7, full plugin system in v3.0+
**Rationale:** Simple, flexible, sufficient for most users

#### 3. Performance: Acceptable Detection Delay?
**Decision:** <100ms threshold
**Rationale:** Fast enough to be imperceptible, strict SLA

#### 4. Testing: How to Test Without API Keys?
**Decision:** Mock environment variables + fixture config files
**Rationale:** CI/CD friendly, no real credentials needed

### Versioning Decision

**Chosen:** v2.3.7 (Phase 1 completion patch)
**Rationale:**
- No breaking changes
- Completes Phase 1 theme
- Saves v2.4.0 for comprehensive Smart Context release

---

## ✅ Approval & Sign-Off

- [x] Product Analysis Complete
- [x] Engineering Questions Answered
- [x] Architecture Decided
- [x] Testing Strategy Defined
- [x] Ready for Implementation

**Next Steps:**
1. Create GitHub issue for v2.3.7
2. Begin Day 1 implementation (LLM profiles + detector)
3. Daily standups to track progress
4. Target completion: 7 days from start

---

**Document Version:** 1.0
**Last Updated:** 2025-11-05
**Review Date:** 2025-11-12 (post-implementation review)
