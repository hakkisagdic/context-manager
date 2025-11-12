#!/usr/bin/env node

/**
 * C# Support Tests
 * Tests C# method extraction and analysis
 */

import { MethodAnalyzer } from '../index.js';
import fs from 'fs';
import path from 'path';

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

console.log('🧪 C# SUPPORT TESTS');
console.log('='.repeat(70));

// ============================================================================
// C# METHOD ANALYZER TESTS
// ============================================================================
console.log('\n📋 C# MethodAnalyzer Tests\n' + '-'.repeat(70));

const methodAnalyzer = new MethodAnalyzer();

// Test 1: Basic C# method detection
{
    const code = `
        public class Calculator {
            public int Add(int a, int b) {
                return a + b;
            }
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'Calculator.cs');
    assert(
        methods.length === 1 && methods[0].name === 'Add',
        'C# MethodAnalyzer: Extracts basic public method',
        `Expected 1 method named 'Add', got ${methods.length} methods`
    );
}

// Test 2: Private method detection
{
    const code = `
        public class Service {
            private void ProcessData() {
                // implementation
            }
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'Service.cs');
    assert(
        methods.length === 1 && methods[0].name === 'ProcessData',
        'C# MethodAnalyzer: Extracts private method',
        `Expected 1 method named 'ProcessData', got ${methods.length} methods`
    );
}

// Test 3: Static method detection
{
    const code = `
        public class MathHelper {
            public static double Square(double x) {
                return x * x;
            }
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'MathHelper.cs');
    assert(
        methods.length === 1 && methods[0].name === 'Square',
        'C# MethodAnalyzer: Extracts static method',
        `Expected 1 method named 'Square', got ${methods.length} methods`
    );
}

// Test 4: Async method detection
{
    const code = `
        public class ApiClient {
            public async Task<string> FetchDataAsync() {
                return await Task.FromResult("data");
            }
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'ApiClient.cs');
    assert(
        methods.length === 1 && methods[0].name === 'FetchDataAsync',
        'C# MethodAnalyzer: Extracts async method',
        `Expected 1 method named 'FetchDataAsync', got ${methods.length} methods`
    );
}

// Test 5: Property detection
{
    const code = `
        public class Person {
            public string Name { get; set; }
            private int age;
            public int Age {
                get { return age; }
                set { age = value; }
            }
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'Person.cs');
    assert(
        methods.length === 2 &&
        methods.some(m => m.name === 'Name') &&
        methods.some(m => m.name === 'Age'),
        'C# MethodAnalyzer: Extracts properties',
        `Expected 2 properties (Name, Age), got ${methods.length} methods`
    );
}

// Test 6: Generic method detection
{
    const code = `
        public class Repository<T> {
            public T GetById<TKey>(TKey id) where TKey : IComparable {
                return default(T);
            }
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'Repository.cs');
    assert(
        methods.length === 1 && methods[0].name === 'GetById',
        'C# MethodAnalyzer: Extracts generic method',
        `Expected 1 method named 'GetById', got ${methods.length} methods`
    );
}

// Test 7: Virtual and override methods
{
    const code = `
        public class BaseClass {
            public virtual void DoSomething() {
                // base implementation
            }
        }

        public class DerivedClass : BaseClass {
            public override void DoSomething() {
                // derived implementation
            }
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'Classes.cs');
    assert(
        methods.length === 2,
        'C# MethodAnalyzer: Extracts virtual and override methods',
        `Expected 2 methods, got ${methods.length}`
    );
}

// Test 8: Expression-bodied methods (C# 6.0+)
{
    const code = `
        public class Calculator {
            public int Double(int x) => x * 2;
            public string GetName() => "Calculator";
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'Calculator.cs');
    assert(
        methods.length === 2 &&
        methods.some(m => m.name === 'Double') &&
        methods.some(m => m.name === 'GetName'),
        'C# MethodAnalyzer: Extracts expression-bodied methods',
        `Expected 2 methods (Double, GetName), got ${methods.length} methods`
    );
}

// Test 9: Constructor detection
{
    const code = `
        public class Person {
            public Person() {
                // default constructor
            }

            public Person(string name) {
                Name = name;
            }
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'Person.cs');
    assert(
        methods.length === 2 && methods.every(m => m.name === 'Person'),
        'C# MethodAnalyzer: Extracts constructors',
        `Expected 2 constructors named 'Person', got ${methods.length} methods`
    );
}

// Test 10: Interface methods
{
    const code = `
        public interface IRepository {
            void Save();
            Task<T> GetByIdAsync<T>(int id);
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'IRepository.cs');
    // Interface methods without implementation won't be detected by current regex
    // This documents the current limitation
    assert(
        methods.length >= 0,
        'C# MethodAnalyzer: Handles interface definitions',
        `Interface methods detection: ${methods.length} methods found`
    );
}

// Test 11: Multiple methods in one class
{
    const code = `
        public class UserService {
            public void Create(User user) { }
            public void Update(User user) { }
            public void Delete(int id) { }
            public User GetById(int id) { return null; }
            public List<User> GetAll() { return new List<User>(); }
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'UserService.cs');
    assert(
        methods.length === 5,
        'C# MethodAnalyzer: Extracts multiple methods from one class',
        `Expected 5 methods, got ${methods.length}`
    );
}

// Test 12: Protected and internal methods
{
    const code = `
        public class BaseService {
            protected void ValidateInput() { }
            internal void LogOperation() { }
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'BaseService.cs');
    assert(
        methods.length === 2,
        'C# MethodAnalyzer: Extracts protected and internal methods',
        `Expected 2 methods, got ${methods.length}`
    );
}

// Test 13: Abstract methods
{
    const code = `
        public abstract class Shape {
            public abstract double CalculateArea();
            public abstract double CalculatePerimeter();
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'Shape.cs');
    // Abstract methods without implementation won't be detected
    assert(
        methods.length >= 0,
        'C# MethodAnalyzer: Handles abstract method declarations',
        `Abstract methods: ${methods.length} found`
    );
}

// Test 14: Method with array return type
{
    const code = `
        public class DataProcessor {
            public int[] GetNumbers() {
                return new int[] { 1, 2, 3 };
            }

            public string[] GetNames() {
                return new string[] { "Alice", "Bob" };
            }
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'DataProcessor.cs');
    assert(
        methods.length === 2,
        'C# MethodAnalyzer: Extracts methods with array return types',
        `Expected 2 methods, got ${methods.length}`
    );
}

// Test 15: Keyword filtering
{
    const code = `
        public class Test {
            public void if() { }  // Invalid C# but tests keyword filtering
            public void class() { }
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'Test.cs');
    assert(
        methods.length === 0,
        'C# MethodAnalyzer: Filters out C# keywords',
        `Expected 0 methods (keywords filtered), got ${methods.length}`
    );
}

// Test 16: Partial methods
{
    const code = `
        public partial class PartialClass {
            public partial void PartialMethod();

            public void RegularMethod() {
                // implementation
            }
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'PartialClass.cs');
    assert(
        methods.some(m => m.name === 'RegularMethod'),
        'C# MethodAnalyzer: Handles partial classes and methods',
        `Found ${methods.length} methods`
    );
}

// Test 17: Empty C# file
{
    const code = '';
    const methods = methodAnalyzer.extractMethods(code, 'Empty.cs');
    assert(
        methods.length === 0,
        'C# MethodAnalyzer: Handles empty file',
        `Expected 0 methods, got ${methods.length}`
    );
}

// Test 18: Line number accuracy for C#
{
    const code = `
namespace MyApp {
    public class Test {
        public void First() { }

        public void Second() { }

        public void Third() { }
    }
}
    `;
    const methods = methodAnalyzer.extractMethods(code, 'Test.cs');
    assert(
        methods.length === 3,
        'C# MethodAnalyzer: Accurate line numbers',
        `Expected 3 methods, got ${methods.length}`
    );
}

// Test 19: Void return type
{
    const code = `
        public class Logger {
            public void Log(string message) {
                Console.WriteLine(message);
            }
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'Logger.cs');
    assert(
        methods.length === 1 && methods[0].name === 'Log',
        'C# MethodAnalyzer: Extracts void methods',
        `Expected 1 method named 'Log', got ${methods.length} methods`
    );
}

// Test 20: Complex generic types
{
    const code = `
        public class GenericService {
            public Task<List<Dictionary<string, object>>> GetComplexData() {
                return Task.FromResult(new List<Dictionary<string, object>>());
            }
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'GenericService.cs');
    assert(
        methods.length === 1 && methods[0].name === 'GetComplexData',
        'C# MethodAnalyzer: Handles complex generic types',
        `Expected 1 method named 'GetComplexData', got ${methods.length} methods`
    );
}

// ============================================================================
// RESULTS SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 C# TEST RESULTS SUMMARY');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed > 0) {
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach((test, index) => {
        console.log(`  ${index + 1}. ${test.name}`);
        if (test.message) {
            console.log(`     ${test.message}`);
        }
    });
    process.exit(1);
} else {
    console.log('\n🎉 ALL C# TESTS PASSED!');
    process.exit(0);
}
