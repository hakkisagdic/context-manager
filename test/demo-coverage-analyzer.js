/**
 * Demo script to show CoverageAnalyzer in action
 */

import { CoverageAnalyzer } from '../lib/analyzers/coverage-analyzer.js';

console.log('='.repeat(60));
console.log('Coverage Analyzer Demo');
console.log('='.repeat(60));

const analyzer = new CoverageAnalyzer();

console.log('\n📊 Analyzing project coverage...\n');

const report = analyzer.analyzeCoverage();

console.log(`Total Modules: ${report.totalModules}`);
console.log(`Tested Modules: ${report.testedModules}`);
console.log(`Overall Coverage: ${report.coveragePercentage.toFixed(2)}%`);
console.log(`Total Functions: ${report.totalFunctions}`);
console.log(`Tested Functions: ${report.testedFunctions}`);
console.log(`Untested Functions: ${report.untestedFunctions.length}`);

console.log('\n📁 Top 5 Modules by Coverage:\n');

const sortedModules = report.moduleDetails
    .sort((a, b) => b.coveragePercentage - a.coveragePercentage)
    .slice(0, 5);

sortedModules.forEach((module, index) => {
    console.log(`${index + 1}. ${module.modulePath}`);
    console.log(`   Coverage: ${module.coveragePercentage.toFixed(2)}%`);
    console.log(`   Functions: ${module.testedFunctions}/${module.totalFunctions}`);
});

console.log('\n📉 Top 5 Modules Needing Tests:\n');

const needingTests = report.moduleDetails
    .filter(m => m.totalFunctions > 0)
    .sort((a, b) => a.coveragePercentage - b.coveragePercentage)
    .slice(0, 5);

needingTests.forEach((module, index) => {
    console.log(`${index + 1}. ${module.modulePath}`);
    console.log(`   Coverage: ${module.coveragePercentage.toFixed(2)}%`);
    console.log(`   Untested: ${module.untestedFunctions.length} functions`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ Coverage analysis complete!');
console.log('='.repeat(60));
