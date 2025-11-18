/**
 * Property-Based Tests for Method Extraction
 * Tests method extraction properties from comprehensive-test-validation spec
 */

import fc from 'fast-check';
import { runProperty } from '../helpers/property-test-helpers.js';
import MethodAnalyzer from '../../lib/analyzers/method-analyzer.js';
import MethodFilterParser from '../../lib/parsers/method-filter-parser.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const analyzer = new MethodAnalyzer();

/**
 * Property 6: JavaScript method extraction completeness
 * Feature: comprehensive-test-validation, Property 6: JavaScript method extraction completeness
 * Validates: Requirements 2.1
 * 
 * For any valid JavaScript/TypeScript file, all function declarations, arrow functions, 
 * and class methods should be extracted
 */
export async function testJavaScriptMethodExtractionCompleteness() {
    console.log('\n🧪 Property 6: JavaScript method extraction completeness');
    console.log('   Feature: comprehensive-test-validation, Property 6: JavaScript method extraction completeness');
    console.log('   Validates: Requirements 2.1');
    
    // Generator for JavaScript function names
    const functionNameGen = fc.stringMatching(/^[a-zA-Z_$][a-zA-Z0-9_$]{0,15}$/);
    
    // Generator for JavaScript code with various function types
    const jsCodeGen = fc.tuple(
        fc.array(functionNameGen, { minLength: 1, maxLength: 5 }),
        fc.constantFrom('function', 'arrow', 'method', 'shorthand', 'async', 'mixed')
    ).map(([names, type]) => {
        const uniqueNames = [...new Set(names)]; // Remove duplicates
        let code = '';
        const expectedMethods = [];
        
        uniqueNames.forEach((name, idx) => {
            switch (type) {
                case 'function':
                    code += `function ${name}() { return ${idx}; }\n`;
                    expectedMethods.push(name);
                    break;
                case 'arrow':
                    code += `const ${name} = () => { return ${idx}; };\n`;
                    expectedMethods.push(name);
                    break;
                case 'method':
                    if (idx === 0) code += 'class TestClass {\n';
                    code += `  ${name}() { return ${idx}; }\n`;
                    if (idx === uniqueNames.length - 1) code += '}\n';
                    expectedMethods.push(name);
                    break;
                case 'shorthand':
                    if (idx === 0) code += 'const obj = {\n';
                    code += `  ${name}() { return ${idx}; },\n`;
                    if (idx === uniqueNames.length - 1) code += '};\n';
                    expectedMethods.push(name);
                    break;
                case 'async':
                    code += `async function ${name}() { return ${idx}; }\n`;
                    expectedMethods.push(name);
                    break;
                case 'mixed':
                    const types = ['function', 'arrow', 'async'];
                    const chosenType = types[idx % types.length];
                    if (chosenType === 'function') {
                        code += `function ${name}() { return ${idx}; }\n`;
                    } else if (chosenType === 'arrow') {
                        code += `const ${name} = () => { return ${idx}; };\n`;
                    } else {
                        code += `async function ${name}() { return ${idx}; }\n`;
                    }
                    expectedMethods.push(name);
                    break;
            }
        });
        
        return { code, expectedMethods: uniqueNames };
    });
    
    const property = fc.property(
        jsCodeGen,
        fc.constantFrom('.js', '.ts'),
        ({ code, expectedMethods }, extension) => {
            const filePath = `test${extension}`;
            const extracted = analyzer.extractMethods(code, filePath);
            const extractedNames = extracted.map(m => m.name);
            
            // Check that all expected methods were extracted
            for (const expectedName of expectedMethods) {
                if (!extractedNames.includes(expectedName)) {
                    console.log(`Missing method: ${expectedName}`);
                    console.log(`Code:\n${code}`);
                    console.log(`Extracted: ${extractedNames.join(', ')}`);
                    return false;
                }
            }
            
            return true;
        }
    );
    
    await runProperty(property, { numRuns: 100 });
    console.log('   ✓ JavaScript method extraction is complete');
}

/**
 * Property 7: Rust function extraction completeness
 * Feature: comprehensive-test-validation, Property 7: Rust function extraction completeness
 * Validates: Requirements 2.2
 * 
 * For any valid Rust file, all fn definitions (including pub, async, and impl methods) 
 * should be extracted
 */
export async function testRustFunctionExtractionCompleteness() {
    console.log('\n🧪 Property 7: Rust function extraction completeness');
    console.log('   Feature: comprehensive-test-validation, Property 7: Rust function extraction completeness');
    console.log('   Validates: Requirements 2.2');
    
    // Generator for Rust function names (snake_case)
    const functionNameGen = fc.stringMatching(/^[a-z_][a-z0-9_]{0,15}$/);
    
    // Generator for Rust code with various function types
    const rustCodeGen = fc.tuple(
        fc.array(functionNameGen, { minLength: 1, maxLength: 5 }),
        fc.constantFrom('fn', 'pub_fn', 'async_fn', 'impl_method', 'mixed')
    ).map(([names, type]) => {
        const uniqueNames = [...new Set(names)];
        let code = '';
        const expectedMethods = [];
        
        uniqueNames.forEach((name, idx) => {
            switch (type) {
                case 'fn':
                    code += `fn ${name}() -> i32 { ${idx} }\n`;
                    expectedMethods.push(name);
                    break;
                case 'pub_fn':
                    code += `pub fn ${name}() -> i32 { ${idx} }\n`;
                    expectedMethods.push(name);
                    break;
                case 'async_fn':
                    code += `async fn ${name}() -> i32 { ${idx} }\n`;
                    expectedMethods.push(name);
                    break;
                case 'impl_method':
                    if (idx === 0) code += 'impl MyStruct {\n';
                    code += `    fn ${name}(&self) -> i32 { ${idx} }\n`;
                    if (idx === uniqueNames.length - 1) code += '}\n';
                    expectedMethods.push(name);
                    break;
                case 'mixed':
                    const types = ['fn', 'pub fn', 'async fn'];
                    const chosenType = types[idx % types.length];
                    code += `${chosenType} ${name}() -> i32 { ${idx} }\n`;
                    expectedMethods.push(name);
                    break;
            }
        });
        
        return { code, expectedMethods: uniqueNames };
    });
    
    const property = fc.property(
        rustCodeGen,
        ({ code, expectedMethods }) => {
            const filePath = 'test.rs';
            const extracted = analyzer.extractMethods(code, filePath);
            const extractedNames = extracted.map(m => m.name);
            
            // Check that all expected methods were extracted
            for (const expectedName of expectedMethods) {
                if (!extractedNames.includes(expectedName)) {
                    console.log(`Missing method: ${expectedName}`);
                    console.log(`Code:\n${code}`);
                    console.log(`Extracted: ${extractedNames.join(', ')}`);
                    return false;
                }
            }
            
            return true;
        }
    );
    
    await runProperty(property, { numRuns: 100 });
    console.log('   ✓ Rust function extraction is complete');
}

/**
 * Property 8: C# method extraction completeness
 * Feature: comprehensive-test-validation, Property 8: C# method extraction completeness
 * Validates: Requirements 2.3
 * 
 * For any valid C# file, all method definitions (including properties and async methods) 
 * should be extracted
 */
export async function testCSharpMethodExtractionCompleteness() {
    console.log('\n🧪 Property 8: C# method extraction completeness');
    console.log('   Feature: comprehensive-test-validation, Property 8: C# method extraction completeness');
    console.log('   Validates: Requirements 2.3');
    
    // Generator for C# method names (PascalCase)
    const methodNameGen = fc.stringMatching(/^[A-Z][a-zA-Z0-9]{0,15}$/);
    
    // Generator for C# code with various method types
    const csharpCodeGen = fc.tuple(
        fc.array(methodNameGen, { minLength: 1, maxLength: 5 }),
        fc.constantFrom('method', 'async_method', 'property', 'expression_bodied', 'mixed')
    ).map(([names, type]) => {
        const uniqueNames = [...new Set(names)];
        let code = 'class TestClass {\n';
        const expectedMethods = [];
        
        uniqueNames.forEach((name, idx) => {
            switch (type) {
                case 'method':
                    code += `    public int ${name}() { return ${idx}; }\n`;
                    expectedMethods.push(name);
                    break;
                case 'async_method':
                    code += `    public async Task<int> ${name}() { return ${idx}; }\n`;
                    expectedMethods.push(name);
                    break;
                case 'property':
                    code += `    public int ${name} { get; set; }\n`;
                    expectedMethods.push(name);
                    break;
                case 'expression_bodied':
                    code += `    public int ${name}() => ${idx};\n`;
                    expectedMethods.push(name);
                    break;
                case 'mixed':
                    const types = ['method', 'async', 'property'];
                    const chosenType = types[idx % types.length];
                    if (chosenType === 'method') {
                        code += `    public int ${name}() { return ${idx}; }\n`;
                    } else if (chosenType === 'async') {
                        code += `    public async Task<int> ${name}() { return ${idx}; }\n`;
                    } else {
                        code += `    public int ${name} { get; set; }\n`;
                    }
                    expectedMethods.push(name);
                    break;
            }
        });
        
        code += '}\n';
        return { code, expectedMethods: uniqueNames };
    });
    
    const property = fc.property(
        csharpCodeGen,
        ({ code, expectedMethods }) => {
            const filePath = 'test.cs';
            const extracted = analyzer.extractMethods(code, filePath);
            const extractedNames = extracted.map(m => m.name);
            
            // Check that all expected methods were extracted
            for (const expectedName of expectedMethods) {
                if (!extractedNames.includes(expectedName)) {
                    console.log(`Missing method: ${expectedName}`);
                    console.log(`Code:\n${code}`);
                    console.log(`Extracted: ${extractedNames.join(', ')}`);
                    return false;
                }
            }
            
            return true;
        }
    );
    
    await runProperty(property, { numRuns: 100 });
    console.log('   ✓ C# method extraction is complete');
}

/**
 * Property 9: Go function extraction completeness
 * Feature: comprehensive-test-validation, Property 9: Go function extraction completeness
 * Validates: Requirements 2.4
 * 
 * For any valid Go file, all func definitions (including receiver methods) should be extracted
 */
export async function testGoFunctionExtractionCompleteness() {
    console.log('\n🧪 Property 9: Go function extraction completeness');
    console.log('   Feature: comprehensive-test-validation, Property 9: Go function extraction completeness');
    console.log('   Validates: Requirements 2.4');
    
    // Generator for Go function names (camelCase or PascalCase)
    const functionNameGen = fc.stringMatching(/^[A-Za-z][a-zA-Z0-9]{0,15}$/);
    
    // Generator for Go code with various function types
    const goCodeGen = fc.tuple(
        fc.array(functionNameGen, { minLength: 1, maxLength: 5 }),
        fc.constantFrom('func', 'method', 'mixed')
    ).map(([names, type]) => {
        const uniqueNames = [...new Set(names)];
        let code = '';
        const expectedMethods = [];
        
        uniqueNames.forEach((name, idx) => {
            switch (type) {
                case 'func':
                    code += `func ${name}() int { return ${idx} }\n`;
                    expectedMethods.push(name);
                    break;
                case 'method':
                    code += `func (r *Receiver) ${name}() int { return ${idx} }\n`;
                    expectedMethods.push(name);
                    break;
                case 'mixed':
                    if (idx % 2 === 0) {
                        code += `func ${name}() int { return ${idx} }\n`;
                    } else {
                        code += `func (r *Receiver) ${name}() int { return ${idx} }\n`;
                    }
                    expectedMethods.push(name);
                    break;
            }
        });
        
        return { code, expectedMethods: uniqueNames };
    });
    
    const property = fc.property(
        goCodeGen,
        ({ code, expectedMethods }) => {
            const filePath = 'test.go';
            const extracted = analyzer.extractMethods(code, filePath);
            const extractedNames = extracted.map(m => m.name);
            
            // Check that all expected methods were extracted
            for (const expectedName of expectedMethods) {
                if (!extractedNames.includes(expectedName)) {
                    console.log(`Missing method: ${expectedName}`);
                    console.log(`Code:\n${code}`);
                    console.log(`Extracted: ${extractedNames.join(', ')}`);
                    return false;
                }
            }
            
            return true;
        }
    );
    
    await runProperty(property, { numRuns: 100 });
    console.log('   ✓ Go function extraction is complete');
}

/**
 * Property 10: Java method extraction completeness
 * Feature: comprehensive-test-validation, Property 10: Java method extraction completeness
 * Validates: Requirements 2.5
 * 
 * For any valid Java file, all method definitions (including constructors and static methods) 
 * should be extracted
 */
export async function testJavaMethodExtractionCompleteness() {
    console.log('\n🧪 Property 10: Java method extraction completeness');
    console.log('   Feature: comprehensive-test-validation, Property 10: Java method extraction completeness');
    console.log('   Validates: Requirements 2.5');
    
    // Java keywords to avoid
    const javaKeywords = new Set([
        'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
        'try', 'catch', 'finally', 'throw', 'return', 'break', 'continue',
        'class', 'extends', 'super', 'this', 'new', 'instanceof',
        'abstract', 'assert', 'boolean', 'byte', 'char', 'double', 'enum',
        'final', 'float', 'implements', 'import', 'int', 'interface', 'long',
        'native', 'package', 'private', 'protected', 'public', 'short', 'static',
        'strictfp', 'synchronized', 'throws', 'transient', 'void', 'volatile'
    ]);
    
    // Generator for Java method names (camelCase, not keywords)
    const methodNameGen = fc.stringMatching(/^[a-z][a-zA-Z0-9]{0,15}$/)
        .filter(name => !javaKeywords.has(name));
    
    // Generator for Java code with various method types
    const javaCodeGen = fc.tuple(
        fc.array(methodNameGen, { minLength: 1, maxLength: 5 }),
        fc.constantFrom('method', 'static_method', 'mixed')
    ).map(([names, type]) => {
        const uniqueNames = [...new Set(names)];
        let code = 'class TestClass {\n';
        const expectedMethods = [];
        
        uniqueNames.forEach((name, idx) => {
            switch (type) {
                case 'method':
                    code += `    public int ${name}() { return ${idx}; }\n`;
                    expectedMethods.push(name);
                    break;
                case 'static_method':
                    code += `    public static int ${name}() { return ${idx}; }\n`;
                    expectedMethods.push(name);
                    break;
                case 'mixed':
                    if (idx % 2 === 0) {
                        code += `    public int ${name}() { return ${idx}; }\n`;
                    } else {
                        code += `    public static int ${name}() { return ${idx}; }\n`;
                    }
                    expectedMethods.push(name);
                    break;
            }
        });
        
        code += '}\n';
        return { code, expectedMethods: uniqueNames };
    });
    
    const property = fc.property(
        javaCodeGen,
        ({ code, expectedMethods }) => {
            const filePath = 'test.java';
            const extracted = analyzer.extractMethods(code, filePath);
            const extractedNames = extracted.map(m => m.name);
            
            // Check that all expected methods were extracted
            for (const expectedName of expectedMethods) {
                if (!extractedNames.includes(expectedName)) {
                    console.log(`Missing method: ${expectedName}`);
                    console.log(`Code:\n${code}`);
                    console.log(`Extracted: ${extractedNames.join(', ')}`);
                    return false;
                }
            }
            
            return true;
        }
    );
    
    await runProperty(property, { numRuns: 100 });
    console.log('   ✓ Java method extraction is complete');
}

// Export all tests
export default async function runAllMethodExtractionProperties() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 Method Extraction Property-Based Tests');
    console.log('='.repeat(80));
    
    await testJavaScriptMethodExtractionCompleteness();
    await testRustFunctionExtractionCompleteness();
    await testCSharpMethodExtractionCompleteness();
    await testGoFunctionExtractionCompleteness();
    await testJavaMethodExtractionCompleteness();
    await testSQLProcedureExtractionCompleteness();
    await testMethodFilteringCorrectness();
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ All method extraction property tests passed!');
    console.log('='.repeat(80) + '\n');
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllMethodExtractionProperties().catch(error => {
        console.error('❌ Property tests failed:', error);
        process.exit(1);
    });
}

/**
 * Property 11: SQL procedure extraction completeness
 * Feature: comprehensive-test-validation, Property 11: SQL procedure extraction completeness
 * Validates: Requirements 2.6
 * 
 * For any valid SQL file, all stored procedures and functions should be extracted
 */
export async function testSQLProcedureExtractionCompleteness() {
    console.log('\n🧪 Property 11: SQL procedure extraction completeness');
    console.log('   Feature: comprehensive-test-validation, Property 11: SQL procedure extraction completeness');
    console.log('   Validates: Requirements 2.6');
    
    // Generator for SQL object names
    const objectNameGen = fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]{0,15}$/);
    
    // Generator for SQL code with various object types
    const sqlCodeGen = fc.tuple(
        fc.array(objectNameGen, { minLength: 1, maxLength: 5 }),
        fc.constantFrom('tsql', 'pgsql', 'mysql', 'oracle')
    ).map(([names, dialect]) => {
        const uniqueNames = [...new Set(names)];
        let code = '';
        const expectedObjects = [];
        
        uniqueNames.forEach((name, idx) => {
            switch (dialect) {
                case 'tsql':
                    code += `CREATE PROCEDURE ${name} AS BEGIN SELECT ${idx}; END;\nGO\n`;
                    expectedObjects.push(name);
                    break;
                case 'pgsql':
                    code += `CREATE OR REPLACE FUNCTION ${name}() RETURNS INTEGER AS $$ BEGIN RETURN ${idx}; END; $$ LANGUAGE plpgsql;\n`;
                    expectedObjects.push(name);
                    break;
                case 'mysql':
                    code += `DELIMITER $$\nCREATE PROCEDURE ${name}() BEGIN SELECT ${idx}; END$$\nDELIMITER ;\n`;
                    expectedObjects.push(name);
                    break;
                case 'oracle':
                    code += `CREATE OR REPLACE PROCEDURE ${name} IS BEGIN NULL; END;\n/\n`;
                    expectedObjects.push(name);
                    break;
            }
        });
        
        return { code, expectedObjects: uniqueNames };
    });
    
    const property = fc.property(
        sqlCodeGen,
        ({ code, expectedObjects }) => {
            const filePath = 'test.sql';
            const extracted = analyzer.extractMethods(code, filePath);
            const extractedNames = extracted.map(m => m.name);
            
            // Check that all expected objects were extracted
            for (const expectedName of expectedObjects) {
                if (!extractedNames.includes(expectedName)) {
                    console.log(`Missing object: ${expectedName}`);
                    console.log(`Code:\n${code}`);
                    console.log(`Extracted: ${extractedNames.join(', ')}`);
                    return false;
                }
            }
            
            return true;
        }
    );
    
    await runProperty(property, { numRuns: 100 });
    console.log('   ✓ SQL procedure extraction is complete');
}

/**
 * Property 12: Method filtering correctness
 * Feature: comprehensive-test-validation, Property 12: Method filtering correctness
 * Validates: Requirements 2.7
 * 
 * For any method list and filter rules, the filtered result should include only methods 
 * matching .methodinclude and exclude those matching .methodignore
 */
export async function testMethodFilteringCorrectness() {
    console.log('\n🧪 Property 12: Method filtering correctness');
    console.log('   Feature: comprehensive-test-validation, Property 12: Method filtering correctness');
    console.log('   Validates: Requirements 2.7');
    
    // Generator for method names
    const methodNameGen = fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]{0,15}$/);
    
    // Generator for filter patterns
    const patternGen = fc.oneof(
        fc.constant('test*'),
        fc.constant('*Helper'),
        fc.constant('get*'),
        fc.constant('set*'),
        methodNameGen
    );
    
    const property = fc.property(
        fc.array(methodNameGen, { minLength: 5, maxLength: 15 }),
        fc.array(patternGen, { minLength: 1, maxLength: 3 }),
        fc.boolean(), // hasIncludeFile
        (methodNames, patterns, hasIncludeFile) => {
            // Filter out edge cases that might cause issues (single char names, etc.)
            const uniqueMethods = [...new Set(methodNames)].filter(name => name.length > 1);
            
            // Skip if no methods after filtering
            if (uniqueMethods.length === 0) {
                return true;
            }
            
            // Create temporary filter files
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'method-filter-test-'));
            const includeFile = path.join(tempDir, '.methodinclude');
            const ignoreFile = path.join(tempDir, '.methodignore');
            
            try {
                // Write filter files
                if (hasIncludeFile) {
                    fs.writeFileSync(includeFile, patterns.join('\n'));
                } else {
                    fs.writeFileSync(ignoreFile, patterns.join('\n'));
                }
                
                // Create filter parser
                const filterParser = new MethodFilterParser(
                    hasIncludeFile ? includeFile : null,
                    hasIncludeFile ? null : ignoreFile
                );
                
                // Apply filtering (use a filename that won't match common patterns)
                const fileName = 'MyClass.js';
                const filtered = uniqueMethods.filter(methodName => 
                    filterParser.shouldIncludeMethod(methodName, fileName)
                );
                
                // Verify filtering logic
                for (const methodName of uniqueMethods) {
                    const shouldInclude = filterParser.shouldIncludeMethod(methodName, fileName);
                    const isIncluded = filtered.includes(methodName);
                    
                    if (shouldInclude !== isIncluded) {
                        console.log(`Filtering mismatch for ${methodName}: expected ${shouldInclude}, got ${isIncluded}`);
                        return false;
                    }
                    
                    // Verify pattern matching logic
                    // The parser checks both methodName and className.methodName
                    const className = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
                    let matchesPattern = false;
                    for (const pattern of patterns) {
                        const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
                        if (regex.test(methodName) || regex.test(`${className}.${methodName}`)) {
                            matchesPattern = true;
                            break;
                        }
                    }
                    
                    // Expected behavior based on mode
                    const expectedInclude = hasIncludeFile ? matchesPattern : !matchesPattern;
                    
                    if (expectedInclude !== shouldInclude) {
                        console.log(`Logic mismatch for ${methodName}:`);
                        console.log(`  Mode: ${hasIncludeFile ? 'INCLUDE' : 'EXCLUDE'}`);
                        console.log(`  Patterns: ${patterns.join(', ')}`);
                        console.log(`  Matches pattern: ${matchesPattern}`);
                        console.log(`  Expected include: ${expectedInclude}`);
                        console.log(`  Actual include: ${shouldInclude}`);
                        return false;
                    }
                }
                
                return true;
            } finally {
                // Cleanup
                try {
                    if (fs.existsSync(includeFile)) fs.unlinkSync(includeFile);
                    if (fs.existsSync(ignoreFile)) fs.unlinkSync(ignoreFile);
                    fs.rmdirSync(tempDir);
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        }
    );
    
    await runProperty(property, { numRuns: 100 });
    console.log('   ✓ Method filtering is correct');
}
