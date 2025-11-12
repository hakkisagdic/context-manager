/**
 * TokenBudgetFitter - Token Budget Optimization
 * v3.1.0 - Token Budget Fitter
 *
 * Responsibilities:
 * - Fit file lists within token budgets
 * - Apply intelligent fitting strategies
 * - Calculate file importance scores
 * - Generate fit reports
 */

import { getLogger } from '../utils/logger.js';
import { FitStrategies } from './fit-strategies.js';

const logger = getLogger('TokenBudgetFitter');

/**
 * @typedef {Object} FitOptions
 * @property {boolean} [preserveEntryPoints=true] - Keep entry points
 * @property {number} [minFiles] - Minimum number of files to include
 * @property {number} [maxFiles] - Maximum number of files to include
 * @property {string[]} [priorityPatterns] - Patterns for high-priority files
 */

/**
 * @typedef {Object} FitResult
 * @property {Array} files - Files that fit within budget
 * @property {number} totalTokens - Total tokens after fitting
 * @property {number} originalTokens - Original token count
 * @property {number} reduction - Token reduction amount
 * @property {number} reductionPercent - Reduction percentage
 * @property {string} strategy - Strategy used
 * @property {Array} excluded - Files that were excluded
 * @property {Object} metadata - Additional metadata
 */

/**
 * @typedef {Object} FitReport
 * @property {string} summary - Human-readable summary
 * @property {Object} details - Detailed information
 * @property {string[]} [recommendations] - Suggestions for improvement
 */

export class TokenBudgetFitter {
  /**
   * Create a TokenBudgetFitter instance
   * @param {number} targetTokens - Target token budget
   * @param {string} [strategy='auto'] - Fitting strategy
   */
  constructor(targetTokens, strategy = 'auto') {
    this.targetTokens = targetTokens;
    this.strategy = strategy;
    this.entryPointPatterns = [
      'index.js',
      'index.ts',
      'main.js',
      'main.ts',
      'app.js',
      'app.ts',
      'server.js',
      'server.ts',
      'src/index.js',
      'src/index.ts',
      'src/main.js',
      'src/main.ts',
      'lib/index.js',
      'lib/index.ts'
    ];
  }

  /**
   * Fit files to token budget
   * @param {Array} files - Array of file objects with token counts
   * @param {FitOptions} [options={}] - Fitting options
   * @returns {FitResult} Fit result
   */
  fitToWindow(files, options = {}) {
    const opts = {
      preserveEntryPoints: true,
      ...options
    };

    // Calculate original token count
    const originalTokens = this.calculateTotalTokens(files);

    logger.info(`Fitting ${files.length} files (${originalTokens} tokens) to ${this.targetTokens} tokens`);

    // Check if already fits
    if (originalTokens <= this.targetTokens) {
      logger.info('Files already fit within budget');
      return {
        files: files,
        totalTokens: originalTokens,
        originalTokens: originalTokens,
        reduction: 0,
        reductionPercent: 0,
        strategy: 'none',
        excluded: [],
        metadata: {
          entryPointsPreserved: 0,
          filesIncluded: files.length,
          filesExcluded: 0,
          averageImportance: 0
        }
      };
    }

    // Mark entry points
    this.markEntryPoints(files);

    // Calculate importance scores
    this.calculateImportanceScores(files, opts);

    // Apply fitting strategy
    let result;
    try {
      result = this.applyStrategy(files, opts);
    } catch (error) {
      logger.error(`Fitting failed: ${error.message}`);
      throw new TokenBudgetError(`Failed to fit within budget: ${error.message}`);
    }

    // Calculate statistics
    const totalTokens = this.calculateTotalTokens(result.files);
    const reduction = originalTokens - totalTokens;
    const reductionPercent = (reduction / originalTokens) * 100;

    const entryPointsPreserved = result.files.filter(f => f.isEntryPoint).length;
    const averageImportance = result.files.reduce((sum, f) => sum + (f.importance || 0), 0) / result.files.length;

    logger.info(`Fit complete: ${result.files.length} files, ${totalTokens} tokens (${reductionPercent.toFixed(1)}% reduction)`);

    return {
      files: result.files,
      totalTokens: totalTokens,
      originalTokens: originalTokens,
      reduction: reduction,
      reductionPercent: reductionPercent,
      strategy: result.strategy,
      excluded: result.excluded,
      metadata: {
        entryPointsPreserved: entryPointsPreserved,
        filesIncluded: result.files.length,
        filesExcluded: result.excluded.length,
        averageImportance: averageImportance
      }
    };
  }

  /**
   * Apply fitting strategy
   * @param {Array} files - Files to fit
   * @param {FitOptions} options - Fitting options
   * @returns {Object} Strategy result
   * @private
   */
  applyStrategy(files, options) {
    const strategy = this.strategy === 'auto' 
      ? this.recommendStrategy(files, this.targetTokens)
      : this.strategy;

    logger.info(`Applying strategy: ${strategy}`);

    let result;
    switch (strategy) {
      case 'shrink-docs':
        result = FitStrategies.shrinkDocs(files, this.targetTokens, options);
        break;
      case 'methods-only':
        result = FitStrategies.methodsOnly(files, this.targetTokens, options);
        break;
      case 'top-n':
        result = FitStrategies.topN(files, this.targetTokens, options);
        break;
      case 'balanced':
        result = FitStrategies.balanced(files, this.targetTokens, options);
        break;
      default:
        result = FitStrategies.auto(files, this.targetTokens, options);
    }

    return {
      files: result.files,
      excluded: result.excluded,
      strategy: strategy
    };
  }

  /**
   * Recommend best strategy for current situation
   * @param {Array} files - Files to analyze
   * @param {number} targetTokens - Target token budget
   * @returns {string} Recommended strategy
   */
  recommendStrategy(files, targetTokens) {
    const totalTokens = this.calculateTotalTokens(files);
    const overBudget = totalTokens - targetTokens;
    const overBudgetPercent = (overBudget / totalTokens) * 100;

    // Count documentation files
    const docFiles = files.filter(f => 
      f.relativePath.includes('docs/') || 
      f.relativePath.endsWith('.md') ||
      f.relativePath.includes('README')
    );
    const docTokens = this.calculateTotalTokens(docFiles);
    const docPercent = (docTokens / totalTokens) * 100;

    logger.debug(`Over budget by ${overBudgetPercent.toFixed(1)}%, docs: ${docPercent.toFixed(1)}%`);

    // If only slightly over budget and lots of docs, remove docs
    if (overBudgetPercent < 30 && docPercent > 20) {
      return 'shrink-docs';
    }

    // If moderately over budget, use balanced approach
    if (overBudgetPercent < 50) {
      return 'balanced';
    }

    // If significantly over budget, use methods-only
    if (overBudgetPercent < 70) {
      return 'methods-only';
    }

    // If way over budget, select top N files
    return 'top-n';
  }

  /**
   * Calculate importance score for a file
   * @param {Object} file - File object
   * @param {FitOptions} options - Fitting options
   * @returns {number} Importance score (0-100)
   */
  calculateImportance(file, options = {}) {
    let score = 50; // Base score

    // Entry points are very important
    if (file.isEntryPoint) {
      score += 30;
    }

    // Shorter paths are more important (likely core files)
    const pathDepth = file.relativePath.split('/').length;
    score += Math.max(0, 10 - pathDepth * 2);

    // Certain directories are more important
    if (file.relativePath.startsWith('src/')) score += 10;
    if (file.relativePath.startsWith('lib/')) score += 10;
    if (file.relativePath.includes('/core/')) score += 15;
    if (file.relativePath.includes('/api/')) score += 10;

    // Less important directories
    if (file.relativePath.includes('/test/')) score -= 20;
    if (file.relativePath.includes('/docs/')) score -= 15;
    if (file.relativePath.includes('/examples/')) score -= 10;

    // File extensions
    if (file.extension === '.js' || file.extension === '.ts') score += 5;
    if (file.extension === '.md') score -= 10;

    // Priority patterns from options
    if (options.priorityPatterns) {
      for (const pattern of options.priorityPatterns) {
        if (this.matchesPattern(file.relativePath, pattern)) {
          score += 20;
          break;
        }
      }
    }

    // Normalize to 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate importance scores for all files
   * @param {Array} files - Files to score
   * @param {FitOptions} options - Fitting options
   * @private
   */
  calculateImportanceScores(files, options) {
    for (const file of files) {
      file.importance = this.calculateImportance(file, options);
    }
  }

  /**
   * Mark entry point files
   * @param {Array} files - Files to check
   * @private
   */
  markEntryPoints(files) {
    for (const file of files) {
      file.isEntryPoint = this.entryPointPatterns.some(pattern => 
        file.relativePath === pattern || file.relativePath.endsWith('/' + pattern)
      );
    }
  }

  /**
   * Calculate total tokens for file list
   * @param {Array} files - Files to count
   * @returns {number} Total token count
   * @private
   */
  calculateTotalTokens(files) {
    return files.reduce((sum, file) => sum + (file.tokens || 0), 0);
  }

  /**
   * Check if file path matches pattern
   * @param {string} path - File path
   * @param {string} pattern - Pattern to match
   * @returns {boolean} True if matches
   * @private
   */
  matchesPattern(path, pattern) {
    // Simple glob pattern matching
    const regex = new RegExp(
      '^' + pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
      + '$'
    );
    return regex.test(path);
  }

  /**
   * Check if files fit within budget
   * @param {Array} files - Files to check
   * @returns {boolean} True if fits
   */
  checkFit(files) {
    const totalTokens = this.calculateTotalTokens(files);
    return totalTokens <= this.targetTokens;
  }

  /**
   * Generate fit report
   * @param {FitResult} result - Fit result
   * @returns {FitReport} Fit report
   */
  generateReport(result) {
    const fitQuality = this.determineFitQuality(result);

    const summary = this.generateSummary(result, fitQuality);
    const recommendations = this.generateRecommendations(result, fitQuality);

    return {
      summary: summary,
      details: {
        strategy: result.strategy,
        targetTokens: this.targetTokens,
        actualTokens: result.totalTokens,
        fit: fitQuality,
        filesIncluded: result.metadata.filesIncluded,
        filesExcluded: result.metadata.filesExcluded,
        reduction: result.reduction,
        reductionPercent: result.reductionPercent
      },
      recommendations: recommendations
    };
  }

  /**
   * Determine fit quality
   * @param {FitResult} result - Fit result
   * @returns {string} Fit quality (perfect, good, tight)
   * @private
   */
  determineFitQuality(result) {
    const utilization = (result.totalTokens / this.targetTokens) * 100;

    if (utilization <= 80) return 'perfect';
    if (utilization <= 95) return 'good';
    return 'tight';
  }

  /**
   * Generate summary text
   * @param {FitResult} result - Fit result
   * @param {string} fitQuality - Fit quality
   * @returns {string} Summary text
   * @private
   */
  generateSummary(result, fitQuality) {
    const lines = [];

    lines.push(`✅ Successfully fit ${result.metadata.filesIncluded} files within ${this.targetTokens} token budget`);
    lines.push(`   Strategy: ${result.strategy}`);
    lines.push(`   Tokens: ${result.totalTokens} / ${this.targetTokens} (${fitQuality} fit)`);
    lines.push(`   Reduction: ${result.reduction} tokens (${result.reductionPercent.toFixed(1)}%)`);
    
    if (result.metadata.filesExcluded > 0) {
      lines.push(`   Excluded: ${result.metadata.filesExcluded} files`);
    }

    if (result.metadata.entryPointsPreserved > 0) {
      lines.push(`   Entry points preserved: ${result.metadata.entryPointsPreserved}`);
    }

    return lines.join('\n');
  }

  /**
   * Generate recommendations
   * @param {FitResult} result - Fit result
   * @param {string} fitQuality - Fit quality
   * @returns {string[]} Recommendations
   * @private
   */
  generateRecommendations(result, fitQuality) {
    const recommendations = [];

    if (fitQuality === 'tight') {
      recommendations.push('Consider increasing token budget for better coverage');
      recommendations.push('Try "methods-only" strategy for more aggressive reduction');
    }

    if (result.metadata.filesExcluded > result.metadata.filesIncluded) {
      recommendations.push('Many files were excluded - consider reviewing filter patterns');
    }

    if (result.strategy === 'top-n') {
      recommendations.push('Using top-N strategy - some important files may be missing');
      recommendations.push('Review excluded files to ensure nothing critical was removed');
    }

    return recommendations;
  }
}

/**
 * Custom error for token budget issues
 */
export class TokenBudgetError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TokenBudgetError';
  }
}

/**
 * Custom error for impossible fit scenarios
 */
export class ImpossibleFitError extends TokenBudgetError {
  constructor(targetTokens, minTokens) {
    super(`Cannot fit within ${targetTokens} tokens. Minimum required: ${minTokens}`);
    this.name = 'ImpossibleFitError';
    this.targetTokens = targetTokens;
    this.minTokens = minTokens;
  }
}

export default TokenBudgetFitter;
