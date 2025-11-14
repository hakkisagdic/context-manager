-- ============================================================================
-- SQL Server (T-SQL) Sample File for Testing
-- Tests: Stored Procedures, Functions, Triggers, Views
-- ============================================================================

-- Simple Stored Procedure
CREATE PROCEDURE GetUserById
    @UserId INT
AS
BEGIN
    SELECT * FROM Users WHERE Id = @UserId;
END;
GO

-- Stored Procedure with Schema
CREATE PROCEDURE dbo.InsertUser
    @Username NVARCHAR(50),
    @Email NVARCHAR(100)
AS
BEGIN
    INSERT INTO Users (Username, Email)
    VALUES (@Username, @Email);
END;
GO

-- ALTER PROCEDURE
ALTER PROCEDURE GetUserById
    @UserId INT,
    @IncludeDeleted BIT = 0
AS
BEGIN
    SELECT * FROM Users
    WHERE Id = @UserId
    AND (@IncludeDeleted = 1 OR IsDeleted = 0);
END;
GO

-- Scalar Function
CREATE FUNCTION CalculateTotal
(
    @Quantity INT,
    @Price DECIMAL(10, 2)
)
RETURNS DECIMAL(10, 2)
AS
BEGIN
    DECLARE @Total DECIMAL(10, 2);
    SET @Total = @Quantity * @Price;
    RETURN @Total;
END;
GO

-- Table-Valued Function
CREATE FUNCTION GetActiveUsers()
RETURNS TABLE
AS
RETURN (
    SELECT Id, Username, Email
    FROM Users
    WHERE IsActive = 1
);
GO

-- Function with Schema
CREATE FUNCTION dbo.GetUsersByRole
(
    @RoleId INT
)
RETURNS TABLE
AS
RETURN (
    SELECT u.*
    FROM Users u
    INNER JOIN UserRoles ur ON u.Id = ur.UserId
    WHERE ur.RoleId = @RoleId
);
GO

-- ALTER FUNCTION
ALTER FUNCTION CalculateTotal
(
    @Quantity INT,
    @Price DECIMAL(10, 2),
    @Discount DECIMAL(5, 2) = 0
)
RETURNS DECIMAL(10, 2)
AS
BEGIN
    DECLARE @Total DECIMAL(10, 2);
    SET @Total = (@Quantity * @Price) * (1 - @Discount / 100);
    RETURN @Total;
END;
GO

-- Inline Table-Valued Function
CREATE FUNCTION GetOrdersByCustomer(@CustomerId INT)
RETURNS TABLE
AS
RETURN
(
    SELECT * FROM Orders WHERE CustomerId = @CustomerId
);
GO

-- TRIGGER on INSERT
CREATE TRIGGER trg_Users_AfterInsert
ON Users
AFTER INSERT
AS
BEGIN
    INSERT INTO AuditLog (TableName, Action, RecordId, Timestamp)
    SELECT 'Users', 'INSERT', Id, GETDATE()
    FROM inserted;
END;
GO

-- TRIGGER on UPDATE
CREATE TRIGGER trg_Users_AfterUpdate
ON Users
AFTER UPDATE
AS
BEGIN
    INSERT INTO AuditLog (TableName, Action, RecordId, Timestamp)
    SELECT 'Users', 'UPDATE', Id, GETDATE()
    FROM inserted;
END;
GO

-- TRIGGER with Schema
CREATE TRIGGER dbo.trg_Orders_BeforeDelete
ON dbo.Orders
INSTEAD OF DELETE
AS
BEGIN
    UPDATE Orders
    SET IsDeleted = 1, DeletedAt = GETDATE()
    WHERE Id IN (SELECT Id FROM deleted);
END;
GO

-- ALTER TRIGGER
ALTER TRIGGER trg_Users_AfterInsert
ON Users
AFTER INSERT
AS
BEGIN
    INSERT INTO AuditLog (TableName, Action, RecordId, Timestamp, CreatedBy)
    SELECT 'Users', 'INSERT', Id, GETDATE(), SYSTEM_USER
    FROM inserted;
END;
GO

-- Simple VIEW
CREATE VIEW vw_ActiveUsers
AS
    SELECT Id, Username, Email, CreatedAt
    FROM Users
    WHERE IsActive = 1;
GO

-- VIEW with Schema
CREATE VIEW dbo.vw_UserOrderSummary
AS
    SELECT
        u.Id AS UserId,
        u.Username,
        COUNT(o.Id) AS TotalOrders,
        SUM(o.Total) AS TotalSpent
    FROM Users u
    LEFT JOIN Orders o ON u.Id = o.CustomerId
    GROUP BY u.Id, u.Username;
GO

-- ALTER VIEW
ALTER VIEW vw_ActiveUsers
AS
    SELECT Id, Username, Email, CreatedAt, LastLoginAt
    FROM Users
    WHERE IsActive = 1 AND IsDeleted = 0;
GO

-- Complex VIEW with JOIN
CREATE VIEW vw_OrderDetails
AS
    SELECT
        o.Id AS OrderId,
        o.OrderNumber,
        u.Username AS CustomerName,
        o.Total,
        o.OrderDate,
        os.StatusName
    FROM Orders o
    INNER JOIN Users u ON o.CustomerId = u.Id
    INNER JOIN OrderStatus os ON o.StatusId = os.Id;
GO

-- Stored Procedure with Complex Logic
CREATE PROCEDURE ProcessOrder
    @OrderId INT,
    @ProcessedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Update order status
        UPDATE Orders
        SET StatusId = 2, ProcessedAt = GETDATE(), ProcessedBy = @ProcessedBy
        WHERE Id = @OrderId;

        -- Log the action
        INSERT INTO OrderLog (OrderId, Action, UserId, Timestamp)
        VALUES (@OrderId, 'PROCESSED', @ProcessedBy, GETDATE());

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- CREATE OR ALTER Syntax (SQL Server 2016+)
CREATE OR ALTER PROCEDURE UpdateUserEmail
    @UserId INT,
    @NewEmail NVARCHAR(100)
AS
BEGIN
    UPDATE Users
    SET Email = @NewEmail, UpdatedAt = GETDATE()
    WHERE Id = @UserId;
END;
GO

CREATE OR ALTER FUNCTION IsValidEmail
(
    @Email NVARCHAR(100)
)
RETURNS BIT
AS
BEGIN
    IF @Email LIKE '%_@__%.__%'
        RETURN 1;
    RETURN 0;
END;
GO

CREATE OR ALTER VIEW vw_RecentOrders
AS
    SELECT * FROM Orders
    WHERE OrderDate >= DATEADD(DAY, -30, GETDATE());
GO

CREATE OR ALTER TRIGGER trg_Products_AfterUpdate
ON Products
AFTER UPDATE
AS
BEGIN
    IF UPDATE(Price)
    BEGIN
        INSERT INTO PriceHistory (ProductId, OldPrice, NewPrice, ChangedAt)
        SELECT i.Id, d.Price, i.Price, GETDATE()
        FROM inserted i
        INNER JOIN deleted d ON i.Id = d.Id;
    END
END;
GO

-- Multi-line Stored Procedure with Comments
CREATE PROCEDURE GetUserReport
    @StartDate DATE = NULL,
    @EndDate DATE = NULL,
    @RoleId INT = NULL
AS
BEGIN
    /*
        This procedure generates a comprehensive user report
        with optional filters for date range and role
    */

    SET NOCOUNT ON;

    -- Set default dates if not provided
    IF @StartDate IS NULL
        SET @StartDate = DATEADD(YEAR, -1, GETDATE());

    IF @EndDate IS NULL
        SET @EndDate = GETDATE();

    -- Main query
    SELECT
        u.Id,
        u.Username,
        u.Email,
        r.RoleName,
        COUNT(o.Id) AS OrderCount,
        SUM(o.Total) AS TotalSpent
    FROM Users u
    LEFT JOIN UserRoles ur ON u.Id = ur.UserId
    LEFT JOIN Roles r ON ur.RoleId = r.Id
    LEFT JOIN Orders o ON u.Id = o.CustomerId
        AND o.OrderDate BETWEEN @StartDate AND @EndDate
    WHERE (@RoleId IS NULL OR ur.RoleId = @RoleId)
    GROUP BY u.Id, u.Username, u.Email, r.RoleName
    ORDER BY TotalSpent DESC;
END;
GO

-- Edge case: PROC shorthand
CREATE PROC ShorthandProc
AS
BEGIN
    SELECT 'This uses PROC instead of PROCEDURE';
END;
GO

ALTER PROC ShorthandProc
AS
BEGIN
    SELECT 'This uses PROC instead of PROCEDURE - altered';
END;
GO
