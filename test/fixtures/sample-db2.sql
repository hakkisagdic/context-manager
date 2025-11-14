-- ============================================================================
-- IBM DB2 (SQL PL) Sample File for Testing
-- Tests: Procedures, Functions, Triggers, Views, Types
-- ============================================================================

-- Simple Procedure
CREATE OR REPLACE PROCEDURE get_user_count(OUT user_count INTEGER)
LANGUAGE SQL
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
END;

-- Procedure with SQL PL
CREATE OR REPLACE PROCEDURE insert_employee(
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(100),
    IN p_dept_id INTEGER
)
LANGUAGE SQL
BEGIN
    INSERT INTO employees (name, email, department_id)
    VALUES (p_name, p_email, p_dept_id);
    COMMIT;
END;

-- Schema-qualified Procedure
CREATE OR REPLACE PROCEDURE HR.calculate_bonus(
    IN emp_id INTEGER,
    OUT bonus_amount DECIMAL(10,2)
)
LANGUAGE SQL
BEGIN
    DECLARE salary DECIMAL(10,2);
    SELECT salary INTO salary FROM employees WHERE id = emp_id;
    SET bonus_amount = salary * 0.10;
END;

-- Procedure with DYNAMIC RESULT SETS
CREATE OR REPLACE PROCEDURE get_employees_by_dept(IN dept_id INTEGER)
DYNAMIC RESULT SETS 1
LANGUAGE SQL
BEGIN
    DECLARE cur1 CURSOR WITH RETURN FOR
        SELECT employee_id, name, salary
        FROM employees
        WHERE department_id = dept_id;
    OPEN cur1;
END;

-- Simple Function
CREATE OR REPLACE FUNCTION calculate_tax(salary DECIMAL(10,2))
RETURNS DECIMAL(10,2)
LANGUAGE SQL
BEGIN
    RETURN salary * 0.25;
END;

-- Table Function
CREATE OR REPLACE FUNCTION get_dept_employees(dept_id INTEGER)
RETURNS TABLE (
    emp_id INTEGER,
    emp_name VARCHAR(100),
    emp_salary DECIMAL(10,2)
)
LANGUAGE SQL
BEGIN
    RETURN SELECT employee_id, name, salary
           FROM employees
           WHERE department_id = dept_id;
END;

-- Scalar Function with Schema
CREATE OR REPLACE FUNCTION FINANCE.get_annual_salary(emp_id INTEGER)
RETURNS DECIMAL(12,2)
LANGUAGE SQL
BEGIN
    DECLARE monthly_salary DECIMAL(10,2);
    SELECT salary INTO monthly_salary FROM employees WHERE id = emp_id;
    RETURN monthly_salary * 12;
END;

-- DETERMINISTIC Function
CREATE OR REPLACE FUNCTION format_currency(amount DECIMAL(10,2))
RETURNS VARCHAR(20)
DETERMINISTIC
LANGUAGE SQL
BEGIN
    RETURN '$' || CHAR(amount);
END;

-- Simple Trigger
CREATE OR REPLACE TRIGGER trg_audit_users
AFTER INSERT ON users
REFERENCING NEW AS n
FOR EACH ROW
MODE DB2SQL
BEGIN ATOMIC
    INSERT INTO audit_log (user_id, action, timestamp)
    VALUES (n.id, 'INSERT', CURRENT_TIMESTAMP);
END;

-- Update Trigger
CREATE OR REPLACE TRIGGER trg_update_timestamp
BEFORE UPDATE ON employees
REFERENCING NEW AS n OLD AS o
FOR EACH ROW
MODE DB2SQL
BEGIN ATOMIC
    SET n.updated_at = CURRENT_TIMESTAMP;
END;

-- Schema-qualified Trigger
CREATE OR REPLACE TRIGGER HR.trg_salary_audit
AFTER UPDATE OF salary ON employees
REFERENCING NEW AS n OLD AS o
FOR EACH ROW
MODE DB2SQL
WHEN (n.salary <> o.salary)
BEGIN ATOMIC
    INSERT INTO salary_history (emp_id, old_salary, new_salary, changed_at)
    VALUES (n.employee_id, o.salary, n.salary, CURRENT_TIMESTAMP);
END;

-- Simple View
CREATE OR REPLACE VIEW v_active_employees AS
SELECT employee_id, name, email, department_id
FROM employees
WHERE status = 'ACTIVE';

-- View with Check Option
CREATE OR REPLACE VIEW v_high_salary_employees AS
SELECT employee_id, name, salary, department_id
FROM employees
WHERE salary > 75000
WITH CHECK OPTION;

-- Schema-qualified View
CREATE OR REPLACE VIEW ANALYTICS.v_department_summary AS
SELECT
    d.department_id,
    d.name as dept_name,
    COUNT(e.employee_id) as emp_count,
    AVG(e.salary) as avg_salary
FROM departments d
LEFT JOIN employees e ON d.department_id = e.department_id
GROUP BY d.department_id, d.name;

-- Structured Type (Object Type)
CREATE OR REPLACE TYPE address_type AS (
    street VARCHAR(100),
    city VARCHAR(50),
    state VARCHAR(2),
    zip_code VARCHAR(10)
) MODE DB2SQL;

-- Distinct Type
CREATE OR REPLACE TYPE email_type AS VARCHAR(255) WITH COMPARISONS;

-- Typed Table
CREATE OR REPLACE TYPE employee_type AS (
    emp_id INTEGER,
    emp_name VARCHAR(100),
    emp_email VARCHAR(100),
    emp_salary DECIMAL(10,2)
) MODE DB2SQL;
