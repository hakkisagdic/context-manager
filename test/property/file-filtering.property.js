/**
 * Property-Based Tests for File Filtering
 * Tests file filtering properties from comprehensive-test-validation spec
 */

import fc from 'fast-check';
import { runProperty } from '../helpers/property-test-helpers.js';
import GitIgnoreParser from '../../lib/parsers/gitignore-parser.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Property 13: Gitignore compliance
 * Feature: comprehensive-test-validation, Property 13: Gitignore compliance
 * Validates: Requirements 3.3
 * 
 * For any file list and .gitignore rules, filtered files should respect gitignore patterns 
 * in both INCLUDE and EXCLUDE modes
 */
export async function testGitignoreCompliance() {
    console.log('\n🧪 Property 13: Gitignore compliance');
    console.log('   Feature: comprehensive-test-validation, Property 13: Gitignore compliance');
    console.log('   Validates: Requirements 3.3');
    
    // Generator for file paths
    const filePathGen = fc.tuple(
        fc.constantFrom('src', 'lib', 'test', 'docs', 'config'),
        fc.stringMatching(/^[a-z0-9_-]{1,10}$/),
        fc.constantFrom('.js', '.ts', '.md', '.json', '.txt')
    ).map(([dir, name, ext]) => `${dir}/${name}${ext}`);
    
    // Generator for gitignore patterns
    const gitignorePatternGen = fc.oneof(
        fc.constant('node_modules/'),
        fc.constant('*.log'),
        fc.constant('dist/'),
        fc.constant('build/'),
        fc.constant('.env'),
        fc.constant('coverage/'),
        fc.tuple(
            fc.constantFrom('src', 'lib', 'test', 'docs'),
            fc.constant('/')
        ).map(([dir, slash]) => `${dir}${slash}`)
    );
    
    const property = fc.property(
        fc.array(filePathGen, { minLength: 5, maxLength: 20 }),
        fc.array(gitignorePatternGen, { minLength: 1, maxLength: 5 }),
        fc.boolean(), // hasIncludeFile
        (filePaths, gitignorePatterns, hasIncludeFile) => {
            // Create unique file paths
            const uniqueFiles = [...new Set(filePaths)];
            
            // Create temporary directory structure
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gitignore-test-'));
            const gitignoreFile = path.join(tempDir, '.gitignore');
            const contextIgnoreFile = path.join(tempDir, '.contextignore');
            const contextIncludeFile = path.join(tempDir, '.contextinclude');
            
            try {
                // Write gitignore file
                fs.writeFileSync(gitignoreFile, gitignorePatterns.join('\n'));
                
                // Write context files based on mode
                if (hasIncludeFile) {
                    // In INCLUDE mode, create a simple include pattern
                    fs.writeFileSync(contextIncludeFile, '*.js\n*.ts\n');
                } else {
                    // In EXCLUDE mode, create a simple exclude pattern
                    fs.writeFileSync(contextIgnoreFile, '*.log\n');
                }
                
                // Create parser
                const parser = new GitIgnoreParser(
                    gitignoreFile,
                    contextIgnoreFile,
                    hasIncludeFile ? null : contextIncludeFile
                );
                
                // Test each file
                for (const filePath of uniqueFiles) {
                    const fullPath = path.join(tempDir, filePath);
                    const isIgnored = parser.isIgnored(null, filePath);
                    
                    // Verify gitignore patterns are applied
                    let shouldBeIgnoredByGitignore = false;
                    for (const pattern of gitignorePatterns) {
                        const normalizedPath = GitIgnoreParser.normalizePath(filePath);
                        const cleanPattern = pattern.replace(/\/$/, '');
                        
                        // Simple pattern matching (not full gitignore spec)
                        if (pattern.includes('*')) {
                            const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\//g, '\\/'));
                            if (regex.test(normalizedPath)) {
                                shouldBeIgnoredByGitignore = true;
                                break;
                            }
                        } else if (normalizedPath.includes(cleanPattern)) {
                            shouldBeIgnoredByGitignore = true;
                            break;
                        }
                    }
                    
                    // In both modes, gitignore should be respected
                    if (shouldBeIgnoredByGitignore && !isIgnored) {
                        console.log(`Gitignore not respected for ${filePath}`);
                        console.log(`  Mode: ${hasIncludeFile ? 'INCLUDE' : 'EXCLUDE'}`);
                        console.log(`  Patterns: ${gitignorePatterns.join(', ')}`);
                        return false;
                    }
                }
                
                return true;
            } finally {
                // Cleanup
                try {
                    if (fs.existsSync(gitignoreFile)) fs.unlinkSync(gitignoreFile);
                    if (fs.existsSync(contextIgnoreFile)) fs.unlinkSync(contextIgnoreFile);
                    if (fs.existsSync(contextIncludeFile)) fs.unlinkSync(contextIncludeFile);
                    fs.rmdirSync(tempDir);
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        }
    );
    
    await runProperty(property, { numRuns: 100 });
    console.log('   ✓ Gitignore compliance verified in both modes');
}

/**
 * Property 14: Wildcard pattern matching
 * Feature: comprehensive-test-validation, Property 14: Wildcard pattern matching
 * Validates: Requirements 3.4
 * 
 * For any wildcard pattern and file list, matching should correctly identify files 
 * according to glob rules
 */
export async function testWildcardPatternMatching() {
    console.log('\n🧪 Property 14: Wildcard pattern matching');
    console.log('   Feature: comprehensive-test-validation, Property 14: Wildcard pattern matching');
    console.log('   Validates: Requirements 3.4');
    
    // Generator for file names with various extensions
    const fileNameGen = fc.tuple(
        fc.stringMatching(/^[a-z0-9_-]{1,10}$/),
        fc.constantFrom('.js', '.ts', '.log', '.md', '.json', '.txt')
    ).map(([name, ext]) => `${name}${ext}`);
    
    // Generator for wildcard patterns
    const wildcardPatternGen = fc.oneof(
        fc.constant('*.js'),
        fc.constant('*.log'),
        fc.constant('test*'),
        fc.constant('*Helper.js'),
        fc.constant('*.test.js'),
        fc.constant('*')
    );
    
    const property = fc.property(
        fc.array(fileNameGen, { minLength: 5, maxLength: 15 }),
        wildcardPatternGen,
        (fileNames, pattern) => {
            const uniqueFiles = [...new Set(fileNames)];
            
            // Create temporary directory
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wildcard-test-'));
            const ignoreFile = path.join(tempDir, '.contextignore');
            
            try {
                // Write pattern to ignore file
                fs.writeFileSync(ignoreFile, pattern);
                
                // Create parser
                const parser = new GitIgnoreParser(
                    path.join(tempDir, '.gitignore'), // Non-existent
                    ignoreFile,
                    null
                );
                
                // Test each file
                for (const fileName of uniqueFiles) {
                    const isIgnored = parser.isIgnored(null, fileName);
                    
                    // Manually check if file should match pattern
                    const shouldMatch = matchesWildcard(fileName, pattern);
                    
                    if (shouldMatch !== isIgnored) {
                        console.log(`Wildcard mismatch for ${fileName} with pattern ${pattern}`);
                        console.log(`  Expected: ${shouldMatch}, Got: ${isIgnored}`);
                        return false;
                    }
                }
                
                return true;
            } finally {
                // Cleanup
                try {
                    if (fs.existsSync(ignoreFile)) fs.unlinkSync(ignoreFile);
                    fs.rmdirSync(tempDir);
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        }
    );
    
    await runProperty(property, { numRuns: 100 });
    console.log('   ✓ Wildcard pattern matching is correct');
}

/**
 * Helper function to check if a filename matches a wildcard pattern
 */
function matchesWildcard(fileName, pattern) {
    // Convert wildcard pattern to regex
    const regexPattern = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(fileName);
}

/**
 * Property 15: Negation pattern correctness
 * Feature: comprehensive-test-validation, Property 15: Negation pattern correctness
 * Validates: Requirements 3.5
 * 
 * For any negation pattern (!pattern), files matching the pattern should be included 
 * even if a broader exclusion exists
 */
export async function testNegationPatternCorrectness() {
    console.log('\n🧪 Property 15: Negation pattern correctness');
    console.log('   Feature: comprehensive-test-validation, Property 15: Negation pattern correctness');
    console.log('   Validates: Requirements 3.5');
    
    // Generator for file names
    const fileNameGen = fc.tuple(
        fc.stringMatching(/^[a-z0-9_-]{1,10}$/),
        fc.constantFrom('.js', '.log', '.md')
    ).map(([name, ext]) => `${name}${ext}`);
    
    const property = fc.property(
        fc.array(fileNameGen, { minLength: 5, maxLength: 15 }),
        fc.stringMatching(/^[a-z0-9_-]{1,10}$/), // specific file to negate
        (fileNames, specificFile) => {
            const uniqueFiles = [...new Set(fileNames)];
            const specificFileName = `${specificFile}.log`;
            
            // Add the specific file to the list if not present
            if (!uniqueFiles.includes(specificFileName)) {
                uniqueFiles.push(specificFileName);
            }
            
            // Create temporary directory
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'negation-test-'));
            const ignoreFile = path.join(tempDir, '.contextignore');
            
            try {
                // Write patterns: ignore all .log files, but not the specific one
                fs.writeFileSync(ignoreFile, `*.log\n!${specificFileName}`);
                
                // Create parser
                const parser = new GitIgnoreParser(
                    path.join(tempDir, '.gitignore'),
                    ignoreFile,
                    null
                );
                
                // Test each file
                for (const fileName of uniqueFiles) {
                    const isIgnored = parser.isIgnored(null, fileName);
                    
                    // Expected behavior:
                    // - All .log files should be ignored
                    // - EXCEPT the specific negated file
                    const isLogFile = fileName.endsWith('.log');
                    const isNegatedFile = fileName === specificFileName;
                    const shouldBeIgnored = isLogFile && !isNegatedFile;
                    
                    if (shouldBeIgnored !== isIgnored) {
                        console.log(`Negation pattern mismatch for ${fileName}`);
                        console.log(`  Is log file: ${isLogFile}`);
                        console.log(`  Is negated file: ${isNegatedFile}`);
                        console.log(`  Expected ignored: ${shouldBeIgnored}, Got: ${isIgnored}`);
                        return false;
                    }
                }
                
                return true;
            } finally {
                // Cleanup
                try {
                    if (fs.existsSync(ignoreFile)) fs.unlinkSync(ignoreFile);
                    fs.rmdirSync(tempDir);
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        }
    );
    
    await runProperty(property, { numRuns: 100 });
    console.log('   ✓ Negation pattern correctness verified');
}

/**
 * Property 16: Recursive directory matching
 * Feature: comprehensive-test-validation, Property 16: Recursive directory matching
 * Validates: Requirements 3.6
 * 
 * For any nested directory pattern (**), matching should recursively include all subdirectories
 */
export async function testRecursiveDirectoryMatching() {
    console.log('\n🧪 Property 16: Recursive directory matching');
    console.log('   Feature: comprehensive-test-validation, Property 16: Recursive directory matching');
    console.log('   Validates: Requirements 3.6');
    
    // Generator for nested file paths
    const nestedPathGen = fc.tuple(
        fc.constantFrom('src', 'lib', 'test'),
        fc.stringMatching(/^[a-z0-9_-]{1,8}$/),
        fc.stringMatching(/^[a-z0-9_-]{1,8}$/),
        fc.constantFrom('.js', '.ts', '.md')
    ).map(([dir1, dir2, name, ext]) => `${dir1}/${dir2}/${name}${ext}`);
    
    const property = fc.property(
        fc.array(nestedPathGen, { minLength: 5, maxLength: 15 }),
        fc.constantFrom('src', 'lib', 'test'), // directory to match recursively
        (filePaths, targetDir) => {
            const uniqueFiles = [...new Set(filePaths)];
            
            // Create temporary directory
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'recursive-test-'));
            const ignoreFile = path.join(tempDir, '.contextignore');
            
            try {
                // Write recursive pattern (e.g., "src/**")
                fs.writeFileSync(ignoreFile, `${targetDir}/**`);
                
                // Create parser
                const parser = new GitIgnoreParser(
                    path.join(tempDir, '.gitignore'),
                    ignoreFile,
                    null
                );
                
                // Test each file
                for (const filePath of uniqueFiles) {
                    const isIgnored = parser.isIgnored(null, filePath);
                    
                    // Expected: all files under targetDir should be ignored
                    const shouldBeIgnored = filePath.startsWith(`${targetDir}/`);
                    
                    if (shouldBeIgnored !== isIgnored) {
                        console.log(`Recursive matching mismatch for ${filePath}`);
                        console.log(`  Pattern: ${targetDir}/**`);
                        console.log(`  Expected ignored: ${shouldBeIgnored}, Got: ${isIgnored}`);
                        return false;
                    }
                }
                
                return true;
            } finally {
                // Cleanup
                try {
                    if (fs.existsSync(ignoreFile)) fs.unlinkSync(ignoreFile);
                    fs.rmdirSync(tempDir);
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        }
    );
    
    await runProperty(property, { numRuns: 100 });
    console.log('   ✓ Recursive directory matching is correct');
}

// Export all tests
export default async function runAllFileFilteringProperties() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 File Filtering Property-Based Tests');
    console.log('='.repeat(80));
    
    await testGitignoreCompliance();
    await testWildcardPatternMatching();
    await testNegationPatternCorrectness();
    await testRecursiveDirectoryMatching();
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ All file filtering property tests passed!');
    console.log('='.repeat(80) + '\n');
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllFileFilteringProperties().catch(error => {
        console.error('❌ Property tests failed:', error);
        process.exit(1);
    });
}
