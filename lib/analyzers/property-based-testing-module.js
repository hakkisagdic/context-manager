/**
 * Property-Based Testing Module
 * Extracts properties from requirements and generates test strategies
 * Provides generator suggestions for property-based testing
 */

import fs from 'fs';
import path from 'path';

export class PropertyBasedTestingModule {
    constructor(requirementsPath) {
        this.requirementsPath = requirementsPath;
        this.requirements = null;
        this.properties = [];
    }

    /**
     * Load requirements from file
     * @returns {string} Requirements content
     */
    loadRequirements() {
        if (!fs.existsSync(this.requirementsPath)) {
            throw new Error(`Requirements file not found: ${this.requirementsPath}`);
        }
        this.requirements = fs.readFileSync(this.requirementsPath, 'utf-8');
        return this.requirements;
    }

    /**
     * Extract properties from a requirement
     * @param {string} requirement - Requirement text
     * @returns {Array<Property>}
     */
    extractProperties(requirement) {
        const properties = [];
        
        // Parse requirement structure
        const requirementMatch = requirement.match(/### Requirement (\d+):\s*(.+)/);
        if (!requirementMatch) {
            return properties;
        }

        const requirementId = requirementMatch[1];
        const requirementTitle = requirementMatch[2];

        // Extract acceptance criteria
        const criteriaSection = requirement.match(/#### Acceptance Criteria\s+([\s\S]+?)(?=###|$)/);
        if (!criteriaSection) {
            return properties;
        }

        const criteriaText = criteriaSection[1];
        const criteriaLines = criteriaText.split('\n').filter(line => line.trim());

        criteriaLines.forEach((line, index) => {
            const criteriaMatch = line.match(/^\d+\.\s+WHEN\s+(.+?)\s+THEN\s+the system SHALL\s+(.+)/i);
            if (criteriaMatch) {
                const trigger = criteriaMatch[1];
                const response = criteriaMatch[2];
                
                const property = this.createPropertyFromCriteria(
                    requirementId,
                    index + 1,
                    trigger,
                    response,
                    requirementTitle
                );
                
                if (property) {
                    properties.push(property);
                }
            }
        });

        return properties;
    }

    /**
     * Create a property definition from acceptance criteria
     * @param {string} requirementId - Requirement ID
     * @param {number} criteriaIndex - Criteria index
     * @param {string} trigger - Trigger condition
     * @param {string} response - Expected response
     * @param {string} requirementTitle - Requirement title
     * @returns {Property}
     */
    createPropertyFromCriteria(requirementId, criteriaIndex, trigger, response, requirementTitle) {
        const propertyId = `${requirementId}.${criteriaIndex}`;
        
        // Determine if this is testable as a property
        const testable = this.isPropertyTestable(trigger, response);
        
        if (!testable) {
            return null;
        }

        // Extract universal quantifier
        const universalQuantifier = this.extractUniversalQuantifier(trigger, response);
        
        // Create invariant description
        const invariant = this.createInvariant(trigger, response);
        
        // Determine property category
        const category = this.determinePropertyCategory(trigger, response);

        return {
            id: propertyId,
            description: `${trigger} → ${response}`,
            requirementId: `${requirementId}.${criteriaIndex}`,
            universalQuantifier,
            invariant,
            testable: true,
            category,
            requirementTitle
        };
    }

    /**
     * Determine if criteria is testable as a property
     * @param {string} trigger - Trigger condition
     * @param {string} response - Expected response
     * @returns {boolean}
     */
    isPropertyTestable(trigger, response) {
        // Check for non-testable patterns
        const nonTestablePatterns = [
            /UI.*display/i,
            /user.*see/i,
            /visual.*feedback/i,
            /aesthetic/i,
            /readable/i,
            /clear.*interface/i,
            /appropriate/i,
            /maintainable/i,
            /extensible/i
        ];

        const combined = `${trigger} ${response}`;
        
        for (const pattern of nonTestablePatterns) {
            if (pattern.test(combined)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Extract universal quantifier from criteria
     * @param {string} trigger - Trigger condition
     * @param {string} response - Expected response
     * @returns {string}
     */
    extractUniversalQuantifier(trigger, response) {
        // Identify the domain being quantified over
        const domains = [
            { pattern: /file|files/i, quantifier: 'For any file' },
            { pattern: /token|tokens/i, quantifier: 'For any token calculation' },
            { pattern: /method|function/i, quantifier: 'For any method' },
            { pattern: /pattern|rule/i, quantifier: 'For any pattern' },
            { pattern: /context|data/i, quantifier: 'For any context' },
            { pattern: /config|setting/i, quantifier: 'For any configuration' },
            { pattern: /plugin/i, quantifier: 'For any plugin' },
            { pattern: /preset/i, quantifier: 'For any preset' },
            { pattern: /repository|repo/i, quantifier: 'For any repository' },
            { pattern: /model/i, quantifier: 'For any model' },
            { pattern: /input/i, quantifier: 'For any input' }
        ];

        const combined = `${trigger} ${response}`;
        
        for (const { pattern, quantifier } of domains) {
            if (pattern.test(combined)) {
                return quantifier;
            }
        }

        return 'For any valid input';
    }

    /**
     * Create invariant description
     * @param {string} trigger - Trigger condition
     * @param {string} response - Expected response
     * @returns {string}
     */
    createInvariant(trigger, response) {
        return `When ${trigger}, then ${response}`;
    }

    /**
     * Determine property category
     * @param {string} trigger - Trigger condition
     * @param {string} response - Expected response
     * @returns {string}
     */
    determinePropertyCategory(trigger, response) {
        const combined = `${trigger} ${response}`.toLowerCase();

        if (/round.?trip|encode.*decode|write.*read|serialize.*deserialize/i.test(combined)) {
            return 'round-trip';
        }
        
        if (/preserve|maintain|keep|same|unchanged|consistent/i.test(combined)) {
            return 'invariant';
        }
        
        if (/idempotent|twice|multiple times/i.test(combined)) {
            return 'idempotence';
        }
        
        if (/error|invalid|fail|exception/i.test(combined)) {
            return 'error-condition';
        }
        
        if (/compare|relationship|ratio|relative/i.test(combined)) {
            return 'metamorphic';
        }

        return 'general';
    }

    /**
     * Generate test strategy for a property
     * @param {Property} property - Property definition
     * @returns {TestStrategy}
     */
    generateTestStrategy(property) {
        const generators = this.suggestGenerators(property);
        
        return {
            propertyId: property.id,
            approach: this.determineTestApproach(property),
            generators,
            iterations: 100,
            category: property.category,
            preconditions: this.extractPreconditions(property),
            postconditions: this.extractPostconditions(property)
        };
    }

    /**
     * Determine test approach based on property category
     * @param {Property} property - Property definition
     * @returns {string}
     */
    determineTestApproach(property) {
        const approaches = {
            'round-trip': 'Apply encode/decode or write/read and verify equality',
            'invariant': 'Apply transformation and verify invariant is preserved',
            'idempotence': 'Apply function twice and verify results are equal',
            'error-condition': 'Generate invalid inputs and verify error handling',
            'metamorphic': 'Verify relationships between related inputs/outputs',
            'general': 'Verify property holds across random inputs'
        };

        return approaches[property.category] || approaches['general'];
    }

    /**
     * Suggest generators for a property
     * @param {Property} property - Property definition
     * @returns {Array<GeneratorSuggestion>}
     */
    suggestGenerators(property) {
        const generators = [];
        const description = property.description.toLowerCase();

        // File-related generators
        if (/file|path/i.test(description)) {
            generators.push({
                type: 'file',
                generator: 'fc.string()',
                description: 'Random file content',
                example: 'fc.string({ minLength: 0, maxLength: 1000 })'
            });
            generators.push({
                type: 'filepath',
                generator: 'fc.array(fc.string(), { minLength: 1, maxLength: 5 }).map(parts => parts.join("/"))',
                description: 'Random file path',
                example: 'src/utils/helper.js'
            });
        }

        // Token-related generators
        if (/token/i.test(description)) {
            generators.push({
                type: 'content',
                generator: 'fc.string()',
                description: 'Random text content for token calculation',
                example: 'fc.string({ minLength: 10, maxLength: 10000 })'
            });
        }

        // Method/function generators
        if (/method|function/i.test(description)) {
            generators.push({
                type: 'code',
                generator: 'fc.oneof(fc.constant("function foo() {}"), fc.constant("const bar = () => {}"))',
                description: 'Random function definitions',
                example: 'Various function syntaxes'
            });
        }

        // Pattern generators
        if (/pattern|rule|filter/i.test(description)) {
            generators.push({
                type: 'pattern',
                generator: 'fc.string()',
                description: 'Random glob patterns',
                example: 'fc.oneof(fc.constant("*.js"), fc.constant("**/*.test.js"))'
            });
        }

        // Configuration generators
        if (/config|setting|option/i.test(description)) {
            generators.push({
                type: 'config',
                generator: 'fc.record({ key: fc.string(), value: fc.anything() })',
                description: 'Random configuration objects',
                example: '{ tokenLimit: 1000, format: "toon" }'
            });
        }

        // Context/data generators
        if (/context|data|object/i.test(description)) {
            generators.push({
                type: 'object',
                generator: 'fc.object()',
                description: 'Random objects',
                example: 'fc.record({ files: fc.array(fc.string()), tokens: fc.nat() })'
            });
        }

        // Number generators
        if (/count|number|size|limit|budget/i.test(description)) {
            generators.push({
                type: 'number',
                generator: 'fc.nat()',
                description: 'Random natural numbers',
                example: 'fc.nat({ max: 100000 })'
            });
        }

        // Array generators
        if (/list|array|set|collection/i.test(description)) {
            generators.push({
                type: 'array',
                generator: 'fc.array(fc.string())',
                description: 'Random arrays',
                example: 'fc.array(fc.string(), { minLength: 0, maxLength: 100 })'
            });
        }

        // If no specific generators found, add generic ones
        if (generators.length === 0) {
            generators.push({
                type: 'generic',
                generator: 'fc.anything()',
                description: 'Random values of any type',
                example: 'fc.anything()'
            });
        }

        return generators;
    }

    /**
     * Extract preconditions from property
     * @param {Property} property - Property definition
     * @returns {Array<string>}
     */
    extractPreconditions(property) {
        const preconditions = [];
        const description = property.description.toLowerCase();

        if (/valid/i.test(description)) {
            preconditions.push('Input must be valid');
        }
        
        if (/non-empty|not empty/i.test(description)) {
            preconditions.push('Input must not be empty');
        }
        
        if (/exist/i.test(description)) {
            preconditions.push('Resource must exist');
        }

        return preconditions;
    }

    /**
     * Extract postconditions from property
     * @param {Property} property - Property definition
     * @returns {Array<string>}
     */
    extractPostconditions(property) {
        const postconditions = [];
        const description = property.description.toLowerCase();

        if (/equal|same|preserve/i.test(description)) {
            postconditions.push('Result must equal expected value');
        }
        
        if (/error|throw|fail/i.test(description)) {
            postconditions.push('Must handle errors appropriately');
        }
        
        if (/return|produce|generate/i.test(description)) {
            postconditions.push('Must return valid result');
        }

        return postconditions;
    }

    /**
     * Extract all properties from requirements document
     * @returns {Array<Property>}
     */
    extractAllProperties() {
        if (!this.requirements) {
            this.loadRequirements();
        }

        const properties = [];
        
        // Split requirements into sections
        const requirementSections = this.requirements.split(/(?=### Requirement \d+:)/);
        
        requirementSections.forEach(section => {
            if (section.trim()) {
                const sectionProperties = this.extractProperties(section);
                properties.push(...sectionProperties);
            }
        });

        this.properties = properties;
        return properties;
    }

    /**
     * Generate test strategies for all properties
     * @returns {Array<TestStrategy>}
     */
    generateAllTestStrategies() {
        if (this.properties.length === 0) {
            this.extractAllProperties();
        }

        return this.properties.map(property => this.generateTestStrategy(property));
    }

    /**
     * Get property by ID
     * @param {string} propertyId - Property ID
     * @returns {Property|null}
     */
    getPropertyById(propertyId) {
        return this.properties.find(p => p.id === propertyId) || null;
    }

    /**
     * Get properties by category
     * @param {string} category - Property category
     * @returns {Array<Property>}
     */
    getPropertiesByCategory(category) {
        return this.properties.filter(p => p.category === category);
    }

    /**
     * Get properties by requirement ID
     * @param {string} requirementId - Requirement ID
     * @returns {Array<Property>}
     */
    getPropertiesByRequirement(requirementId) {
        return this.properties.filter(p => p.requirementId.startsWith(requirementId));
    }

    /**
     * Generate property summary
     * @returns {Object}
     */
    generateSummary() {
        if (this.properties.length === 0) {
            this.extractAllProperties();
        }

        const categoryCounts = {};
        this.properties.forEach(p => {
            categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
        });

        return {
            totalProperties: this.properties.length,
            testableProperties: this.properties.filter(p => p.testable).length,
            categoryCounts,
            categories: Object.keys(categoryCounts)
        };
    }
}

export default PropertyBasedTestingModule;
