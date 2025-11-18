/**
 * Test Quality Evaluator
 * Evaluates the quality of test files in the Context Manager project
 * Analyzes assertion coverage, edge case detection, and test organization
 */

import fs from 'fs';
import path from 'path';

export class TestQualityEvaluator {
    constructor(testDirectory = 'test') {
        this.testDirectory = testDirectory;
    }

    /**
     * Evaluate a test file
     * @param {string} testFilePath - Path to the test file
     * @returns {TestQualityReport}
     */
    evaluateTestFile(testFilePath) {
        const content = fs.readFileSync(testFilePath, 'utf-8');
        const fileName = path.basename(testFilePath);
        
        const totalTests = this.countTests(content);
        const assertionCount = this.checkAssertionCoverage(content);
        const edgeCasesCovered = this.checkEdgeCaseCoverage(content);
        const organizationScore = this.evaluateTestOrganization(content);
        const recommendations = this.generateRecommendations(
            totalTests,
            assertionCount,
            edgeCasesCovered,
            organizationScore
        );

        return {
            testFile: fileName,
            totalTests,
            assertionCount,
            edgeCasesCovered,
            organizationScore,
            recommendations
        };
    }

    /**
     * Count total number of tests in a file
     * @param {string} content - Test file content
     * @returns {number}
     */
    countTests(content) {
        // Match various test patterns
        const patterns = [
            /\btest\s*\(/g,
            /\bit\s*\(/g,
            /\bdescribe\s*\(/g,
            /await\s+runner\.test\s*\(/g
        ];

        let count = 0;
        patterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                count += matches.length;
            }
        });

        return count;
    }

    /**
     * Check assertion coverage in test content
     * @param {string} testContent - Test file content
     * @returns {number}
     */
    checkAssertionCoverage(testContent) {
        // Count various assertion patterns
        const assertionPatterns = [
            /assert\./g,
            /expect\(/g,
            /\.toBe\(/g,
            /\.toEqual\(/g,
            /\.toMatch\(/g,
            /\.toContain\(/g,
            /\.toHaveLength\(/g,
            /\.toThrow\(/g,
            /\.toBeNull\(/g,
            /\.toBeDefined\(/g,
            /\.toBeTruthy\(/g,
            /\.toBeFalsy\(/g,
            /\.toBeGreaterThan\(/g,
            /\.toBeLessThan\(/g
        ];

        let totalAssertions = 0;
        assertionPatterns.forEach(pattern => {
            const matches = testContent.match(pattern);
            if (matches) {
                totalAssertions += matches.length;
            }
        });

        return totalAssertions;
    }

    /**
     * Check edge case coverage in test content
     * @param {string} testContent - Test file content
     * @returns {Array<string>}
     */
    checkEdgeCaseCoverage(testContent) {
        const edgeCases = [];
        const lowerContent = testContent.toLowerCase();

        // Edge case indicators
        const edgeCasePatterns = [
            { keyword: 'empty', pattern: /\b(empty|null|undefined)\b/gi },
            { keyword: 'boundary', pattern: /\b(boundary|limit|max|min|zero)\b/gi },
            { keyword: 'invalid', pattern: /\b(invalid|malformed|corrupt|error)\b/gi },
            { keyword: 'special', pattern: /\b(special|unicode|utf-?8|escape)\b/gi },
            { keyword: 'large', pattern: /\b(large|huge|big|performance)\b/gi },
            { keyword: 'negative', pattern: /\b(negative|minus)\b/gi },
            { keyword: 'edge', pattern: /\b(edge\s*case|corner\s*case)\b/gi }
        ];

        edgeCasePatterns.forEach(({ keyword, pattern }) => {
            if (pattern.test(testContent)) {
                edgeCases.push(keyword);
            }
        });

        return [...new Set(edgeCases)]; // Remove duplicates
    }

    /**
     * Evaluate test organization
     * @param {string} testContent - Test file content
     * @returns {number} Score from 0-100
     */
    evaluateTestOrganization(testContent) {
        let score = 0;
        const maxScore = 100;

        // Check for test structure (20 points)
        if (/describe\s*\(|suite\s*\(|TestRunner/i.test(testContent)) {
            score += 20;
        }

        // Check for comments/documentation (15 points)
        const commentLines = (testContent.match(/\/\*\*[\s\S]*?\*\/|\/\/.*/g) || []).length;
        if (commentLines > 5) {
            score += 15;
        } else if (commentLines > 0) {
            score += 10;
        }

        // Check for setup/teardown (15 points)
        if (/beforeEach|afterEach|beforeAll|afterAll|setUp|tearDown/i.test(testContent)) {
            score += 15;
        }

        // Check for test naming conventions (20 points)
        const testNames = testContent.match(/(?:test|it)\s*\(\s*['"`]([^'"`]+)['"`]/g) || [];
        const descriptiveNames = testNames.filter(name => 
            name.length > 30 && /should|must|when|given/i.test(name)
        );
        if (descriptiveNames.length > testNames.length * 0.7) {
            score += 20;
        } else if (descriptiveNames.length > testNames.length * 0.4) {
            score += 10;
        }

        // Check for test isolation (15 points)
        const hasImports = /import\s+.*\s+from/g.test(testContent);
        const hasModuleMocks = /mock|stub|spy/i.test(testContent);
        if (hasImports && !hasModuleMocks) {
            score += 15; // Good - testing real implementations
        } else if (hasImports) {
            score += 10; // Acceptable - using some mocks
        }

        // Check for assertion density (15 points)
        const assertions = this.checkAssertionCoverage(testContent);
        const tests = this.countTests(testContent);
        if (tests > 0) {
            const assertionsPerTest = assertions / tests;
            if (assertionsPerTest >= 2) {
                score += 15;
            } else if (assertionsPerTest >= 1) {
                score += 10;
            } else if (assertionsPerTest > 0) {
                score += 5;
            }
        }

        return Math.min(score, maxScore);
    }

    /**
     * Generate recommendations based on evaluation
     * @param {number} totalTests - Total test count
     * @param {number} assertionCount - Total assertions
     * @param {Array<string>} edgeCases - Edge cases covered
     * @param {number} organizationScore - Organization score
     * @returns {Array<string>}
     */
    generateRecommendations(totalTests, assertionCount, edgeCases, organizationScore) {
        const recommendations = [];

        // Test count recommendations
        if (totalTests === 0) {
            recommendations.push('Add test cases to this file');
        } else if (totalTests < 3) {
            recommendations.push('Consider adding more test cases for better coverage');
        }

        // Assertion recommendations
        if (totalTests > 0) {
            const assertionsPerTest = assertionCount / totalTests;
            if (assertionsPerTest < 1) {
                recommendations.push('Increase assertion density - aim for at least 1-2 assertions per test');
            } else if (assertionsPerTest > 10) {
                recommendations.push('Consider splitting tests with many assertions into smaller, focused tests');
            }
        }

        // Edge case recommendations
        if (edgeCases.length === 0) {
            recommendations.push('Add edge case tests (empty inputs, boundaries, invalid data, etc.)');
        } else if (edgeCases.length < 3) {
            recommendations.push('Consider testing more edge cases for robustness');
        }

        // Organization recommendations
        if (organizationScore < 40) {
            recommendations.push('Improve test organization with describe blocks and better naming');
        } else if (organizationScore < 70) {
            recommendations.push('Good organization - consider adding more documentation');
        }

        // If everything looks good
        if (recommendations.length === 0) {
            recommendations.push('Test quality looks good!');
        }

        return recommendations;
    }

    /**
     * Evaluate all test files in a directory
     * @param {string} directory - Directory to scan
     * @returns {Array<TestQualityReport>}
     */
    evaluateAllTests(directory = null) {
        const targetDir = directory || this.testDirectory;
        const testFiles = this.scanTestFiles(targetDir);
        
        return testFiles.map(filePath => {
            try {
                return this.evaluateTestFile(filePath);
            } catch (error) {
                return {
                    testFile: path.basename(filePath),
                    totalTests: 0,
                    assertionCount: 0,
                    edgeCasesCovered: [],
                    organizationScore: 0,
                    recommendations: [`Error evaluating file: ${error.message}`]
                };
            }
        });
    }

    /**
     * Scan for test files in a directory
     * @param {string} directory - Directory to scan
     * @returns {Array<string>}
     */
    scanTestFiles(directory) {
        const testFiles = [];
        
        const scanDirectory = (dir) => {
            if (!fs.existsSync(dir)) {
                return;
            }

            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    scanDirectory(fullPath);
                } else if (entry.isFile() && 
                          (entry.name.startsWith('test-') || 
                           entry.name.endsWith('.test.js') ||
                           entry.name.endsWith('.property.js'))) {
                    testFiles.push(fullPath);
                }
            }
        };

        scanDirectory(directory);
        return testFiles;
    }

    /**
     * Generate summary statistics for all tests
     * @param {Array<TestQualityReport>} reports - Test quality reports
     * @returns {Object}
     */
    generateSummary(reports) {
        const totalFiles = reports.length;
        const totalTests = reports.reduce((sum, r) => sum + r.totalTests, 0);
        const totalAssertions = reports.reduce((sum, r) => sum + r.assertionCount, 0);
        const avgOrganizationScore = totalFiles > 0
            ? reports.reduce((sum, r) => sum + r.organizationScore, 0) / totalFiles
            : 0;

        const edgeCasesCovered = new Set();
        reports.forEach(r => {
            r.edgeCasesCovered.forEach(ec => edgeCasesCovered.add(ec));
        });

        return {
            totalFiles,
            totalTests,
            totalAssertions,
            averageAssertionsPerTest: totalTests > 0 ? totalAssertions / totalTests : 0,
            averageOrganizationScore: Math.round(avgOrganizationScore * 100) / 100,
            uniqueEdgeCasesCovered: Array.from(edgeCasesCovered),
            filesNeedingImprovement: reports.filter(r => r.organizationScore < 70).length
        };
    }
}

export default TestQualityEvaluator;
