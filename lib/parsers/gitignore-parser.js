/**
 * GitIgnore Parser
 * Parses .gitignore, .contextignore, and .contextinclude files
 */

import fs from 'fs';

class GitIgnoreParser {
    constructor(gitignorePath, contextIgnorePath, contextIncludePath, tracer = null) {
        this.patterns = [];
        this.contextPatterns = [];
        this.hasIncludeFile = false;
        this._lastIgnoreReason = null;
        this.tracer = tracer;

        this.loadPatterns(gitignorePath, contextIgnorePath, contextIncludePath);
    }

    /**
     * Normalize path separators to forward slashes (gitignore standard)
     * @param {string} filePath - Path to normalize
     * @returns {string} Normalized path with forward slashes
     */
    static normalizePath(filePath) {
        // Convert Windows backslashes to forward slashes
        // Gitignore patterns always use forward slashes, even on Windows
        return filePath.replace(/\\/g, '/');
    }

    loadPatterns(gitignorePath, contextIgnorePath, contextIncludePath) {
        // Load .gitignore
        if (fs.existsSync(gitignorePath)) {
            this.patterns = this.parsePatternFile(gitignorePath);
        }

        // Load context patterns (include takes priority)
        if (contextIncludePath && fs.existsSync(contextIncludePath)) {
            this.contextPatterns = this.parsePatternFile(contextIncludePath);
            this.hasIncludeFile = true;
            console.log(`📅 Context include rules loaded: ${this.contextPatterns.length} patterns`);
        } else if (contextIgnorePath && fs.existsSync(contextIgnorePath)) {
            this.contextPatterns = this.parsePatternFile(contextIgnorePath);
            console.log(`📋 Context ignore rules loaded: ${this.contextPatterns.length} patterns`);
        }
    }

    parsePatternFile(filePath) {
        try {
            // Check if path is actually a file (not a directory)
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                console.warn(`Warning: ${filePath} is a directory, expected a file`);
                return [];
            }

            return fs.readFileSync(filePath, 'utf8')
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'))
                .map(pattern => this.convertToRegex(pattern));
        } catch (error) {
            // File doesn't exist or can't be read
            return [];
        }
    }

    convertToRegex(pattern) {
        const isDirectory = pattern.endsWith('/');
        const isNegation = pattern.startsWith('!');
        const original = pattern;

        pattern = pattern.replace(/^[!/]/, '').replace(/\/$/, '');

        let regexPattern = pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '[^/]');

        regexPattern = original.startsWith('/')
            ? `^${regexPattern}`
            : `(^|/)${regexPattern}`;

        regexPattern += isDirectory ? '(/.*)?$' : '$';

        return { regex: new RegExp(regexPattern), isNegation, original, isDirectory };
    }

    isIgnored(filePath, relativePath) {
        // Normalize path separators to forward slashes (gitignore standard)
        const normalizedPath = GitIgnoreParser.normalizePath(relativePath);

        let ignored = this.testPatterns(this.patterns, normalizedPath, 'gitignore');
        let matchedRule = null;
        let ruleSource = null;
        let mode = null;

        if (this.hasIncludeFile) {
            if (ignored) {
                // Record gitignore exclusion
                if (this.tracer && this.tracer.isEnabled()) {
                    this.tracer.recordFileDecision(relativePath, {
                        included: false,
                        reason: 'Matched .gitignore pattern',
                        rule: this._lastIgnoreReason || 'gitignore pattern',
                        ruleSource: '.gitignore',
                        mode: 'EXCLUDE'
                    });
                }
                return true; // Keep gitignore exclusions
            }

            // Check if filePath is provided before stat check
            if (filePath) {
                try {
                    const stat = fs.statSync(filePath);
                    if (stat.isDirectory()) {
                        const shouldTraverse = this.contextPatterns.some(p =>
                            p.original.startsWith(normalizedPath) ||
                            p.original.includes('**') ||
                            normalizedPath === ''
                        );
                        ignored = !shouldTraverse;
                        mode = 'INCLUDE';
                        ruleSource = '.contextinclude';
                    } else {
                        const included = this.testPatternsWithNegation(this.contextPatterns, normalizedPath);
                        ignored = !included;
                        mode = 'INCLUDE';
                        ruleSource = '.contextinclude';

                        // Find the matching pattern for tracing
                        for (const pattern of this.contextPatterns) {
                            if (pattern.regex.test(normalizedPath)) {
                                matchedRule = pattern.original;
                                break;
                            }
                        }
                    }
                } catch (error) {
                    // If stat fails, treat as file and check patterns
                    const included = this.testPatternsWithNegation(this.contextPatterns, normalizedPath);
                    ignored = !included;
                    mode = 'INCLUDE';
                    ruleSource = '.contextinclude';

                    // Find the matching pattern for tracing
                    for (const pattern of this.contextPatterns) {
                        if (pattern.regex.test(normalizedPath)) {
                            matchedRule = pattern.original;
                            break;
                        }
                    }
                }
            } else {
                // No filePath provided, just check patterns
                const included = this.testPatternsWithNegation(this.contextPatterns, normalizedPath);
                ignored = !included;
                mode = 'INCLUDE';
                ruleSource = '.contextinclude';

                // Find the matching pattern for tracing
                for (const pattern of this.contextPatterns) {
                    if (pattern.regex.test(normalizedPath)) {
                        matchedRule = pattern.original;
                        break;
                    }
                }
            }

            if (ignored) this._lastIgnoreReason = 'context-include';
        } else if (!ignored) {
            ignored = this.testPatterns(this.contextPatterns, normalizedPath, 'context');
            mode = 'EXCLUDE';
            ruleSource = '.contextignore';

            // Find the matching pattern for tracing
            for (const pattern of this.contextPatterns) {
                if (pattern.regex.test(normalizedPath) && !pattern.isNegation) {
                    matchedRule = pattern.original;
                    break;
                }
            }
        } else {
            // gitignore matched
            mode = 'EXCLUDE';
            ruleSource = '.gitignore';
        }

        // Record decision with tracer
        if (this.tracer && this.tracer.isEnabled()) {
            this.tracer.recordFileDecision(relativePath, {
                included: !ignored,
                reason: ignored 
                    ? (this._lastIgnoreReason === 'context-include' 
                        ? 'Not matched by .contextinclude pattern' 
                        : 'Matched exclusion pattern')
                    : 'Included (no exclusion pattern matched)',
                rule: matchedRule || this._lastIgnoreReason || (ignored ? 'exclusion pattern' : null),
                ruleSource: ruleSource,
                mode: mode || (this.hasIncludeFile ? 'INCLUDE' : 'EXCLUDE')
            });
        }

        return ignored;
    }

    testPatterns(patterns, relativePath, reason) {
        let ignored = false;
        for (const pattern of patterns) {
            if (pattern.regex.test(relativePath)) {
                ignored = !pattern.isNegation;
                if (ignored) this._lastIgnoreReason = reason;
            }
        }
        return ignored;
    }

    testPatternsWithNegation(patterns, relativePath) {
        let included = false;
        for (const pattern of patterns) {
            if (pattern.regex.test(relativePath)) {
                included = pattern.isNegation ? false : true;
                if (pattern.isNegation) break;
            }
        }
        return included;
    }
}

export default GitIgnoreParser;
