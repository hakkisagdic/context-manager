#!/usr/bin/env node

/**
 * Comprehensive Language Analyzer Tests
 * Tests method extraction for 14+ programming languages with edge cases
 */

import MethodAnalyzer from '../lib/analyzers/method-analyzer.js';

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

console.log('🧪 COMPREHENSIVE LANGUAGE ANALYZER TESTS');
console.log('='.repeat(70));

const analyzer = new MethodAnalyzer();

// ============================================================================
// JAVASCRIPT/TYPESCRIPT EDGE CASES
// ============================================================================
console.log('\n🟨 JavaScript/TypeScript Edge Cases\n' + '-'.repeat(70));

// Test 1: Arrow functions with various syntaxes
{
    const code = `
        const func1 = () => 42;
        const func2 = x => x * 2;
        const func3 = (x, y) => x + y;
        const func4 = (x, y) => { return x + y; };
    `;
    const methods = analyzer.extractMethods(code, '.js');
    assert(
        methods.length >= 2,
        'JavaScript: Extracts arrow functions',
        `Expected at least 2, got ${methods.length}`
    );
}

// Test 2: Async/await functions
{
    const code = `
        async function fetchData() {
            const response = await fetch('/api');
            return response.json();
        }
        const asyncArrow = async () => await something();
    `;
    const methods = analyzer.extractMethods(code, '.js');
    assert(
        methods.length >= 1,
        'JavaScript: Extracts async functions',
        `Expected at least 1, got ${methods.length}`
    );
}

// Test 3: Generator functions
{
    const code = `
        function* generator() {
            yield 1;
            yield 2;
            yield 3;
        }
        function* fibonacci() {
            let [a, b] = [0, 1];
            while (true) {
                yield a;
                [a, b] = [b, a + b];
            }
        }
    `;
    const methods = analyzer.extractMethods(code, '.js');
    assert(
        methods.length >= 1,
        'JavaScript: Extracts generator functions'
    );
}

// Test 4: Class methods with decorators
{
    const code = `
        class MyClass {
            @deprecated
            oldMethod() {
                return 'old';
            }

            @bind
            async getData() {
                return await fetch();
            }
        }
    `;
    const methods = analyzer.extractMethods(code, '.js');
    assert(
        methods.length >= 1,
        'JavaScript: Extracts class methods with decorators'
    );
}

// Test 5: TypeScript generic methods
{
    const code = `
        function identity<T>(arg: T): T {
            return arg;
        }

        class GenericClass<T> {
            method<U>(arg: U): U {
                return arg;
            }
        }
    `;
    const methods = analyzer.extractMethods(code, '.ts');
    assert(
        methods.length >= 1,
        'TypeScript: Extracts generic methods'
    );
}

// ============================================================================
// RUST EDGE CASES
// ============================================================================
console.log('\n🦀 Rust Edge Cases\n' + '-'.repeat(70));

// Test 6: Rust macros
{
    const code = `
        macro_rules! say_hello {
            () => {
                println!("Hello!");
            };
        }

        fn regular_function() {
            say_hello!();
        }
    `;
    const methods = analyzer.extractMethods(code, '.rs');
    assert(
        methods.length >= 1,
        'Rust: Extracts functions (macros are not functions)',
        `Expected at least 1, got ${methods.length}`
    );
}

// Test 7: Rust traits
{
    const code = `
        trait Animal {
            fn make_sound(&self) -> String;
            fn get_name(&self) -> &str;
        }

        impl Animal for Dog {
            fn make_sound(&self) -> String {
                String::from("Woof!")
            }
        }
    `;
    const methods = analyzer.extractMethods(code, '.rs');
    assert(
        methods.length >= 1,
        'Rust: Extracts trait methods and implementations'
    );
}

// Test 8: Rust lifetimes
{
    const code = `
        fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
            if x.len() > y.len() { x } else { y }
        }

        struct ImportantExcerpt<'a> {
            part: &'a str,
        }

        impl<'a> ImportantExcerpt<'a> {
            fn level(&self) -> i32 {
                3
            }
        }
    `;
    const methods = analyzer.extractMethods(code, '.rs');
    assert(
        methods.length >= 1,
        'Rust: Extracts functions with lifetimes'
    );
}

// ============================================================================
// C# EDGE CASES
// ============================================================================
console.log('\n💠 C# Edge Cases\n' + '-'.repeat(70));

// Test 9: C# async methods
{
    const code = `
        public async Task<string> GetDataAsync() {
            var result = await FetchAsync();
            return result;
        }

        private async Task ProcessAsync() {
            await Task.Delay(1000);
        }
    `;
    const methods = analyzer.extractMethods(code, '.cs');
    assert(
        methods.length >= 2,
        'C#: Extracts async methods',
        `Expected 2, got ${methods.length}`
    );
}

// Test 10: C# LINQ and lambda
{
    const code = `
        public IEnumerable<int> GetEvenNumbers(IEnumerable<int> numbers) {
            return numbers.Where(n => n % 2 == 0);
        }

        public void ProcessItems() {
            var items = list.Select(x => x.Value)
                           .OrderBy(x => x)
                           .ToList();
        }
    `;
    const methods = analyzer.extractMethods(code, '.cs');
    assert(
        methods.length >= 2,
        'C#: Extracts methods with LINQ'
    );
}

// Test 11: C# properties
{
    const code = `
        public class Person {
            public string Name { get; set; }
            public int Age { get; private set; }

            private string _email;
            public string Email {
                get { return _email; }
                set { _email = value; }
            }
        }
    `;
    const methods = analyzer.extractMethods(code, '.cs');
    assert(
        methods.length >= 1,
        'C#: Extracts properties'
    );
}

// ============================================================================
// GO EDGE CASES
// ============================================================================
console.log('\n🔵 Go Edge Cases\n' + '-'.repeat(70));

// Test 12: Go interfaces
{
    const code = `
        type Reader interface {
            Read(p []byte) (n int, err error)
        }

        type Writer interface {
            Write(p []byte) (n int, err error)
        }
    `;
    const methods = analyzer.extractMethods(code, '.go');
    assert(
        methods.length >= 2,
        'Go: Extracts interface methods',
        `Expected 2, got ${methods.length}`
    );
}

// Test 13: Go goroutines and channels
{
    const code = `
        func worker(id int, jobs <-chan int, results chan<- int) {
            for j := range jobs {
                results <- j * 2
            }
        }

        func startWorkers() {
            jobs := make(chan int, 100)
            results := make(chan int, 100)

            for w := 1; w <= 3; w++ {
                go worker(w, jobs, results)
            }
        }
    `;
    const methods = analyzer.extractMethods(code, '.go');
    assert(
        methods.length >= 2,
        'Go: Extracts functions with channels',
        `Expected 2, got ${methods.length}`
    );
}

// Test 14: Go method receivers
{
    const code = `
        type Rectangle struct {
            width, height float64
        }

        func (r Rectangle) Area() float64 {
            return r.width * r.height
        }

        func (r *Rectangle) Scale(factor float64) {
            r.width *= factor
            r.height *= factor
        }
    `;
    const methods = analyzer.extractMethods(code, '.go');
    assert(
        methods.length >= 2,
        'Go: Extracts methods with receivers',
        `Expected 2, got ${methods.length}`
    );
}

// ============================================================================
// JAVA EDGE CASES
// ============================================================================
console.log('\n☕ Java Edge Cases\n' + '-'.repeat(70));

// Test 15: Java annotations
{
    const code = `
        @Override
        public String toString() {
            return "Object";
        }

        @Deprecated
        @SuppressWarnings("unchecked")
        public void oldMethod() {
            // deprecated code
        }
    `;
    const methods = analyzer.extractMethods(code, '.java');
    assert(
        methods.length >= 2,
        'Java: Extracts methods with annotations',
        `Expected 2, got ${methods.length}`
    );
}

// Test 16: Java lambdas and streams
{
    const code = `
        public List<String> filterNames(List<String> names) {
            return names.stream()
                       .filter(name -> name.startsWith("A"))
                       .collect(Collectors.toList());
        }

        public void processItems() {
            items.forEach(item -> System.out.println(item));
        }
    `;
    const methods = analyzer.extractMethods(code, '.java');
    assert(
        methods.length >= 2,
        'Java: Extracts methods with lambdas'
    );
}

// Test 17: Java generics
{
    const code = `
        public <T> T getFirst(List<T> list) {
            return list.isEmpty() ? null : list.get(0);
        }

        public <K, V> Map<K, V> createMap() {
            return new HashMap<>();
        }
    `;
    const methods = analyzer.extractMethods(code, '.java');
    assert(
        methods.length >= 2,
        'Java: Extracts generic methods'
    );
}

// ============================================================================
// PYTHON EDGE CASES
// ============================================================================
console.log('\n🐍 Python Edge Cases\n' + '-'.repeat(70));

// Test 18: Python decorators
{
    const code = `
        @staticmethod
        def static_method():
            return "static"

        @classmethod
        def class_method(cls):
            return cls()

        @property
        def name(self):
            return self._name
    `;
    const methods = analyzer.extractMethods(code, '.py');
    assert(
        methods.length >= 3,
        'Python: Extracts decorated methods',
        `Expected 3, got ${methods.length}`
    );
}

// Test 19: Python async def
{
    const code = `
        async def fetch_data():
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    return await response.json()

        async def main():
            await fetch_data()
    `;
    const methods = analyzer.extractMethods(code, '.py');
    assert(
        methods.length >= 2,
        'Python: Extracts async def functions'
    );
}

// Test 20: Python lambda and comprehensions
{
    const code = `
        def process_data(data):
            filtered = [x for x in data if x > 0]
            mapped = map(lambda x: x * 2, filtered)
            return list(mapped)
    `;
    const methods = analyzer.extractMethods(code, '.py');
    assert(
        methods.length >= 1,
        'Python: Extracts functions with comprehensions'
    );
}

// ============================================================================
// CROSS-LANGUAGE EDGE CASES
// ============================================================================
console.log('\n🌐 Cross-Language Edge Cases\n' + '-'.repeat(70));

// Test 21: Nested functions
{
    const code = `
        function outer() {
            function middle() {
                function inner() {
                    return 42;
                }
                return inner();
            }
            return middle();
        }
    `;
    const methods = analyzer.extractMethods(code, '.js');
    assert(
        methods.length >= 1,
        'Nested: Extracts deeply nested functions'
    );
}

// Test 22: Closures
{
    const code = `
        function makeCounter() {
            let count = 0;
            return function() {
                return ++count;
            };
        }
    `;
    const methods = analyzer.extractMethods(code, '.js');
    assert(
        methods.length >= 1,
        'Closures: Extracts functions with closures'
    );
}

// Test 23: Comments inside method signatures
{
    const code = `
        function myMethod(
            a, // first parameter
            b, /* second parameter */
            c  // third parameter
        ) {
            return a + b + c;
        }
    `;
    const methods = analyzer.extractMethods(code, '.js');
    assert(
        methods.length >= 1,
        'Comments: Handles comments in parameters'
    );
}

// Test 24: Multiline parameters with defaults
{
    const code = `
        function complexMethod(
            required,
            optional1 = 'default1',
            optional2 = { key: 'value' },
            optional3 = [1, 2, 3],
            ...rest
        ) {
            return required;
        }
    `;
    const methods = analyzer.extractMethods(code, '.js');
    assert(
        methods.length >= 1,
        'Parameters: Handles complex multiline parameters'
    );
}

// Test 25: Variadic parameters
{
    const code = `
        function sum(...numbers) {
            return numbers.reduce((a, b) => a + b, 0);
        }

        function format(template, ...args) {
            return template.replace(/{(\d+)}/g, (match, index) => args[index]);
        }
    `;
    const methods = analyzer.extractMethods(code, '.js');
    assert(
        methods.length >= 2,
        'Variadic: Extracts functions with rest parameters'
    );
}

// Test 26: Method names with special patterns
{
    const code = `
        function $jquery() { return true; }
        function _private() { return true; }
        function __dunder__() { return true; }
        function method123() { return true; }
    `;
    const methods = analyzer.extractMethods(code, '.js');
    assert(
        methods.length >= 4,
        'Special chars: Extracts methods with $, _, numbers',
        `Expected 4, got ${methods.length}`
    );
}

// Test 27: Method overloading (Java/C#)
{
    const code = `
        public void process(int value) {
            System.out.println(value);
        }

        public void process(String value) {
            System.out.println(value);
        }

        public void process(int value, String name) {
            System.out.println(name + ": " + value);
        }
    `;
    const methods = analyzer.extractMethods(code, '.java');
    assert(
        methods.length >= 3,
        'Overloading: Extracts overloaded methods',
        `Expected 3, got ${methods.length}`
    );
}

// Test 28: Private vs public methods
{
    const code = `
        public class MyClass {
            public void publicMethod() {}
            private void privateMethod() {}
            protected void protectedMethod() {}
            internal void internalMethod() {}
        }
    `;
    const methods = analyzer.extractMethods(code, '.cs');
    assert(
        methods.length >= 4,
        'Access modifiers: Extracts methods with all access levels',
        `Expected 4, got ${methods.length}`
    );
}

// Test 29: Static vs instance methods
{
    const code = `
        public class Utility {
            public static void staticMethod() {}
            public void instanceMethod() {}
            public static async Task<int> staticAsync() {}
        }
    `;
    const methods = analyzer.extractMethods(code, '.cs');
    assert(
        methods.length >= 3,
        'Static: Extracts both static and instance methods'
    );
}

// Test 30: Abstract and virtual methods
{
    const code = `
        public abstract class Base {
            public abstract void AbstractMethod();
            public virtual void VirtualMethod() {}
            protected abstract Task<int> AbstractAsync();
        }
    `;
    const methods = analyzer.extractMethods(code, '.cs');
    assert(
        methods.length >= 3,
        'Abstract: Extracts abstract and virtual methods'
    );
}

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(70));
console.log(`\n✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total tests: ${testsPassed + testsFailed}`);
console.log(`🎯 Success rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(({ name, message }) => {
        console.log(`  • ${name}`);
        if (message) console.log(`    ${message}`);
    });
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
}
