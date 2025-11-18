/**
 * Unit Tests for PropertyBasedTestingModule
 * Tests property extraction, test strategy generation, and generator suggestions
 */

import { TestRunner, assert } from '../helpers/test-runner.js';
import { PropertyBasedTestingModule } from '../../lib/analyzers/property-based-testing-module.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runner = new TestRunner('PropertyBasedTestingModule Tests');

// Sample requirements content for testing
const sampleRequirements = `
# Requirements Document

## Introduction
Test requirements document

## Glossary
- **System**: The test system

## Requirements

### Requirement 1: Token Calculation

**User Story:** As a developer, I want accurate token calculation.

#### Acceptance Criteria

1. WHEN token calculator analyzes a file THEN the system SHALL calculate correct token count
2. WHEN tiktoken is unavailable THEN the system SHALL estimate with 95% accuracy
3. WHEN multiple files are analyzed THEN the system SHALL sum token counts correctly

### Requirement 2: UI Display

**User Story:** As a user, I want clear UI display.

#### Acceptance Criteria

1. WHEN UI is displayed THEN the system SHALL show clear interface
2. WHEN user sees results THEN the system SHALL provide visual feedback
`;

// Create temporary requirements file for testing
const tempRequirementsPath = path.join(__dirname, '../fixtures/temp-requirements.md');

// Setup: Create temp requirements file
try {
    fs.mkdirSync(path.dirname(tempRequirementsPath), { recursive: true });
    fs.writeFileSync(tempRequirementsPath, sampleRequirements);
} catch (error) {
    console.error('Setup error:', error);
}

// Test: Constructor
await runner.test('Constructor should initialize with requirements path', () => {
    const module = new PropertyBasedTestingModule(tempRequirementsPath);
    
    assert.equal(module.requirementsPath, tempRequirementsPath, 'Should store requirements path');
    assert.equal(module.requirements, null, 'Should initialize requirements as null');
    assert.ok(Array.isArray(module.properties), 'Should initialize properties as array');
    assert.equal(module.properties.length, 0, 'Should initialize properties as empty array');
});

// Test: Load requirements
await runner.test('loadRequirements should load requirements from file', () => {
    const module = new PropertyBasedTestingModule(tempRequirementsPath);
    const content = module.loadRequirements();
    
    assert.ok(typeof content === 'string', 'Should return string content');
    assert.ok(content.includes('Token Calculation'), 'Should contain requirement text');
    assert.ok(module.requirements !== null, 'Should store requirements in instance');
});

// Test: Load requirements - file not found
await runner.test('loadRequirements should throw error if file not found', () => {
    const module = new PropertyBasedTestingModule('/nonexistent/path.md');
    
    try {
        module.loadRequirements();
        assert.ok(false, 'Should have thrown error');
    } catch (error) {
        assert.ok(error.message.includes('not found'), 'Should throw file not found error');
    }
});

// Test: Extract properties from requirement
await runner.test('extractProperties should extract testable properties', () => {
    const module = new PropertyBasedTestingModule(tempRequirementsPath);
    module.loadRequirements();
    
    const requirement = `
### Requirement 1: Token Calculation

**User Story:** As a developer, I want accurate token calculation.

#### Acceptance Criteria

1. WHEN token calculator analyzes a file THEN the system SHALL calculate correct token count
2. WHEN tiktoken is unavailable THEN the system SHALL estimate with 95% accuracy
`;
    
    const properties = module.extractProperties(requirement);
    
    assert.ok(Array.isArray(properties), 'Should return array of properties');
    assert.ok(properties.length > 0, 'Should extract at least one property');
    assert.equal(properties[0].id, '1.1', 'Should have correct property ID');
    assert.equal(properties[0].testable, true, 'Should mark as testable');
});

// Test: Extract properties - non-testable criteria
await runner.test('extractProperties should filter out non-testable criteria', () => {
    const module = new PropertyBasedTestingModule(tempRequirementsPath);
    
    const requirement = `
### Requirement 2: UI Display

**User Story:** As a user, I want clear UI display.

#### Acceptance Criteria

1. WHEN UI is displayed THEN the system SHALL show clear interface
2. WHEN user sees results THEN the system SHALL provide visual feedback
`;
    
    const properties = module.extractProperties(requirement);
    
    // UI-related criteria should be filtered out as non-testable
    assert.equal(properties.length, 0, 'Should filter out non-testable UI criteria');
});

// Test: isPropertyTestable
await runner.test('isPropertyTestable should identify testable properties', () => {
    const module = new PropertyBasedTestingModule(tempRequirementsPath);
    
    // Testable
    assert.ok(
        module.isPropertyTestable('file is analyzed', 'calculate token count'),
        'Should identify testable property'
    );
    
    // Non-testable (UI)
    assert.ok(
        !module.isPropertyTestable('UI is displayed', 'show clear interface'),
        'Should identify non-testable UI property'
    );
    
    // Non-testable (visual)
    assert.ok(
        !module.isPropertyTestable('user sees', 'visual feedback'),
        'Should identify non-testable visual property'
    );
});

// Test: extractUniversalQuantifier
await runner.test('extractUniversalQuantifier should extract correct quantifier', () => {
    const module = new PropertyBasedTestingModule(tempRequirementsPath);
    
    const fileQuantifier = module.extractUniversalQuantifier('a file is analyzed', 'calculate tokens');
    assert.equal(fileQuantifier, 'For any file', 'Should extract file quantifier');
    
    const tokenQuantifier = module.extractUniversalQuantifier('token calculation', 'return count');
    assert.equal(tokenQuantifier, 'For any token calculation', 'Should extract token quantifier');
    
    const methodQuantifier = module.extractUniversalQuantifier('method is extracted', 'return definition');
    assert.equal(methodQuantifier, 'For any method', 'Should extract method quantifier');
});

// Test: determinePropertyCategory
await runner.test('determinePropertyCategory should categorize properties correctly', () => {
    const module = new PropertyBasedTestingModule(tempRequirementsPath);
    
    const roundTrip = module.determinePropertyCategory('encode then decode', 'preserve original');
    assert.equal(roundTrip, 'round-trip', 'Should identify round-trip property');
    
    const invariant = module.determinePropertyCategory('transform data', 'maintain structure');
    assert.equal(invariant, 'invariant', 'Should identify invariant property');
    
    const error = module.determinePropertyCategory('invalid input', 'throw error');
    assert.equal(error, 'error-condition', 'Should identify error-condition property');
});

// Test: generateTestStrategy
await runner.test('generateTestStrategy should create complete test strategy', () => {
    const module = new PropertyBasedTestingModule(tempRequirementsPath);
    
    const property = {
        id: '1.1',
        description: 'file analysis → token count',
        requirementId: '1.1',
        universalQuantifier: 'For any file',
        invariant: 'When file is analyzed, then calculate token count',
        testable: true,
        category: 'general'
    };
    
    const strategy = module.generateTestStrategy(property);
    
    assert.equal(strategy.propertyId, '1.1', 'Should have correct property ID');
    assert.ok(typeof strategy.approach === 'string', 'Should have test approach');
    assert.ok(Array.isArray(strategy.generators), 'Should have generators array');
    assert.equal(strategy.iterations, 100, 'Should have 100 iterations');
    assert.equal(strategy.category, 'general', 'Should have correct category');
});

// Test: suggestGenerators
await runner.test('suggestGenerators should suggest appropriate generators', () => {
    const module = new PropertyBasedTestingModule(tempRequirementsPath);
    
    // File-related property
    const fileProperty = { id: '1.1', description: 'file analysis → token count', category: 'general' };
    const fileGenerators = module.suggestGenerators(fileProperty);
    assert.ok(fileGenerators.length > 0, 'Should suggest generators for file property');
    assert.ok(fileGenerators.some(g => g.type === 'file'), 'Should suggest file generator');
    
    // Token-related property
    const tokenProperty = { id: '1.2', description: 'token calculation → accurate count', category: 'general' };
    const tokenGenerators = module.suggestGenerators(tokenProperty);
    assert.ok(tokenGenerators.some(g => g.type === 'content'), 'Should suggest content generator for tokens');
    
    // Config-related property
    const configProperty = { id: '1.3', description: 'configuration → apply settings', category: 'general' };
    const configGenerators = module.suggestGenerators(configProperty);
    assert.ok(configGenerators.some(g => g.type === 'config'), 'Should suggest config generator');
});

// Test: extractAllProperties
await runner.test('extractAllProperties should extract all properties from document', () => {
    const module = new PropertyBasedTestingModule(tempRequirementsPath);
    const properties = module.extractAllProperties();
    
    assert.ok(Array.isArray(properties), 'Should return array of properties');
    assert.ok(properties.length > 0, 'Should extract properties from document');
    assert.equal(module.properties.length, properties.length, 'Should store properties in instance');
});

// Test: generateAllTestStrategies
await runner.test('generateAllTestStrategies should generate strategies for all properties', () => {
    const module = new PropertyBasedTestingModule(tempRequirementsPath);
    const strategies = module.generateAllTestStrategies();
    
    assert.ok(Array.isArray(strategies), 'Should return array of strategies');
    assert.ok(strategies.length > 0, 'Should generate strategies');
    assert.ok(strategies.every(s => s.iterations === 100), 'All strategies should have 100 iterations');
    assert.ok(strategies.every(s => Array.isArray(s.generators)), 'All strategies should have generators');
});

// Test: getPropertyById
await runner.test('getPropertyById should retrieve property by ID', () => {
    const module = new PropertyBasedTestingModule(tempRequirementsPath);
    module.extractAllProperties();
    
    const property = module.getPropertyById('1.1');
    
    if (property) {
        assert.equal(property.id, '1.1', 'Should return property with correct ID');
    }
    
    const nonExistent = module.getPropertyById('999.999');
    assert.equal(nonExistent, null, 'Should return null for non-existent ID');
});

// Test: getPropertiesByCategory
await runner.test('getPropertiesByCategory should filter properties by category', () => {
    const module = new PropertyBasedTestingModule(tempRequirementsPath);
    module.extractAllProperties();
    
    const generalProperties = module.getPropertiesByCategory('general');
    
    assert.ok(Array.isArray(generalProperties), 'Should return array');
    assert.ok(generalProperties.every(p => p.category === 'general'), 'All properties should have general category');
});

// Test: getPropertiesByRequirement
await runner.test('getPropertiesByRequirement should filter properties by requirement', () => {
    const module = new PropertyBasedTestingModule(tempRequirementsPath);
    module.extractAllProperties();
    
    const req1Properties = module.getPropertiesByRequirement('1');
    
    assert.ok(Array.isArray(req1Properties), 'Should return array');
    assert.ok(req1Properties.every(p => p.requirementId.startsWith('1')), 'All properties should belong to requirement 1');
});

// Test: generateSummary
await runner.test('generateSummary should generate property summary', () => {
    const module = new PropertyBasedTestingModule(tempRequirementsPath);
    const summary = module.generateSummary();
    
    assert.ok(typeof summary.totalProperties === 'number', 'Should have total properties count');
    assert.ok(typeof summary.testableProperties === 'number', 'Should have testable properties count');
    assert.ok(typeof summary.categoryCounts === 'object', 'Should have category counts');
    assert.ok(Array.isArray(summary.categories), 'Should have categories array');
});

// Test: createPropertyFromCriteria
await runner.test('createPropertyFromCriteria should create property with all fields', () => {
    const module = new PropertyBasedTestingModule(tempRequirementsPath);
    
    const property = module.createPropertyFromCriteria('1', 1, 'file is analyzed', 'calculate token count', 'Token Calculation');
    
    assert.ok(property !== null, 'Should create property');
    assert.equal(property.id, '1.1', 'Should have correct ID');
    assert.equal(property.requirementId, '1.1', 'Should have correct requirement ID');
    assert.equal(property.testable, true, 'Should be testable');
    assert.ok(typeof property.universalQuantifier === 'string', 'Should have universal quantifier');
    assert.ok(typeof property.invariant === 'string', 'Should have invariant');
    assert.ok(typeof property.category === 'string', 'Should have category');
});

// Test: createPropertyFromCriteria - non-testable
await runner.test('createPropertyFromCriteria should return null for non-testable criteria', () => {
    const module = new PropertyBasedTestingModule(tempRequirementsPath);
    
    const property = module.createPropertyFromCriteria('2', 1, 'UI is displayed', 'show clear interface', 'UI Display');
    
    assert.equal(property, null, 'Should return null for non-testable criteria');
});

// Test: extractPreconditions
await runner.test('extractPreconditions should extract preconditions from property', () => {
    const module = new PropertyBasedTestingModule(tempRequirementsPath);
    
    const property = { description: 'valid file must exist → process correctly', category: 'general' };
    const preconditions = module.extractPreconditions(property);
    
    assert.ok(Array.isArray(preconditions), 'Should return array');
    assert.ok(preconditions.some(p => p.includes('valid')), 'Should extract valid precondition');
    assert.ok(preconditions.some(p => p.includes('exist')), 'Should extract exist precondition');
});

// Test: extractPostconditions
await runner.test('extractPostconditions should extract postconditions from property', () => {
    const module = new PropertyBasedTestingModule(tempRequirementsPath);
    
    const property = { description: 'process file → return equal result', category: 'general' };
    const postconditions = module.extractPostconditions(property);
    
    assert.ok(Array.isArray(postconditions), 'Should return array');
    assert.ok(postconditions.some(p => p.includes('equal') || p.includes('return')), 'Should extract postcondition');
});

// Cleanup: Remove temp requirements file
try {
    fs.unlinkSync(tempRequirementsPath);
} catch (error) {
    // Ignore cleanup errors
}

// Run all tests and display results
const success = runner.summary();
process.exit(success ? 0 : 1);
