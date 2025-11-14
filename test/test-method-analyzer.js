#!/usr/bin/env node

/**
 * Comprehensive Method Analyzer Tests
 * Tests for method extraction across 14+ programming languages
 */

import MethodAnalyzer from '../lib/analyzers/method-analyzer.js';

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        testsPassed++;
        return true;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        testsFailed++;
        return false;
    }
}

console.log('🧪 Testing Method Analyzer...\n');

// ============================================================================
// CONSTRUCTOR TESTS
// ============================================================================
console.log('🔨 Constructor Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Constructor creates instance', () => {
    const analyzer = new MethodAnalyzer();
    if (!analyzer) throw new Error('Should create instance');
    if (typeof analyzer.extractMethods !== 'function') {
        throw new Error('Should have extractMethods method');
    }
});

test('MethodAnalyzer - Has goAnalyzer instance', () => {
    const analyzer = new MethodAnalyzer();
    if (!analyzer.goAnalyzer) throw new Error('Should have goAnalyzer');
});

// ============================================================================
// JAVASCRIPT/TYPESCRIPT EXTRACTION TESTS
// ============================================================================
console.log('\n📜 JavaScript/TypeScript Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts JavaScript function declarations', () => {
    const content = `
function hello() {
    return "world";
}
function greet(name) {
    return "Hello " + name;
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.js');

    if (methods.length !== 2) throw new Error('Should extract 2 functions');
    if (!methods.find(m => m.name === 'hello')) throw new Error('Should find hello');
    if (!methods.find(m => m.name === 'greet')) throw new Error('Should find greet');
});

test('MethodAnalyzer - Extracts async functions', () => {
    const content = `
async function fetchData() {
    return await getData();
}
export async function saveData() {
    return true;
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.js');

    if (methods.length < 2) throw new Error('Should extract async functions');
});

test('MethodAnalyzer - Extracts arrow functions', () => {
    const content = `
const add = (a, b) => a + b;
let multiply = (x, y) => x * y;
var divide = (a, b) => {
    return a / b;
};
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.js');

    if (methods.length < 2) throw new Error('Should extract arrow functions');
});

test('MethodAnalyzer - Extracts class methods', () => {
    const content = `
class Calculator {
    add(a, b) {
        return a + b;
    }

    async subtract(a, b) {
        return a - b;
    }
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.js');

    if (methods.length < 2) throw new Error('Should extract class methods');
});

test('MethodAnalyzer - Extracts getters and setters', () => {
    const content = `
class Person {
    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.js');

    if (methods.length !== 2) throw new Error('Should extract getter and setter');
});

// ============================================================================
// PYTHON EXTRACTION TESTS
// ============================================================================
console.log('\n🐍 Python Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts Python functions', () => {
    const content = `
def hello():
    return "world"

def greet(name):
    return f"Hello {name}"

async def fetch_data():
    return await get_data()
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.py');

    if (methods.length < 2) throw new Error('Should extract Python functions');
    if (!methods.find(m => m.name === 'hello')) throw new Error('Should find hello');
});

test('MethodAnalyzer - Extracts Python class methods', () => {
    const content = `
class Calculator:
    def add(self, a, b):
        return a + b

    @staticmethod
    def multiply(a, b):
        return a * b

    @classmethod
    def create(cls):
        return cls()
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.py');

    if (methods.length < 2) throw new Error('Should extract class methods');
});

// ============================================================================
// RUST EXTRACTION TESTS
// ============================================================================
console.log('\n🦀 Rust Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts Rust functions', () => {
    const content = `
fn main() {
    println!("Hello, world!");
}

pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

async fn fetch_data() -> Result<String, Error> {
    Ok("data".to_string())
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.rs');

    if (methods.length < 2) throw new Error('Should extract Rust functions');
    if (!methods.find(m => m.name === 'main')) throw new Error('Should find main');
    if (!methods.find(m => m.name === 'add')) throw new Error('Should find add');
});

test('MethodAnalyzer - Extracts Rust impl methods', () => {
    const content = `
impl Calculator {
    fn new() -> Self {
        Calculator {}
    }

    pub fn add(&self, a: i32, b: i32) -> i32 {
        a + b
    }
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.rs');

    if (methods.length < 2) throw new Error('Should extract impl methods');
});

// ============================================================================
// C# EXTRACTION TESTS
// ============================================================================
console.log('\n#️⃣  C# Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts C# methods', () => {
    const content = `
public class Calculator {
    public int Add(int a, int b) {
        return a + b;
    }

    private string GetName() {
        return "Calculator";
    }

    public async Task<int> FetchDataAsync() {
        return await GetDataAsync();
    }
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.cs');

    if (methods.length < 2) throw new Error('Should extract C# methods');
    if (!methods.find(m => m.name === 'Add')) throw new Error('Should find Add');
});

test('MethodAnalyzer - Extracts C# properties', () => {
    const content = `
public class Person {
    public string Name { get; set; }

    private int age;
    public int Age {
        get { return age; }
        set { age = value; }
    }
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.cs');

    if (methods.length < 2) throw new Error('Should extract properties');
});

// ============================================================================
// GO EXTRACTION TESTS
// ============================================================================
console.log('\n🔵 Go Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts Go functions', () => {
    const content = `
package main

func main() {
    fmt.Println("Hello")
}

func Add(a int, b int) int {
    return a + b
}

func (c *Calculator) Multiply(a, b int) int {
    return a * b
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.go');

    if (methods.length < 2) throw new Error('Should extract Go functions');
});

// ============================================================================
// JAVA EXTRACTION TESTS
// ============================================================================
console.log('\n☕ Java Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts Java methods', () => {
    const content = `
public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }

    private String getName() {
        return "Calculator";
    }

    public static void main(String[] args) {
        System.out.println("Hello");
    }
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.java');

    if (methods.length < 2) throw new Error('Should extract Java methods');
});

test('MethodAnalyzer - Extracts Java constructors', () => {
    const content = `
public class Person {
    public Person() {
        this.name = "Unknown";
    }

    public Person(String name) {
        this.name = name;
    }
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.java');

    if (methods.length < 2) throw new Error('Should extract constructors');
});

// ============================================================================
// PHP EXTRACTION TESTS
// ============================================================================
console.log('\n🐘 PHP Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts PHP functions', () => {
    const content = `
<?php
function hello() {
    return "world";
}

function greet($name) {
    return "Hello " . $name;
}
?>
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.php');

    if (methods.length < 2) throw new Error('Should extract PHP functions');
});

test('MethodAnalyzer - Extracts PHP class methods', () => {
    const content = `
<?php
class Calculator {
    public function add($a, $b) {
        return $a + $b;
    }

    private function subtract($a, $b) {
        return $a - $b;
    }
}
?>
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.php');

    if (methods.length < 2) throw new Error('Should extract class methods');
});

// ============================================================================
// RUBY EXTRACTION TESTS
// ============================================================================
console.log('\n💎 Ruby Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts Ruby methods', () => {
    const content = `
def hello
  "world"
end

def greet(name)
  "Hello #{name}"
end

def self.class_method
  "Class method"
end
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.rb');

    if (methods.length < 2) throw new Error('Should extract Ruby methods');
});

// ============================================================================
// KOTLIN EXTRACTION TESTS
// ============================================================================
console.log('\n🅺 Kotlin Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts Kotlin functions', () => {
    const content = `
fun main() {
    println("Hello")
}

fun add(a: Int, b: Int): Int {
    return a + b
}

suspend fun fetchData(): String {
    return "data"
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.kt');

    if (methods.length < 2) throw new Error('Should extract Kotlin functions');
});

// ============================================================================
// SWIFT EXTRACTION TESTS
// ============================================================================
console.log('\n🦅 Swift Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts Swift functions', () => {
    const content = `
func hello() {
    print("Hello")
}

func add(a: Int, b: Int) -> Int {
    return a + b
}

init() {
    self.name = "Unknown"
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.swift');

    if (methods.length < 2) throw new Error('Should extract Swift functions');
});

// ============================================================================
// C/C++ EXTRACTION TESTS
// ============================================================================
console.log('\n⚙️  C/C++ Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts C functions', () => {
    const content = `
int main() {
    printf("Hello\\n");
    return 0;
}

int add(int a, int b) {
    return a + b;
}

void print_message(const char* msg) {
    printf("%s\\n", msg);
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.c');

    if (methods.length < 2) throw new Error('Should extract C functions');
});

test('MethodAnalyzer - Extracts C++ methods', () => {
    const content = `
class Calculator {
public:
    int add(int a, int b) {
        return a + b;
    }

    virtual int multiply(int a, int b) {
        return a * b;
    }
};
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.cpp');

    if (methods.length < 2) throw new Error('Should extract C++ methods');
});

// ============================================================================
// SCALA EXTRACTION TESTS
// ============================================================================
console.log('\n🎭 Scala Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts Scala methods', () => {
    const content = `
def hello(): String = {
  "world"
}

def add(a: Int, b: Int): Int = a + b

override def toString: String = "Calculator"
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.scala');

    if (methods.length < 2) throw new Error('Should extract Scala methods');
});

// ============================================================================
// EDGE CASES AND ERROR HANDLING
// ============================================================================
console.log('\n🎯 Edge Cases and Error Handling');
console.log('-'.repeat(70));

test('MethodAnalyzer - Handles empty content', () => {
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods('', 'test.js');

    if (!Array.isArray(methods)) throw new Error('Should return array');
    if (methods.length !== 0) throw new Error('Should return empty array');
});

test('MethodAnalyzer - Handles content with no methods', () => {
    const content = `
const x = 10;
const y = 20;
console.log(x + y);
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.js');

    if (!Array.isArray(methods)) throw new Error('Should return array');
});

test('MethodAnalyzer - Handles unknown file extensions', () => {
    const content = 'function test() { }';
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.unknown');

    // Should default to JavaScript extraction
    if (!Array.isArray(methods)) throw new Error('Should return array');
});

test('MethodAnalyzer - Handles multiline methods', () => {
    const content = `
function longMethod(
    param1,
    param2,
    param3
) {
    return param1 + param2 + param3;
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.js');

    if (methods.length === 0) throw new Error('Should extract multiline method');
});

test('MethodAnalyzer - Each method has required properties', () => {
    const content = 'function test() { return 42; }';
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.js');

    if (methods.length === 0) throw new Error('Should extract method');
    const method = methods[0];

    if (!method.name) throw new Error('Method should have name');
    if (typeof method.line !== 'number') throw new Error('Method should have line number');
});

test('MethodAnalyzer - Handles methods with special characters in names', () => {
    const content = `
const test_method = () => {};
const $jQuery = () => {};
const _private = () => {};
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.js');

    if (methods.length < 2) throw new Error('Should extract methods with special chars');
});

test('MethodAnalyzer - Handles nested methods/classes', () => {
    const content = `
class Outer {
    method1() {
        function inner() {
            return 42;
        }
    }

    method2() {
        return () => 10;
    }
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.js');

    if (methods.length < 2) throw new Error('Should extract nested methods');
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\n🔗 Integration Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Works with all supported languages', () => {
    const analyzer = new MethodAnalyzer();
    const extensions = [
        '.js', '.ts', '.jsx', '.tsx', '.rs', '.cs', '.go', '.java',
        '.py', '.php', '.rb', '.kt', '.swift', '.c', '.cpp', '.scala'
    ];

    const content = 'function test() { }'; // Simple test content

    for (const ext of extensions) {
        const methods = analyzer.extractMethods(content, `test${ext}`);
        if (!Array.isArray(methods)) throw new Error(`Should work with ${ext}`);
    }
});

test('MethodAnalyzer - Consistent results for same content', () => {
    const analyzer = new MethodAnalyzer();
    const content = 'function test() { return 42; }';

    const methods1 = analyzer.extractMethods(content, 'test.js');
    const methods2 = analyzer.extractMethods(content, 'test.js');

    if (methods1.length !== methods2.length) {
        throw new Error('Should return consistent results');
    }
});

// ============================================================================
// RESULTS
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All method analyzer tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
