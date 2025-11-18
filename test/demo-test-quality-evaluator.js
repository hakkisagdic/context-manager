/**
 * Demo script for Test Quality Evaluator
 * Shows how to use the evaluator to analyze test quality
 */

import { TestQualityEvaluator } from '../lib/analyzers/test-quality-evaluator.js';
import path from 'path';

console.log('='.repeat(60));
console.log('Test Quality Evaluator Demo');
console.log('='.repeat(60));
console.log();

// Create evaluator instance
const evaluator = new TestQualityEvaluator();

// Evaluate all tests in the unit directory
console.log('Evaluating test files in test/unit directory...');
console.log();

const reports = evaluator.evaluateAllTests('test/unit');

// Display individual reports
reports.forEach((report, index) => {
    console.log(`${index + 1}. ${report.testFile}`);
    console.log(`   Tests: ${report.totalTests}`);
    console.log(`   Assertions: ${report.assertionCount}`);
    console.log(`   Edge Cases: ${report.edgeCasesCovered.join(', ') || 'none'}`);
    console.log(`   Organization Score: ${report.organizationScore}/100`);
    console.log(`   Recommendations:`);
    report.recommendations.forEach(rec => {
        console.log(`     - ${rec}`);
    });
    console.log();
});

// Generate and display summary
console.log('='.repeat(60));
console.log('Summary Statistics');
console.log('='.repeat(60));

const summary = evaluator.generateSummary(reports);

console.log(`Total Test Files: ${summary.totalFiles}`);
console.log(`Total Tests: ${summary.totalTests}`);
console.log(`Total Assertions: ${summary.totalAssertions}`);
console.log(`Average Assertions per Test: ${summary.averageAssertionsPerTest.toFixed(2)}`);
console.log(`Average Organization Score: ${summary.averageOrganizationScore}/100`);
console.log(`Unique Edge Cases Covered: ${summary.uniqueEdgeCasesCovered.join(', ')}`);
console.log(`Files Needing Improvement: ${summary.filesNeedingImprovement}`);
console.log();

// Quality assessment
const avgScore = summary.averageOrganizationScore;
let assessment;
if (avgScore >= 80) {
    assessment = '✓ Excellent - Tests are well organized and comprehensive';
} else if (avgScore >= 60) {
    assessment = '✓ Good - Tests are solid with room for improvement';
} else if (avgScore >= 40) {
    assessment = '⚠ Fair - Tests need better organization and coverage';
} else {
    assessment = '✗ Poor - Tests require significant improvement';
}

console.log('Overall Assessment:', assessment);
console.log();
console.log('='.repeat(60));
