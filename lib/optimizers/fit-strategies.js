/**
 * Token Budget Fitting Strategies
 * Different approaches to fit files within token budgets
 */

class FitStrategies {
    /**
     * Calculate total tokens from file list
     * @param {Array} files - Array of file objects with tokens property
     * @returns {number} Total token count
     */
    static calculateTotal(files) {
        return files.reduce((sum, file) => sum + (file.tokens || 0), 0);
    }

    /**
     * Sort files by token count (descending)
     * @param {Array} files - Array of file objects
     * @returns {Array} Sorted files
     */
    static sortByTokens(files) {
        return [...files].sort((a, b) => (b.tokens || 0) - (a.tokens || 0));
    }

    /**
     * Calculate importance score for a file
     * Based on: path depth, file type, token count
     * @param {object} file - File object with path and tokens
     * @returns {number} Importance score (0-100)
     */
    static calculateImportance(file) {
        let score = 50; // Base score

        const relativePath = file.relativePath || file.path;
        const parts = relativePath.split('/');
        const fileName = parts[parts.length - 1];
        const depth = parts.length;

        // Entry points get high scores
        if (['index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts'].includes(fileName)) {
            score += 30;
        }

        // Core directories get bonuses
        if (relativePath.includes('src/') || relativePath.includes('lib/')) {
            score += 15;
        }

        // Server/handler files are important
        if (fileName.includes('server') || fileName.includes('handler') || fileName.includes('controller')) {
            score += 10;
        }

        // Penalize deep nesting (likely less important)
        score -= Math.min(depth * 2, 20);

        // Penalize very large files (might be generated/less important)
        if (file.tokens > 10000) {
            score -= 10;
        }

        // Utility/helper files slightly less important
        if (fileName.includes('util') || fileName.includes('helper')) {
            score -= 5;
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Strategy: Shrink Docs
     * Remove documentation and comment-heavy files first
     * @param {Array} files - Array of file objects
     * @param {number} targetTokens - Target token count
     * @returns {object} Result with selected files and stats
     */
    static shrinkDocs(files, targetTokens) {
        // Separate docs from code
        const docs = [];
        const code = [];

        for (const file of files) {
            const relativePath = file.relativePath || file.path;
            const ext = relativePath.split('.').pop().toLowerCase();

            if (['md', 'txt', 'rst'].includes(ext) || relativePath.includes('docs/') || relativePath.includes('documentation/')) {
                docs.push(file);
            } else {
                code.push(file);
            }
        }

        let selected = [];
        let currentTokens = 0;

        // If code alone exceeds budget, use top-N on code files
        const codeTokens = this.calculateTotal(code);
        if (codeTokens > targetTokens) {
            // Select code files by importance until we hit budget
            const scored = code.map(file => ({
                ...file,
                importance: this.calculateImportance(file)
            }));
            const sorted = scored.sort((a, b) => b.importance - a.importance);

            for (const file of sorted) {
                if (currentTokens + file.tokens <= targetTokens) {
                    selected.push(file);
                    currentTokens += file.tokens;
                }
            }
        } else {
            // Code fits, add all code first
            selected = [...code];
            currentTokens = codeTokens;

            // Add docs back if we have budget
            const sortedDocs = this.sortByTokens(docs);
            for (const doc of sortedDocs) {
                if (currentTokens + doc.tokens <= targetTokens) {
                    selected.push(doc);
                    currentTokens += doc.tokens;
                }
            }
        }

        return {
            files: selected,
            totalTokens: currentTokens,
            excluded: files.length - selected.length,
            strategy: 'shrink-docs',
            fits: currentTokens <= targetTokens
        };
    }

    /**
     * Strategy: Methods Only
     * Extract only methods, exclude full file content
     * This is handled at the analysis level, not file selection
     * @param {Array} files - Array of file objects
     * @param {number} targetTokens - Target token count
     * @returns {object} Result with method-level flag
     */
    static methodsOnly(files, targetTokens) {
        // This strategy requires re-analysis with method-level enabled
        // We'll mark files for method-level extraction
        return {
            files: files,
            totalTokens: this.calculateTotal(files),
            excluded: 0,
            strategy: 'methods-only',
            requiresMethodLevel: true,
            estimatedReduction: 0.6, // Methods typically use 40% of tokens
            fits: this.calculateTotal(files) * 0.4 <= targetTokens
        };
    }

    /**
     * Strategy: Top-N by Importance
     * Select N most important files that fit in budget
     * @param {Array} files - Array of file objects
     * @param {number} targetTokens - Target token count
     * @returns {object} Result with selected files
     */
    static topN(files, targetTokens) {
        // Calculate importance for each file
        const scoredFiles = files.map(file => ({
            ...file,
            importance: this.calculateImportance(file)
        }));

        // Sort by importance (descending)
        const sorted = scoredFiles.sort((a, b) => b.importance - a.importance);

        // Select files until we hit budget
        const selected = [];
        let currentTokens = 0;

        for (const file of sorted) {
            if (currentTokens + file.tokens <= targetTokens) {
                selected.push(file);
                currentTokens += file.tokens;
            }
        }

        return {
            files: selected,
            totalTokens: currentTokens,
            excluded: files.length - selected.length,
            strategy: 'top-n',
            fits: currentTokens <= targetTokens
        };
    }

    /**
     * Strategy: Balanced
     * Balance between coverage and token limit
     * Tries to include representative files from each directory
     * @param {Array} files - Array of file objects
     * @param {number} targetTokens - Target token count
     * @returns {object} Result with selected files
     */
    static balanced(files, targetTokens) {
        // Group files by directory
        const byDirectory = {};

        for (const file of files) {
            const relativePath = file.relativePath || file.path;
            const dir = relativePath.split('/').slice(0, -1).join('/') || '/';

            if (!byDirectory[dir]) {
                byDirectory[dir] = [];
            }
            byDirectory[dir].push(file);
        }

        // Calculate budget per directory proportionally
        const totalFiles = files.length;
        const selected = [];
        let currentTokens = 0;

        // Sort directories by file count (more files = more important)
        const sortedDirs = Object.entries(byDirectory).sort((a, b) => b[1].length - a[1].length);

        for (const [dir, dirFiles] of sortedDirs) {
            // Take top files from each directory
            const sorted = this.sortByTokens(dirFiles);
            const proportion = dirFiles.length / totalFiles;
            const dirBudget = targetTokens * proportion;

            let dirTokens = 0;
            for (const file of sorted) {
                if (currentTokens + file.tokens <= targetTokens && dirTokens + file.tokens <= dirBudget) {
                    selected.push(file);
                    currentTokens += file.tokens;
                    dirTokens += file.tokens;
                }
            }
        }

        return {
            files: selected,
            totalTokens: currentTokens,
            excluded: files.length - selected.length,
            strategy: 'balanced',
            fits: currentTokens <= targetTokens
        };
    }

    /**
     * Strategy: Auto (Smart Selection)
     * Automatically choose best strategy based on file composition
     * @param {Array} files - Array of file objects
     * @param {number} targetTokens - Target token count
     * @returns {object} Result with selected files
     */
    static auto(files, targetTokens) {
        const currentTokens = this.calculateTotal(files);

        // If already fits, return all files
        if (currentTokens <= targetTokens) {
            return {
                files: files,
                totalTokens: currentTokens,
                excluded: 0,
                strategy: 'auto (no-reduction-needed)',
                fits: true
            };
        }

        // Try strategies in order of preference
        const strategies = [
            { name: 'shrink-docs', fn: this.shrinkDocs.bind(this) },
            { name: 'balanced', fn: this.balanced.bind(this) },
            { name: 'top-n', fn: this.topN.bind(this) }
        ];

        for (const strategy of strategies) {
            const result = strategy.fn(files, targetTokens);
            if (result.fits) {
                result.strategy = `auto (${strategy.name})`;
                return result;
            }
        }

        // If nothing fits, try methods-only
        const methodsResult = this.methodsOnly(files, targetTokens);
        if (methodsResult.fits) {
            methodsResult.strategy = 'auto (methods-only)';
            return methodsResult;
        }

        // Last resort: top-n with whatever fits
        const topNResult = this.topN(files, targetTokens);
        topNResult.strategy = 'auto (top-n-fallback)';
        return topNResult;
    }
}

module.exports = FitStrategies;
