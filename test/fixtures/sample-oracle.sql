-- ============================================================================
-- Oracle (PL/SQL) Sample File for Testing
-- Tests: Procedures, Functions, Triggers, Views, Packages, Types
-- ============================================================================

-- Simple Procedure
CREATE OR REPLACE PROCEDURE get_user_count(p_count OUT NUMBER)
IS
BEGIN
    SELECT COUNT(*) INTO p_count FROM users;
END;
/

-- Function
CREATE OR REPLACE FUNCTION calculate_bonus(p_salary NUMBER, p_rate NUMBER)
RETURN NUMBER
IS
    v_bonus NUMBER;
BEGIN
    v_bonus := p_salary * p_rate / 100;
    RETURN v_bonus;
END;
/

-- Procedure with schema
CREATE OR REPLACE PROCEDURE HR.insert_employee(
    p_name VARCHAR2,
    p_email VARCHAR2,
    p_department_id NUMBER
)
IS
BEGIN
    INSERT INTO employees (name, email, department_id)
    VALUES (p_name, p_email, p_department_id);
    COMMIT;
END;
/

-- Function with schema
CREATE OR REPLACE FUNCTION SALES.get_commission(p_sales_amount NUMBER)
RETURN NUMBER
IS
BEGIN
    IF p_sales_amount > 10000 THEN
        RETURN p_sales_amount * 0.10;
    ELSE
        RETURN p_sales_amount * 0.05;
    END IF;
END;
/

-- Trigger
CREATE OR REPLACE TRIGGER trg_audit_users
AFTER INSERT OR UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action, timestamp)
    VALUES (:NEW.id, 'MODIFIED', SYSDATE);
END;
/

-- View
CREATE OR REPLACE VIEW v_active_employees AS
SELECT employee_id, name, email, department_id
FROM employees
WHERE status = 'ACTIVE';
/

-- FORCE View
CREATE OR REPLACE FORCE VIEW v_department_summary AS
SELECT d.department_id, d.name, COUNT(e.employee_id) as emp_count
FROM departments d
LEFT JOIN employees e ON d.department_id = e.department_id
GROUP BY d.department_id, d.name;
/

-- Package Specification
CREATE OR REPLACE PACKAGE pkg_employee_mgmt
IS
    PROCEDURE hire_employee(p_name VARCHAR2, p_email VARCHAR2);
    FUNCTION get_employee_count RETURN NUMBER;
    PROCEDURE terminate_employee(p_emp_id NUMBER);
END pkg_employee_mgmt;
/

-- Package Body
CREATE OR REPLACE PACKAGE BODY pkg_employee_mgmt
IS
    PROCEDURE hire_employee(p_name VARCHAR2, p_email VARCHAR2)
    IS
    BEGIN
        INSERT INTO employees (name, email, hire_date)
        VALUES (p_name, p_email, SYSDATE);
    END;

    FUNCTION get_employee_count RETURN NUMBER
    IS
        v_count NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_count FROM employees;
        RETURN v_count;
    END;

    PROCEDURE terminate_employee(p_emp_id NUMBER)
    IS
    BEGIN
        UPDATE employees SET status = 'TERMINATED' WHERE employee_id = p_emp_id;
    END;
END pkg_employee_mgmt;
/

-- Object Type
CREATE OR REPLACE TYPE address_type AS OBJECT (
    street VARCHAR2(100),
    city VARCHAR2(50),
    state VARCHAR2(2),
    zipcode VARCHAR2(10)
);
/

-- Type Body
CREATE OR REPLACE TYPE BODY address_type AS
    MEMBER FUNCTION get_full_address RETURN VARCHAR2 IS
    BEGIN
        RETURN street || ', ' || city || ', ' || state || ' ' || zipcode;
    END;
END;
/

-- Nested Package
CREATE OR REPLACE PACKAGE HR.pkg_payroll
IS
    PROCEDURE calculate_salary(p_emp_id NUMBER);
    FUNCTION get_annual_salary(p_emp_id NUMBER) RETURN NUMBER;
END;
/
