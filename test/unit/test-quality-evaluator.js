/**
 * Unit Tests for Test Quality Evaluator
 * Tests constructor, assertion counting, edge case detection, and organization scoring
 */

import { TestQualityEvaluator } from '../../lib/analyzers/test-quality-evaluator.js';
import { TestRunner, assert } from '../helpers/test-runner.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runner = new TestRunner('Test Quality Evaluator Unit Tests');

// Test 1: Constructor tests
await runner.test('TestQualityEvaluator constructor should initialize with default test directory', () => {
    const evaluator = new TestQualityEvaluator();
    
    assert.ok(evaluator.testDirectory, 'Test directory should be set');
    assert.equal(evaluator.testDirectory, 'test', 'Default test directory should be "test"');
});

await runner.test('TestQualityEvaluator constructor should accept custom test directory', () => {
    const customDir = 'custom-tests';
    const evaluator = new TestQualityEvaluator(customDir);
    
    assert.equal(evaluator.testDirectory, customDir, 'Test directory should match custom value');
});

// Test 2: Assertion counting tests
await runner.test('checkAssertionCoverage should count assert.* patterns', () => {
    const evaluator = new TestQualityEvaluator();
    const content = `
        test('example', () => {
            assert.ok(true);
            assert.equal(1, 1);
            assert.notEqual(1, 2);
        });
    `;
    
    const count = evaluator.checkAssertionCoverage(content);
    
    assert.ok(count >= 3, 'Should count at least 3 assertions');
});

await runner.test('checkAssertionCoverage should count expect() patterns', () => {
    const evaluator = new TestQualityEvaluator();
    const content = `
        test('example', () => {
            expect(value).toBe(true);
            expect(result).toEqual({ a: 1 });
        });
    `;
    
    const count = evaluator.checkAssertionCoverage(content);
    
    assert.ok(count >= 2, 'Should count expect assertions');
});

await runner.test('checkAssertionCoverage should count various assertion types', () => {
    const evaluator = new TestQualityEvaluator();
    const content = `
        test('example', () => {
            expect(value).toMatch(/pattern/);
            expect(array).toContain(item);
            expect(list).toHaveLength(5);
            expect(fn).toThrow();
            expect(val).toBeNull();
            expect(obj).toBeDefined();
        });
    `;
    
    const count = evaluator.checkAssertionCoverage(content);
    
    assert.ok(count >= 6, 'Should count various assertion types');
});

await runner.test('checkAssertionCoverage should return 0 for content without assertions', () => {
    const evaluator = new TestQualityEvaluator();
    const content = `
        test('example', () => {
            const result = someFunction();
            console.log(result);
        });
    `;
    
    const count = evaluator.checkAssertionCoverage(content);
    
    assert.equal(count, 0, 'Should return 0 when no assertions found');
});

// Test 3: Edge case detection tests
await runner.test('checkEdgeCaseCoverage should detect empty/null/undefined patterns', () => {
    const evaluator = new TestQualityEvaluator();
    const content = `
        test('handles empty input', () => {
            const result = process(null);
            assert.ok(result);
        });
    `;
    
    const edgeCases = evaluator.checkEdgeCaseCoverage(content);
    
    assert.ok(edgeCases.includes('empty'), 'Should detect empty edge case');
});

await runner.test('checkEdgeCaseCoverage should detect boundary patterns', () => {
    const evaluator = new TestQualityEvaluator();
    const content = `
        test('handles boundary values', () => {
            testMax(Number.MAX_VALUE);
            testMin(0);
            testLimit(100);
        });
    `;
    
    const edgeCases = evaluator.checkEdgeCaseCoverage(content);
    
    assert.ok(edgeCases.includes('boundary'), 'Should detect boundary edge case');
});

await runner.test('checkEdgeCaseCoverage should detect invalid/error patterns', () => {
    const evaluator = new TestQualityEvaluator();
    const content = `
        test('handles invalid input', () => {
            expect(() => process(malformed)).toThrow();
        });
    `;
    
    const edgeCases = evaluator.checkEdgeCaseCoverage(content);
    
    assert.ok(edgeCases.includes('invalid'), 'Should detect invalid edge case');
});

await runner.test('checkEdgeCaseCoverage should detect special character patterns', () => {
    const evaluator = new TestQualityEvaluator();
    const content = `
        test('handles special UTF-8 characters', () => {
            const result = process('café ☕');
            assert.ok(result);
        });
    `;
    
    const edgeCases = evaluator.checkEdgeCaseCoverage(content);
    
    assert.ok(edgeCases.includes('special'), 'Should detect special character edge case');
});

await runner.test('checkEdgeCaseCoverage should detect large/performance patterns', () => {
    const evaluator = new TestQualityEvaluator();
    const content = `
        test('handles large datasets', () => {
            const bigArray = new Array(10000);
            const result = process(bigArray);
        });
    `;
    
    const edgeCases = evaluator.checkEdgeCaseCoverage(content);
    
    assert.ok(edgeCases.includes('large'), 'Should detect large data edge case');
});

await runner.test('checkEdgeCaseCoverage should detect negative number patterns', () => {
    const evaluator = new TestQualityEvaluator();
    const content = `
        test('handles negative values', () => {
            const result = calculate(-100);
            assert.ok(result);
        });
    `;
    
    const edgeCases = evaluator.checkEdgeCaseCoverage(content);
    
    assert.ok(edgeCases.includes('negative'), 'Should detect negative edge case');
});

await runner.test('checkEdgeCaseCoverage should detect explicit edge case mentions', () => {
    const evaluator = new TestQualityEvaluator();
    const content = `
        test('edge case: handles corner case scenario', () => {
            assert.ok(true);
        });
    `;
    
    const edgeCases = evaluator.checkEdgeCaseCoverage(content);
    
    assert.ok(edgeCases.includes('edge'), 'Should detect explicit edge case mention');
});

await runner.test('checkEdgeCaseCoverage should return empty array when no edge cases found', () => {
    const evaluator = new TestQualityEvaluator();
    const content = `
        test('basic test', () => {
            const result = add(1, 2);
            assert.equal(result, 3);
        });
    `;
    
    const edgeCases = evaluator.checkEdgeCaseCoverage(content);
    
    assert.ok(Array.isArray(edgeCases), 'Should return an array');
    assert.equal(edgeCases.length, 0, 'Should return empty array when no edge cases found');
});

await runner.test('checkEdgeCaseCoverage should not return duplicates', () => {
    const evaluator = new TestQualityEvaluator();
    const content = `
        test('handles empty input', () => {});
        test('handles null value', () => {});
        test('handles undefined case', () => {});
    `;
    
    const edgeCases = evaluator.checkEdgeCaseCoverage(content);
    const uniqueEdgeCases = [...new Set(edgeCases)];
    
    assert.equal(edgeCases.length, uniqueEdgeCases.length, 'Should not contain duplicates');
});

// Test 4: Organization scoring tests
await runner.test('evaluateTestOrganization should give points for test structure', () => {
    const evaluator = new TestQualityEvaluator();
    const contentWithStructure = `
        describe('MyModule', () => {
            test('should work', () => {});
        });
    `;
    const contentWithoutStructure = `
        test('should work', () => {});
    `;
    
    const scoreWith = evaluator.evaluateTestOrganization(contentWithStructure);
    const scoreWithout = evaluator.evaluateTestOrganization(contentWithoutStructure);
    
    assert.ok(scoreWith > scoreWithout, 'Structured tests should score higher');
});

await runner.test('evaluateTestOrganization should give points for comments', () => {
    const evaluator = new TestQualityEvaluator();
    const contentWithComments = `
        /**
         * Test suite for MyModule
         */
        // Test case 1
        test('test1', () => {});
        // Test case 2
        test('test2', () => {});
        // Test case 3
        test('test3', () => {});
    `;
    const contentWithoutComments = `
        test('test1', () => {});
        test('test2', () => {});
    `;
    
    const scoreWith = evaluator.evaluateTestOrganization(contentWithComments);
    const scoreWithout = evaluator.evaluateTestOrganization(contentWithoutComments);
    
    assert.ok(scoreWith > scoreWithout, 'Commented tests should score higher');
});

await runner.test('evaluateTestOrganization should give points for setup/teardown', () => {
    const evaluator = new TestQualityEvaluator();
    const contentWithSetup = `
        beforeEach(() => {
            // setup
        });
        afterEach(() => {
            // teardown
        });
        test('test', () => {});
    `;
    const contentWithoutSetup = `
        test('test', () => {});
    `;
    
    const scoreWith = evaluator.evaluateTestOrganization(contentWithSetup);
    const scoreWithout = evaluator.evaluateTestOrganization(contentWithoutSetup);
    
    assert.ok(scoreWith > scoreWithout, 'Tests with setup/teardown should score higher');
});

await runner.test('evaluateTestOrganization should give points for descriptive test names', () => {
    const evaluator = new TestQualityEvaluator();
    const contentWithDescriptive = `
        test('should correctly calculate the sum when given two positive numbers', () => {});
        test('should throw an error when given invalid input parameters', () => {});
        test('should return null when the input array is empty', () => {});
    `;
    const contentWithoutDescriptive = `
        test('test1', () => {});
        test('test2', () => {});
        test('test3', () => {});
    `;
    
    const scoreWith = evaluator.evaluateTestOrganization(contentWithDescriptive);
    const scoreWithout = evaluator.evaluateTestOrganization(contentWithoutDescriptive);
    
    assert.ok(scoreWith > scoreWithout, 'Descriptive test names should score higher');
});

await runner.test('evaluateTestOrganization should give points for good assertion density', () => {
    const evaluator = new TestQualityEvaluator();
    const contentWithAssertions = `
        test('test', () => {
            assert.ok(true);
            assert.equal(1, 1);
        });
    `;
    const contentWithoutAssertions = `
        test('test', () => {
            console.log('test');
        });
    `;
    
    const scoreWith = evaluator.evaluateTestOrganization(contentWithAssertions);
    const scoreWithout = evaluator.evaluateTestOrganization(contentWithoutAssertions);
    
    assert.ok(scoreWith > scoreWithout, 'Tests with assertions should score higher');
});

await runner.test('evaluateTestOrganization should return score between 0 and 100', () => {
    const evaluator = new TestQualityEvaluator();
    const content = `
        test('basic test', () => {
            assert.ok(true);
        });
    `;
    
    const score = evaluator.evaluateTestOrganization(content);
    
    assert.ok(score >= 0, 'Score should be at least 0');
    assert.ok(score <= 100, 'Score should not exceed 100');
});

await runner.test('evaluateTestOrganization should give high score for well-organized tests', () => {
    const evaluator = new TestQualityEvaluator();
    const wellOrganizedContent = `
        /**
         * Comprehensive test suite for MyModule
         * Tests all major functionality
         */
        import { MyModule } from './my-module.js';
        
        describe('MyModule', () => {
            beforeEach(() => {
                // Setup test environment
            });
            
            test('should correctly process valid input when given proper parameters', () => {
                const result = MyModule.process('valid');
                assert.ok(result);
                assert.equal(result.status, 'success');
            });
            
            test('should handle edge cases when given boundary values', () => {
                const result = MyModule.process(null);
                assert.ok(result);
            });
        });
    `;
    
    const score = evaluator.evaluateTestOrganization(wellOrganizedContent);
    
    assert.ok(score >= 70, 'Well-organized tests should score at least 70');
});

// Test 5: Test file evaluation tests
await runner.test('evaluateTestFile should return complete quality report', () => {
    const evaluator = new TestQualityEvaluator();
    
    // Use an existing test file
    const testFilePath = path.join(__dirname, 'test-coverage-analyzer.js');
    
    if (fs.existsSync(testFilePath)) {
        const report = evaluator.evaluateTestFile(testFilePath);
        
        assert.ok(typeof report.testFile === 'string', 'Should have test file name');
        assert.ok(typeof report.totalTests === 'number', 'Should have total tests count');
        assert.ok(typeof report.assertionCount === 'number', 'Should have assertion count');
        assert.ok(Array.isArray(report.edgeCasesCovered), 'Should have edge cases array');
        assert.ok(typeof report.organizationScore === 'number', 'Should have organization score');
        assert.ok(Array.isArray(report.recommendations), 'Should have recommendations array');
    }
});

await runner.test('countTests should count test() calls', () => {
    const evaluator = new TestQualityEvaluator();
    const content = `
        test('test1', () => {});
        test('test2', () => {});
        test('test3', () => {});
    `;
    
    const count = evaluator.countTests(content);
    
    assert.ok(count >= 3, 'Should count at least 3 tests');
});

await runner.test('countTests should count it() calls', () => {
    const evaluator = new TestQualityEvaluator();
    const content = `
        it('should work', () => {});
        it('should also work', () => {});
    `;
    
    const count = evaluator.countTests(content);
    
    assert.ok(count >= 2, 'Should count it() calls');
});

await runner.test('countTests should count describe() blocks', () => {
    const evaluator = new TestQualityEvaluator();
    const content = `
        describe('Suite 1', () => {});
        describe('Suite 2', () => {});
    `;
    
    const count = evaluator.countTests(content);
    
    assert.ok(count >= 2, 'Should count describe blocks');
});

await runner.test('countTests should count runner.test() calls', () => {
    const evaluator = new TestQualityEvaluator();
    const content = `
        await runner.test('test1', () => {});
        await runner.test('test2', () => {});
    `;
    
    const count = evaluator.countTests(content);
    
    assert.ok(count >= 2, 'Should count runner.test() calls');
});

// Test 6: Recommendations tests
await runner.test('generateRecommendations should suggest adding tests when none exist', () => {
    const evaluator = new TestQualityEvaluator();
    const recommendations = evaluator.generateRecommendations(0, 0, [], 50);
    
    assert.ok(
        recommendations.some(r => r.includes('Add test cases')),
        'Should recommend adding test cases'
    );
});

await runner.test('generateRecommendations should suggest more assertions when density is low', () => {
    const evaluator = new TestQualityEvaluator();
    const recommendations = evaluator.generateRecommendations(10, 5, ['empty'], 60);
    
    assert.ok(
        recommendations.some(r => r.includes('assertion')),
        'Should recommend increasing assertions'
    );
});

await runner.test('generateRecommendations should suggest edge case tests when missing', () => {
    const evaluator = new TestQualityEvaluator();
    const recommendations = evaluator.generateRecommendations(5, 10, [], 70);
    
    assert.ok(
        recommendations.some(r => r.includes('edge case')),
        'Should recommend adding edge cases'
    );
});

await runner.test('generateRecommendations should suggest organization improvements for low scores', () => {
    const evaluator = new TestQualityEvaluator();
    const recommendations = evaluator.generateRecommendations(5, 10, ['empty'], 30);
    
    assert.ok(
        recommendations.some(r => r.includes('organization')),
        'Should recommend improving organization'
    );
});

await runner.test('generateRecommendations should give positive feedback for good tests', () => {
    const evaluator = new TestQualityEvaluator();
    const recommendations = evaluator.generateRecommendations(10, 25, ['empty', 'boundary', 'invalid'], 85);
    
    assert.ok(recommendations.length > 0, 'Should always return some recommendations');
});

// Test 7: Batch evaluation tests
await runner.test('scanTestFiles should find test files', () => {
    const evaluator = new TestQualityEvaluator('test');
    const testFiles = evaluator.scanTestFiles('test/unit');
    
    assert.ok(Array.isArray(testFiles), 'Should return an array');
    assert.ok(testFiles.length > 0, 'Should find at least one test file');
});

await runner.test('evaluateAllTests should evaluate multiple test files', () => {
    const evaluator = new TestQualityEvaluator();
    const reports = evaluator.evaluateAllTests('test/unit');
    
    assert.ok(Array.isArray(reports), 'Should return an array');
    assert.ok(reports.length > 0, 'Should evaluate at least one file');
    
    reports.forEach(report => {
        assert.ok(typeof report.testFile === 'string', 'Each report should have test file name');
        assert.ok(typeof report.totalTests === 'number', 'Each report should have test count');
    });
});

await runner.test('generateSummary should aggregate statistics', () => {
    const evaluator = new TestQualityEvaluator();
    const mockReports = [
        {
            testFile: 'test1.js',
            totalTests: 5,
            assertionCount: 10,
            edgeCasesCovered: ['empty', 'boundary'],
            organizationScore: 70,
            recommendations: []
        },
        {
            testFile: 'test2.js',
            totalTests: 3,
            assertionCount: 6,
            edgeCasesCovered: ['invalid', 'boundary'],
            organizationScore: 80,
            recommendations: []
        }
    ];
    
    const summary = evaluator.generateSummary(mockReports);
    
    assert.equal(summary.totalFiles, 2, 'Should count total files');
    assert.equal(summary.totalTests, 8, 'Should sum total tests');
    assert.equal(summary.totalAssertions, 16, 'Should sum total assertions');
    assert.equal(summary.averageAssertionsPerTest, 2, 'Should calculate average assertions per test');
    assert.equal(summary.averageOrganizationScore, 75, 'Should calculate average organization score');
    assert.ok(Array.isArray(summary.uniqueEdgeCasesCovered), 'Should have unique edge cases array');
    assert.equal(summary.uniqueEdgeCasesCovered.length, 3, 'Should have 3 unique edge cases');
});

await runner.test('generateSummary should handle empty reports', () => {
    const evaluator = new TestQualityEvaluator();
    const summary = evaluator.generateSummary([]);
    
    assert.equal(summary.totalFiles, 0, 'Should handle empty reports');
    assert.equal(summary.totalTests, 0, 'Should have 0 tests');
    assert.equal(summary.averageOrganizationScore, 0, 'Should have 0 average score');
});

// Print summary
const success = runner.summary();
process.exit(success ? 0 : 1);
