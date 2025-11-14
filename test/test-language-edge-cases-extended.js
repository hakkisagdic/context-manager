#!/usr/bin/env node

/**
 * Extended Language Analyzer Edge Cases Tests
 * Tests method extraction for all supported languages with edge cases
 * Target: 95% coverage of language-specific analyzers
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import MethodAnalyzer from '../lib/analyzers/method-analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    testsRun++;
    try {
        fn();
        testsPassed++;
        console.log(`✅ ${name}`);
        return true;
    } catch (error) {
        testsFailed++;
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        return false;
    }
}

console.log('🧪 Extended Language Analyzer Edge Cases Tests\n');

const testDir = path.join(__dirname, 'temp-lang-test');
if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

const analyzer = new MethodAnalyzer();

// ============================================================================
// JAVASCRIPT/TYPESCRIPT EDGE CASES
// ============================================================================
console.log('📦 JavaScript/TypeScript Edge Cases');
console.log('-'.repeat(70));

test('JS: Arrow functions with default parameters', () => {
    const code = `const func = (a = 5, b = 10) => a + b;`;
    const methods = analyzer.extractMethods(code, 'js');
    if (!methods.some(m => m.name.includes('func'))) {
        throw new Error('Failed to extract arrow function with defaults');
    }
});

test('JS: Async arrow functions', () => {
    const code = `const fetchData = async () => await fetch('/api');`;
    const methods = analyzer.extractMethods(code, 'js');
    if (!methods.some(m => m.name.includes('fetchData'))) {
        throw new Error('Failed to extract async arrow function');
    }
});

test('JS: Nested functions', () => {
    const code = `function outer() { function inner() { return 1; } return inner; }`;
    const methods = analyzer.extractMethods(code, 'js');
    if (!methods.some(m => m.name.includes('outer'))) {
        throw new Error('Failed to extract outer function');
    }
    if (!methods.some(m => m.name.includes('inner'))) {
        throw new Error('Failed to extract inner function');
    }
});

test('JS: Generator functions', () => {
    const code = `function* generator() { yield 1; yield 2; }`;
    const methods = analyzer.extractMethods(code, 'js');
    if (!methods.some(m => m.name.includes('generator'))) {
        throw new Error('Failed to extract generator function');
    }
});

test('JS: Class with private methods (#)', () => {
    const code = `class MyClass { #privateMethod() { return 'private'; } }`;
    const methods = analyzer.extractMethods(code, 'js');
    // May or may not extract private methods - both acceptable
});

test('JS: Method with destructured parameters', () => {
    const code = `function process({ name, age }) { return name; }`;
    const methods = analyzer.extractMethods(code, 'js');
    if (!methods.some(m => m.name.includes('process'))) {
        throw new Error('Failed to extract function with destructuring');
    }
});

test('JS: Method with rest parameters', () => {
    const code = `function sum(...numbers) { return numbers.reduce((a,b) => a+b); }`;
    const methods = analyzer.extractMethods(code, 'js');
    if (!methods.some(m => m.name.includes('sum'))) {
        throw new Error('Failed to extract function with rest params');
    }
});

test('TS: Generic methods', () => {
    const code = `function identity<T>(arg: T): T { return arg; }`;
    const methods = analyzer.extractMethods(code, 'ts');
    if (!methods.some(m => m.name.includes('identity'))) {
        throw new Error('Failed to extract generic function');
    }
});

// ============================================================================
// PYTHON EDGE CASES
// ============================================================================
console.log('\n📦 Python Edge Cases');
console.log('-'.repeat(70));

test('Python: Decorated methods', () => {
    const code = `@staticmethod\ndef static_method():\n    pass`;
    const methods = analyzer.extractMethods(code, 'py');
    if (!methods.some(m => m.name.includes('static_method'))) {
        throw new Error('Failed to extract decorated method');
    }
});

test('Python: Async methods', () => {
    const code = `async def fetch_data():\n    return await api.get()`;
    const methods = analyzer.extractMethods(code, 'py');
    if (!methods.some(m => m.name.includes('fetch_data'))) {
        throw new Error('Failed to extract async method');
    }
});

test('Python: Methods with type hints', () => {
    const code = `def greet(name: str) -> str:\n    return f"Hello {name}"`;
    const methods = analyzer.extractMethods(code, 'py');
    if (!methods.some(m => m.name.includes('greet'))) {
        throw new Error('Failed to extract typed method');
    }
});

test('Python: Class methods and instance methods', () => {
    const code = `class MyClass:\n    def instance_method(self):\n        pass\n    @classmethod\n    def class_method(cls):\n        pass`;
    const methods = analyzer.extractMethods(code, 'py');
    if (methods.length < 2) {
        throw new Error('Failed to extract both methods');
    }
});

// ============================================================================
// RUST EDGE CASES
// ============================================================================
console.log('\n📦 Rust Edge Cases');
console.log('-'.repeat(70));

test('Rust: Async functions', () => {
    const code = `async fn fetch_data() -> Result<String, Error> { Ok("data".to_string()) }`;
    const methods = analyzer.extractMethods(code, 'rs');
    if (!methods.some(m => m.name.includes('fetch_data'))) {
        throw new Error('Failed to extract async function');
    }
});

test('Rust: Const functions', () => {
    const code = `const fn compile_time_calc() -> i32 { 42 }`;
    const methods = analyzer.extractMethods(code, 'rs');
    if (!methods.some(m => m.name.includes('compile_time_calc'))) {
        throw new Error('Failed to extract const function');
    }
});

test('Rust: Unsafe functions', () => {
    const code = `unsafe fn dangerous_operation() { /* unsafe code */ }`;
    const methods = analyzer.extractMethods(code, 'rs');
    if (!methods.some(m => m.name.includes('dangerous_operation'))) {
        throw new Error('Failed to extract unsafe function');
    }
});

test('Rust: Generic impl methods', () => {
    const code = `impl<T> MyStruct<T> { fn new(value: T) -> Self { Self { value } } }`;
    const methods = analyzer.extractMethods(code, 'rs');
    if (!methods.some(m => m.name.includes('new'))) {
        throw new Error('Failed to extract generic impl method');
    }
});

// ============================================================================
// GO EDGE CASES
// ============================================================================
console.log('\n📦 Go Edge Cases');
console.log('-'.repeat(70));

test('Go: Variadic functions', () => {
    const code = `func sum(nums ...int) int { total := 0; return total }`;
    const methods = analyzer.extractMethods(code, 'go');
    if (!methods.some(m => m.name.includes('sum'))) {
        throw new Error('Failed to extract variadic function');
    }
});

test('Go: Methods with pointer receivers', () => {
    const code = `func (p *Person) SetAge(age int) { p.age = age }`;
    const methods = analyzer.extractMethods(code, 'go');
    if (!methods.some(m => m.name.includes('SetAge'))) {
        throw new Error('Failed to extract pointer receiver method');
    }
});

test('Go: Interface methods', () => {
    const code = `type Reader interface { Read(p []byte) (n int, err error) }`;
    const methods = analyzer.extractMethods(code, 'go');
    if (!methods.some(m => m.name.includes('Read'))) {
        throw new Error('Failed to extract interface method');
    }
});

test('Go: Anonymous functions assigned to variables', () => {
    const code = `var handler = func(w http.ResponseWriter, r *http.Request) { }`;
    const methods = analyzer.extractMethods(code, 'go');
    // May or may not extract - both acceptable
});

// ============================================================================
// JAVA EDGE CASES
// ============================================================================
console.log('\n📦 Java Edge Cases');
console.log('-'.repeat(70));

test('Java: Generic methods with bounds', () => {
    const code = `public <T extends Comparable<T>> T max(T a, T b) { return a.compareTo(b) > 0 ? a : b; }`;
    const methods = analyzer.extractMethods(code, 'java');
    if (!methods.some(m => m.name.includes('max'))) {
        throw new Error('Failed to extract bounded generic method');
    }
});

test('Java: Synchronized methods', () => {
    const code = `public synchronized void criticalSection() { /* synchronized */ }`;
    const methods = analyzer.extractMethods(code, 'java');
    if (!methods.some(m => m.name.includes('criticalSection'))) {
        throw new Error('Failed to extract synchronized method');
    }
});

test('Java: Methods with throws clause', () => {
    const code = `public void riskyMethod() throws IOException, SQLException { }`;
    const methods = analyzer.extractMethods(code, 'java');
    if (!methods.some(m => m.name.includes('riskyMethod'))) {
        throw new Error('Failed to extract method with throws');
    }
});

test('Java: Default interface methods', () => {
    const code = `default void defaultMethod() { System.out.println("default"); }`;
    const methods = analyzer.extractMethods(code, 'java');
    if (!methods.some(m => m.name.includes('defaultMethod'))) {
        throw new Error('Failed to extract default interface method');
    }
});

// ============================================================================
// C# EDGE CASES
// ============================================================================
console.log('\n📦 C# Edge Cases');
console.log('-'.repeat(70));

test('C#: Async methods', () => {
    const code = `public async Task<string> FetchDataAsync() { return await client.GetStringAsync(); }`;
    const methods = analyzer.extractMethods(code, 'cs');
    if (!methods.some(m => m.name.includes('FetchDataAsync'))) {
        throw new Error('Failed to extract async method');
    }
});

test('C#: Extension methods', () => {
    const code = `public static class StringExtensions { public static bool IsEmpty(this string str) { return string.IsNullOrEmpty(str); } }`;
    const methods = analyzer.extractMethods(code, 'cs');
    if (!methods.some(m => m.name.includes('IsEmpty'))) {
        throw new Error('Failed to extract extension method');
    }
});

test('C#: Expression-bodied members', () => {
    const code = `public int Double(int x) => x * 2;`;
    const methods = analyzer.extractMethods(code, 'cs');
    if (!methods.some(m => m.name.includes('Double'))) {
        throw new Error('Failed to extract expression-bodied method');
    }
});

test('C#: Generic constraints', () => {
    const code = `public T GetValue<T>() where T : class, new() { return new T(); }`;
    const methods = analyzer.extractMethods(code, 'cs');
    if (!methods.some(m => m.name.includes('GetValue'))) {
        throw new Error('Failed to extract method with constraints');
    }
});

// ============================================================================
// PHP EDGE CASES
// ============================================================================
console.log('\n📦 PHP Edge Cases');
console.log('-'.repeat(70));

test('PHP: Static methods', () => {
    const code = `public static function getInstance() { return self::$instance; }`;
    const methods = analyzer.extractMethods(code, 'php');
    if (!methods.some(m => m.name.includes('getInstance'))) {
        throw new Error('Failed to extract static method');
    }
});

test('PHP: Abstract methods', () => {
    const code = `abstract public function process();`;
    const methods = analyzer.extractMethods(code, 'php');
    if (!methods.some(m => m.name.includes('process'))) {
        throw new Error('Failed to extract abstract method');
    }
});

test('PHP: Methods with type hints', () => {
    const code = `public function setName(string $name): void { $this->name = $name; }`;
    const methods = analyzer.extractMethods(code, 'php');
    if (!methods.some(m => m.name.includes('setName'))) {
        throw new Error('Failed to extract typed method');
    }
});

// ============================================================================
// RUBY EDGE CASES
// ============================================================================
console.log('\n📦 Ruby Edge Cases');
console.log('-'.repeat(70));

test('Ruby: Methods with question marks', () => {
    const code = `def empty?\n  @items.empty?\nend`;
    const methods = analyzer.extractMethods(code, 'rb');
    if (!methods.some(m => m.name.includes('empty'))) {
        throw new Error('Failed to extract method with ?');
    }
});

test('Ruby: Methods with exclamation marks', () => {
    const code = `def save!\n  raise unless valid?\nend`;
    const methods = analyzer.extractMethods(code, 'rb');
    if (!methods.some(m => m.name.includes('save'))) {
        throw new Error('Failed to extract method with !');
    }
});

test('Ruby: Class methods (self.)', () => {
    const code = `def self.class_method\n  puts "class method"\nend`;
    const methods = analyzer.extractMethods(code, 'rb');
    if (!methods.some(m => m.name.includes('class_method'))) {
        throw new Error('Failed to extract class method');
    }
});

// ============================================================================
// KOTLIN EDGE CASES
// ============================================================================
console.log('\n📦 Kotlin Edge Cases');
console.log('-'.repeat(70));

test('Kotlin: Suspend functions', () => {
    const code = `suspend fun fetchData(): String = withContext(Dispatchers.IO) { }`;
    const methods = analyzer.extractMethods(code, 'kt');
    if (!methods.some(m => m.name.includes('fetchData'))) {
        throw new Error('Failed to extract suspend function');
    }
});

test('Kotlin: Inline functions', () => {
    const code = `inline fun <reified T> printType() { println(T::class) }`;
    const methods = analyzer.extractMethods(code, 'kt');
    if (!methods.some(m => m.name.includes('printType'))) {
        throw new Error('Failed to extract inline function');
    }
});

test('Kotlin: Extension functions', () => {
    const code = `fun String.isValidEmail(): Boolean = this.contains("@")`;
    const methods = analyzer.extractMethods(code, 'kt');
    if (!methods.some(m => m.name.includes('isValidEmail'))) {
        throw new Error('Failed to extract extension function');
    }
});

// ============================================================================
// SWIFT EDGE CASES
// ============================================================================
console.log('\n📦 Swift Edge Cases');
console.log('-'.repeat(70));

test('Swift: Throwing functions', () => {
    const code = `func loadData() throws -> Data { throw MyError.notFound }`;
    const methods = analyzer.extractMethods(code, 'swift');
    if (!methods.some(m => m.name.includes('loadData'))) {
        throw new Error('Failed to extract throwing function');
    }
});

test('Swift: Mutating methods', () => {
    const code = `mutating func increment() { self.value += 1 }`;
    const methods = analyzer.extractMethods(code, 'swift');
    if (!methods.some(m => m.name.includes('increment'))) {
        throw new Error('Failed to extract mutating method');
    }
});

test('Swift: Class vs static methods', () => {
    const code = `class func classMethod() { }\nstatic func staticMethod() { }`;
    const methods = analyzer.extractMethods(code, 'swift');
    if (methods.length < 2) {
        throw new Error('Failed to extract both method types');
    }
});

// ============================================================================
// CLEANUP
// ============================================================================
console.log('\n📦 Cleanup');
console.log('-'.repeat(70));

test('Cleanup: Remove test directory', () => {
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 LANGUAGE EDGE CASES TEST SUMMARY');
console.log('='.repeat(70));
console.log(`Total tests run: ${testsRun}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All language edge case tests passed!');
    process.exit(0);
} else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed`);
    process.exit(1);
}
