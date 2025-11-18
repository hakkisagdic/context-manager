/**
 * Demo: Property-Based Testing Module
 * Demonstrates the PropertyBasedTestingModule functionality
 */

import { PropertyBasedTestingModule } from '../lib/analyzers/property-based-testing-module.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('='.repeat(70));
console.log('Property-Based Testing Module Demo');
console.log('='.repeat(70));
console.log();

// Use the actual requirements file from the spec
const requirementsPath = path.join(__dirname, '../.kiro/specs/comprehensive-test-validation/requirements.md');

try {
    // Initialize the module
    console.log('1. Initializing PropertyBasedTestingModule...');
    const module = new PropertyBasedTestingModule(requirementsPath);
    console.log('   ✓ Module initialized');
    console.log();

    // Load requirements
    console.log('2. Loading requirements document...');
    module.loadRequirements();
    console.log('   ✓ Requirements loaded');
    console.log();

    // Extract all properties
    console.log('3. Extracting properties from requirements...');
    const properties = module.extractAllProperties();
    console.log(`   ✓ Extracted ${properties.length} testable properties`);
    console.log();

    // Generate summary
    console.log('4. Generating property summary...');
    const summary = module.generateSummary();
    console.log(`   Total Properties: ${summary.totalProperties}`);
    console.log(`   Testable Properties: ${summary.testableProperties}`);
    console.log(`   Categories: ${summary.categories.join(', ')}`);
    console.log();
    console.log('   Category Breakdown:');
    Object.entries(summary.categoryCounts).forEach(([category, count]) => {
        console.log(`     - ${category}: ${count}`);
    });
    console.log();

    // Show sample properties
    console.log('5. Sample Properties:');
    console.log();
    
    const sampleProperties = properties.slice(0, 3);
    sampleProperties.forEach((prop, index) => {
        console.log(`   Property ${index + 1}:`);
        console.log(`     ID: ${prop.id}`);
        console.log(`     Category: ${prop.category}`);
        console.log(`     Quantifier: ${prop.universalQuantifier}`);
        console.log(`     Description: ${prop.description.substring(0, 80)}...`);
        console.log();
    });

    // Generate test strategies
    console.log('6. Generating test strategies...');
    const strategies = module.generateAllTestStrategies();
    console.log(`   ✓ Generated ${strategies.length} test strategies`);
    console.log();

    // Show sample strategy
    if (strategies.length > 0) {
        console.log('7. Sample Test Strategy:');
        const sampleStrategy = strategies[0];
        console.log(`   Property ID: ${sampleStrategy.propertyId}`);
        console.log(`   Category: ${sampleStrategy.category}`);
        console.log(`   Approach: ${sampleStrategy.approach}`);
        console.log(`   Iterations: ${sampleStrategy.iterations}`);
        console.log(`   Generators (${sampleStrategy.generators.length}):`);
        sampleStrategy.generators.slice(0, 2).forEach(gen => {
            console.log(`     - Type: ${gen.type}`);
            console.log(`       Generator: ${gen.generator}`);
            console.log(`       Description: ${gen.description}`);
        });
        console.log();
    }

    // Show properties by category
    console.log('8. Properties by Category:');
    summary.categories.forEach(category => {
        const categoryProps = module.getPropertiesByCategory(category);
        console.log(`   ${category}: ${categoryProps.length} properties`);
    });
    console.log();

    console.log('='.repeat(70));
    console.log('Demo completed successfully!');
    console.log('='.repeat(70));

} catch (error) {
    console.error('Error during demo:', error.message);
    console.error(error.stack);
    process.exit(1);
}
