/**
 * LLM Detector
 * Auto-detects target LLM model and provides optimization recommendations
 * v2.3.7 feature - JSON config based
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import ConfigUtils from './config-utils.js';
import { getLogger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lazy-loaded profiles cache
let profilesCache = null;

// Logger instance
const logger = getLogger('LLMDetector');

export class LLMDetector {
  /**
   * Load LLM profiles from JSON config
   * Merges built-in profiles with custom user profiles
   * @returns {object} All LLM profiles
   */
  static loadProfiles() {
    // Return cached if available
    if (profilesCache) {
      return profilesCache;
    }

    try {
      // Load built-in profiles
      const profilesPath = resolve(__dirname, '../../.context-manager/llm-profiles.json');
      const profilesData = JSON.parse(readFileSync(profilesPath, 'utf-8'));
      const builtInProfiles = profilesData.profiles || {};
      const defaultProfile = profilesData.default;

      // Try to load custom profiles
      let customProfiles = {};
      try {
        const customPath = resolve(__dirname, '../../.context-manager/custom-profiles.json');
        const customData = JSON.parse(readFileSync(customPath, 'utf-8'));
        customProfiles = customData.profiles || {};
        logger.debug(`Loaded ${Object.keys(customProfiles).length} custom LLM profiles`);
      } catch (error) {
        // Custom profiles optional
        logger.debug('No custom profiles found (optional)');
      }

      // Merge profiles (custom overrides built-in)
      const allProfiles = {
        ...builtInProfiles,
        ...customProfiles
      };

      // Cache the result
      profilesCache = {
        profiles: allProfiles,
        default: defaultProfile
      };

      logger.debug(`Loaded ${Object.keys(allProfiles).length} total LLM profiles`);
      return profilesCache;

    } catch (error) {
      logger.error(`Failed to load LLM profiles: ${error.message}`);

      // Fallback to minimal built-in if JSON load fails
      const fallback = {
        profiles: {
          'claude-sonnet-4.5': {
            name: 'Claude Sonnet 4.5',
            vendor: 'Anthropic',
            contextWindow: 200000,
            utilizationPercentage: 0.6,
            maxRecommendedInput: 120000,
            preferredFormat: 'toon',
            chunkStrategy: 'smart'
          },
          'gpt-4o': {
            name: 'GPT-4o',
            vendor: 'OpenAI',
            contextWindow: 128000,
            utilizationPercentage: 0.6,
            maxRecommendedInput: 76800,
            preferredFormat: 'json',
            chunkStrategy: 'smart'
          }
        },
        default: {
          name: 'Unknown Model',
          contextWindow: 100000,
          utilizationPercentage: 0.6,
          maxRecommendedInput: 60000,
          preferredFormat: 'json',
          chunkStrategy: 'smart'
        }
      };

      profilesCache = fallback;
      return fallback;
    }
  }

  /**
   * Get default profile for unknown models
   * @returns {object} Default profile
   */
  static getDefaultProfile() {
    const data = this.loadProfiles();
    return data.default;
  }

  /**
   * Get all profiles
   * @returns {object} All LLM profiles
   */
  static getAllProfiles() {
    const data = this.loadProfiles();
    return data.profiles;
  }
  /**
   * Auto-detect LLM from environment and config
   * Performance target: <100ms
   * @returns {string} Detected model name or 'unknown'
   */
  static detect() {
    const startTime = Date.now();

    try {
      // 1. Check environment variables (fastest, <1ms)
      const envModel = this.detectFromEnv();
      if (envModel && envModel !== 'unknown') {
        logger.debug(`LLM detected from environment: ${envModel}`);
        return envModel;
      }

      // 2. Check user config (slower but still fast, <50ms)
      const configModel = this.detectFromConfig();
      if (configModel && configModel !== 'unknown') {
        logger.debug(`LLM detected from config: ${configModel}`);
        return configModel;
      }

      logger.debug('No LLM detected, using defaults');
      return 'unknown';

    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed > 100) {
        logger.warn(`LLM detection took ${elapsed}ms (threshold: 100ms)`);
      } else {
        logger.debug(`LLM detection completed in ${elapsed}ms`);
      }
    }
  }

  /**
   * Detect from environment variables
   * Checks for API keys and explicit overrides
   * @returns {string|null} Model name or null
   */
  static detectFromEnv() {
    // Explicit override
    if (process.env.CONTEXT_MANAGER_LLM) {
      return process.env.CONTEXT_MANAGER_LLM;
    }

    // Anthropic (Claude)
    if (process.env.ANTHROPIC_API_KEY) {
      return 'claude-sonnet-4.5'; // Default to Sonnet
    }

    // OpenAI (GPT-4)
    if (process.env.OPENAI_API_KEY) {
      return 'gpt-4o'; // Default to GPT-4o (most capable)
    }

    // Google (Gemini)
    if (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) {
      return 'gemini-2.0-flash'; // Default to Flash (fastest)
    }

    // DeepSeek
    if (process.env.DEEPSEEK_API_KEY) {
      return 'deepseek-chat'; // Default to Chat
    }

    return null;
  }

  /**
   * Detect from user configuration file
   * @returns {string|null} Model name or null
   */
  static detectFromConfig() {
    try {
      const config = ConfigUtils.loadUserConfig();
      if (config && config.targetModel) {
        return config.targetModel;
      }
    } catch (error) {
      logger.debug(`Config file not found or invalid: ${error.message}`);
    }
    return null;
  }

  /**
   * Get LLM profile by name
   * Supports built-in and custom user models
   * @param {string} modelName - Model identifier
   * @returns {object} LLM profile
   */
  static getProfile(modelName) {
    // Unknown model
    if (!modelName || modelName === 'unknown') {
      return this.getDefaultProfile();
    }

    // Load all profiles
    const allProfiles = this.getAllProfiles();

    // Check if profile exists
    if (allProfiles[modelName]) {
      return allProfiles[modelName];
    }

    // Fallback to default
    logger.warn(`Unknown LLM model: ${modelName}, using default profile`);
    return {
      ...this.getDefaultProfile(),
      name: modelName
    };
  }

  /**
   * Recommend optimal configuration based on LLM profile and repository stats
   * @param {object} profile - LLM profile
   * @param {object} repoStats - Repository statistics
   * @returns {object} Configuration recommendations
   */
  static recommendConfiguration(profile, repoStats) {
    const { totalTokens, totalFiles } = repoStats;
    const { maxRecommendedInput, preferredFormat, chunkStrategy, utilizationPercentage } = profile;

    const fitsInContext = totalTokens <= maxRecommendedInput;
    const chunksNeeded = fitsInContext ? 1 : Math.ceil(totalTokens / maxRecommendedInput);

    // Chunk size should also respect 60% rule
    const recommendedChunkSize = maxRecommendedInput;

    return {
      targetModel: profile.name,
      outputFormat: preferredFormat,
      chunkingEnabled: !fitsInContext,
      chunkStrategy: chunkStrategy,
      chunkSize: recommendedChunkSize,
      chunksNeeded: chunksNeeded,
      fitsInContext: fitsInContext,
      utilizationPercentage: Math.round((utilizationPercentage || 0.6) * 100),
      utilizationActual: (totalTokens / maxRecommendedInput) * 100
    };
  }

  /**
   * Analyze context fit - detailed analysis for display
   * @param {object} profile - LLM profile
   * @param {object} repoStats - Repository statistics
   * @returns {object} Context fit analysis
   */
  static analyzeContextFit(profile, repoStats) {
    const { totalTokens, totalFiles } = repoStats;
    const { name, contextWindow, maxRecommendedInput, utilizationPercentage } = profile;

    // Calculate usable context (60% of total by default)
    const utilization = utilizationPercentage || 0.6;
    const usableContext = maxRecommendedInput; // Already calculated as 60%
    const reservedForSystem = contextWindow - usableContext; // 40% reserved

    const fitsInOne = totalTokens <= usableContext;
    const chunksNeeded = fitsInOne ? 1 : Math.ceil(totalTokens / usableContext);
    const utilizationActual = (totalTokens / usableContext) * 100; // % of usable context

    return {
      modelName: name,
      contextWindow,
      usableContext,
      reservedForSystem,
      utilizationPercentage: Math.round(utilization * 100),
      repoTokens: totalTokens,
      repoFiles: totalFiles,
      fitsInOne,
      chunksNeeded,
      utilizationActual,
      recommendation: this.getRecommendation(fitsInOne, chunksNeeded, utilizationActual)
    };
  }

  /**
   * Get recommendation message based on context fit
   * @param {boolean} fitsInOne - Whether repo fits in one context
   * @param {number} chunksNeeded - Number of chunks needed
   * @param {number} utilizationActual - Actual utilization percentage
   * @returns {string} Recommendation message
   */
  static getRecommendation(fitsInOne, chunksNeeded, utilizationActual) {
    if (fitsInOne) {
      if (utilizationActual < 50) {
        return 'Plenty of room for system prompts and responses.';
      } else if (utilizationActual < 80) {
        return 'Your entire codebase fits comfortably.';
      } else if (utilizationActual <= 100) {
        return 'Repository uses most of available context.';
      } else {
        // Should not happen if fitsInOne is true, but safety check
        return 'Context limit exceeded. Enable chunking.';
      }
    } else {
      if (chunksNeeded <= 3) {
        return `Repository requires ${chunksNeeded} chunks. Enable chunking with --chunk flag.`;
      } else if (chunksNeeded <= 10) {
        return `Large repository needs ${chunksNeeded} chunks. Consider filtering with .contextinclude.`;
      } else {
        return `Very large repository (${chunksNeeded} chunks). Strongly recommend filtering to key files.`;
      }
    }
  }

  /**
   * List all available LLM profiles
   * @returns {string[]} Array of model identifiers
   */
  static listProfiles() {
    const allProfiles = this.getAllProfiles();
    return Object.keys(allProfiles);
  }

  /**
   * Get human-readable list of models with details
   * @returns {object[]} Array of model details
   */
  static getModelList() {
    const allProfiles = this.getAllProfiles();
    return Object.entries(allProfiles).map(([key, profile]) => ({
      id: key,
      name: profile.name,
      vendor: profile.vendor,
      contextWindow: profile.contextWindow,
      preferredFormat: profile.preferredFormat
    }));
  }

  /**
   * Format context fit analysis for CLI display
   * @param {object} analysis - Context fit analysis
   * @returns {string} Formatted text
   */
  static formatAnalysis(analysis) {
    const lines = [];

    lines.push('');
    lines.push('📊 Context Window Analysis:');
    lines.push('════════════════════════════════════════════════════');
    lines.push(`   Target Model: ${analysis.modelName}`);
    lines.push(`   Total Context: ${analysis.contextWindow.toLocaleString()} tokens`);
    lines.push(`   Usable Context: ${analysis.usableContext.toLocaleString()} tokens (${analysis.utilizationPercentage}% policy)`);
    lines.push(`   Reserved for System: ${analysis.reservedForSystem.toLocaleString()} tokens (${100 - analysis.utilizationPercentage}%)`);
    lines.push('');
    lines.push(`   Your Repository: ${analysis.repoTokens.toLocaleString()} tokens (${analysis.repoFiles} files)`);

    if (analysis.fitsInOne) {
      // Show utilization only if it fits
      lines.push(`   Utilization: ${analysis.utilizationActual.toFixed(1)}% of usable context`);
      lines.push('');

      // Determine fit quality
      let fitStatus = '';
      if (analysis.utilizationActual < 50) {
        fitStatus = '✅ EXCELLENT FIT!';
      } else if (analysis.utilizationActual < 80) {
        fitStatus = '✅ GOOD FIT!';
      } else {
        fitStatus = '⚠️  ACCEPTABLE FIT';
      }

      lines.push(`   ${fitStatus}`);
      lines.push(`   ${analysis.recommendation}`);
      lines.push('   💡 Recommendation: Use single-file export (no chunking needed)');
    } else {
      // Show excess instead of percentage over 100%
      const excess = analysis.repoTokens - analysis.usableContext;
      const excessMultiplier = (analysis.repoTokens / analysis.usableContext).toFixed(1);

      lines.push(`   Exceeds by: ${excess.toLocaleString()} tokens (${excessMultiplier}x usable context)`);
      lines.push('');
      lines.push(`   ❌ TOO LARGE! Repository exceeds usable context.`);
      lines.push(`   📦 Chunks Needed: ${analysis.chunksNeeded}`);
      lines.push('   💡 Recommendation: Enable chunking with --chunk flag');
      lines.push(`   💡 Or: Filter files with .contextinclude to fit in ${analysis.usableContext.toLocaleString()} tokens`);
    }

    lines.push('');

    return lines.join('\n');
  }
}
