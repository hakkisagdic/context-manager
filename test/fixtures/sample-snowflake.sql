-- ============================================================================
-- Snowflake Sample File for Testing
-- Tests: Procedures, Functions, Views, Stages, Pipes, Streams, Tasks
-- ============================================================================

-- Simple Procedure
CREATE OR REPLACE PROCEDURE get_user_count()
RETURNS NUMBER
LANGUAGE SQL
AS
$$
    SELECT COUNT(*) FROM users;
$$;

-- Procedure with JavaScript
CREATE OR REPLACE PROCEDURE process_orders(ORDER_STATUS VARCHAR)
RETURNS VARCHAR
LANGUAGE JAVASCRIPT
AS
$$
    var sql_command = "UPDATE orders SET status = '" + ORDER_STATUS + "'";
    snowflake.execute({sqlText: sql_command});
    return "Orders processed";
$$;

-- Procedure with Python
CREATE OR REPLACE PROCEDURE calculate_metrics()
RETURNS TABLE(metric_name VARCHAR, metric_value FLOAT)
LANGUAGE PYTHON
RUNTIME_VERSION = '3.8'
PACKAGES = ('pandas', 'numpy')
HANDLER = 'compute_metrics'
AS
$$
import pandas as pd
def compute_metrics():
    return [('total_revenue', 150000.50), ('avg_order', 450.25)]
$$;

-- Schema-qualified Procedure
CREATE OR REPLACE PROCEDURE analytics.generate_report(START_DATE DATE, END_DATE DATE)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
DECLARE
    result VARCHAR;
BEGIN
    result := 'Report generated for ' || START_DATE || ' to ' || END_DATE;
    RETURN result;
END;
$$;

-- Simple Function
CREATE OR REPLACE FUNCTION calculate_discount(PRICE NUMBER, RATE NUMBER)
RETURNS NUMBER
LANGUAGE SQL
AS
$$
    PRICE * (1 - RATE / 100)
$$;

-- Secure Function
CREATE OR REPLACE SECURE FUNCTION get_salary(EMP_ID NUMBER)
RETURNS NUMBER
LANGUAGE SQL
AS
$$
    SELECT salary FROM employees WHERE id = EMP_ID
$$;

-- Table Function
CREATE OR REPLACE FUNCTION get_employees_by_dept(DEPT_ID NUMBER)
RETURNS TABLE(emp_id NUMBER, emp_name VARCHAR, salary NUMBER)
LANGUAGE SQL
AS
$$
    SELECT id, name, salary
    FROM employees
    WHERE department_id = DEPT_ID
$$;

-- Simple View
CREATE OR REPLACE VIEW v_active_customers AS
SELECT customer_id, name, email, account_balance
FROM customers
WHERE status = 'ACTIVE';

-- Secure View
CREATE OR REPLACE SECURE VIEW v_employee_salaries AS
SELECT employee_id, first_name, last_name, salary, department_id
FROM employees;

-- Materialized View
CREATE OR REPLACE MATERIALIZED VIEW mv_sales_summary AS
SELECT
    DATE_TRUNC('day', sale_date) as sale_day,
    product_id,
    SUM(amount) as total_sales,
    COUNT(*) as transaction_count
FROM sales
GROUP BY DATE_TRUNC('day', sale_date), product_id;

-- Internal Stage
CREATE OR REPLACE STAGE staging.data_import
DIRECTORY = (ENABLE = TRUE)
FILE_FORMAT = (TYPE = 'CSV' FIELD_DELIMITER = ',' SKIP_HEADER = 1);

-- External Stage (S3)
CREATE OR REPLACE STAGE s3_stage
URL = 's3://mybucket/data/'
CREDENTIALS = (AWS_KEY_ID = 'xxx' AWS_SECRET_KEY = 'yyy')
FILE_FORMAT = (TYPE = 'PARQUET');

-- External Stage (Azure)
CREATE OR REPLACE STAGE azure_stage
URL = 'azure://myaccount.blob.core.windows.net/mycontainer/path/'
CREDENTIALS = (AZURE_SAS_TOKEN = 'token');

-- Simple Pipe
CREATE OR REPLACE PIPE user_data_pipe
AUTO_INGEST = TRUE
AS
COPY INTO users
FROM @staging.data_import
FILE_FORMAT = (TYPE = 'JSON');

-- Pipe with Error Integration
CREATE OR REPLACE PIPE order_pipe
AUTO_INGEST = TRUE
ERROR_INTEGRATION = my_error_notification
AS
COPY INTO orders
FROM @s3_stage/orders/
FILE_FORMAT = (TYPE = 'CSV');

-- Stream on Table
CREATE OR REPLACE STREAM user_changes_stream
ON TABLE users
APPEND_ONLY = FALSE;

-- Stream on View
CREATE OR REPLACE STREAM order_view_stream
ON VIEW v_active_orders
SHOW_INITIAL_ROWS = TRUE;

-- Stream on External Table
CREATE OR REPLACE STREAM external_stream
ON EXTERNAL TABLE ext_sales;

-- Simple Task
CREATE OR REPLACE TASK daily_cleanup
WAREHOUSE = compute_wh
SCHEDULE = 'USING CRON 0 2 * * * UTC'
AS
DELETE FROM staging_table WHERE created_at < DATEADD(day, -7, CURRENT_TIMESTAMP());

-- Task with Dependencies
CREATE OR REPLACE TASK process_orders_task
WAREHOUSE = compute_wh
AFTER task1, task2
AS
CALL process_orders('COMPLETED');

-- Task with Session Parameters
CREATE OR REPLACE TASK analytics_task
WAREHOUSE = analytics_wh
SCHEDULE = '60 MINUTE'
USER_TASK_TIMEOUT_MS = 3600000
AS
INSERT INTO analytics_results
SELECT * FROM generate_analytics();
