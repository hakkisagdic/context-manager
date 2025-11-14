-- ============================================================================
-- Amazon Redshift Sample File for Testing
-- Tests: Procedures, Functions, Views (Redshift SQL)
-- ============================================================================

-- Simple Procedure
CREATE OR REPLACE PROCEDURE get_user_count(OUT user_count INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
END;
$$;

-- Procedure with transaction control
CREATE OR REPLACE PROCEDURE insert_batch_users(batch_size INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..batch_size LOOP
        INSERT INTO users (username, email)
        VALUES ('user' || i, 'user' || i || '@example.com');
    END LOOP;
    COMMIT;
END;
$$;

-- Schema-qualified Procedure
CREATE OR REPLACE PROCEDURE analytics.refresh_summary_tables()
LANGUAGE plpgsql
AS $$
BEGIN
    TRUNCATE TABLE summary_daily;
    INSERT INTO summary_daily
    SELECT
        DATE_TRUNC('day', event_time) as event_day,
        event_type,
        COUNT(*) as event_count
    FROM events
    GROUP BY DATE_TRUNC('day', event_time), event_type;
    COMMIT;
END;
$$;

-- Procedure with error handling
CREATE OR REPLACE PROCEDURE safe_update_user(
    p_user_id INTEGER,
    p_email VARCHAR(100)
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE users
    SET email = p_email, updated_at = GETDATE()
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User % not found', p_user_id;
    END IF;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating user: %', SQLERRM;
        ROLLBACK;
END;
$$;

-- Simple Scalar Function
CREATE OR REPLACE FUNCTION calculate_discount(price DECIMAL(10,2), rate DECIMAL(5,2))
RETURNS DECIMAL(10,2)
IMMUTABLE
AS $$
    SELECT price * (1 - rate / 100)
$$ LANGUAGE sql;

-- Function returning table
CREATE OR REPLACE FUNCTION get_active_users()
RETURNS TABLE(user_id INTEGER, username VARCHAR, email VARCHAR)
STABLE
AS $$
    SELECT user_id, username, email
    FROM users
    WHERE active = true
$$ LANGUAGE sql;

-- Schema-qualified Function
CREATE OR REPLACE FUNCTION public.get_annual_revenue(year INTEGER)
RETURNS DECIMAL(15,2)
STABLE
AS $$
    SELECT COALESCE(SUM(amount), 0)
    FROM orders
    WHERE DATE_PART('year', order_date) = year
$$ LANGUAGE sql;

-- Python UDF (User Defined Function)
CREATE OR REPLACE FUNCTION python_lower(input VARCHAR)
RETURNS VARCHAR
IMMUTABLE
AS $$
    return input.lower()
$$ LANGUAGE plpythonu;

-- Lambda UDF
CREATE OR REPLACE FUNCTION sql_lower(VARCHAR)
RETURNS VARCHAR
IMMUTABLE
AS $$
    SELECT LOWER($1)
$$ LANGUAGE sql;

-- Simple View
CREATE OR REPLACE VIEW v_active_customers AS
SELECT customer_id, customer_name, email, account_balance
FROM customers
WHERE status = 'ACTIVE';

-- View with aggregation
CREATE OR REPLACE VIEW v_order_summary AS
SELECT
    customer_id,
    COUNT(*) as order_count,
    SUM(order_total) as total_spent,
    AVG(order_total) as avg_order_value
FROM orders
GROUP BY customer_id;

-- Schema-qualified View
CREATE OR REPLACE VIEW analytics.v_daily_metrics AS
SELECT
    DATE_TRUNC('day', event_timestamp) as metric_date,
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users
FROM events
GROUP BY DATE_TRUNC('day', event_timestamp), event_type;

-- Late Binding View (Redshift specific)
CREATE OR REPLACE VIEW v_late_binding_example
WITH NO SCHEMA BINDING AS
SELECT
    user_id,
    username,
    email,
    created_at
FROM users;

-- Materialized View (Redshift specific)
CREATE MATERIALIZED VIEW mv_sales_summary AS
SELECT
    product_id,
    DATE_TRUNC('month', sale_date) as sale_month,
    SUM(quantity) as total_quantity,
    SUM(amount) as total_amount
FROM sales
GROUP BY product_id, DATE_TRUNC('month', sale_date);

-- View with UNION
CREATE OR REPLACE VIEW v_all_transactions AS
SELECT transaction_id, user_id, amount, 'purchase' as type
FROM purchases
UNION ALL
SELECT refund_id, user_id, amount, 'refund' as type
FROM refunds;
