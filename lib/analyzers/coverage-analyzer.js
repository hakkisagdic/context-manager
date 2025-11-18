/**
 * Coverage Analyzer
 * Analyzes test coverage for the Context Manager project
 * Identifies untested functions and calculates coverage metrics
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CoverageAnalyzer {
    constructor(projectRoot, testDirectory = 'test') {
        this.projectRoot = projectRoot || process.cwd();
        this.testDirectory = path.join(this.projectRoot, testDirectory);
        this.libDirectory = path.join(this.projectRoot, 'lib');
    }

    /**
     * Analyze coverage for all modules
     * @returns {CoverageReport}
     */
    analyzeCoverage() {
        const modules = this.scanModules();
        const testFiles = this.scanTestFiles();
        
        const moduleDetails = modules.map(modulePath => 
            this.analyzeModule(modulePath, testFiles)
        );

        const totalModules = moduleDetails.length;
        const testedModules = moduleDetails.filter(m => m.coveragePercentage > 0).length;
        const totalFunctions = moduleDetails.reduce((sum, m) => sum + m.totalFunctions, 0);
        const testedFunctions = moduleDetails.reduce((sum, m) => sum + m.testedFunctions, 0);
        
        const coveragePercentage = totalFunctions > 0 
            ? (testedFunctions / totalFunctions) * 100 
            : 0;

        const untestedFunctions = this.findUntestedFunctions(moduleDetails);

        return {
            totalModules,
            testedModules,
            coveragePercentage: Math.round(coveragePercentage * 100) / 100,
            totalFunctions,
            testedFunctions,
            moduleDetails,
            untestedFunctions
        };
    }

    /**
     * Analyze a specific module
     * @param {string} modulePath - Path to the module
     * @param {Array<string>} testFiles - List of test file paths
     * @returns {ModuleCoverage}
     */
    analyzeModule(modulePath, testFiles = null) {
        if (!testFiles) {
            testFiles = this.scanTestFiles();
        }

        const content = fs.readFileSync(modulePath, 'utf-8');
        const functions = this.extractFunctions(content);
        const moduleName = path.relative(this.projectRoot, modulePath);

        // Find which functions are tested
        const testedFunctionNames = new Set();
        const testContent = testFiles.map(tf => {
            try {
                return fs.readFileSync(tf, 'utf-8');
            } catch (e) {
                return '';
            }
        }).join('\n');

        functions.forEach(func => {
            if (this.isFunctionTested(func.name, moduleName, testContent)) {
                testedFunctionNames.add(func.name);
            }
        });

        const testedFunctions = testedFunctionNames.size;
        const totalFunctions = functions.length;
        const coveragePercentage = totalFunctions > 0 
            ? (testedFunctions / totalFunctions) * 100 
            : 0;

        const untestedFunctions = functions
            .filter(f => !testedFunctionNames.has(f.name))
            .map(f => f.name);

        return {
            modulePath: moduleName,
            totalFunctions,
            testedFunctions,
            coveragePercentage: Math.round(coveragePercentage * 100) / 100,
            untestedFunctions,
            functions
        };
    }

    /**
     * Scan all modules in the lib directory
     * @returns {Array<string>}
     */
    scanModules() {
        const modules = [];
        
        const scanDirectory = (dir) => {
            if (!fs.existsSync(dir)) {
                return;
            }

            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    scanDirectory(fullPath);
                } else if (entry.isFile() && entry.name.endsWith('.js')) {
                    modules.push(fullPath);
                }
            }
        };

        scanDirectory(this.libDirectory);
        return modules;
    }

    /**
     * Scan all test files
     * @returns {Array<string>}
     */
    scanTestFiles() {
        const testFiles = [];
        
        const scanDirectory = (dir) => {
            if (!fs.existsSync(dir)) {
                return;
            }

            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    scanDirectory(fullPath);
                } else if (entry.isFile() && 
                          (entry.name.startsWith('test-') || 
                           entry.name.endsWith('.test.js') ||
                           entry.name.endsWith('.property.js'))) {
                    testFiles.push(fullPath);
                }
            }
        };

        scanDirectory(this.testDirectory);
        return testFiles;
    }

    /**
     * Extract functions from module content
     * @param {string} content - Module content
     * @returns {Array<FunctionInfo>}
     */
    extractFunctions(content) {
        const functions = [];
        const lines = content.split('\n');

        // Patterns for different function declarations
        const patterns = [
            // Regular function declarations
            { regex: /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_$][\w$]*)\s*\(/g, type: 'function' },
            // Arrow functions assigned to const/let/var
            { regex: /(?:export\s+)?(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g, type: 'arrow' },
            // Object method shorthand
            { regex: /([a-zA-Z_$][\w$]*)\s*:\s*(?:async\s+)?function\s*\(/g, type: 'method' },
            // Class methods (must be last to avoid conflicts)
            { regex: /(?:async\s+)?([a-zA-Z_$][\w$]*)\s*\([^)]*\)\s*\{/g, type: 'shorthand' }
        ];

        const functionNames = new Set();

        patterns.forEach(({ regex, type }) => {
            let match;
            
            while ((match = regex.exec(content)) !== null) {
                const funcName = match[1];
                
                // Skip if it's a keyword or already added
                if (this.isKeyword(funcName) || functionNames.has(funcName)) {
                    continue;
                }

                const line = this.getLineNumber(content, match.index);
                
                functions.push({
                    name: funcName,
                    line,
                    type: type
                });
                
                functionNames.add(funcName);
            }
        });

        return functions;
    }

    /**
     * Determine function type from match
     * @param {string} matchText - Matched text
     * @returns {string}
     */
    determineFunctionType(matchText) {
        if (matchText.includes('=>')) {
            return 'arrow';
        } else if (matchText.includes(': function')) {
            return 'method';
        } else if (matchText.includes('function')) {
            return 'function';
        } else {
            return 'shorthand';
        }
    }

    /**
     * Check if a function is tested
     * @param {string} functionName - Function name
     * @param {string} moduleName - Module name
     * @param {string} testContent - Combined test content
     * @returns {boolean}
     */
    isFunctionTested(functionName, moduleName, testContent) {
        // Check if function name appears in test content
        const functionRegex = new RegExp(`\\b${functionName}\\b`, 'g');
        
        // Simple heuristic: if function name appears in test files, consider it tested
        // This is a basic implementation - could be enhanced with AST parsing
        return functionRegex.test(testContent);
    }

    /**
     * Find all untested functions across modules
     * @param {Array<ModuleCoverage>} moduleDetails
     * @returns {Array<FunctionInfo>}
     */
    findUntestedFunctions(moduleDetails) {
        const untestedFunctions = [];

        moduleDetails.forEach(module => {
            module.untestedFunctions.forEach(funcName => {
                const funcInfo = module.functions.find(f => f.name === funcName);
                if (funcInfo) {
                    untestedFunctions.push({
                        name: funcName,
                        module: module.modulePath,
                        line: funcInfo.line,
                        type: funcInfo.type
                    });
                }
            });
        });

        return untestedFunctions;
    }

    /**
     * Calculate coverage percentage
     * @returns {number}
     */
    calculateCoveragePercentage() {
        const report = this.analyzeCoverage();
        return report.coveragePercentage;
    }

    /**
     * Get line number from content index
     * @param {string} content - File content
     * @param {number} index - Character index
     * @returns {number}
     */
    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }

    /**
     * Check if name is a JavaScript keyword
     * @param {string} name - Name to check
     * @returns {boolean}
     */
    isKeyword(name) {
        const keywords = new Set([
            'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
            'try', 'catch', 'finally', 'throw', 'return', 'break', 'continue',
            'class', 'extends', 'super', 'this', 'new', 'typeof', 'instanceof',
            'var', 'let', 'const', 'function', 'async', 'await', 'export', 
            'import', 'from', 'as', 'of', 'in', 'with', 'yield', 'static',
            'get', 'set'
        ]);
        return keywords.has(name);
    }
}

export default CoverageAnalyzer;
