/**
 * FitStrategies - Token Budget Fitting Strategies
 * v3.1.0 - Token Budget Fitter
 *
 * Responsibilities:
 * - Implement various token reduction strategies
 * - Provide intelligent file selection algorithms
 * - Balance coverage vs token count
 */

import { getLogger } from '../utils/logger.js';

const logger = getLogger('FitStrategies');

/**
 * @typedef {Object} StrategyResult
 * @property {Array} files - Files that fit within budget
 * @property {Array} excluded - Files that were excluded
 */

export class FitStrategies {
  /**
   * Automatically select and apply best strategy
   * @param {Array} files - Files to fit
   * @param {number} targetTokens - Target token budget
   * @param {Object} options - Fitting options
   * @returns {StrategyResult} Strategy result
   */
  static auto(files, targetTokens, options = {}) {
    logger.debug('Applying auto strategy');

    // Try strategies in order of preference
    const strategies = [
      'shrink-docs',
      'balanced',
      'methods-only',
      'top-n'
    ];

    for (const strategy of strategies) {
      try {
        // Convert kebab-case to camelCase (e.g., 'shrink-docs' -> 'shrinkDocs')
        const methodName = strategy.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        const result = this[methodName](files, targetTokens, options);
        const totalTokens = this.calculateTotalTokens(result.files);

        if (totalTokens <= targetTokens) {
          logger.info(`Auto strategy selected: ${strategy}`);
          return result;
        }
      } catch (error) {
        logger.warn(`Strategy ${strategy} failed: ${error.message}`);
      }
    }

    // If all strategies fail, return top-n as last resort
    return this.topN(files, targetTokens, options);
  }

  /**
   * Remove documentation and comments first
   * @param {Array} files - Files to fit
   * @param {number} targetTokens - Target token budget
   * @param {Object} options - Fitting options
   * @returns {StrategyResult} Strategy result
   */
  static shrinkDocs(files, targetTokens, options = {}) {
    logger.debug('Applying shrink-docs strategy');

    const included = [];
    const excluded = [];

    // Separate documentation files
    const docFiles = [];
    const codeFiles = [];

    for (const file of files) {
      if (this.isDocumentationFile(file)) {
        docFiles.push(file);
      } else {
        codeFiles.push(file);
      }
    }

    // Start with all code files
    let currentTokens = this.calculateTotalTokens(codeFiles);

    if (currentTokens <= targetTokens) {
      // Code files fit, add docs until budget is reached
      included.push(...codeFiles);

      // Sort docs by importance
      docFiles.sort((a, b) => (b.importance || 0) - (a.importance || 0));

      for (const doc of docFiles) {
        if (currentTokens + doc.tokens <= targetTokens) {
          included.push(doc);
          currentTokens += doc.tokens;
        } else {
          excluded.push(doc);
        }
      }
    } else {
      // Even code files don't fit, exclude docs and apply balanced strategy
      excluded.push(...docFiles);
      const balancedResult = this.balanced(codeFiles, targetTokens, options);
      included.push(...balancedResult.files);
      excluded.push(...balancedResult.excluded);
    }

    return { files: included, excluded };
  }

  /**
   * Extract only methods, exclude full files
   * @param {Array} files - Files to fit
   * @param {number} targetTokens - Target token budget
   * @param {Object} options - Fitting options
   * @returns {StrategyResult} Strategy result
   */
  static methodsOnly(files, targetTokens, options = {}) {
    logger.debug('Applying methods-only strategy');

    const included = [];
    const excluded = [];

    // Sort files by importance
    const sortedFiles = [...files].sort((a, b) => (b.importance || 0) - (a.importance || 0));

    let currentTokens = 0;

    for (const file of sortedFiles) {
      // Estimate method tokens (assume methods are 60% of file)
      const methodTokens = Math.floor(file.tokens * 0.6);

      if (currentTokens + methodTokens <= targetTokens) {
        // Mark file for method extraction
        const methodFile = { ...file, methodsOnly: true, tokens: methodTokens };
        included.push(methodFile);
        currentTokens += methodTokens;
      } else {
        excluded.push(file);
      }
    }

    // Preserve entry points even if over budget
    if (options.preserveEntryPoints) {
      // Collect files to swap first to avoid mutating array during iteration
      const filesToSwap = [];
      for (const file of excluded) {
        if (file.isEntryPoint && currentTokens + file.tokens * 0.6 <= targetTokens * 1.1) {
          filesToSwap.push(file);
        }
      }

      // Apply swaps after iteration
      for (const file of filesToSwap) {
        const idx = excluded.indexOf(file);
        if (idx !== -1) {
          excluded.splice(idx, 1);
          const methodFile = { ...file, methodsOnly: true, tokens: Math.floor(file.tokens * 0.6) };
          included.push(methodFile);
          currentTokens += methodFile.tokens;
        }
      }
    }

    return { files: included, excluded };
  }

  /**
   * Select top N files by importance
   * @param {Array} files - Files to fit
   * @param {number} targetTokens - Target token budget
   * @param {Object} options - Fitting options
   * @returns {StrategyResult} Strategy result
   */
  static topN(files, targetTokens, options = {}) {
    logger.debug('Applying top-n strategy');

    const included = [];
    const excluded = [];

    // Sort files by importance (descending)
    const sortedFiles = [...files].sort((a, b) => (b.importance || 0) - (a.importance || 0));

    let currentTokens = 0;

    for (const file of sortedFiles) {
      if (currentTokens + file.tokens <= targetTokens) {
        included.push(file);
        currentTokens += file.tokens;
      } else {
        excluded.push(file);
      }
    }

    // Ensure minimum files if specified
    if (options.minFiles && included.length < options.minFiles) {
      logger.warn(`Only ${included.length} files fit, but minFiles is ${options.minFiles}`);
    }

    return { files: included, excluded };
  }

  /**
   * Balance coverage vs size
   * @param {Array} files - Files to fit
   * @param {number} targetTokens - Target token budget
   * @param {Object} options - Fitting options
   * @returns {StrategyResult} Strategy result
   */
  static balanced(files, targetTokens, options = {}) {
    logger.debug('Applying balanced strategy');

    const included = [];
    const excluded = [];

    // Calculate efficiency score (importance / tokens)
    const scoredFiles = files.map(file => ({
      ...file,
      efficiency: (file.importance || 50) / Math.max(file.tokens, 1)
    }));

    // Sort by efficiency (descending)
    scoredFiles.sort((a, b) => b.efficiency - a.efficiency);

    let currentTokens = 0;

    // First pass: Add high-efficiency files
    for (const file of scoredFiles) {
      if (currentTokens + file.tokens <= targetTokens) {
        included.push(file);
        currentTokens += file.tokens;
      } else {
        excluded.push(file);
      }
    }

    // Second pass: Try to add entry points if not included
    if (options.preserveEntryPoints) {
      // Collect swaps to avoid mutating array during iteration
      const swapsToApply = [];
      for (const file of excluded) {
        if (file.isEntryPoint) {
          // Try to make room by removing least efficient file
          const leastEfficient = included.reduce((min, f) => 
            f.efficiency < min.efficiency ? f : min
          );

          if (leastEfficient && !leastEfficient.isEntryPoint && 
              currentTokens - leastEfficient.tokens + file.tokens <= targetTokens) {
            swapsToApply.push({ file, leastEfficient });
          }
        }
      }

      // Apply swaps after iteration
      for (const { file, leastEfficient } of swapsToApply) {
        const leastEfficientIdx = included.indexOf(leastEfficient);
        const fileIdx = excluded.indexOf(file);
        
        if (leastEfficientIdx !== -1 && fileIdx !== -1) {
          included.splice(leastEfficientIdx, 1);
          excluded.splice(fileIdx, 1);
          included.push(file);
          excluded.push(leastEfficient);
          currentTokens = currentTokens - leastEfficient.tokens + file.tokens;
        }
      }
    }

    return { files: included, excluded };
  }

  /**
   * Check if file is documentation
   * @param {Object} file - File object
   * @returns {boolean} True if documentation file
   * @private
   */
  static isDocumentationFile(file) {
    return (
      file.extension === '.md' ||
      file.relativePath.includes('docs/') ||
      file.relativePath.includes('README') ||
      file.relativePath.includes('CHANGELOG') ||
      file.relativePath.includes('LICENSE') ||
      file.relativePath.includes('CONTRIBUTING')
    );
  }

  /**
   * Calculate total tokens for file list
   * @param {Array} files - Files to count
   * @returns {number} Total token count
   * @private
   */
  static calculateTotalTokens(files) {
    return files.reduce((sum, file) => sum + (file.tokens || 0), 0);
  }
}

export default FitStrategies;
