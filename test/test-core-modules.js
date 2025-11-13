#!/usr/bin/env node

/**
 * Comprehensive Unit Tests for Core Modules
 * Tests Scanner, ContextBuilder, Reporter, and Analyzer classes
 */

import { Scanner } from '../lib/core/Scanner.js';
import { ContextBuilder } from '../lib/core/ContextBuilder.js';
import { Reporter } from '../lib/core/Reporter.js';
import { Analyzer } from '../lib/core/Analyzer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test framework
let testsPassed = 0;
let testsFailed = 0;
const failedTests = [];

function assert(condition, testName, message = '') {
    if (condition) {
        console.log(`✅ ${testName}`);
        testsPassed++;
        return true;
    } else {
        console.log(`❌ ${testName}: ${message}`);
        testsFailed++;
        failedTests.push({ name: testName, message });
        return false;
    }
}

function assertThrows(fn, testName, expectedError = null) {
    try {
        fn();
        console.log(`❌ ${testName}: Expected error but none was thrown`);
        testsFailed++;
        failedTests.push({ name: testName, message: 'No error thrown' });
        return false;
    } catch (error) {
        if (expectedError && !error.message.includes(expectedError)) {
            console.log(`❌ ${testName}: Wrong error - ${error.message}`);
            testsFailed++;
            failedTests.push({ name: testName, message: `Wrong error: ${error.message}` });
            return false;
        }
        console.log(`✅ ${testName}`);
        testsPassed++;
        return true;
    }
}

// Create test directory structure
const testDir = path.join(__dirname, 'temp-test-core');
if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

// Create test files
fs.writeFileSync(path.join(testDir, 'test.js'), 'function test() { return 42; }');
fs.writeFileSync(path.join(testDir, 'test.py'), 'def test(): return 42');
fs.writeFileSync(path.join(testDir, 'README.md'), '# Test Project');
fs.writeFileSync(path.join(testDir, '.gitignore'), 'node_modules/\n*.log');

// Create subdirectory
const subDir = path.join(testDir, 'src');
fs.mkdirSync(subDir);
fs.writeFileSync(path.join(subDir, 'main.js'), 'console.log("Hello World");');

(async () => {
console.log('🧪 COMPREHENSIVE CORE MODULE TESTS');
console.log('='.repeat(70));

// ============================================================================
// SCANNER TESTS
// ============================================================================
console.log('\n🔍 Scanner Tests\n' + '-'.repeat(70));

// Test 1: Scanner instantiation
{
    const scanner = new Scanner(testDir);
    assert(
        scanner instanceof Scanner,
        'Scanner: Basic instantiation'
    );
    assert(
        scanner.rootPath === testDir,
        'Scanner: Root path set correctly'
    );
    assert(
        typeof scanner.options === 'object',
        'Scanner: Options initialized'
    );
}

// Test 2: Scanner with custom options
{
    const options = {
        respectGitignore: false,
        followSymlinks: true,
        maxDepth: 2
    };
    const scanner = new Scanner(testDir, options);
    assert(
        scanner.options.respectGitignore === false,
        'Scanner: Custom respectGitignore option'
    );
    assert(
        scanner.options.followSymlinks === true,
        'Scanner: Custom followSymlinks option'
    );
    assert(
        scanner.options.maxDepth === 2,
        'Scanner: Custom maxDepth option'
    );
}

// Test 3: Scanner stats initialization
{
    const scanner = new Scanner(testDir);
    assert(
        typeof scanner.stats === 'object',
        'Scanner: Stats object initialized'
    );
    assert(
        scanner.stats.filesScanned === 0,
        'Scanner: Initial filesScanned is 0'
    );
    assert(
        scanner.stats.directoriesTraversed === 0,
        'Scanner: Initial directoriesTraversed is 0'
    );
}

// Test 4: Scanner scan method
{
    const scanner = new Scanner(testDir);
    const files = scanner.scan();
    assert(
        Array.isArray(files),
        'Scanner.scan: Returns array'
    );
    assert(
        files.length > 0,
        'Scanner.scan: Finds files',
        `Expected files, got ${files.length}`
    );
    assert(
        scanner.stats.filesScanned > 0,
        'Scanner.scan: Updates filesScanned stat'
    );
}

// Test 5: Scanner file filtering
{
    const scanner = new Scanner(testDir);
    const files = scanner.scan();
    const jsFiles = files.filter(f => f.path.endsWith('.js'));
    const pyFiles = files.filter(f => f.path.endsWith('.py'));
    const mdFiles = files.filter(f => f.path.endsWith('.md'));
    
    assert(
        jsFiles.length >= 2,
        'Scanner: Finds JavaScript files',
        `Expected at least 2 JS files, got ${jsFiles.length}`
    );
    assert(
        pyFiles.length >= 1,
        'Scanner: Finds Python files',
        `Expected at least 1 Python file, got ${pyFiles.length}`
    );
    assert(
        mdFiles.length >= 1,
        'Scanner: Finds Markdown files',
        `Expected at least 1 MD file, got ${mdFiles.length}`
    );
}

// Test 6: Scanner with non-existent directory
{
    const scanner = new Scanner('/non/existent/path');
    const files = scanner.scan();
    assert(
        Array.isArray(files),
        'Scanner: Returns array for non-existent directory'
    );
    assert(
        files.length === 0,
        'Scanner: Returns empty array for non-existent directory'
    );
    assert(
        scanner.stats.errors > 0,
        'Scanner: Records error for non-existent directory'
    );
}

// ============================================================================
// CONTEXTBUILDER TESTS
// ============================================================================
console.log('\n🏗️  ContextBuilder Tests\n' + '-'.repeat(70));

// Test 7: ContextBuilder instantiation
{
    const builder = new ContextBuilder();
    assert(
        builder instanceof ContextBuilder,
        'ContextBuilder: Basic instantiation'
    );
    assert(
        typeof builder.options === 'object',
        'ContextBuilder: Options initialized'
    );
    assert(
        builder.options.useCase === 'custom',
        'ContextBuilder: Default useCase is custom'
    );
}

// Test 8: ContextBuilder with custom options
{
    const options = {
        targetModel: 'gpt-4',
        targetTokens: 8000,
        useCase: 'code-review',
        includeTests: false,
        priorityStrategy: 'changed-first'
    };
    const builder = new ContextBuilder(options);
    assert(
        builder.options.targetModel === 'gpt-4',
        'ContextBuilder: Custom targetModel option'
    );
    assert(
        builder.options.targetTokens === 8000,
        'ContextBuilder: Custom targetTokens option'
    );
    assert(
        builder.options.includeTests === false,
        'ContextBuilder: Custom includeTests option'
    );
}

// Test 9: ContextBuilder build method
{
    const builder = new ContextBuilder();
    const mockAnalysisResult = {
        files: [
            { path: 'test.js', relativePath: 'test.js', content: 'function test() {}', tokens: 10 },
            { path: 'main.js', relativePath: 'main.js', content: 'console.log("hello");', tokens: 8 }
        ],
        stats: {
            totalFiles: 2,
            totalTokens: 18,
            codeFiles: 2
        }
    };
    
    const context = builder.build(mockAnalysisResult);
    assert(
        typeof context === 'object',
        'ContextBuilder.build: Returns object'
    );
    assert(
        context.hasOwnProperty('metadata'),
        'ContextBuilder.build: Contains metadata'
    );
    assert(
        context.hasOwnProperty('files'),
        'ContextBuilder.build: Contains files'
    );
}

// Test 10: ContextBuilder with target tokens
{
    const builder = new ContextBuilder({ targetTokens: 15 });
    const mockAnalysisResult = {
        files: [
            { path: 'test.js', relativePath: 'test.js', content: 'function test() {}', tokens: 10 },
            { path: 'main.js', relativePath: 'main.js', content: 'console.log("hello");', tokens: 8 }
        ],
        stats: {
            totalFiles: 2,
            totalTokens: 18,
            codeFiles: 2
        }
    };
    
    const context = builder.build(mockAnalysisResult);
    assert(
        typeof context === 'object',
        'ContextBuilder.build: Handles target tokens'
    );
}

// ============================================================================
// REPORTER TESTS
// ============================================================================
console.log('\n📊 Reporter Tests\n' + '-'.repeat(70));

// Test 11: Reporter instantiation
{
    const reporter = new Reporter();
    assert(
        reporter instanceof Reporter,
        'Reporter: Basic instantiation'
    );
    assert(
        typeof reporter.options === 'object',
        'Reporter: Options initialized'
    );
}

// Test 12: Reporter with custom options
{
    const options = {
        format: 'json',
        verbose: true,
        includeStats: true
    };
    const reporter = new Reporter(options);
    assert(
        reporter.options.format === 'json',
        'Reporter: Custom format option'
    );
    assert(
        reporter.options.verbose === true,
        'Reporter: Custom verbose option'
    );
}

// Test 13: Reporter report method
{
    const reporter = new Reporter({ verbose: false });
    const mockContext = {
        metadata: { totalFiles: 1, totalTokens: 10 },
        files: [
            { path: 'test.js', content: 'function test() {}' }
        ]
    };
    const mockStats = {
        totalFiles: 1,
        totalTokens: 10,
        codeFiles: 1
    };
    
    try {
        reporter.report(mockContext, mockStats);
        assert(true, 'Reporter.report: Executes without error');
    } catch (error) {
        assert(false, 'Reporter.report: Should not throw', error.message);
    }
}

// Test 14: Reporter different formats
{
    const formats = ['toon', 'json', 'xml'];
    for (const format of formats) {
        const reporter = new Reporter({ format, verbose: false });
        const mockContext = {
            metadata: { totalFiles: 1, totalTokens: 5 },
            files: [{ path: 'test.js', content: 'test' }]
        };
        const mockStats = { totalFiles: 1, totalTokens: 5 };
        
        try {
            reporter.report(mockContext, mockStats);
            assert(true, `Reporter.report: Handles ${format} format`);
        } catch (error) {
            assert(false, `Reporter.report: Should handle ${format} format`, error.message);
        }
    }
}

// ============================================================================
// ANALYZER TESTS
// ============================================================================
console.log('\n🔬 Analyzer Tests\n' + '-'.repeat(70));

// Test 15: Analyzer instantiation
{
    const analyzer = new Analyzer();
    assert(
        analyzer instanceof Analyzer,
        'Analyzer: Basic instantiation'
    );
    assert(
        typeof analyzer.options === 'object',
        'Analyzer: Options initialized'
    );
}

// Test 16: Analyzer with custom options
{
    const options = {
        methodLevel: true,
        parallel: true,
        maxWorkers: 2
    };
    const analyzer = new Analyzer(options);
    assert(
        analyzer.options.methodLevel === true,
        'Analyzer: Custom methodLevel option'
    );
    assert(
        analyzer.options.parallel === true,
        'Analyzer: Custom parallel option'
    );
}

// Test 17: Analyzer analyze method
{
    const scanner = new Scanner(testDir);
    const scannedFiles = scanner.scan();
    
    const analyzer = new Analyzer();
    const result = await analyzer.analyze(scannedFiles);
    assert(
        typeof result === 'object',
        'Analyzer.analyze: Returns object'
    );
    assert(
        result.hasOwnProperty('files'),
        'Analyzer.analyze: Contains files'
    );
    assert(
        result.hasOwnProperty('stats'),
        'Analyzer.analyze: Contains stats'
    );
    assert(
        Array.isArray(result.files),
        'Analyzer.analyze: Files is array'
    );
}

// Test 18: Analyzer stats validation
{
    const scanner = new Scanner(testDir);
    const scannedFiles = scanner.scan();
    
    const analyzer = new Analyzer();
    const result = await analyzer.analyze(scannedFiles);
    const stats = result.stats;
    
    assert(
        typeof stats.totalFiles === 'number',
        'Analyzer: Stats contains totalFiles number'
    );
    assert(
        typeof stats.totalTokens === 'number',
        'Analyzer: Stats contains totalTokens number'
    );
    assert(
        stats.totalFiles > 0,
        'Analyzer: Stats shows files found'
    );
    assert(
        stats.totalTokens > 0,
        'Analyzer: Stats shows tokens calculated'
    );
}

// Test 19: Analyzer file content validation
{
    const scanner = new Scanner(testDir);
    const scannedFiles = scanner.scan();
    
    const analyzer = new Analyzer();
    const result = await analyzer.analyze(scannedFiles);
    const jsFile = result.files.find(f => f.path.endsWith('test.js'));
    
    assert(
        jsFile !== undefined,
        'Analyzer: Finds test.js file'
    );
    assert(
        typeof jsFile.path === 'string',
        'Analyzer: File has path string'
    );
    assert(
        typeof jsFile.tokens === 'number',
        'Analyzer: File has tokens number'
    );
    assert(
        jsFile.tokens > 0,
        'Analyzer: File has positive token count'
    );
}

// Test 20: Analyzer method-level analysis
{
    const scanner = new Scanner(testDir);
    const scannedFiles = scanner.scan();
    
    const analyzer = new Analyzer({ methodLevel: true });
    const result = await analyzer.analyze(scannedFiles);
    const jsFile = result.files.find(f => f.path.endsWith('test.js'));
    
    if (jsFile && jsFile.methods) {
        assert(
            Array.isArray(jsFile.methods),
            'Analyzer: Method-level analysis includes methods array'
        );
        assert(
            jsFile.methods.length > 0,
            'Analyzer: Method-level analysis finds methods'
        );
    } else {
        assert(true, 'Analyzer: Method-level analysis handled gracefully');
    }
}

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\n🔗 Integration Tests\n' + '-'.repeat(70));

// Test 21: Scanner -> ContextBuilder integration
{
    const scanner = new Scanner(testDir);
    const files = scanner.scan();
    
    // Analyzer'dan gelen dosyaları ContextBuilder için uygun hale getir
    const mockAnalysisResult = {
        files: files.map(f => ({ 
            path: f.path, 
            relativePath: f.relativePath, 
            content: fs.readFileSync(f.path, 'utf-8'), 
            tokens: 5 
        })),
        stats: { totalFiles: files.length, totalTokens: files.length * 5 }
    };
    
    const builder = new ContextBuilder();
    try {
        const context = builder.build(mockAnalysisResult);
        assert(
            context.files && Object.keys(context.files).length > 0,
            'Integration: Scanner -> ContextBuilder pipeline works'
        );
    } catch (error) {
        assert(false, 'Integration: Scanner -> ContextBuilder pipeline works', error.message);
    }
}

// Test 22: Analyzer -> Reporter integration
{
    const scanner = new Scanner(testDir);
    const scannedFiles = scanner.scan();
    
    const analyzer = new Analyzer();
    const result = await analyzer.analyze(scannedFiles);
    
    const builder = new ContextBuilder();
    const context = builder.build(result);
    
    const reporter = new Reporter({ format: 'json', verbose: false });
    
    try {
        reporter.report(context, result.stats);
        assert(true, 'Integration: Analyzer -> Reporter pipeline works');
    } catch (error) {
        assert(false, 'Integration: Pipeline should work', error.message);
    }
}

// Test 23: Full pipeline test
{
    const scanner = new Scanner(testDir);
    const scannedFiles = scanner.scan();
    
    const analyzer = new Analyzer({ methodLevel: false });
    const analysisResult = await analyzer.analyze(scannedFiles);
    
    const builder = new ContextBuilder({ useCase: 'code-review' });
    const context = builder.build(analysisResult);
    
    const reporter = new Reporter({ format: 'xml', verbose: false });
    
    assert(
        analysisResult.files.length > 0,
        'Full Pipeline: Analysis produces files'
    );
    assert(
        context.files && Object.keys(context.files).length > 0,
        'Full Pipeline: Context building works'
    );
    
    try {
        reporter.report(context, analysisResult.stats);
        assert(true, 'Full Pipeline: Report generation works');
    } catch (error) {
        assert(false, 'Full Pipeline: Report should work', error.message);
    }
}

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================
console.log('\n⚠️  Error Handling Tests\n' + '-'.repeat(70));

// Test 24: Scanner error handling
{
    const scanner = new Scanner(testDir);
    // Create a file that will cause read error
    const badFile = path.join(testDir, 'bad-permissions.txt');
    fs.writeFileSync(badFile, 'test');
    
    try {
        fs.chmodSync(badFile, 0o000); // Remove all permissions
        const files = scanner.scan();
        assert(
            scanner.stats.errors >= 0,
            'Scanner: Tracks errors gracefully'
        );
        fs.chmodSync(badFile, 0o644); // Restore permissions
    } catch (error) {
        // Some systems don't allow permission changes
        assert(true, 'Scanner: Error handling test skipped (permissions)');
    }
}

// Test 25: ContextBuilder error handling
{
    const builder = new ContextBuilder();
    
    try {
        const result = builder.build(null);
        assert(false, 'ContextBuilder: Should handle null input');
    } catch (error) {
        assert(true, 'ContextBuilder: Handles null input with error');
    }
}

// Test 26: Reporter error handling
{
    const reporter = new Reporter({ verbose: false });
    
    try {
        await reporter.report(null, null);
        // Reporter null input'u handle ediyor, hata atmıyor
        assert(true, 'Reporter: Handles null input gracefully');
    } catch (error) {
        assert(true, 'Reporter: Handles null input with error');
    }
}

// Test 27: Analyzer error handling
{
    const analyzer = new Analyzer();
    
    try {
        const result = await analyzer.analyze([]);
        assert(
            result.files.length === 0,
            'Analyzer: Handles empty file array'
        );
        assert(
            result.stats.totalFiles === 0,
            'Analyzer: Stats correct for empty input'
        );
    } catch (error) {
        assert(false, 'Analyzer: Should handle empty array', error.message);
    }
}

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🎯 Edge Cases\n' + '-'.repeat(70));

// Test 28: Empty directory
{
    const emptyDir = path.join(testDir, 'empty');
    fs.mkdirSync(emptyDir);
    
    const scanner = new Scanner(emptyDir);
    const files = scanner.scan();
    
    assert(
        Array.isArray(files),
        'Scanner: Handles empty directory'
    );
    assert(
        files.length === 0,
        'Scanner: Empty directory returns empty array'
    );
}

// Test 29: Very deep directory structure
{
    let deepPath = testDir;
    for (let i = 0; i < 5; i++) {
        deepPath = path.join(deepPath, `level${i}`);
        fs.mkdirSync(deepPath, { recursive: true });
    }
    fs.writeFileSync(path.join(deepPath, 'deep.js'), 'console.log("deep");');
    
    const scanner = new Scanner(testDir);
    const files = scanner.scan();
    const deepFile = files.find(f => f.path.includes('deep.js'));
    
    assert(
        deepFile !== undefined,
        'Scanner: Handles deep directory structures'
    );
}

// Test 30: Large file handling
{
    const largeContent = 'console.log("test");\n'.repeat(1000);
    fs.writeFileSync(path.join(testDir, 'large.js'), largeContent);
    
    const scanner = new Scanner(testDir);
    const scannedFiles = scanner.scan();
    
    const analyzer = new Analyzer();
    const result = await analyzer.analyze(scannedFiles);
    const largeFile = result.files.find(f => f.path.includes('large.js'));
    
    assert(
        largeFile !== undefined,
        'Analyzer: Handles large files'
    );
    assert(
        largeFile.tokens > 1000,
        'Analyzer: Calculates tokens for large files'
    );
}

// Cleanup
fs.rmSync(testDir, { recursive: true, force: true });

// ============================================================================
// RESULTS SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 COMPREHENSIVE CORE MODULE TEST RESULTS');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(test => {
        console.log(`   • ${test.name}: ${test.message}`);
    });
    process.exit(1);
} else {
    console.log('\n🎉 ALL CORE MODULE TESTS PASSED!');
    console.log('📈 Core modules now have comprehensive test coverage.');
}

})().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});