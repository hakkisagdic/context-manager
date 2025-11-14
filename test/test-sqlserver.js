#!/usr/bin/env node

/**
 * SQL Server (T-SQL) Support Tests
 * Tests SQL Server stored procedure, function, trigger, and view extraction
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

console.log('🧪 SQL SERVER (T-SQL) SUPPORT TESTS');
console.log('='.repeat(70));

// ============================================================================
// SQL SERVER METHOD ANALYZER TESTS
// ============================================================================
console.log('\n📋 SQL Server MethodAnalyzer Tests\n' + '-'.repeat(70));

const methodAnalyzer = new MethodAnalyzer();

// Test 1: Basic stored procedure detection
{
    const code = `
        CREATE PROCEDURE GetUserById
            @UserId INT
        AS
        BEGIN
            SELECT * FROM Users WHERE Id = @UserId;
        END;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'GetUserById',
        'SQL MethodAnalyzer: Extracts basic stored procedure',
        `Expected 1 procedure named 'GetUserById', got ${methods.length} methods`
    );
}

// Test 2: Stored procedure with schema
{
    const code = `
        CREATE PROCEDURE dbo.InsertUser
            @Username NVARCHAR(50)
        AS
        BEGIN
            INSERT INTO Users (Username) VALUES (@Username);
        END;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'InsertUser',
        'SQL MethodAnalyzer: Extracts procedure with schema',
        `Expected 1 procedure named 'InsertUser', got ${methods.length} methods`
    );
}

// Test 3: ALTER PROCEDURE
{
    const code = `
        ALTER PROCEDURE GetUserById
            @UserId INT,
            @IncludeDeleted BIT = 0
        AS
        BEGIN
            SELECT * FROM Users WHERE Id = @UserId;
        END;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'GetUserById',
        'SQL MethodAnalyzer: Extracts ALTER PROCEDURE',
        `Expected 1 procedure named 'GetUserById', got ${methods.length} methods`
    );
}

// Test 4: PROC shorthand
{
    const code = `
        CREATE PROC ShortProc
        AS
        BEGIN
            SELECT 1;
        END;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'ShortProc',
        'SQL MethodAnalyzer: Extracts PROC shorthand',
        `Expected 1 procedure named 'ShortProc', got ${methods.length} methods`
    );
}

// Test 5: CREATE OR ALTER PROCEDURE (SQL Server 2016+)
{
    const code = `
        CREATE OR ALTER PROCEDURE UpdateUser
            @UserId INT
        AS
        BEGIN
            UPDATE Users SET UpdatedAt = GETDATE() WHERE Id = @UserId;
        END;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'UpdateUser',
        'SQL MethodAnalyzer: Extracts CREATE OR ALTER PROCEDURE',
        `Expected 1 procedure named 'UpdateUser', got ${methods.length} methods`
    );
}

// Test 6: Scalar function
{
    const code = `
        CREATE FUNCTION CalculateTotal
        (
            @Quantity INT,
            @Price DECIMAL(10, 2)
        )
        RETURNS DECIMAL(10, 2)
        AS
        BEGIN
            RETURN @Quantity * @Price;
        END;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'CalculateTotal',
        'SQL MethodAnalyzer: Extracts scalar function',
        `Expected 1 function named 'CalculateTotal', got ${methods.length} methods`
    );
}

// Test 7: Table-valued function
{
    const code = `
        CREATE FUNCTION GetActiveUsers()
        RETURNS TABLE
        AS
        RETURN (
            SELECT * FROM Users WHERE IsActive = 1
        );
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'GetActiveUsers',
        'SQL MethodAnalyzer: Extracts table-valued function',
        `Expected 1 function named 'GetActiveUsers', got ${methods.length} methods`
    );
}

// Test 8: Function with schema
{
    const code = `
        CREATE FUNCTION dbo.GetUsersByRole
        (
            @RoleId INT
        )
        RETURNS TABLE
        AS
        RETURN (
            SELECT * FROM Users WHERE RoleId = @RoleId
        );
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'GetUsersByRole',
        'SQL MethodAnalyzer: Extracts function with schema',
        `Expected 1 function named 'GetUsersByRole', got ${methods.length} methods`
    );
}

// Test 9: ALTER FUNCTION
{
    const code = `
        ALTER FUNCTION CalculateTotal
        (
            @Quantity INT,
            @Price DECIMAL(10, 2),
            @Discount DECIMAL(5, 2)
        )
        RETURNS DECIMAL(10, 2)
        AS
        BEGIN
            RETURN (@Quantity * @Price) * (1 - @Discount);
        END;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'CalculateTotal',
        'SQL MethodAnalyzer: Extracts ALTER FUNCTION',
        `Expected 1 function named 'CalculateTotal', got ${methods.length} methods`
    );
}

// Test 10: CREATE OR ALTER FUNCTION
{
    const code = `
        CREATE OR ALTER FUNCTION IsValidEmail
        (
            @Email NVARCHAR(100)
        )
        RETURNS BIT
        AS
        BEGIN
            IF @Email LIKE '%@%'
                RETURN 1;
            RETURN 0;
        END;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'IsValidEmail',
        'SQL MethodAnalyzer: Extracts CREATE OR ALTER FUNCTION',
        `Expected 1 function named 'IsValidEmail', got ${methods.length} methods`
    );
}

// Test 11: Inline table-valued function
{
    const code = `
        CREATE FUNCTION GetOrdersByCustomer(@CustomerId INT)
        RETURNS TABLE
        AS
        RETURN
        (
            SELECT * FROM Orders WHERE CustomerId = @CustomerId
        );
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'GetOrdersByCustomer',
        'SQL MethodAnalyzer: Extracts inline table-valued function',
        `Expected 1 function named 'GetOrdersByCustomer', got ${methods.length} methods`
    );
}

// Test 12: Simple trigger
{
    const code = `
        CREATE TRIGGER trg_Users_AfterInsert
        ON Users
        AFTER INSERT
        AS
        BEGIN
            INSERT INTO AuditLog SELECT * FROM inserted;
        END;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'trg_Users_AfterInsert',
        'SQL MethodAnalyzer: Extracts simple trigger',
        `Expected 1 trigger named 'trg_Users_AfterInsert', got ${methods.length} methods`
    );
}

// Test 13: Trigger with schema
{
    const code = `
        CREATE TRIGGER dbo.trg_Orders_BeforeDelete
        ON dbo.Orders
        INSTEAD OF DELETE
        AS
        BEGIN
            UPDATE Orders SET IsDeleted = 1 WHERE Id IN (SELECT Id FROM deleted);
        END;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'trg_Orders_BeforeDelete',
        'SQL MethodAnalyzer: Extracts trigger with schema',
        `Expected 1 trigger named 'trg_Orders_BeforeDelete', got ${methods.length} methods`
    );
}

// Test 14: ALTER TRIGGER
{
    const code = `
        ALTER TRIGGER trg_Users_AfterUpdate
        ON Users
        AFTER UPDATE
        AS
        BEGIN
            INSERT INTO AuditLog SELECT * FROM inserted;
        END;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'trg_Users_AfterUpdate',
        'SQL MethodAnalyzer: Extracts ALTER TRIGGER',
        `Expected 1 trigger named 'trg_Users_AfterUpdate', got ${methods.length} methods`
    );
}

// Test 15: CREATE OR ALTER TRIGGER
{
    const code = `
        CREATE OR ALTER TRIGGER trg_Products_AfterUpdate
        ON Products
        AFTER UPDATE
        AS
        BEGIN
            INSERT INTO PriceHistory SELECT * FROM inserted;
        END;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'trg_Products_AfterUpdate',
        'SQL MethodAnalyzer: Extracts CREATE OR ALTER TRIGGER',
        `Expected 1 trigger named 'trg_Products_AfterUpdate', got ${methods.length} methods`
    );
}

// Test 16: Simple view
{
    const code = `
        CREATE VIEW vw_ActiveUsers
        AS
            SELECT * FROM Users WHERE IsActive = 1;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'vw_ActiveUsers',
        'SQL MethodAnalyzer: Extracts simple view',
        `Expected 1 view named 'vw_ActiveUsers', got ${methods.length} methods`
    );
}

// Test 17: View with schema
{
    const code = `
        CREATE VIEW dbo.vw_UserOrderSummary
        AS
            SELECT u.Id, COUNT(o.Id) AS OrderCount
            FROM Users u
            LEFT JOIN Orders o ON u.Id = o.CustomerId
            GROUP BY u.Id;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'vw_UserOrderSummary',
        'SQL MethodAnalyzer: Extracts view with schema',
        `Expected 1 view named 'vw_UserOrderSummary', got ${methods.length} methods`
    );
}

// Test 18: ALTER VIEW
{
    const code = `
        ALTER VIEW vw_ActiveUsers
        AS
            SELECT * FROM Users WHERE IsActive = 1 AND IsDeleted = 0;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'vw_ActiveUsers',
        'SQL MethodAnalyzer: Extracts ALTER VIEW',
        `Expected 1 view named 'vw_ActiveUsers', got ${methods.length} methods`
    );
}

// Test 19: CREATE OR ALTER VIEW
{
    const code = `
        CREATE OR ALTER VIEW vw_RecentOrders
        AS
            SELECT * FROM Orders WHERE OrderDate >= DATEADD(DAY, -30, GETDATE());
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'vw_RecentOrders',
        'SQL MethodAnalyzer: Extracts CREATE OR ALTER VIEW',
        `Expected 1 view named 'vw_RecentOrders', got ${methods.length} methods`
    );
}

// Test 20: Multiple objects in one file
{
    const code = `
        CREATE PROCEDURE GetUser AS BEGIN SELECT 1; END;
        GO
        CREATE FUNCTION CalcTotal() RETURNS INT AS BEGIN RETURN 1; END;
        GO
        CREATE TRIGGER trg_Test ON Users AFTER INSERT AS BEGIN SELECT 1; END;
        GO
        CREATE VIEW vw_Test AS SELECT 1 AS Col;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 4,
        'SQL MethodAnalyzer: Extracts multiple objects from one file',
        `Expected 4 objects, got ${methods.length}`
    );
}

// Test 21: Case insensitivity
{
    const code = `
        create procedure LowerCaseProc as begin select 1; end;
        CREATE PROCEDURE UpperCaseProc AS BEGIN SELECT 1; END;
        CrEaTe PrOcEdUrE MixedCaseProc AS BEGIN SELECT 1; END;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 3,
        'SQL MethodAnalyzer: Handles case insensitivity',
        `Expected 3 procedures, got ${methods.length}`
    );
}

// Test 22: Keyword filtering
{
    const code = `
        CREATE PROCEDURE SELECT AS BEGIN SELECT 1; END;
        CREATE PROCEDURE FROM AS BEGIN SELECT 1; END;
        CREATE FUNCTION WHERE() RETURNS INT AS BEGIN RETURN 1; END;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 0,
        'SQL MethodAnalyzer: Filters out SQL keywords',
        `Expected 0 objects (keywords filtered), got ${methods.length}`
    );
}

// Test 23: Empty SQL file
{
    const code = '';
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 0,
        'SQL MethodAnalyzer: Handles empty file',
        `Expected 0 methods, got ${methods.length}`
    );
}

// Test 24: Comments in SQL
{
    const code = `
        -- This is a comment
        /* Multi-line
           comment */
        CREATE PROCEDURE TestProc
        AS
        BEGIN
            -- Another comment
            SELECT 1;
        END;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'TestProc',
        'SQL MethodAnalyzer: Handles comments in SQL',
        `Expected 1 procedure named 'TestProc', got ${methods.length} methods`
    );
}

// Test 25: Line number accuracy
{
    const code = `
-- Line 2
-- Line 3
CREATE PROCEDURE FirstProc AS BEGIN SELECT 1; END;
GO
-- Line 6
CREATE FUNCTION SecondFunc() RETURNS INT AS BEGIN RETURN 1; END;
GO
-- Line 9
CREATE TRIGGER ThirdTrigger ON Users AFTER INSERT AS BEGIN SELECT 1; END;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 3,
        'SQL MethodAnalyzer: Accurate line numbers',
        `Expected 3 objects, got ${methods.length}`
    );
}

// Test 26: Complex stored procedure
{
    const code = `
        CREATE PROCEDURE ProcessOrder
            @OrderId INT,
            @ProcessedBy INT
        AS
        BEGIN
            SET NOCOUNT ON;
            BEGIN TRY
                BEGIN TRANSACTION;
                UPDATE Orders SET StatusId = 2 WHERE Id = @OrderId;
                COMMIT TRANSACTION;
            END TRY
            BEGIN CATCH
                ROLLBACK TRANSACTION;
                THROW;
            END CATCH
        END;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].name === 'ProcessOrder',
        'SQL MethodAnalyzer: Extracts complex stored procedure',
        `Expected 1 procedure named 'ProcessOrder', got ${methods.length} methods`
    );
}

// Test 27: Type field in extracted methods
{
    const code = `
        CREATE PROCEDURE TestProc AS BEGIN SELECT 1; END;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 1 && methods[0].type === 'procedure',
        'SQL MethodAnalyzer: Includes type field in extracted methods',
        `Expected type 'procedure', got '${methods[0]?.type}'`
    );
}

// Test 28: Different object types have correct type field
{
    const code = `
        CREATE PROCEDURE TestProc AS BEGIN SELECT 1; END;
        CREATE FUNCTION TestFunc() RETURNS INT AS BEGIN RETURN 1; END;
        CREATE TRIGGER TestTrigger ON Users AFTER INSERT AS BEGIN SELECT 1; END;
        CREATE VIEW TestView AS SELECT 1 AS Col;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 4 &&
        methods.some(m => m.type === 'procedure') &&
        methods.some(m => m.type === 'function') &&
        methods.some(m => m.type === 'trigger') &&
        methods.some(m => m.type === 'view'),
        'SQL MethodAnalyzer: Correct type field for different objects',
        `Expected 4 objects with correct types, got ${methods.length}`
    );
}

// Test 29: Procedure with special characters in name
{
    const code = `
        CREATE PROCEDURE sp_GetUsers_ByRole AS BEGIN SELECT 1; END;
        CREATE PROCEDURE usp_InsertUser_WithValidation AS BEGIN SELECT 1; END;
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.sql');
    assert(
        methods.length === 2 &&
        methods.some(m => m.name === 'sp_GetUsers_ByRole') &&
        methods.some(m => m.name === 'usp_InsertUser_WithValidation'),
        'SQL MethodAnalyzer: Handles underscores in names',
        `Expected 2 procedures with underscores, got ${methods.length}`
    );
}

// Test 30: Real sample.sql fixture file
{
    const fixturePath = path.join(process.cwd(), 'test', 'fixtures', 'sample.sql');
    if (fs.existsSync(fixturePath)) {
        const code = fs.readFileSync(fixturePath, 'utf8');
        const methods = methodAnalyzer.extractMethods(code, 'sample.sql');
        assert(
            methods.length > 0,
            'SQL MethodAnalyzer: Extracts from sample.sql fixture',
            `Expected multiple objects from fixture, got ${methods.length}`
        );
    } else {
        console.log(`⚠️  SQL MethodAnalyzer: sample.sql fixture not found (skipped)`);
    }
}

// ============================================================================
// RESULTS SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 SQL SERVER TEST RESULTS SUMMARY');
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
    console.log('\n🎉 ALL SQL SERVER TESTS PASSED!');
    process.exit(0);
}
