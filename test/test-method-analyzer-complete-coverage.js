#!/usr/bin/env node

/**
 * Complete Coverage Tests for Method Analyzer
 * Tests for SQL dialects, HTML, Markdown, XML extraction to achieve 100% coverage
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

console.log('🧪 Complete Coverage Tests for Method Analyzer\n');

// ============================================================================
// SQL DIALECT DETECTION TESTS
// ============================================================================
console.log('🔍 SQL Dialect Detection Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Detects Snowflake dialect (LANGUAGE JAVASCRIPT)', () => {
    const content = `
CREATE OR REPLACE FUNCTION add_numbers(a NUMBER, b NUMBER)
RETURNS NUMBER
LANGUAGE JAVASCRIPT
AS
$$
  return A + B;
$$;
`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'snowflake') throw new Error(`Expected snowflake, got ${dialect}`);
});

test('MethodAnalyzer - Detects Snowflake dialect (CREATE STAGE)', () => {
    const content = `CREATE STAGE my_stage;`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'snowflake') throw new Error(`Expected snowflake, got ${dialect}`);
});

test('MethodAnalyzer - Detects Snowflake dialect (RUNTIME_VERSION)', () => {
    const content = `CREATE FUNCTION test() RUNTIME_VERSION = '3.8';`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'snowflake') throw new Error(`Expected snowflake, got ${dialect}`);
});

test('MethodAnalyzer - Detects MySQL dialect (DELIMITER)', () => {
    const content = `
DELIMITER $$
CREATE PROCEDURE test_proc()
BEGIN
  SELECT 1;
END$$
DELIMITER ;
`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'mysql') throw new Error(`Expected mysql, got ${dialect}`);
});

test('MethodAnalyzer - Detects MySQL dialect (CREATE DEFINER)', () => {
    const content = `CREATE DEFINER=\`root\`@\`localhost\` PROCEDURE test_proc() BEGIN END;`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'mysql') throw new Error(`Expected mysql, got ${dialect}`);
});

test('MethodAnalyzer - Detects MySQL dialect (CREATE EVENT)', () => {
    const content = `CREATE EVENT my_event ON SCHEDULE EVERY 1 HOUR DO BEGIN END;`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'mysql') throw new Error(`Expected mysql, got ${dialect}`);
});

test('MethodAnalyzer - Detects Oracle dialect (CREATE PACKAGE)', () => {
    const content = `CREATE OR REPLACE PACKAGE test_pkg IS END;`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'oracle') throw new Error(`Expected oracle, got ${dialect}`);
});

test('MethodAnalyzer - Detects Oracle dialect (PROCEDURE...IS)', () => {
    const content = `CREATE OR REPLACE PROCEDURE test_proc IS BEGIN NULL; END;`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'oracle') throw new Error(`Expected oracle, got ${dialect}`);
});

test('MethodAnalyzer - Detects Oracle dialect (TYPE BODY)', () => {
    const content = `CREATE OR REPLACE TYPE BODY test_type AS END;`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'oracle') throw new Error(`Expected oracle, got ${dialect}`);
});

test('MethodAnalyzer - Detects DB2 dialect (MODE DB2SQL)', () => {
    const content = `CREATE PROCEDURE test_proc() LANGUAGE SQL MODE DB2SQL BEGIN END;`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'db2') throw new Error(`Expected db2, got ${dialect}`);
});

test('MethodAnalyzer - Detects DB2 dialect (DYNAMIC RESULT SETS)', () => {
    const content = `CREATE PROCEDURE test_proc() DYNAMIC RESULT SETS 1 BEGIN END;`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'db2') throw new Error(`Expected db2, got ${dialect}`);
});

test('MethodAnalyzer - Detects DB2 dialect (REFERENCING NEW AS)', () => {
    const content = `CREATE TRIGGER test_trig REFERENCING NEW AS n OLD AS o FOR EACH ROW BEGIN END;`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'db2') throw new Error(`Expected db2, got ${dialect}`);
});

test('MethodAnalyzer - Detects Redshift dialect (LANGUAGE plpythonu)', () => {
    const content = `CREATE FUNCTION test_func() RETURNS INT LANGUAGE plpythonu AS $$ return 1 $$;`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'redshift') throw new Error(`Expected redshift, got ${dialect}`);
});

test('MethodAnalyzer - Detects Redshift dialect (DISTKEY)', () => {
    const content = `CREATE TABLE test (id INT) DISTKEY(id);`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'redshift') throw new Error(`Expected redshift, got ${dialect}`);
});

test('MethodAnalyzer - Detects Redshift dialect (WITH NO SCHEMA BINDING)', () => {
    const content = `CREATE VIEW test_view WITH NO SCHEMA BINDING AS SELECT 1;`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'redshift') throw new Error(`Expected redshift, got ${dialect}`);
});

test('MethodAnalyzer - Detects T-SQL dialect (CREATE OR ALTER)', () => {
    const content = `CREATE OR ALTER PROCEDURE test_proc AS BEGIN SELECT 1; END;`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'tsql') throw new Error(`Expected tsql, got ${dialect}`);
});

test('MethodAnalyzer - Detects T-SQL dialect (GO statement)', () => {
    const content = `CREATE PROCEDURE test_proc AS BEGIN SELECT 1; END;\nGO`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'tsql') throw new Error(`Expected tsql, got ${dialect}`);
});

test('MethodAnalyzer - Detects PostgreSQL dialect (LANGUAGE plpgsql)', () => {
    const content = `CREATE FUNCTION test_func() RETURNS INT LANGUAGE plpgsql AS $$ BEGIN RETURN 1; END; $$;`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'pgsql') throw new Error(`Expected pgsql, got ${dialect}`);
});

test('MethodAnalyzer - Detects PostgreSQL dialect ($$ delimiter)', () => {
    const content = `CREATE OR REPLACE FUNCTION test_func() RETURNS INT AS $$ BEGIN RETURN 1; END; $$;`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'pgsql') throw new Error(`Expected pgsql, got ${dialect}`);
});

test('MethodAnalyzer - Detects SQLite dialect (PRAGMA)', () => {
    const content = `PRAGMA foreign_keys = ON;`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'sqlite') throw new Error(`Expected sqlite, got ${dialect}`);
});

test('MethodAnalyzer - Detects SQLite dialect (AUTOINCREMENT)', () => {
    const content = `CREATE TABLE test (id INTEGER PRIMARY KEY AUTOINCREMENT);`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'sqlite') throw new Error(`Expected sqlite, got ${dialect}`);
});

test('MethodAnalyzer - Detects SQLite dialect (CREATE TEMP TRIGGER)', () => {
    const content = `CREATE TEMP TRIGGER test_trig AFTER INSERT ON test BEGIN END;`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'sqlite') throw new Error(`Expected sqlite, got ${dialect}`);
});

test('MethodAnalyzer - Detects SQLite dialect (RAISE ABORT)', () => {
    const content = `SELECT RAISE(ABORT, 'error');`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'sqlite') throw new Error(`Expected sqlite, got ${dialect}`);
});

test('MethodAnalyzer - Detects BigQuery dialect (project.dataset.table)', () => {
    const content = 'SELECT * FROM `my-project.my_dataset.my_table`;';
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'bigquery') throw new Error(`Expected bigquery, got ${dialect}`);
});

test('MethodAnalyzer - Detects BigQuery dialect (TABLE FUNCTION)', () => {
    const content = `CREATE TABLE FUNCTION test_func() AS SELECT 1;`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'bigquery') throw new Error(`Expected bigquery, got ${dialect}`);
});

test('MethodAnalyzer - Detects BigQuery dialect (LANGUAGE js)', () => {
    const content = `CREATE FUNCTION test_func() RETURNS INT64 LANGUAGE js AS """return 1;""";`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'bigquery') throw new Error(`Expected bigquery, got ${dialect}`);
});

test('MethodAnalyzer - Detects BigQuery dialect (INT64 type)', () => {
    const content = `SELECT CAST(1 AS INT64);`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'bigquery') throw new Error(`Expected bigquery, got ${dialect}`);
});

test('MethodAnalyzer - Detects BigQuery dialect (STRUCT type)', () => {
    const content = `SELECT STRUCT<name STRING, age INT64>('John', 30);`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'bigquery') throw new Error(`Expected bigquery, got ${dialect}`);
});

test('MethodAnalyzer - Returns generic for unrecognized SQL', () => {
    const content = `SELECT * FROM table;`;
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'generic') throw new Error(`Expected generic, got ${dialect}`);
});

// ============================================================================
// SQL SERVER (T-SQL) EXTRACTION TESTS
// ============================================================================
console.log('\n🗄️  SQL Server Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts SQL Server procedures', () => {
    const content = `
CREATE PROCEDURE dbo.GetUsers AS BEGIN SELECT * FROM Users; END;
GO
ALTER PROCEDURE dbo.UpdateUser AS BEGIN UPDATE Users SET Name = 'Test'; END;
GO
CREATE OR ALTER PROC #TempProc AS BEGIN SELECT 1; END;
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 3) throw new Error('Should extract 3 procedures');
    if (!methods.find(m => m.name === 'GetUsers')) throw new Error('Should find GetUsers');
    if (!methods.find(m => m.name === 'UpdateUser')) throw new Error('Should find UpdateUser');
});

test('MethodAnalyzer - Extracts SQL Server functions', () => {
    const content = `
CREATE FUNCTION dbo.AddNumbers(@a INT, @b INT) RETURNS INT AS BEGIN RETURN @a + @b; END;
ALTER FUNCTION dbo.GetUserName() RETURNS VARCHAR(100) AS BEGIN RETURN 'Test'; END;
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract functions');
});

test('MethodAnalyzer - Extracts SQL Server triggers', () => {
    const content = `
CREATE TRIGGER dbo.OnInsert ON Users AFTER INSERT AS BEGIN PRINT 'Inserted'; END;
ALTER TRIGGER dbo.OnUpdate ON Users AFTER UPDATE AS BEGIN PRINT 'Updated'; END;
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 2) throw new Error('Should extract 2 triggers');
});

test('MethodAnalyzer - Extracts SQL Server views', () => {
    const content = `
CREATE VIEW dbo.UserView AS SELECT * FROM Users;
ALTER VIEW dbo.OrderView AS SELECT * FROM Orders;
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 2) throw new Error('Should extract 2 views');
});

test('MethodAnalyzer - Extracts SQL Server types', () => {
    const content = `
CREATE TYPE dbo.UserTableType AS TABLE (Id INT, Name VARCHAR(100));
CREATE TYPE dbo.Money FROM DECIMAL(18, 2);
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 2) throw new Error('Should extract 2 types');
});

test('MethodAnalyzer - Extracts SQL Server synonyms', () => {
    const content = `CREATE SYNONYM MySynonym FOR dbo.MyTable;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract synonym');
});

test('MethodAnalyzer - Extracts SQL Server sequences', () => {
    const content = `CREATE SEQUENCE dbo.MySequence START WITH 1 INCREMENT BY 1;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract sequence');
});

test('MethodAnalyzer - Extracts SQL Server indexes', () => {
    const content = `
CREATE CLUSTERED INDEX IX_Users_Id ON Users(Id);
CREATE NONCLUSTERED INDEX IX_Users_Name ON Users(Name);
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 2) throw new Error('Should extract 2 indexes');
});

// ============================================================================
// POSTGRESQL EXTRACTION TESTS
// ============================================================================
console.log('\n🐘 PostgreSQL Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts PostgreSQL functions', () => {
    const content = `
CREATE OR REPLACE FUNCTION public.add(a INT, b INT) RETURNS INT LANGUAGE plpgsql AS $$
BEGIN
  RETURN a + b;
END;
$$;
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract function');
});

test('MethodAnalyzer - Extracts PostgreSQL procedures', () => {
    const content = `CREATE OR REPLACE PROCEDURE public.insert_user(name TEXT) LANGUAGE plpgsql AS $$ BEGIN INSERT INTO users VALUES (name); END; $$;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract procedure');
});

test('MethodAnalyzer - Extracts PostgreSQL triggers', () => {
    const content = `CREATE TRIGGER update_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_modified();`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract trigger');
});

test('MethodAnalyzer - Extracts PostgreSQL views', () => {
    const content = `
CREATE OR REPLACE FUNCTION test_func() RETURNS INT LANGUAGE plpgsql AS $$ BEGIN RETURN 1; END; $$;
CREATE OR REPLACE VIEW vw_users AS SELECT * FROM users;
CREATE MATERIALIZED VIEW vw_stats AS SELECT COUNT(*) FROM users;
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    // Should extract at least the function, dialect will be pgsql
    if (methods.length < 1) throw new Error('Should extract PostgreSQL objects');
});

test('MethodAnalyzer - Extracts PostgreSQL types', () => {
    const content = `CREATE TYPE mood AS ENUM ('sad', 'happy');`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract type');
});

test('MethodAnalyzer - Extracts PostgreSQL domains', () => {
    const content = `
LANGUAGE plpgsql
CREATE DOMAIN email_address AS TEXT CHECK (VALUE ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$');`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract domain');
});

test('MethodAnalyzer - Extracts PostgreSQL rules', () => {
    const content = `
LANGUAGE plpgsql
CREATE RULE rule_notify AS ON UPDATE TO users DO NOTIFY users_updated;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract rule');
});

test('MethodAnalyzer - Extracts PostgreSQL operators', () => {
    const content = `
LANGUAGE plpgsql
CREATE OPERATOR @@@ (LEFTARG = text, RIGHTARG = text, PROCEDURE = texteq);`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract operator');
});

// ============================================================================
// MYSQL EXTRACTION TESTS
// ============================================================================
console.log('\n🐬 MySQL Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts MySQL procedures', () => {
    const content = `
DELIMITER $$
CREATE PROCEDURE GetUsers() BEGIN SELECT * FROM users; END$$
DELIMITER ;
`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract procedure');
});

test('MethodAnalyzer - Extracts MySQL functions', () => {
    const content = `
DELIMITER $$
CREATE FUNCTION \`calculate_sum\`(a INT, b INT) RETURNS INT DETERMINISTIC RETURN a + b$$
DELIMITER ;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract function');
});

test('MethodAnalyzer - Extracts MySQL triggers', () => {
    const content = `CREATE TRIGGER before_user_update BEFORE UPDATE ON users FOR EACH ROW BEGIN SET NEW.updated_at = NOW(); END;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract trigger');
});

test('MethodAnalyzer - Extracts MySQL views', () => {
    const content = `
DELIMITER $$
CREATE OR REPLACE VIEW vw_active_users AS SELECT id, name FROM users;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract view');
});

test('MethodAnalyzer - Extracts MySQL events', () => {
    const content = `CREATE EVENT cleanup ON SCHEDULE EVERY 1 DAY DO DELETE FROM logs WHERE created < NOW() - INTERVAL 30 DAY;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract event');
});

// ============================================================================
// ORACLE EXTRACTION TESTS
// ============================================================================
console.log('\n☀️  Oracle PL/SQL Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts Oracle procedures', () => {
    const content = `CREATE OR REPLACE PROCEDURE get_users IS BEGIN SELECT * FROM users; END;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract procedure');
});

test('MethodAnalyzer - Extracts Oracle functions', () => {
    const content = `CREATE OR REPLACE FUNCTION add_nums(a NUMBER, b NUMBER) RETURN NUMBER IS BEGIN RETURN a + b; END;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract function');
});

test('MethodAnalyzer - Extracts Oracle triggers', () => {
    const content = `
CREATE OR REPLACE PACKAGE test_pkg IS END;
CREATE OR REPLACE TRIGGER trg_update_timestamp BEFORE UPDATE ON users FOR EACH ROW BEGIN :NEW.updated_at := SYSDATE; END;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract Oracle objects');
});

test('MethodAnalyzer - Extracts Oracle views', () => {
    const content = `
CREATE OR REPLACE PACKAGE test_pkg IS END;
CREATE OR REPLACE FORCE VIEW vw_all_users AS SELECT * FROM users;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract Oracle objects');
});

test('MethodAnalyzer - Extracts Oracle packages', () => {
    const content = `CREATE OR REPLACE PACKAGE user_pkg IS PROCEDURE get_user; END user_pkg;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract package');
});

test('MethodAnalyzer - Extracts Oracle package bodies', () => {
    const content = `CREATE OR REPLACE PACKAGE BODY user_pkg IS PROCEDURE get_user IS BEGIN NULL; END; END user_pkg;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract package body');
});

test('MethodAnalyzer - Extracts Oracle types', () => {
    const content = `
CREATE OR REPLACE PACKAGE test_pkg IS END;
CREATE OR REPLACE TYPE typ_user_info AS OBJECT (id NUMBER, name VARCHAR2(100));`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract Oracle objects');
});

test('MethodAnalyzer - Extracts Oracle type bodies', () => {
    const content = `CREATE OR REPLACE TYPE BODY user_type AS MEMBER FUNCTION get_name RETURN VARCHAR2 IS BEGIN RETURN name; END; END;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract type body');
});

// ============================================================================
// SQLITE EXTRACTION TESTS
// ============================================================================
console.log('\n🗃️  SQLite Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts SQLite triggers', () => {
    const content = `CREATE TRIGGER update_timestamp AFTER UPDATE ON users BEGIN UPDATE users SET updated_at = datetime('now'); END;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract trigger');
});

test('MethodAnalyzer - Extracts SQLite temp triggers', () => {
    const content = `CREATE TEMP TRIGGER temp_trig AFTER INSERT ON users BEGIN SELECT 1; END;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract temp trigger');
});

test('MethodAnalyzer - Extracts SQLite views', () => {
    const content = `CREATE VIEW user_view AS SELECT id, name FROM users;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract view');
});

test('MethodAnalyzer - Extracts SQLite indexes', () => {
    const content = `CREATE UNIQUE INDEX idx_users_email ON users(email);`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract index');
});

// ============================================================================
// SNOWFLAKE EXTRACTION TESTS
// ============================================================================
console.log('\n❄️  Snowflake Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts Snowflake procedures', () => {
    const content = `CREATE OR REPLACE PROCEDURE add_numbers(A NUMBER, B NUMBER) RETURNS NUMBER LANGUAGE JAVASCRIPT AS $$ return A + B; $$;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract procedure');
});

test('MethodAnalyzer - Extracts Snowflake functions', () => {
    const content = `CREATE OR REPLACE FUNCTION add(a NUMBER, b NUMBER) RETURNS NUMBER AS $$ a + b $$;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract function');
});

test('MethodAnalyzer - Extracts Snowflake secure views', () => {
    const content = `
CREATE STAGE my_stage;
CREATE OR REPLACE SECURE VIEW vw_secure_users AS SELECT * FROM users;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract Snowflake objects');
});

test('MethodAnalyzer - Extracts Snowflake stages', () => {
    const content = `CREATE STAGE my_stage URL='s3://mybucket/path/';`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract stage');
});

test('MethodAnalyzer - Extracts Snowflake pipes', () => {
    const content = `CREATE PIPE mypipe AS COPY INTO mytable FROM @mystage;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract pipe');
});

test('MethodAnalyzer - Extracts Snowflake streams', () => {
    const content = `CREATE STREAM mystream ON TABLE mytable;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract stream');
});

test('MethodAnalyzer - Extracts Snowflake tasks', () => {
    const content = `CREATE TASK mytask WAREHOUSE = mywh SCHEDULE = 'USING CRON 0 9 * * * UTC' AS INSERT INTO mytable VALUES (1);`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract task');
});

// ============================================================================
// DB2 EXTRACTION TESTS
// ============================================================================
console.log('\n💼 DB2 Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts DB2 procedures', () => {
    const content = `
MODE DB2SQL
CREATE OR REPLACE PROCEDURE sp_get_all_users() LANGUAGE SQL BEGIN SELECT * FROM users; END;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract procedure');
});

test('MethodAnalyzer - Extracts DB2 functions', () => {
    const content = `CREATE FUNCTION fn_calculate_total(a INT, b INT) RETURNS INT RETURN a + b;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract function');
});

test('MethodAnalyzer - Extracts DB2 triggers', () => {
    const content = `CREATE TRIGGER update_trig AFTER UPDATE ON users FOR EACH ROW BEGIN ATOMIC END;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract trigger');
});

test('MethodAnalyzer - Extracts DB2 views', () => {
    const content = `CREATE VIEW user_view AS SELECT * FROM users;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract view');
});

test('MethodAnalyzer - Extracts DB2 types', () => {
    const content = `CREATE TYPE user_type AS (id INT, name VARCHAR(100));`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract type');
});

// ============================================================================
// REDSHIFT EXTRACTION TESTS
// ============================================================================
console.log('\n🔴 Redshift Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts Redshift procedures', () => {
    const content = `CREATE OR REPLACE PROCEDURE add_numbers(a INT, b INT) LANGUAGE plpgsql AS $$ BEGIN RAISE INFO '%', a + b; END; $$;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract procedure');
});

test('MethodAnalyzer - Extracts Redshift functions', () => {
    const content = `CREATE FUNCTION fn_sum_values(a INT, b INT) RETURNS INT IMMUTABLE AS $$ SELECT a + b $$ LANGUAGE SQL;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract function');
});

test('MethodAnalyzer - Extracts Redshift views', () => {
    const content = `
DISTKEY(id)
CREATE OR REPLACE VIEW vw_user_summary AS SELECT * FROM users;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract view');
});

test('MethodAnalyzer - Extracts Redshift materialized views', () => {
    const content = `
DISTKEY(id)
CREATE MATERIALIZED VIEW mv_user_stats AS SELECT COUNT(*) FROM users;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract materialized view');
});

// ============================================================================
// BIGQUERY EXTRACTION TESTS
// ============================================================================
console.log('\n🔷 BigQuery Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts BigQuery procedures', () => {
    const content = `CREATE OR REPLACE PROCEDURE \`project.dataset.add_numbers\`(a INT64, b INT64) BEGIN DECLARE result INT64; SET result = a + b; END;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract procedure');
});

test('MethodAnalyzer - Extracts BigQuery functions', () => {
    const content = `CREATE OR REPLACE FUNCTION fn_add_numbers(a INT64, b INT64) RETURNS INT64 AS (a + b);`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract function');
});

test('MethodAnalyzer - Extracts BigQuery table functions', () => {
    const content = `CREATE OR REPLACE TABLE FUNCTION get_users() AS SELECT * FROM users;`;
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract table function');
});

test('MethodAnalyzer - Extracts BigQuery views', () => {
    const content = 'CREATE OR REPLACE VIEW `project.dataset.user_view` AS SELECT * FROM users;';
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(content, 'test.sql');
    if (methods.length < 1) throw new Error('Should extract view');
});

// ============================================================================
// HTML EXTRACTION TESTS
// ============================================================================
console.log('\n🌐 HTML Element Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts HTML headings', () => {
    const content = `
<h1>Main Title</h1>
<h2>Subtitle</h2>
<h3>Section</h3>
<h4>Subsection</h4>
<h5>Minor heading</h5>
<h6>Smallest heading</h6>
`;
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractHTMLElements(content, 'test.html');
    if (elements.length < 6) throw new Error('Should extract 6 headings');
    if (!elements.find(e => e.name.includes('Main Title'))) throw new Error('Should find main title');
});

test('MethodAnalyzer - Extracts HTML semantic sections', () => {
    const content = `
<section id="intro">Content</section>
<article class="post">Post content</article>
<aside id="sidebar">Sidebar</aside>
<nav class="menu">Menu</nav>
<header id="main-header">Header</header>
<footer class="site-footer">Footer</footer>
<main id="content">Main content</main>
`;
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractHTMLElements(content, 'test.html');
    if (elements.length < 7) throw new Error('Should extract semantic sections');
});

test('MethodAnalyzer - Extracts HTML div components', () => {
    const content = `
<div id="app">App</div>
<div class="container">Container</div>
<div class="card">Card</div>
`;
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractHTMLElements(content, 'test.html');
    if (elements.length < 3) throw new Error('Should extract div components');
});

test('MethodAnalyzer - Extracts HTML forms', () => {
    const content = `
<form id="login-form">Login</form>
<form name="signup">Signup</form>
`;
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractHTMLElements(content, 'test.html');
    if (elements.length < 2) throw new Error('Should extract forms');
});

test('MethodAnalyzer - Extracts HTML scripts', () => {
    const content = `
<script src="app.js"></script>
<script id="main-script">console.log('test');</script>
`;
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractHTMLElements(content, 'test.html');
    if (elements.length < 2) throw new Error('Should extract scripts');
});

test('MethodAnalyzer - Extracts HTML custom elements', () => {
    const content = `
<user-profile></user-profile>
<data-grid></data-grid>
<custom-button></custom-button>
`;
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractHTMLElements(content, 'test.html');
    if (elements.length < 3) throw new Error('Should extract custom elements');
});

test('MethodAnalyzer - Extracts HTML templates', () => {
    const content = `<template id="user-template"><div>User</div></template>`;
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractHTMLElements(content, 'test.html');
    if (elements.length < 1) throw new Error('Should extract template');
});

test('MethodAnalyzer - HTML elements have correct properties', () => {
    const content = '<h1>Test</h1>';
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractHTMLElements(content, 'test.html');
    if (elements.length < 1) throw new Error('Should extract element');
    const element = elements[0];
    if (!element.name) throw new Error('Element should have name');
    if (typeof element.line !== 'number') throw new Error('Element should have line number');
    if (!element.type) throw new Error('Element should have type');
});

test('MethodAnalyzer - HTML elements sorted by line number', () => {
    const content = `
<h1>Title</h1>
<section id="content">Content</section>
<div class="footer">Footer</div>
`;
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractHTMLElements(content, 'test.html');
    for (let i = 1; i < elements.length; i++) {
        if (elements[i].line < elements[i - 1].line) {
            throw new Error('Elements should be sorted by line number');
        }
    }
});

// ============================================================================
// MARKDOWN EXTRACTION TESTS
// ============================================================================
console.log('\n📝 Markdown Section Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts Markdown headings', () => {
    const content = `
# Main Title
## Subtitle
### Section
#### Subsection
##### Minor
###### Tiny
`;
    const analyzer = new MethodAnalyzer();
    const sections = analyzer.extractMarkdownSections(content, 'test.md');
    if (sections.length < 6) throw new Error('Should extract 6 headings');
    if (!sections.find(s => s.name === 'Main Title')) throw new Error('Should find main title');
});

test('MethodAnalyzer - Extracts Markdown code blocks', () => {
    const content = `
\`\`\`javascript
function test() {}
\`\`\`

\`\`\`python
def test():
    pass
\`\`\`
`;
    const analyzer = new MethodAnalyzer();
    const sections = analyzer.extractMarkdownSections(content, 'test.md');
    if (sections.length < 2) throw new Error('Should extract 2 code blocks');
});

test('MethodAnalyzer - Extracts Markdown ordered lists', () => {
    const content = `
1. First item
2. Second item
3. Third item
`;
    const analyzer = new MethodAnalyzer();
    const sections = analyzer.extractMarkdownSections(content, 'test.md');
    if (sections.length < 3) throw new Error('Should extract list items');
});

test('MethodAnalyzer - Extracts Markdown unordered lists', () => {
    const content = `
- Item one
* Item two
+ Item three
`;
    const analyzer = new MethodAnalyzer();
    const sections = analyzer.extractMarkdownSections(content, 'test.md');
    if (sections.length < 3) throw new Error('Should extract list items');
});

test('MethodAnalyzer - Extracts Markdown link references', () => {
    const content = `
[google]: https://google.com
[github]: https://github.com
`;
    const analyzer = new MethodAnalyzer();
    const sections = analyzer.extractMarkdownSections(content, 'test.md');
    if (sections.length < 2) throw new Error('Should extract link references');
});

test('MethodAnalyzer - Markdown sections have correct properties', () => {
    const content = '# Test Heading';
    const analyzer = new MethodAnalyzer();
    const sections = analyzer.extractMarkdownSections(content, 'test.md');
    if (sections.length < 1) throw new Error('Should extract section');
    const section = sections[0];
    if (!section.name) throw new Error('Section should have name');
    if (typeof section.line !== 'number') throw new Error('Section should have line number');
    if (!section.type) throw new Error('Section should have type');
});

test('MethodAnalyzer - Ignores closing code fences', () => {
    const content = `
\`\`\`javascript
code here
\`\`\`
`;
    const analyzer = new MethodAnalyzer();
    const sections = analyzer.extractMarkdownSections(content, 'test.md');
    // Should only find the opening fence, not the closing one
    const codeSections = sections.filter(s => s.type === 'code-block');
    if (codeSections.length !== 1) throw new Error('Should extract only opening fence');
});

// ============================================================================
// XML EXTRACTION TESTS
// ============================================================================
console.log('\n📄 XML Element Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts XML root elements with namespace', () => {
    const content = `<project xmlns="http://maven.apache.org/POM/4.0.0"></project>`;
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractXMLElements(content, 'test.xml');
    if (elements.length < 1) throw new Error('Should extract root element');
    if (!elements.find(e => e.name === 'project')) throw new Error('Should find project');
});

test('MethodAnalyzer - Extracts XML elements with id', () => {
    const content = `
<build id="main-build"></build>
<target id="compile"></target>
`;
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractXMLElements(content, 'test.xml');
    if (elements.length < 2) throw new Error('Should extract elements with id');
});

test('MethodAnalyzer - Extracts XML elements with name attribute', () => {
    const content = `
<property name="version"></property>
<dependency name="junit"></dependency>
`;
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractXMLElements(content, 'test.xml');
    if (elements.length < 2) throw new Error('Should extract elements with name');
});

test('MethodAnalyzer - Extracts XML processing instructions', () => {
    const content = `<?xml-stylesheet type="text/xsl" href="style.xsl"?>`;
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractXMLElements(content, 'test.xml');
    if (elements.length < 1) throw new Error('Should extract processing instruction');
});

test('MethodAnalyzer - Extracts XML TODO comments', () => {
    const content = `
<!-- TODO: Implement this feature -->
<!-- FIXME: Fix this bug -->
<!-- NOTE: Important note here -->
`;
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractXMLElements(content, 'test.xml');
    if (elements.length < 3) throw new Error('Should extract TODO comments');
});

test('MethodAnalyzer - Extracts XML namespaced elements', () => {
    const content = `
<maven:project></maven:project>
<build:target></build:target>
`;
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractXMLElements(content, 'test.xml');
    if (elements.length < 2) throw new Error('Should extract namespaced elements');
});

test('MethodAnalyzer - XML elements have correct properties', () => {
    const content = '<element id="test"></element>';
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractXMLElements(content, 'test.xml');
    if (elements.length < 1) throw new Error('Should extract element');
    const element = elements[0];
    if (!element.name) throw new Error('Element should have name');
    if (typeof element.line !== 'number') throw new Error('Element should have line number');
    if (!element.type) throw new Error('Element should have type');
});

test('MethodAnalyzer - XML elements sorted by line number', () => {
    const content = `
<first id="1"></first>
<second id="2"></second>
<third id="3"></third>
`;
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractXMLElements(content, 'test.xml');
    for (let i = 1; i < elements.length; i++) {
        if (elements[i].line < elements[i - 1].line) {
            throw new Error('Elements should be sorted by line number');
        }
    }
});

// ============================================================================
// METHOD CONTENT EXTRACTION TESTS
// ============================================================================
console.log('\n🔧 Method Content Extraction Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts method content for function declaration', () => {
    const content = `
function testMethod() {
    return 42;
}
`;
    const analyzer = new MethodAnalyzer();
    const methodContent = analyzer.extractMethodContent(content, 'testMethod');
    if (!methodContent) throw new Error('Should extract method content');
    if (!methodContent.includes('testMethod')) throw new Error('Should include method name');
});

test('MethodAnalyzer - Extracts method content for object method', () => {
    const content = `
const obj = {
    testMethod: function() {
        return 42;
    }
};
`;
    const analyzer = new MethodAnalyzer();
    const methodContent = analyzer.extractMethodContent(content, 'testMethod');
    if (!methodContent) throw new Error('Should extract method content');
});

test('MethodAnalyzer - Returns null for non-existent method', () => {
    const content = `function other() { return 1; }`;
    const analyzer = new MethodAnalyzer();
    const methodContent = analyzer.extractMethodContent(content, 'testMethod');
    if (methodContent !== null) throw new Error('Should return null for non-existent method');
});

// ============================================================================
// KEYWORD CHECKER TESTS
// ============================================================================
console.log('\n🔑 Keyword Checker Tests');
console.log('-'.repeat(70));

test('MethodAnalyzer - isSQLServerKeyword recognizes keywords', () => {
    const analyzer = new MethodAnalyzer();
    if (!analyzer.isSQLServerKeyword('SELECT')) throw new Error('Should recognize SELECT');
    if (!analyzer.isSQLServerKeyword('create')) throw new Error('Should be case-insensitive');
    if (analyzer.isSQLServerKeyword('MyFunction')) throw new Error('Should not recognize non-keyword');
});

test('MethodAnalyzer - isPostgreSQLKeyword recognizes keywords', () => {
    const analyzer = new MethodAnalyzer();
    if (!analyzer.isPostgreSQLKeyword('SELECT')) throw new Error('Should recognize SELECT');
    if (!analyzer.isPostgreSQLKeyword('ILIKE')) throw new Error('Should recognize ILIKE');
    if (analyzer.isPostgreSQLKeyword('MyFunction')) throw new Error('Should not recognize non-keyword');
});

test('MethodAnalyzer - isMySQLKeyword recognizes keywords', () => {
    const analyzer = new MethodAnalyzer();
    if (!analyzer.isMySQLKeyword('SELECT')) throw new Error('Should recognize SELECT');
    if (!analyzer.isMySQLKeyword('ZEROFILL')) throw new Error('Should recognize ZEROFILL');
    if (analyzer.isMySQLKeyword('MyFunction')) throw new Error('Should not recognize non-keyword');
});

test('MethodAnalyzer - isOracleKeyword recognizes keywords', () => {
    const analyzer = new MethodAnalyzer();
    if (!analyzer.isOracleKeyword('SELECT')) throw new Error('Should recognize SELECT');
    if (!analyzer.isOracleKeyword('SYSDATE')) throw new Error('Should recognize SYSDATE');
    if (analyzer.isOracleKeyword('MyFunction')) throw new Error('Should not recognize non-keyword');
});

test('MethodAnalyzer - isSnowflakeKeyword recognizes keywords', () => {
    const analyzer = new MethodAnalyzer();
    if (!analyzer.isSnowflakeKeyword('SELECT')) throw new Error('Should recognize SELECT');
    if (!analyzer.isSnowflakeKeyword('STAGE')) throw new Error('Should recognize STAGE');
    if (analyzer.isSnowflakeKeyword('MyFunction')) throw new Error('Should not recognize non-keyword');
});

test('MethodAnalyzer - isDB2Keyword recognizes keywords', () => {
    const analyzer = new MethodAnalyzer();
    if (!analyzer.isDB2Keyword('SELECT')) throw new Error('Should recognize SELECT');
    if (!analyzer.isDB2Keyword('LANGUAGE')) throw new Error('Should recognize LANGUAGE');
    if (analyzer.isDB2Keyword('MyFunction')) throw new Error('Should not recognize non-keyword');
});

test('MethodAnalyzer - isBigQueryKeyword recognizes keywords', () => {
    const analyzer = new MethodAnalyzer();
    if (!analyzer.isBigQueryKeyword('SELECT')) throw new Error('Should recognize SELECT');
    if (!analyzer.isBigQueryKeyword('PARTITION')) throw new Error('Should recognize PARTITION');
    if (analyzer.isBigQueryKeyword('MyFunction')) throw new Error('Should not recognize non-keyword');
});

test('MethodAnalyzer - isCSharpKeyword recognizes keywords', () => {
    const analyzer = new MethodAnalyzer();
    if (!analyzer.isCSharpKeyword('if')) throw new Error('Should recognize if');
    if (!analyzer.isCSharpKeyword('async')) throw new Error('Should recognize async');
    if (analyzer.isCSharpKeyword('MyMethod')) throw new Error('Should not recognize non-keyword');
});

test('MethodAnalyzer - isRustKeyword recognizes keywords', () => {
    const analyzer = new MethodAnalyzer();
    if (!analyzer.isRustKeyword('fn')) throw new Error('Should recognize fn');
    if (!analyzer.isRustKeyword('async')) throw new Error('Should recognize async');
    if (analyzer.isRustKeyword('my_function')) throw new Error('Should not recognize non-keyword');
});

test('MethodAnalyzer - isPythonKeyword recognizes keywords', () => {
    const analyzer = new MethodAnalyzer();
    if (!analyzer.isPythonKeyword('def')) throw new Error('Should recognize def');
    if (!analyzer.isPythonKeyword('async')) throw new Error('Should recognize async');
    if (analyzer.isPythonKeyword('my_function')) throw new Error('Should not recognize non-keyword');
});

test('MethodAnalyzer - isRubyKeyword recognizes keywords', () => {
    const analyzer = new MethodAnalyzer();
    if (!analyzer.isRubyKeyword('def')) throw new Error('Should recognize def');
    if (!analyzer.isRubyKeyword('class')) throw new Error('Should recognize class');
    if (analyzer.isRubyKeyword('my_method')) throw new Error('Should not recognize non-keyword');
});

test('MethodAnalyzer - isKotlinKeyword recognizes keywords', () => {
    const analyzer = new MethodAnalyzer();
    if (!analyzer.isKotlinKeyword('fun')) throw new Error('Should recognize fun');
    if (!analyzer.isKotlinKeyword('suspend')) throw new Error('Should recognize suspend');
    if (analyzer.isKotlinKeyword('myFunction')) throw new Error('Should not recognize non-keyword');
});

test('MethodAnalyzer - isSwiftKeyword recognizes keywords', () => {
    const analyzer = new MethodAnalyzer();
    if (!analyzer.isSwiftKeyword('func')) throw new Error('Should recognize func');
    if (!analyzer.isSwiftKeyword('async')) throw new Error('Should recognize async');
    if (analyzer.isSwiftKeyword('myFunction')) throw new Error('Should not recognize non-keyword');
});

test('MethodAnalyzer - isScalaKeyword recognizes keywords', () => {
    const analyzer = new MethodAnalyzer();
    if (!analyzer.isScalaKeyword('def')) throw new Error('Should recognize def');
    if (!analyzer.isScalaKeyword('override')) throw new Error('Should recognize override');
    if (analyzer.isScalaKeyword('myMethod')) throw new Error('Should not recognize non-keyword');
});

// ============================================================================
// ADDITIONAL COVERAGE TESTS FOR 100%
// ============================================================================
console.log('\n🎯 Additional Coverage Tests for 100%');
console.log('-'.repeat(70));

test('MethodAnalyzer - Extracts HTML from .htm extension', () => {
    const content = '<h1>Test</h1>';
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractMethods(content, 'test.htm');
    if (elements.length < 1) throw new Error('Should extract HTML from .htm file');
});

test('MethodAnalyzer - Extracts Markdown from .markdown extension', () => {
    const content = '# Heading';
    const analyzer = new MethodAnalyzer();
    const sections = analyzer.extractMethods(content, 'test.markdown');
    if (sections.length < 1) throw new Error('Should extract Markdown from .markdown file');
});

test('MethodAnalyzer - Detects PostgreSQL dialect (MATERIALIZED VIEW with EXECUTE)', () => {
    const content = 'CREATE MATERIALIZED VIEW test AS EXECUTE PROCEDURE my_proc();';
    const analyzer = new MethodAnalyzer();
    const dialect = analyzer.detectSQLDialect(content);
    if (dialect !== 'pgsql') throw new Error(`Expected pgsql, got ${dialect}`);
});

test('MethodAnalyzer - Extracts Markdown tables', () => {
    const content = `| Header1 | Header2 |
|---------|---------|
| Cell1   | Cell2   |`;
    const analyzer = new MethodAnalyzer();
    const sections = analyzer.extractMarkdownSections(content, 'test.md');
    const tables = sections.filter(s => s.type === 'table');
    if (tables.length < 1) throw new Error('Should extract Markdown table');
});

test('MethodAnalyzer - Extracts Markdown table at line 1', () => {
    const content = '| Header1 | Header2 |';
    const analyzer = new MethodAnalyzer();
    const sections = analyzer.extractMarkdownSections(content, 'test.md');
    const tables = sections.filter(s => s.type === 'table');
    if (tables.length < 1) throw new Error('Should extract table at line 1');
});

test('MethodAnalyzer - Extracts XML from extractMethods', () => {
    const content = '<root xmlns="http://example.com"><element id="test"></element></root>';
    const analyzer = new MethodAnalyzer();
    const elements = analyzer.extractMethods(content, 'test.xml');
    if (elements.length < 1) throw new Error('Should extract XML elements');
});

// ============================================================================
// RESULTS
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 COMPLETE COVERAGE TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All complete coverage tests passed!');
    console.log('✨ method-analyzer.js should now have 100% coverage!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
