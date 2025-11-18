/**
 * Unit Tests for Coverage Analyzer
 * Tests constructor, module scanning, function detection, and coverage calculation
 */

import { CoverageAnalyzer } from '../../lib/analyzers/coverage-analyzer.js';
import { TestRunner, assert } from '../helpers/test-runner.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runner = new TestRunner('Coverage Analyzer Unit Tests');

// Test 1: Constructor tests
await runner.test('CoverageAnalyzer constructor should initialize with default values', () => {
    const analyzer = new CoverageAnalyzer();
    
    assert.ok(analyzer.projectRoot, 'Project root should be set');
    assert.ok(analyzer.testDirectory, 'Test directory should be set');
    assert.ok(analyzer.libDirectory, 'Lib directory should be set');
});

await runner.test('CoverageAnalyzer constructor should accept custom project root', () => {
    const customRoot = '/custom/path';
    const analyzer = new CoverageAnalyzer(customRoot);
    
    assert.equal(analyzer.projectRoot, customRoot, 'Project root should match custom path');
    assert.ok(analyzer.testDirectory.includes('test'), 'Test directory should include test folder');
});

await runner.test('CoverageAnalyzer constructor should accept custom test directory', () => {
    const customRoot = '/custom/path';
    const customTestDir = 'tests';
    const analyzer = new CoverageAnalyzer(customRoot, customTestDir);
    
    assert.ok(analyzer.testDirectory.includes(customTestDir), 'Test directory should use custom name');
});

// Test 2: Module scanning tests
await runner.test('scanModules should return array of module paths', () => {
    const analyzer = new CoverageAnalyzer();
    const modules = analyzer.scanModules();
    
    assert.ok(Array.isArray(modules), 'Should return an array');
    assert.ok(modules.length > 0, 'Should find at least one module');
    assert.ok(modules.every(m => m.endsWith('.js')), 'All modules should be .js files');
});

await runner.test('scanModules should find modules in lib directory', () => {
    const analyzer = new CoverageAnalyzer();
    const modules = analyzer.scanModules();
    
    const hasAnalyzers = modules.some(m => m.includes('analyzers'));
    const hasCore = modules.some(m => m.includes('core'));
    
    assert.ok(hasAnalyzers || hasCore, 'Should find modules in subdirectories');
});

await runner.test('scanTestFiles should return array of test file paths', () => {
    const analyzer = new CoverageAnalyzer();
    const testFiles = analyzer.scanTestFiles();
    
    assert.ok(Array.isArray(testFiles), 'Should return an array');
    assert.ok(testFiles.length > 0, 'Should find at least one test file');
});

await runner.test('scanTestFiles should find test files with correct naming patterns', () => {
    const analyzer = new CoverageAnalyzer();
    const testFiles = analyzer.scanTestFiles();
    
    const hasTestPrefix = testFiles.some(f => path.basename(f).startsWith('test-'));
    const hasTestSuffix = testFiles.some(f => f.endsWith('.test.js'));
    const hasPropertySuffix = testFiles.some(f => f.endsWith('.property.js'));
    
    assert.ok(
        hasTestPrefix || hasTestSuffix || hasPropertySuffix, 
        'Should find files with test naming patterns'
    );
});

// Test 3: Function detection tests
await runner.test('extractFunctions should detect regular function declarations', () => {
    const analyzer = new CoverageAnalyzer();
    const content = `
        function testFunction() {
            return true;
        }
        
        export function exportedFunction() {
            return false;
        }
    `;
    
    const functions = analyzer.extractFunctions(content);
    
    assert.ok(functions.length >= 2, 'Should find at least 2 functions');
    assert.ok(functions.some(f => f.name === 'testFunction'), 'Should find testFunction');
    assert.ok(functions.some(f => f.name === 'exportedFunction'), 'Should find exportedFunction');
});

await runner.test('extractFunctions should detect arrow functions', () => {
    const analyzer = new CoverageAnalyzer();
    const content = `
        const arrowFunc = () => {
            return true;
        };
        
        const asyncArrow = async () => {
            return false;
        };
    `;
    
    const functions = analyzer.extractFunctions(content);
    
    assert.ok(functions.some(f => f.name === 'arrowFunc'), 'Should find arrowFunc');
    assert.ok(functions.some(f => f.name === 'asyncArrow'), 'Should find asyncArrow');
});

await runner.test('extractFunctions should detect class methods', () => {
    const analyzer = new CoverageAnalyzer();
    const content = `
        class TestClass {
            constructor() {}
            
            methodOne() {
                return true;
            }
            
            async methodTwo() {
                return false;
            }
        }
    `;
    
    const functions = analyzer.extractFunctions(content);
    
    assert.ok(functions.some(f => f.name === 'constructor'), 'Should find constructor');
    assert.ok(functions.some(f => f.name === 'methodOne'), 'Should find methodOne');
    assert.ok(functions.some(f => f.name === 'methodTwo'), 'Should find methodTwo');
});

await runner.test('extractFunctions should not detect keywords as functions', () => {
    const analyzer = new CoverageAnalyzer();
    const content = `
        if (condition) {
            for (let i = 0; i < 10; i++) {
                while (true) {
                    break;
                }
            }
        }
    `;
    
    const functions = analyzer.extractFunctions(content);
    
    assert.ok(!functions.some(f => f.name === 'if'), 'Should not detect if as function');
    assert.ok(!functions.some(f => f.name === 'for'), 'Should not detect for as function');
    assert.ok(!functions.some(f => f.name === 'while'), 'Should not detect while as function');
});

await runner.test('extractFunctions should include line numbers', () => {
    const analyzer = new CoverageAnalyzer();
    const content = `
        function firstFunction() {}
        
        function secondFunction() {}
    `;
    
    const functions = analyzer.extractFunctions(content);
    
    assert.ok(functions.every(f => typeof f.line === 'number'), 'All functions should have line numbers');
    assert.ok(functions.every(f => f.line > 0), 'Line numbers should be positive');
});

// Test 4: Coverage calculation tests
await runner.test('analyzeModule should return coverage metrics', () => {
    const analyzer = new CoverageAnalyzer();
    const modules = analyzer.scanModules();
    
    if (modules.length > 0) {
        const coverage = analyzer.analyzeModule(modules[0]);
        
        assert.ok(typeof coverage.modulePath === 'string', 'Should have module path');
        assert.ok(typeof coverage.totalFunctions === 'number', 'Should have total functions count');
        assert.ok(typeof coverage.testedFunctions === 'number', 'Should have tested functions count');
        assert.ok(typeof coverage.coveragePercentage === 'number', 'Should have coverage percentage');
        assert.ok(Array.isArray(coverage.untestedFunctions), 'Should have untested functions array');
    }
});

await runner.test('analyzeModule should calculate correct coverage percentage', () => {
    const analyzer = new CoverageAnalyzer();
    const modules = analyzer.scanModules();
    
    if (modules.length > 0) {
        const coverage = analyzer.analyzeModule(modules[0]);
        
        assert.ok(coverage.coveragePercentage >= 0, 'Coverage should be non-negative');
        assert.ok(coverage.coveragePercentage <= 100, 'Coverage should not exceed 100%');
        
        if (coverage.totalFunctions > 0) {
            const expectedPercentage = (coverage.testedFunctions / coverage.totalFunctions) * 100;
            const roundedExpected = Math.round(expectedPercentage * 100) / 100;
            assert.equal(
                coverage.coveragePercentage, 
                roundedExpected, 
                'Coverage percentage should be correctly calculated'
            );
        }
    }
});

await runner.test('analyzeCoverage should return complete coverage report', () => {
    const analyzer = new CoverageAnalyzer();
    const report = analyzer.analyzeCoverage();
    
    assert.ok(typeof report.totalModules === 'number', 'Should have total modules count');
    assert.ok(typeof report.testedModules === 'number', 'Should have tested modules count');
    assert.ok(typeof report.coveragePercentage === 'number', 'Should have overall coverage percentage');
    assert.ok(Array.isArray(report.moduleDetails), 'Should have module details array');
    assert.ok(Array.isArray(report.untestedFunctions), 'Should have untested functions array');
});

await runner.test('analyzeCoverage should aggregate module statistics', () => {
    const analyzer = new CoverageAnalyzer();
    const report = analyzer.analyzeCoverage();
    
    assert.ok(report.totalModules > 0, 'Should find at least one module');
    assert.ok(report.moduleDetails.length === report.totalModules, 'Module details should match total count');
    
    const sumFunctions = report.moduleDetails.reduce((sum, m) => sum + m.totalFunctions, 0);
    assert.equal(report.totalFunctions, sumFunctions, 'Total functions should match sum of module functions');
});

await runner.test('calculateCoveragePercentage should return valid percentage', () => {
    const analyzer = new CoverageAnalyzer();
    const percentage = analyzer.calculateCoveragePercentage();
    
    assert.ok(typeof percentage === 'number', 'Should return a number');
    assert.ok(percentage >= 0, 'Percentage should be non-negative');
    assert.ok(percentage <= 100, 'Percentage should not exceed 100%');
});

await runner.test('findUntestedFunctions should return function details', () => {
    const analyzer = new CoverageAnalyzer();
    const report = analyzer.analyzeCoverage();
    
    report.untestedFunctions.forEach(func => {
        assert.ok(typeof func.name === 'string', 'Function should have name');
        assert.ok(typeof func.module === 'string', 'Function should have module path');
        assert.ok(typeof func.line === 'number', 'Function should have line number');
        assert.ok(typeof func.type === 'string', 'Function should have type');
    });
});

// Test 5: Helper method tests
await runner.test('getLineNumber should return correct line number', () => {
    const analyzer = new CoverageAnalyzer();
    const content = 'line1\nline2\nline3\nline4';
    
    const line1 = analyzer.getLineNumber(content, 0);
    const line2 = analyzer.getLineNumber(content, 6);
    const line3 = analyzer.getLineNumber(content, 12);
    
    assert.equal(line1, 1, 'First character should be on line 1');
    assert.equal(line2, 2, 'Character after first newline should be on line 2');
    assert.equal(line3, 3, 'Character after second newline should be on line 3');
});

await runner.test('isKeyword should identify JavaScript keywords', () => {
    const analyzer = new CoverageAnalyzer();
    
    assert.ok(analyzer.isKeyword('if'), 'Should identify if as keyword');
    assert.ok(analyzer.isKeyword('function'), 'Should identify function as keyword');
    assert.ok(analyzer.isKeyword('return'), 'Should identify return as keyword');
    assert.ok(!analyzer.isKeyword('myFunction'), 'Should not identify myFunction as keyword');
    assert.ok(!analyzer.isKeyword('customName'), 'Should not identify customName as keyword');
});

await runner.test('determineFunctionType should identify function types', () => {
    const analyzer = new CoverageAnalyzer();
    
    assert.equal(analyzer.determineFunctionType('function test()'), 'function', 'Should identify function declaration');
    assert.equal(analyzer.determineFunctionType('const test = () =>'), 'arrow', 'Should identify arrow function');
    assert.equal(analyzer.determineFunctionType('test: function()'), 'method', 'Should identify method');
    assert.equal(analyzer.determineFunctionType('test() {'), 'shorthand', 'Should identify shorthand method');
});

await runner.test('isFunctionTested should detect tested functions', () => {
    const analyzer = new CoverageAnalyzer();
    const testContent = `
        import { myFunction } from './module.js';
        
        test('myFunction should work', () => {
            const result = myFunction();
            assert.ok(result);
        });
    `;
    
    assert.ok(
        analyzer.isFunctionTested('myFunction', 'module.js', testContent),
        'Should detect myFunction as tested'
    );
    assert.ok(
        !analyzer.isFunctionTested('untestedFunction', 'module.js', testContent),
        'Should not detect untestedFunction as tested'
    );
});

// Print summary
const success = runner.summary();
process.exit(success ? 0 : 1);
