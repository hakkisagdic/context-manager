/**
 * Token Budget Fitter
 * Automatically fits files within token budgets using various strategies
 */

const FitStrategies = require('./fit-strategies');

class TokenBudgetFitter {
    /**
     * Create a new TokenBudgetFitter
     * @param {number} targetTokens - Target token limit
     * @param {object} options - Fitter options
     */
    constructor(targetTokens, options = {}) {
        this.targetTokens = targetTokens;
        this.options = {
            strategy: 'auto',
            verbose: false,
            preserveEntryPoints: true,
            ...options
        };
    }

    /**
     * Fit files to token budget
     * @param {Array} files - Array of file objects with tokens
     * @returns {object} Fit result with selected files and stats
     */
    fit(files) {
        if (!Array.isArray(files) || files.length === 0) {
            return {
                files: [],
                totalTokens: 0,
                excluded: 0,
                strategy: 'none',
                fits: true,
                message: 'No files to fit'
            };
        }

        const currentTokens = FitStrategies.calculateTotal(files);

        // Already fits
        if (currentTokens <= this.targetTokens) {
            return {
                files: files,
                totalTokens: currentTokens,
                excluded: 0,
                strategy: 'none (already fits)',
                fits: true,
                message: `Current ${currentTokens} tokens fits within ${this.targetTokens} target`
            };
        }

        // Preserve entry points if requested
        let filesToFit = files;
        let preservedFiles = [];

        if (this.options.preserveEntryPoints) {
            const { entryPoints, others } = this.separateEntryPoints(files);
            preservedFiles = entryPoints;
            filesToFit = others;

            const preservedTokens = FitStrategies.calculateTotal(preservedFiles);
            if (preservedTokens > this.targetTokens) {
                console.warn(`⚠️  Warning: Entry points alone (${preservedTokens} tokens) exceed target (${this.targetTokens} tokens)`);
            }
        }

        // Apply strategy
        const strategy = this.options.strategy;
        let result;

        switch (strategy) {
            case 'shrink-docs':
                result = FitStrategies.shrinkDocs(filesToFit, this.targetTokens - FitStrategies.calculateTotal(preservedFiles));
                break;
            case 'methods-only':
                result = FitStrategies.methodsOnly(filesToFit, this.targetTokens);
                break;
            case 'top-n':
                result = FitStrategies.topN(filesToFit, this.targetTokens - FitStrategies.calculateTotal(preservedFiles));
                break;
            case 'balanced':
                result = FitStrategies.balanced(filesToFit, this.targetTokens - FitStrategies.calculateTotal(preservedFiles));
                break;
            case 'auto':
            default:
                result = FitStrategies.auto(filesToFit, this.targetTokens - FitStrategies.calculateTotal(preservedFiles));
                break;
        }

        // Add preserved files back
        if (preservedFiles.length > 0) {
            result.files = [...preservedFiles, ...result.files];
            result.totalTokens += FitStrategies.calculateTotal(preservedFiles);
            result.preservedEntryPoints = preservedFiles.length;
        }

        // Add metadata
        result.targetTokens = this.targetTokens;
        result.originalCount = files.length;
        result.originalTokens = currentTokens;
        result.reduction = ((currentTokens - result.totalTokens) / currentTokens * 100).toFixed(1);
        result.message = this.generateMessage(result);

        return result;
    }

    /**
     * Separate entry points from other files
     * @param {Array} files - All files
     * @returns {object} Separated entry points and others
     */
    separateEntryPoints(files) {
        const entryPointNames = ['index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts'];
        const entryPoints = [];
        const others = [];

        for (const file of files) {
            const relativePath = file.relativePath || file.path;
            const fileName = relativePath.split('/').pop();

            if (entryPointNames.includes(fileName)) {
                entryPoints.push(file);
            } else {
                others.push(file);
            }
        }

        return { entryPoints, others };
    }

    /**
     * Generate human-readable message about fit result
     * @param {object} result - Fit result
     * @returns {string} Message
     */
    generateMessage(result) {
        if (result.fits) {
            return `✅ Successfully fit ${result.files.length} files (${result.totalTokens} tokens) within ${this.targetTokens} target using ${result.strategy} strategy`;
        }

        if (result.requiresMethodLevel) {
            return `⚠️  Requires method-level analysis. Estimated reduction: ${(result.estimatedReduction * 100).toFixed(0)}%`;
        }

        return `⚠️  Could not fit within budget. Best effort: ${result.files.length} files (${result.totalTokens} tokens) using ${result.strategy} strategy`;
    }

    /**
     * Print fit result summary
     * @param {object} result - Fit result from fit()
     */
    printSummary(result) {
        console.log('\n📊 Token Budget Fitting Summary');
        console.log('='.repeat(50));
        console.log(`🎯 Target: ${this.targetTokens.toLocaleString()} tokens`);
        console.log(`📁 Original: ${result.originalCount} files, ${result.originalTokens.toLocaleString()} tokens`);
        console.log(`✂️  Selected: ${result.files.length} files, ${result.totalTokens.toLocaleString()} tokens`);
        console.log(`📉 Reduction: ${result.reduction}%`);
        console.log(`🚫 Excluded: ${result.excluded} files`);
        console.log(`🔧 Strategy: ${result.strategy}`);

        if (result.preservedEntryPoints) {
            console.log(`📍 Preserved entry points: ${result.preservedEntryPoints}`);
        }

        if (result.requiresMethodLevel) {
            console.log(`💡 Recommendation: Enable method-level analysis for ${(result.estimatedReduction * 100).toFixed(0)}% reduction`);
        }

        console.log(`\n${result.message}`);
        console.log('');
    }

    /**
     * Get recommended strategy for given files and target
     * @param {Array} files - Files to analyze
     * @param {number} targetTokens - Target token count
     * @returns {string} Recommended strategy name
     */
    static recommendStrategy(files, targetTokens) {
        const currentTokens = FitStrategies.calculateTotal(files);
        const ratio = currentTokens / targetTokens;

        if (ratio <= 1.0) {
            return 'none (already fits)';
        }

        if (ratio <= 1.5) {
            return 'shrink-docs';
        }

        if (ratio <= 2.0) {
            return 'balanced';
        }

        if (ratio <= 3.0) {
            return 'methods-only';
        }

        return 'top-n';
    }

    /**
     * Calculate statistics about file distribution
     * @param {Array} files - Files to analyze
     * @returns {object} Statistics
     */
    static analyzeFiles(files) {
        const stats = {
            totalFiles: files.length,
            totalTokens: FitStrategies.calculateTotal(files),
            byExtension: {},
            byDirectory: {},
            largestFiles: []
        };

        for (const file of files) {
            const relativePath = file.relativePath || file.path;
            const ext = relativePath.split('.').pop();
            const dir = relativePath.split('/').slice(0, -1).join('/') || '/';

            // By extension
            if (!stats.byExtension[ext]) {
                stats.byExtension[ext] = { count: 0, tokens: 0 };
            }
            stats.byExtension[ext].count++;
            stats.byExtension[ext].tokens += file.tokens || 0;

            // By directory
            if (!stats.byDirectory[dir]) {
                stats.byDirectory[dir] = { count: 0, tokens: 0 };
            }
            stats.byDirectory[dir].count++;
            stats.byDirectory[dir].tokens += file.tokens || 0;
        }

        // Largest files
        stats.largestFiles = [...files]
            .sort((a, b) => (b.tokens || 0) - (a.tokens || 0))
            .slice(0, 10)
            .map(f => ({
                path: f.relativePath || f.path,
                tokens: f.tokens
            }));

        return stats;
    }
}

module.exports = TokenBudgetFitter;
