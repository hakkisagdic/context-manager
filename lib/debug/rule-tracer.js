/**
 * Rule Tracer
 * Traces and explains why files are included or excluded
 */

const fs = require('fs');
const path = require('path');

class RuleTracer {
    constructor(gitIgnoreParser, methodFilter = null) {
        this.gitIgnoreParser = gitIgnoreParser;
        this.methodFilter = methodFilter;
        this.traces = [];
    }

    /**
     * Trace why a file was included or excluded
     * @param {string} filePath - File path to trace
     * @param {string} projectRoot - Project root directory
     * @returns {object} Trace result with reason
     */
    traceFile(filePath, projectRoot) {
        const relativePath = path.relative(projectRoot, filePath);

        // Check .gitignore first (test patterns directly to avoid fs.statSync)
        const gitignoreRules = this.gitIgnoreParser.patterns || [];
        const gitignoreMatch = this.findMatchingRule(relativePath, gitignoreRules);

        if (gitignoreMatch) {
            return {
                file: relativePath,
                included: false,
                reason: 'Excluded by .gitignore',
                rule: gitignoreMatch,
                priority: 1,
                type: 'gitignore'
            };
        }

        // Check calculator rules
        const calculatorResult = this.traceCalculatorRules(relativePath);
        if (calculatorResult) {
            return {
                file: relativePath,
                ...calculatorResult,
                priority: 2,
                type: 'calculator'
            };
        }

        // Default: included (no rules matched)
        return {
            file: relativePath,
            included: true,
            reason: 'No exclusion rules matched',
            rule: null,
            priority: 3,
            type: 'default'
        };
    }

    /**
     * Trace calculator include/exclude rules
     * @param {string} relativePath - Relative file path
     * @returns {object|null} Trace result or null if no match
     */
    traceCalculatorRules(relativePath) {
        const hasIncludeFile = this.gitIgnoreParser.hasIncludeFile;
        const calculatorRules = this.gitIgnoreParser.calculatorPatterns || [];

        if (calculatorRules.length === 0) {
            return null; // No calculator rules defined
        }

        if (hasIncludeFile) {
            // INCLUDE mode
            const matchingRule = this.findMatchingRule(relativePath, calculatorRules);

            if (matchingRule) {
                return {
                    included: true,
                    reason: 'INCLUDE mode - Matched include pattern',
                    rule: matchingRule,
                    mode: 'INCLUDE'
                };
            } else {
                return {
                    included: false,
                    reason: 'INCLUDE mode - No include pattern matched',
                    rule: null,
                    mode: 'INCLUDE'
                };
            }
        } else {
            // EXCLUDE mode
            const matchingRule = this.findMatchingRule(relativePath, calculatorRules);

            if (matchingRule) {
                return {
                    included: false,
                    reason: 'EXCLUDE mode - Matched exclude pattern',
                    rule: matchingRule,
                    mode: 'EXCLUDE'
                };
            } else {
                // In EXCLUDE mode, no match means include
                return {
                    included: true,
                    reason: 'EXCLUDE mode - No exclude pattern matched',
                    rule: null,
                    mode: 'EXCLUDE'
                };
            }
        }
    }

    /**
     * Find matching rule from a list of rules
     * @param {string} relativePath - Relative file path
     * @param {Array} rules - Array of rule objects
     * @returns {object|null} Matching rule or null
     */
    findMatchingRule(relativePath, rules) {
        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            // Handle both GitIgnoreParser pattern objects (with regex) and simple pattern strings
            const patternToTest = rule.regex || rule.pattern || rule;
            const matches = this.testPattern(relativePath, patternToTest);

            if (matches && !rule.isNegation) {
                return {
                    pattern: rule.original || rule.pattern || rule,
                    line: i + 1,
                    negation: rule.isNegation || false
                };
            }
        }
        return null;
    }

    /**
     * Find matching .gitignore rule
     * @param {string} relativePath - Relative file path
     * @returns {object|null} Matching rule or null
     */
    findMatchingGitignoreRule(relativePath) {
        // This is a simplified version - real implementation would parse .gitignore
        return {
            pattern: '(gitignore pattern)',
            line: '?',
            negation: false
        };
    }

    /**
     * Test if a path matches a pattern
     * @param {string} filePath - File path to test
     * @param {string|RegExp} pattern - Pattern to match against
     * @returns {boolean} True if matches
     */
    testPattern(filePath, pattern) {
        if (pattern instanceof RegExp) {
            return pattern.test(filePath);
        }

        // Convert glob pattern to regex
        // IMPORTANT: Replace ** before * to avoid double replacement
        const regexPattern = pattern
            .replace(/\./g, '\\.') // Escape dots
            .replace(/\*\*/g, '<<DOUBLESTAR>>') // Placeholder for **
            .replace(/\*/g, '[^/]*') // * matches anything except /
            .replace(/<<DOUBLESTAR>>/g, '.*') // ** matches anything including /
            .replace(/\?/g, '.'); // ? matches single char

        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(filePath);
    }

    /**
     * Trace method inclusion/exclusion
     * @param {string} methodName - Method name to trace
     * @param {string} fileName - File name containing the method
     * @returns {object} Trace result
     */
    traceMethod(methodName, fileName) {
        if (!this.methodFilter) {
            return {
                method: methodName,
                file: fileName,
                included: true,
                reason: 'No method filtering enabled',
                rule: null
            };
        }

        const included = this.methodFilter.shouldIncludeMethod(methodName, fileName);
        const hasIncludeFile = this.methodFilter.hasIncludeFile;

        if (hasIncludeFile) {
            // INCLUDE mode
            if (included) {
                const rule = this.findMatchingMethodRule(methodName, fileName, this.methodFilter.includePatterns);
                return {
                    method: methodName,
                    file: fileName,
                    included: true,
                    reason: 'INCLUDE mode - Matched include pattern',
                    rule: rule,
                    mode: 'INCLUDE'
                };
            } else {
                return {
                    method: methodName,
                    file: fileName,
                    included: false,
                    reason: 'INCLUDE mode - No include pattern matched',
                    rule: null,
                    mode: 'INCLUDE'
                };
            }
        } else {
            // EXCLUDE mode
            if (!included) {
                const rule = this.findMatchingMethodRule(methodName, fileName, this.methodFilter.ignorePatterns);
                return {
                    method: methodName,
                    file: fileName,
                    included: false,
                    reason: 'EXCLUDE mode - Matched exclude pattern',
                    rule: rule,
                    mode: 'EXCLUDE'
                };
            } else {
                return {
                    method: methodName,
                    file: fileName,
                    included: true,
                    reason: 'EXCLUDE mode - No exclude pattern matched',
                    rule: null,
                    mode: 'EXCLUDE'
                };
            }
        }
    }

    /**
     * Find matching method rule
     * @param {string} methodName - Method name
     * @param {string} fileName - File name
     * @param {Array} patterns - Array of patterns
     * @returns {object|null} Matching rule or null
     */
    findMatchingMethodRule(methodName, fileName, patterns) {
        if (!patterns) return null;

        for (let i = 0; i < patterns.length; i++) {
            const patternObj = patterns[i];
            // Handle both string patterns and pattern objects from MethodFilterParser
            const patternStr = typeof patternObj === 'string' ? patternObj : patternObj.pattern;

            if (this.matchesMethodPattern(methodName, fileName, patternStr)) {
                return {
                    pattern: patternStr,
                    line: i + 1
                };
            }
        }
        return null;
    }

    /**
     * Check if method matches pattern
     * @param {string} methodName - Method name
     * @param {string} fileName - File name
     * @param {string} pattern - Pattern to match
     * @returns {boolean} True if matches
     */
    matchesMethodPattern(methodName, fileName, pattern) {
        // Class.method pattern (must be checked before wildcard)
        if (pattern.includes('.') && !pattern.startsWith('.')) {
            const [classPattern, methodPattern] = pattern.split('.');

            // Check if file name matches the class pattern
            const fileMatchesClass = classPattern.includes('*')
                ? new RegExp('^' + classPattern.replace(/\*/g, '.*') + '$', 'i').test(fileName)
                : fileName.toLowerCase().includes(classPattern.toLowerCase());

            if (!fileMatchesClass) return false;

            // Check method pattern
            if (methodPattern === '*') return true;
            if (methodPattern.includes('*')) {
                return new RegExp('^' + methodPattern.replace(/\*/g, '.*') + '$', 'i').test(methodName);
            }
            return methodName === methodPattern;
        }

        // Wildcard match
        if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
            return regex.test(methodName);
        }

        // Exact match
        return methodName === pattern;
    }

    /**
     * Print trace result
     * @param {object} trace - Trace result object
     */
    printTrace(trace) {
        const icon = trace.included ? '✅' : '❌';
        const status = trace.included ? 'INCLUDED' : 'EXCLUDED';

        console.log(`${icon} ${trace.file}: ${status}`);
        console.log(`   Reason: ${trace.reason}`);

        if (trace.rule) {
            console.log(`   Rule: ${trace.rule.pattern} (line ${trace.rule.line})`);
            if (trace.mode) {
                console.log(`   Mode: ${trace.mode}`);
            }
        }

        console.log();
    }

    /**
     * Print method trace result
     * @param {object} trace - Method trace result
     */
    printMethodTrace(trace) {
        const icon = trace.included ? '✅' : '❌';
        const status = trace.included ? 'INCLUDED' : 'EXCLUDED';

        console.log(`${icon} ${trace.method} (in ${trace.file}): ${status}`);
        console.log(`   Reason: ${trace.reason}`);

        if (trace.rule) {
            console.log(`   Rule: ${trace.rule.pattern} (line ${trace.rule.line})`);
            if (trace.mode) {
                console.log(`   Mode: ${trace.mode}`);
            }
        }

        console.log();
    }

    /**
     * Analyze all patterns and show what they match
     * @param {Array} files - Array of files to test patterns against
     * @returns {object} Pattern analysis results
     */
    analyzePatterns(files) {
        const results = {
            includePatterns: [],
            excludePatterns: [],
            unusedPatterns: []
        };

        const hasIncludeFile = this.gitIgnoreParser.hasIncludeFile;
        const calculatorRules = this.gitIgnoreParser.calculatorPatterns || [];

        if (calculatorRules.length > 0) {
            if (hasIncludeFile) {
                results.includePatterns = this.analyzeRuleSet(
                    calculatorRules,
                    files,
                    'INCLUDE'
                );
            } else {
                results.excludePatterns = this.analyzeRuleSet(
                    calculatorRules,
                    files,
                    'EXCLUDE'
                );
            }
        }

        return results;
    }

    /**
     * Analyze a set of rules against files
     * @param {Array} rules - Array of rule objects
     * @param {Array} files - Array of file paths
     * @param {string} mode - Mode (INCLUDE or EXCLUDE)
     * @returns {Array} Analysis results
     */
    analyzeRuleSet(rules, files, mode) {
        return rules.map((rule, index) => {
            const matches = files.filter(file => {
                const relativePath = typeof file === 'string' ? file : file.relativePath || file.path;
                // Handle both GitIgnoreParser pattern objects (with regex) and simple patterns
                const patternToTest = rule.regex || rule.pattern || rule;
                return this.testPattern(relativePath, patternToTest);
            });

            return {
                pattern: rule.original || rule.pattern || rule,
                line: index + 1,
                matches: matches.length,
                examples: matches.slice(0, 3).map(f => typeof f === 'string' ? f : f.relativePath || f.path),
                mode: mode,
                used: matches.length > 0
            };
        });
    }

    /**
     * Print pattern analysis
     * @param {object} analysis - Analysis results from analyzePatterns
     */
    printPatternAnalysis(analysis) {
        console.log('\n🔍 Pattern Analysis\n');
        console.log('='.repeat(70));

        if (analysis.includePatterns.length > 0) {
            console.log('\n✅ INCLUDE Patterns (.calculatorinclude):');
            console.log('-'.repeat(70));

            for (const pattern of analysis.includePatterns) {
                const icon = pattern.used ? '✓' : '⚠️';
                console.log(`${icon} Line ${pattern.line}: ${pattern.pattern}`);
                console.log(`   Matches: ${pattern.matches} files`);

                if (pattern.examples.length > 0) {
                    console.log(`   Examples: ${pattern.examples.join(', ')}`);
                } else {
                    console.log(`   ⚠️  No files matched this pattern`);
                }
                console.log();
            }
        }

        if (analysis.excludePatterns.length > 0) {
            console.log('\n🚫 EXCLUDE Patterns (.calculatorignore):');
            console.log('-'.repeat(70));

            for (const pattern of analysis.excludePatterns) {
                const icon = pattern.used ? '✓' : '⚠️';
                console.log(`${icon} Line ${pattern.line}: ${pattern.pattern}`);
                console.log(`   Matches: ${pattern.matches} files`);

                if (pattern.examples.length > 0) {
                    console.log(`   Examples: ${pattern.examples.join(', ')}`);
                } else {
                    console.log(`   ⚠️  No files matched this pattern`);
                }
                console.log();
            }
        }

        // Find unused patterns
        const allPatterns = [...analysis.includePatterns, ...analysis.excludePatterns];
        const unusedPatterns = allPatterns.filter(p => !p.used);

        if (unusedPatterns.length > 0) {
            console.log('\n⚠️  Unused Patterns (no files matched):');
            console.log('-'.repeat(70));

            for (const pattern of unusedPatterns) {
                console.log(`   ${pattern.mode} - Line ${pattern.line}: ${pattern.pattern}`);
            }
            console.log();
        }

        console.log('='.repeat(70));
        console.log();
    }
}

module.exports = RuleTracer;
