/**
 * Test Suite for Go Method Analyzer
 */

import GoMethodAnalyzer from '../lib/analyzers/go-method-analyzer.js';
import path from 'path';

function testGoFunctionExtraction() {
    console.log('\n🧪 Test: Go Function Extraction');

    const analyzer = new GoMethodAnalyzer();
    const goCode = `
package main

import "fmt"

// Public function
func HelloWorld() {
    fmt.Println("Hello, World!")
}

// Function with parameters and return
func Add(a int, b int) int {
    return a + b
}

// Multiple return values
func Divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("division by zero")
    }
    return a / b, nil
}
`;

    const methods = analyzer.extractMethods(goCode, '/test/sample.go');

    console.log(`   ✓ Found ${methods.length} functions`);

    const expectedFunctions = ['HelloWorld', 'Add', 'Divide'];
    expectedFunctions.forEach(name => {
        const found = methods.some(m => m.name === name);
        if (found) {
            console.log(`   ✓ ${name} detected`);
        } else {
            console.log(`   ✗ ${name} NOT detected`);
        }
    });

    return methods.length === 3;
}

function testGoMethodExtraction() {
    console.log('\n🧪 Test: Go Method Extraction (with receivers)');

    const analyzer = new GoMethodAnalyzer();
    const goCode = `
package main

type Calculator struct {
    value int
}

// Method with pointer receiver
func (c *Calculator) Add(n int) {
    c.value += n
}

// Method with value receiver
func (c Calculator) GetValue() int {
    return c.value
}

// Method with multiple parameters
func (c *Calculator) Multiply(a, b int) int {
    return a * b
}
`;

    const methods = analyzer.extractMethods(goCode, '/test/calculator.go');

    console.log(`   ✓ Found ${methods.length} methods`);

    const expectedMethods = ['Add', 'GetValue', 'Multiply'];
    expectedMethods.forEach(name => {
        const found = methods.some(m => m.name === name && m.type === 'method');
        if (found) {
            console.log(`   ✓ ${name} method detected`);
        } else {
            console.log(`   ✗ ${name} method NOT detected`);
        }
    });

    return methods.length === 3;
}

function testGoInterfaceExtraction() {
    console.log('\n🧪 Test: Go Interface Method Extraction');

    const analyzer = new GoMethodAnalyzer();
    const goCode = `
package main

type Reader interface {
    Read(p []byte) (n int, err error)
    Close() error
}

type Writer interface {
    Write(p []byte) (n int, err error)
    Flush() error
}
`;

    const methods = analyzer.extractMethods(goCode, '/test/interfaces.go');

    console.log(`   ✓ Found ${methods.length} interface methods`);

    const expectedMethods = ['Read', 'Close', 'Write', 'Flush'];
    expectedMethods.forEach(name => {
        const found = methods.some(m => m.name === name);
        if (found) {
            console.log(`   ✓ ${name} interface method detected`);
        } else {
            console.log(`   ✗ ${name} interface method NOT detected`);
        }
    });

    return methods.length >= 4;
}

function testGoCommentFiltering() {
    console.log('\n🧪 Test: Go Comment Filtering');

    const analyzer = new GoMethodAnalyzer();
    const goCode = `
package main

// This is a comment with func FakeFunction() syntax
/* Multi-line comment
   func AnotherFake() {
   }
*/

// Real function
func RealFunction() {
    // func NotAFunction() inside comment
    println("real")
}
`;

    const methods = analyzer.extractMethods(goCode, '/test/comments.go');

    console.log(`   ✓ Found ${methods.length} functions (should be 1)`);

    const hasOnlyReal = methods.length === 1 && methods[0].name === 'RealFunction';
    if (hasOnlyReal) {
        console.log('   ✓ Comments properly filtered');
    } else {
        console.log('   ✗ Comment filtering failed');
        console.log('   Found:', methods.map(m => m.name));
    }

    return hasOnlyReal;
}

function testGoKeywordFiltering() {
    console.log('\n🧪 Test: Go Keyword Filtering');

    const analyzer = new GoMethodAnalyzer();

    // Test that keywords are properly filtered
    const keywords = ['func', 'var', 'const', 'type', 'struct', 'interface'];
    let allFiltered = true;

    keywords.forEach(keyword => {
        const isFiltered = analyzer.isKeyword(keyword);
        if (!isFiltered) {
            console.log(`   ✗ Keyword '${keyword}' not filtered`);
            allFiltered = false;
        }
    });

    if (allFiltered) {
        console.log('   ✓ All keywords properly filtered');
    }

    return allFiltered;
}

function runAllTests() {
    console.log('🚀 Go Method Analyzer Test Suite');
    console.log('='.repeat(50));

    const tests = [
        testGoFunctionExtraction,
        testGoMethodExtraction,
        testGoInterfaceExtraction,
        testGoCommentFiltering,
        testGoKeywordFiltering
    ];

    let passed = 0;
    let failed = 0;

    tests.forEach(test => {
        try {
            const result = test();
            if (result) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.log(`   ✗ Test failed with error: ${error.message}`);
            failed++;
        }
    });

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Results: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
        console.log('✅ All tests passed!');
    } else {
        console.log('❌ Some tests failed');
    }

    return failed === 0;
}

if (require.main === module) {
    const success = runAllTests();
    process.exit(success ? 0 : 1);
}

module.exports = { runAllTests };
