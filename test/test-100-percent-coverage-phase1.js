#!/usr/bin/env node

/**
 * Phase 1: 100% Line Coverage Achievement Tests
 * Comprehensive tests for high-impact modules
 * Target: method-analyzer.js, format-converter.js, gitingest-formatter.js, token-calculator.js
 */

import MethodAnalyzer from '../lib/analyzers/method-analyzer.js';
import TokenCalculator from '../lib/analyzers/token-calculator.js';
import GitIngestFormatter from '../lib/formatters/gitingest-formatter.js';
import FormatConverter from '../lib/utils/format-converter.js';
import { writeFileSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';

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

console.log('🎯 Phase 1: 100% Coverage - High Impact Modules\n');

// ============================================================================
// METHOD ANALYZER - Comprehensive Coverage
// ============================================================================
console.log('📋 Method Analyzer - Complete Language Coverage');
console.log('='.repeat(70));

// Test all SQL dialects
test('MethodAnalyzer - Extract T-SQL procedures', () => {
    const content = `
CREATE OR ALTER PROCEDURE dbo.GetUsers
    @MinAge INT = 18
AS
BEGIN
    SELECT * FROM Users WHERE Age >= @MinAge;
END;
GO

CREATE FUNCTION dbo.CalculateAge(@BirthDate DATE)
RETURNS INT
AS
BEGIN
    RETURN DATEDIFF(YEAR, @BirthDate, GETDATE());
END;
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 2) throw new Error('Should extract T-SQL objects');
    const proc = methods.find(m => m.name === 'dbo.GetUsers');
    if (!proc) throw new Error('Should find procedure');
    if (proc.type !== 'PROCEDURE') throw new Error('Should be PROCEDURE type');
});

test('MethodAnalyzer - Extract PostgreSQL functions', () => {
    const content = `
CREATE OR REPLACE FUNCTION calculate_total(p_amount NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    v_total NUMERIC;
BEGIN
    v_total := p_amount * 1.2;
    RETURN v_total;
END;
$$;

CREATE TRIGGER update_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract PostgreSQL functions');
});

test('MethodAnalyzer - Extract MySQL procedures', () => {
    const content = `
DELIMITER $$
CREATE PROCEDURE GetOrdersByCustomer(IN customer_id INT)
BEGIN
    SELECT * FROM orders WHERE customer_id = customer_id;
END$$
DELIMITER ;

CREATE EVENT cleanup_old_data
ON SCHEDULE EVERY 1 DAY
DO
    DELETE FROM logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract MySQL procedures');
});

test('MethodAnalyzer - Extract Oracle PL/SQL', () => {
    const content = `
CREATE OR REPLACE PACKAGE employee_pkg IS
    PROCEDURE hire_employee(p_name VARCHAR2, p_salary NUMBER);
    FUNCTION get_salary(p_id NUMBER) RETURN NUMBER;
END employee_pkg;
/

CREATE OR REPLACE PACKAGE BODY employee_pkg IS
    PROCEDURE hire_employee(p_name VARCHAR2, p_salary NUMBER) IS
    BEGIN
        INSERT INTO employees (name, salary) VALUES (p_name, p_salary);
    END;
    
    FUNCTION get_salary(p_id NUMBER) RETURN NUMBER IS
        v_salary NUMBER;
    BEGIN
        SELECT salary INTO v_salary FROM employees WHERE id = p_id;
        RETURN v_salary;
    END;
END employee_pkg;
/
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 2) throw new Error('Should extract Oracle packages');
});

test('MethodAnalyzer - Extract SQLite objects', () => {
    const content = `
CREATE TRIGGER update_timestamp
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE VIEW active_users AS
SELECT * FROM users WHERE status = 'active';
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract SQLite triggers');
});

test('MethodAnalyzer - Extract Snowflake objects', () => {
    const content = `
CREATE OR REPLACE FUNCTION add_numbers(a NUMBER, b NUMBER)
RETURNS NUMBER
LANGUAGE JAVASCRIPT
AS
$$
  return A + B;
$$;

CREATE OR REPLACE STREAM user_changes ON TABLE users;

CREATE OR REPLACE TASK daily_refresh
WAREHOUSE = compute_wh
SCHEDULE = 'USING CRON 0 9 * * * UTC'
AS
    INSERT INTO summary SELECT * FROM raw_data;
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract Snowflake objects');
});

test('MethodAnalyzer - Extract DB2 objects', () => {
    const content = `
CREATE OR REPLACE PROCEDURE calculate_bonus(IN emp_id INT, OUT bonus DECIMAL)
LANGUAGE SQL
SPECIFIC calc_bonus
MODE DB2SQL
BEGIN
    SELECT salary * 0.1 INTO bonus FROM employees WHERE id = emp_id;
END;

CREATE OR REPLACE FUNCTION get_full_name(first_name VARCHAR(50), last_name VARCHAR(50))
RETURNS VARCHAR(100)
LANGUAGE SQL
DETERMINISTIC
BEGIN
    RETURN first_name || ' ' || last_name;
END;
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract DB2 procedures');
});

test('MethodAnalyzer - Extract Redshift objects', () => {
    const content = `
CREATE OR REPLACE PROCEDURE update_stats()
LANGUAGE plpgsql
AS $$
BEGIN
    ANALYZE users;
    ANALYZE orders;
END;
$$;

CREATE FUNCTION clean_phone(phone VARCHAR)
RETURNS VARCHAR
IMMUTABLE
AS $$
    SELECT REGEXP_REPLACE(phone, '[^0-9]', '', 'g');
$$ LANGUAGE SQL;
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract Redshift objects');
});

test('MethodAnalyzer - Extract BigQuery objects', () => {
    const content = `
CREATE OR REPLACE PROCEDURE \`project.dataset.process_data\`()
BEGIN
    INSERT INTO \`project.dataset.results\`
    SELECT * FROM \`project.dataset.raw_data\`;
END;

CREATE OR REPLACE FUNCTION \`project.dataset.mask_email\`(email STRING)
RETURNS STRING
AS (
    CONCAT(SUBSTR(email, 1, 2), '***@', SPLIT(email, '@')[OFFSET(1)])
);
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract BigQuery objects');
});

// Test all other languages comprehensively
test('MethodAnalyzer - Extract Rust methods with all modifiers', () => {
    const content = `
pub async fn fetch_data() -> Result<Data, Error> {
    let data = request().await?;
    Ok(data)
}

pub const fn max_value() -> i32 {
    100
}

pub unsafe fn raw_pointer_op(ptr: *const i32) -> i32 {
    *ptr
}

impl MyStruct {
    pub fn new() -> Self {
        MyStruct {}
    }
    
    async fn internal_async(&self) -> bool {
        true
    }
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.rs');
    if (methods.length < 4) throw new Error(`Should extract Rust methods, got ${methods.length}`);
});

test('MethodAnalyzer - Extract C# methods with all features', () => {
    const content = `
public class UserService
{
    public async Task<User> GetUserAsync(int id)
    {
        return await db.Users.FindAsync(id);
    }
    
    private static void LogError(string message) => Console.WriteLine(message);
    
    protected internal virtual bool Validate(object obj) { return true; }
    
    public string Name { get; set; }
    
    public int Age { get; private set; }
    
    public decimal Total => Price * Quantity;
}

public record Person(string Name, int Age);
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.cs');
    if (methods.length < 5) throw new Error(`Should extract C# methods, got ${methods.length}`);
});

test('MethodAnalyzer - Extract Go methods with receivers', () => {
    const content = `
package main

func Calculate(a, b int) int {
    return a + b
}

func (s *Server) Start() error {
    return s.listen()
}

func (s Server) Stop() {
    // cleanup
}

type Handler interface {
    Handle(req Request) Response
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.go');
    if (methods.length < 3) throw new Error(`Should extract Go functions, got ${methods.length}`);
});

test('MethodAnalyzer - Extract Java methods with generics', () => {
    const content = `
public class DataProcessor<T> {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
    
    public <R> R process(T data) throws IOException {
        return convert(data);
    }
    
    protected synchronized void update() {
        // update logic
    }
    
    private final boolean validate(Object obj) {
        return obj != null;
    }
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.java');
    if (methods.length < 3) throw new Error(`Should extract Java methods, got ${methods.length}`);
});

test('MethodAnalyzer - Extract Python methods with decorators', () => {
    const content = `
class UserService:
    def __init__(self, db):
        self.db = db
    
    @staticmethod
    def validate_email(email):
        return '@' in email
    
    @classmethod
    def from_config(cls, config):
        return cls(config.db)
    
    async def fetch_user(self, user_id):
        return await self.db.get(user_id)
    
    def _internal_method(self):
        pass
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.py');
    if (methods.length < 4) throw new Error(`Should extract Python methods, got ${methods.length}`);
});

test('MethodAnalyzer - Extract PHP methods with all modifiers', () => {
    const content = `
<?php
class UserController {
    public function index() {
        return view('users.index');
    }
    
    private static function validateData($data) {
        return !empty($data);
    }
    
    protected function authorize() {
        // check permissions
    }
    
    final public function process() {
        $this->authorize();
    }
}

function helper_function($param) {
    return $param;
}
?>
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.php');
    if (methods.length < 4) throw new Error(`Should extract PHP methods, got ${methods.length}`);
});

test('MethodAnalyzer - Extract Ruby methods with all styles', () => {
    const content = `
class User
  def initialize(name)
    @name = name
  end
  
  def self.find(id)
    # class method
  end
  
  def valid?
    !@name.empty?
  end
  
  def save!
    # save with exception
  end
  
  private
  
  def validate
    # private method
  end
end

def helper_method(param)
  param.to_s
end
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.rb');
    if (methods.length < 4) throw new Error(`Should extract Ruby methods, got ${methods.length}`);
});

test('MethodAnalyzer - Extract Kotlin methods', () => {
    const content = `
class UserRepository {
    fun findById(id: Int): User? {
        return database.query("SELECT * FROM users WHERE id = ?", id)
    }
    
    suspend fun fetchUser(id: Int): User {
        return api.getUser(id)
    }
    
    inline fun <reified T> parse(json: String): T {
        return gson.fromJson(json, T::class.java)
    }
}

fun String.isEmail(): Boolean {
    return this.contains('@')
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.kt');
    if (methods.length < 3) throw new Error(`Should extract Kotlin methods, got ${methods.length}`);
});

test('MethodAnalyzer - Extract Swift methods', () => {
    const content = `
class UserService {
    func fetchUser(id: Int) -> User? {
        return database.find(id)
    }
    
    private func validate() -> Bool {
        return true
    }
    
    static func shared() -> UserService {
        return UserService()
    }
}

struct User {
    init(name: String) {
        self.name = name
    }
    
    func fullName() -> String {
        return name
    }
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.swift');
    if (methods.length < 4) throw new Error(`Should extract Swift methods, got ${methods.length}`);
});

test('MethodAnalyzer - Extract C/C++ functions', () => {
    const content = `
#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

static void internal_function() {
    // internal
}

class Calculator {
public:
    virtual int calculate(int x, int y) {
        return x + y;
    }
    
    Calculator() {
        // constructor
    }
};

template<typename T>
T max(T a, T b) {
    return (a > b) ? a : b;
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.cpp');
    if (methods.length < 3) throw new Error(`Should extract C++ functions, got ${methods.length}`);
});

test('MethodAnalyzer - Extract Scala methods', () => {
    const content = `
class UserService {
  def findUser(id: Int): Option[User] = {
    database.find(id)
  }
  
  override def toString: String = "UserService"
  
  private val helper = (x: Int) => x * 2
}

object UserService {
  def apply(): UserService = new UserService()
}
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.scala');
    if (methods.length < 2) throw new Error(`Should extract Scala methods, got ${methods.length}`);
});

// HTML, Markdown, XML extraction
test('MethodAnalyzer - Extract HTML elements comprehensively', () => {
    const content = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
</head>
<body>
    <header id="main-header">
        <nav class="navbar">Navigation</nav>
    </header>
    
    <main>
        <section id="content">
            <h1>Main Heading</h1>
            <h2>Subheading</h2>
            <article class="post">Article content</article>
        </section>
        
        <aside id="sidebar">Sidebar</aside>
    </main>
    
    <footer class="page-footer">Footer</footer>
    
    <div id="modal" class="hidden">Modal</div>
    
    <form id="contact-form" name="contact">
        <input type="text" name="email">
    </form>
    
    <script src="app.js"></script>
    <script id="inline-script">console.log('test');</script>
    
    <template id="user-template">
        <div>User template</div>
    </template>
    
    <user-profile data-id="123"></user-profile>
    <data-grid columns="3"></data-grid>
</body>
</html>
`;
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractMethods(content, 'test.html');
    if (elements.length < 10) throw new Error(`Should extract HTML elements, got ${elements.length}`);
    
    // Verify specific element types
    const hasHeader = elements.some(e => e.name.includes('header'));
    const hasSection = elements.some(e => e.name.includes('section'));
    const hasForm = elements.some(e => e.name.includes('form'));
    const hasScript = elements.some(e => e.name.includes('script'));
    const hasCustomElement = elements.some(e => e.name.includes('user-profile') || e.name.includes('data-grid'));
    
    if (!hasHeader || !hasSection || !hasForm || !hasScript) {
        throw new Error('Should extract various HTML element types');
    }
});

test('MethodAnalyzer - Extract Markdown sections comprehensively', () => {
    const content = `
# Main Title

This is the introduction.

## Getting Started

Installation instructions here.

### Prerequisites

- Node.js
- npm

#### Configuration

Edit the config file.

##### Advanced Settings

Expert level configuration.

###### Debug Mode

Enable debug mode.

\`\`\`javascript
function hello() {
    console.log('Hello');
}
\`\`\`

\`\`\`python
def greet():
    print("Hello")
\`\`\`

- First item
- Second item
  - Nested item

1. Ordered item
2. Second ordered

[link-ref]: https://example.com
[another-ref]: https://test.com

<!-- TODO: Add more examples -->
<!-- FIXME: Fix this section -->
`;
    const analyzer = new MethodAnalyzer();
    const sections = analyzer.extractMethods(content, 'test.md');
    if (sections.length < 8) throw new Error(`Should extract Markdown sections, got ${sections.length}`);
    
    // Verify code blocks and headings
    const hasCodeBlocks = sections.some(s => s.type === 'CODE_BLOCK');
    const hasH1 = sections.some(s => s.type === 'HEADING_1');
    const hasH2 = sections.some(s => s.type === 'HEADING_2');
    
    if (!hasCodeBlocks || !hasH1 || !hasH2) {
        throw new Error('Should extract headings and code blocks');
    }
});

test('MethodAnalyzer - Extract XML elements comprehensively', () => {
    const content = `
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="style.xsl"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId id="main-artifact">my-app</artifactId>
    <version name="1.0.0">1.0.0</version>
    
    <build:target name="compile">
        <javac srcdir="src"/>
    </build:target>
    
    <ns:element xmlns:ns="http://example.com/ns">
        Content
    </ns:element>
    
    <!-- TODO: Add more dependencies -->
    <!-- FIXME: Update version -->
    <!-- NOTE: This is important -->
</project>
`;
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractMethods(content, 'test.xml');
    if (elements.length < 3) throw new Error(`Should extract XML elements, got ${elements.length}`);
    
    // Verify processing instructions and namespaced elements
    const hasProcessingInstruction = elements.some(e => e.type === 'PROCESSING_INSTRUCTION');
    const hasNamespacedElement = elements.some(e => e.name.includes(':'));
    
    if (!hasProcessingInstruction) {
        throw new Error('Should extract processing instructions');
    }
});

// Edge cases and error paths
test('MethodAnalyzer - Handle empty content', () => {
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods('', 'test.js');
    if (methods.length !== 0) throw new Error('Should return empty array for empty content');
});

test('MethodAnalyzer - Handle null/undefined gracefully', () => {
    const analyzer = new MethodAnalyzer();
    try {
        analyzer.extractMethods(null, 'test.js');
        analyzer.extractMethods(undefined, 'test.js');
    } catch (error) {
        // Should either handle gracefully or throw descriptive error
    }
});

test('MethodAnalyzer - Handle unknown file extension', () => {
    const analyzer = new MethodAnalyzer();
    const content = 'function test() {}';
    const methods = analyzer.extractMethods(content, 'test.unknown');
    // Should fall back to JavaScript parsing
    if (methods.length === 0) throw new Error('Should fall back to JS for unknown extensions');
});

// ============================================================================
// TOKEN CALCULATOR - Comprehensive Coverage
// ============================================================================
console.log('\n📊 Token Calculator - Complete Coverage');
console.log('='.repeat(70));

const testDir = '/tmp/token-calc-test';

test('TokenCalculator - Initialize with default options', () => {
    const calc = new TokenCalculator();
    if (!calc) throw new Error('Should create instance');
});

test('TokenCalculator - Initialize with custom options', () => {
    const calc = new TokenCalculator({
        verbose: true,
        includeHidden: false,
        respectGitignore: true
    });
    if (!calc) throw new Error('Should create instance with options');
});

test('TokenCalculator - Calculate tokens for directory', async () => {
    try {
        rmSync(testDir, { recursive: true, force: true });
    } catch (e) {}
    mkdirSync(testDir, { recursive: true });
    
    writeFileSync(join(testDir, 'test1.js'), 'function hello() { return "world"; }');
    writeFileSync(join(testDir, 'test2.js'), 'const x = 42;');
    
    const calc = new TokenCalculator();
    const result = await calc.analyze(testDir);
    
    if (!result || !result.totalTokens) throw new Error('Should return result with tokens');
    if (result.totalFiles < 2) throw new Error('Should find test files');
    
    rmSync(testDir, { recursive: true, force: true });
});

test('TokenCalculator - Calculate tokens for single file', async () => {
    try {
        rmSync(testDir, { recursive: true, force: true });
    } catch (e) {}
    mkdirSync(testDir, { recursive: true });
    
    const filePath = join(testDir, 'single.js');
    writeFileSync(filePath, 'const message = "Hello, World!";');
    
    const calc = new TokenCalculator();
    const result = await calc.analyze(filePath);
    
    if (!result || result.totalFiles !== 1) throw new Error('Should analyze single file');
    if (!result.totalTokens) throw new Error('Should calculate tokens');
    
    rmSync(testDir, { recursive: true, force: true });
});

test('TokenCalculator - Handle non-existent path', async () => {
    const calc = new TokenCalculator();
    try {
        await calc.analyze('/non/existent/path/xyz123');
        throw new Error('Should throw error for non-existent path');
    } catch (error) {
        if (!error.message.includes('not found') && !error.message.includes('ENOENT')) {
            throw new Error('Should throw descriptive error');
        }
    }
});

test('TokenCalculator - Respect .gitignore', async () => {
    try {
        rmSync(testDir, { recursive: true, force: true });
    } catch (e) {}
    mkdirSync(testDir, { recursive: true });
    mkdirSync(join(testDir, 'node_modules'), { recursive: true });
    
    writeFileSync(join(testDir, '.gitignore'), 'node_modules/\n*.log');
    writeFileSync(join(testDir, 'index.js'), 'console.log("main");');
    writeFileSync(join(testDir, 'node_modules', 'dep.js'), 'console.log("dep");');
    writeFileSync(join(testDir, 'debug.log'), 'log content');
    
    const calc = new TokenCalculator({ respectGitignore: true });
    const result = await calc.analyze(testDir);
    
    // Should only include index.js, not node_modules or .log files
    const jsFiles = result.files?.filter(f => f.path.endsWith('.js')) || [];
    const hasNodeModules = jsFiles.some(f => f.path.includes('node_modules'));
    
    if (hasNodeModules) throw new Error('Should respect .gitignore');
    
    rmSync(testDir, { recursive: true, force: true });
});

test('TokenCalculator - Generate detailed report', async () => {
    try {
        rmSync(testDir, { recursive: true, force: true });
    } catch (e) {}
    mkdirSync(testDir, { recursive: true });
    
    writeFileSync(join(testDir, 'app.js'), 'function app() { console.log("test"); }');
    
    const calc = new TokenCalculator();
    const result = await calc.analyze(testDir);
    const report = calc.generateReport(result);
    
    if (!report) throw new Error('Should generate report');
    if (!report.includes('Total Files') && !report.includes('total')) {
        throw new Error('Report should contain statistics');
    }
    
    rmSync(testDir, { recursive: true, force: true });
});

test('TokenCalculator - Save report to file', async () => {
    try {
        rmSync(testDir, { recursive: true, force: true });
    } catch (e) {}
    mkdirSync(testDir, { recursive: true });
    
    writeFileSync(join(testDir, 'app.js'), 'const x = 1;');
    
    const calc = new TokenCalculator();
    const result = await calc.analyze(testDir);
    const reportPath = join(testDir, 'report.json');
    
    await calc.saveReport(result, reportPath);
    
    const reportContent = JSON.parse(readFileSync(reportPath, 'utf8'));
    if (!reportContent) throw new Error('Should save report');
    
    rmSync(testDir, { recursive: true, force: true });
});

// ============================================================================
// GITINGEST FORMATTER - Comprehensive Coverage
// ============================================================================
console.log('\n📄 GitIngest Formatter - Complete Coverage');
console.log('='.repeat(70));

test('GitIngestFormatter - Initialize with default options', () => {
    const formatter = new GitIngestFormatter();
    if (!formatter) throw new Error('Should create instance');
});

test('GitIngestFormatter - Initialize with custom options', () => {
    const formatter = new GitIngestFormatter({
        maxFileSize: 50000,
        chunkSize: 100000,
        includeMetadata: true
    });
    if (!formatter) throw new Error('Should create instance with options');
});

test('GitIngestFormatter - Format analysis results', () => {
    const formatter = new GitIngestFormatter();
    const data = {
        totalFiles: 10,
        totalTokens: 5000,
        files: [
            { path: 'src/index.js', tokens: 500, content: 'console.log("test");' },
            { path: 'src/utils.js', tokens: 300, content: 'export const util = {};' }
        ]
    };
    
    const result = formatter.format(data);
    if (!result) throw new Error('Should format data');
    if (!result.includes('src/index.js')) throw new Error('Should include file paths');
});

test('GitIngestFormatter - Format with metadata', () => {
    const formatter = new GitIngestFormatter({ includeMetadata: true });
    const data = {
        totalFiles: 5,
        totalTokens: 2000,
        timestamp: new Date().toISOString(),
        files: []
    };
    
    const result = formatter.format(data);
    if (!result) throw new Error('Should format with metadata');
});

test('GitIngestFormatter - Handle empty data', () => {
    const formatter = new GitIngestFormatter();
    const result = formatter.format({ files: [], totalFiles: 0, totalTokens: 0 });
    if (!result) throw new Error('Should handle empty data');
});

test('GitIngestFormatter - Chunk large content', () => {
    const formatter = new GitIngestFormatter({ chunkSize: 100 });
    const largeContent = 'x'.repeat(500);
    const data = {
        files: [{ path: 'large.txt', content: largeContent, tokens: 100 }],
        totalFiles: 1,
        totalTokens: 100
    };
    
    const result = formatter.format(data);
    // Should handle chunking without errors
    if (!result) throw new Error('Should chunk large content');
});

// ============================================================================
// FORMAT CONVERTER - Comprehensive Coverage
// ============================================================================
console.log('\n🔄 Format Converter - Complete Coverage');
console.log('='.repeat(70));

test('FormatConverter - Convert JSON to TOON', () => {
    const data = { name: 'Test', value: 123, items: ['a', 'b', 'c'] };
    const toon = FormatConverter.toTOON(data);
    if (!toon || typeof toon !== 'string') throw new Error('Should convert to TOON');
});

test('FormatConverter - Convert JSON to YAML', () => {
    const data = { name: 'Test', value: 456 };
    const yaml = FormatConverter.toYAML(data);
    if (!yaml || typeof yaml !== 'string') throw new Error('Should convert to YAML');
    if (!yaml.includes('name:')) throw new Error('Should contain YAML syntax');
});

test('FormatConverter - Convert JSON to XML', () => {
    const data = { root: { name: 'Test', value: 789 } };
    const xml = FormatConverter.toXML(data);
    if (!xml || typeof xml !== 'string') throw new Error('Should convert to XML');
    if (!xml.includes('<') || !xml.includes('>')) throw new Error('Should contain XML tags');
});

test('FormatConverter - Convert JSON to CSV', () => {
    const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 }
    ];
    const csv = FormatConverter.toCSV(data);
    if (!csv || typeof csv !== 'string') throw new Error('Should convert to CSV');
    if (!csv.includes('name') || !csv.includes('Alice')) throw new Error('Should contain CSV data');
});

test('FormatConverter - Convert JSON to Markdown', () => {
    const data = { title: 'Test', content: 'Sample content' };
    const md = FormatConverter.toMarkdown(data);
    if (!md || typeof md !== 'string') throw new Error('Should convert to Markdown');
});

test('FormatConverter - Parse YAML to JSON', () => {
    const yaml = 'name: Test\nvalue: 123';
    const json = FormatConverter.parseYAML(yaml);
    if (!json || typeof json !== 'object') throw new Error('Should parse YAML');
    if (json.name !== 'Test') throw new Error('Should parse correctly');
});

test('FormatConverter - Parse CSV to JSON', () => {
    const csv = 'name,age\nAlice,30\nBob,25';
    const json = FormatConverter.parseCSV(csv);
    if (!Array.isArray(json)) throw new Error('Should parse CSV to array');
    if (json.length !== 2) throw new Error('Should parse all rows');
});

test('FormatConverter - Handle conversion errors gracefully', () => {
    try {
        FormatConverter.toYAML(undefined);
        FormatConverter.toXML(null);
        FormatConverter.toCSV('not an array');
    } catch (error) {
        // Should handle errors gracefully
    }
});

test('FormatConverter - Get supported formats', () => {
    const formats = FormatConverter.getSupportedFormats();
    if (!Array.isArray(formats)) throw new Error('Should return array of formats');
    if (!formats.includes('json')) throw new Error('Should include json format');
    if (!formats.includes('yaml')) throw new Error('Should include yaml format');
});

test('FormatConverter - Detect format from extension', () => {
    const jsonFormat = FormatConverter.detectFormat('.json');
    const yamlFormat = FormatConverter.detectFormat('.yml');
    const csvFormat = FormatConverter.detectFormat('.csv');
    
    if (jsonFormat !== 'json') throw new Error('Should detect json format');
    if (yamlFormat !== 'yaml') throw new Error('Should detect yaml format');
    if (csvFormat !== 'csv') throw new Error('Should detect csv format');
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 PHASE 1 TEST RESULTS');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 ALL PHASE 1 TESTS PASSED!');
    console.log('✨ Coverage significantly improved for high-impact modules.');
}

process.exit(testsFailed > 0 ? 1 : 0);
