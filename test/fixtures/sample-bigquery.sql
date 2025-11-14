-- ============================================================================
-- Google BigQuery Sample File for Testing
-- Tests: Procedures, Functions, Views (Standard SQL)
-- ============================================================================

-- Simple Procedure
CREATE OR REPLACE PROCEDURE `project.dataset.get_user_count`(OUT user_count INT64)
BEGIN
    SET user_count = (SELECT COUNT(*) FROM `project.dataset.users`);
END;

-- Procedure with multiple statements
CREATE OR REPLACE PROCEDURE insert_user_log(
    user_id INT64,
    action STRING
)
BEGIN
    INSERT INTO user_logs (user_id, action, timestamp)
    VALUES (user_id, action, CURRENT_TIMESTAMP());

    UPDATE user_stats
    SET action_count = action_count + 1
    WHERE user_id = user_id;
END;

-- Procedure with conditional logic
CREATE OR REPLACE PROCEDURE update_user_tier(user_id INT64)
BEGIN
    DECLARE total_purchases INT64;
    DECLARE new_tier STRING;

    SET total_purchases = (
        SELECT COUNT(*)
        FROM purchases
        WHERE user_id = user_id
    );

    IF total_purchases > 100 THEN
        SET new_tier = 'GOLD';
    ELSEIF total_purchases > 50 THEN
        SET new_tier = 'SILVER';
    ELSE
        SET new_tier = 'BRONZE';
    END IF;

    UPDATE users
    SET tier = new_tier
    WHERE id = user_id;
END;

-- Procedure with loop
CREATE OR REPLACE PROCEDURE process_batch(batch_size INT64)
BEGIN
    DECLARE counter INT64 DEFAULT 0;

    WHILE counter < batch_size DO
        INSERT INTO batch_log (batch_id, processed_at)
        VALUES (counter, CURRENT_TIMESTAMP());

        SET counter = counter + 1;
    END WHILE;
END;

-- Dataset-qualified Procedure
CREATE OR REPLACE PROCEDURE `analytics.generate_daily_report`(report_date DATE)
BEGIN
    DELETE FROM daily_reports WHERE report_date = report_date;

    INSERT INTO daily_reports
    SELECT
        report_date,
        event_type,
        COUNT(*) as event_count
    FROM events
    WHERE DATE(event_timestamp) = report_date
    GROUP BY event_type;
END;

-- Simple SQL UDF (Scalar Function)
CREATE OR REPLACE FUNCTION calculate_tax(amount FLOAT64)
RETURNS FLOAT64
AS (
    amount * 0.08
);

-- Function with multiple parameters
CREATE OR REPLACE FUNCTION calculate_discount(
    price FLOAT64,
    discount_rate FLOAT64
)
RETURNS FLOAT64
AS (
    price * (1 - discount_rate / 100)
);

-- JavaScript UDF
CREATE OR REPLACE FUNCTION js_parse_url(url STRING)
RETURNS STRING
LANGUAGE js
AS r"""
    try {
        const parsed = new URL(url);
        return parsed.hostname;
    } catch (e) {
        return null;
    }
""";

-- SQL UDF returning STRUCT
CREATE OR REPLACE FUNCTION get_user_info(user_id INT64)
RETURNS STRUCT<name STRING, email STRING, tier STRING>
AS (
    (SELECT AS STRUCT name, email, tier FROM users WHERE id = user_id LIMIT 1)
);

-- Table Function (SQL TVF)
CREATE OR REPLACE TABLE FUNCTION get_monthly_sales(year INT64, month INT64)
AS (
    SELECT
        product_id,
        product_name,
        SUM(quantity) as total_quantity,
        SUM(amount) as total_amount
    FROM sales
    WHERE EXTRACT(YEAR FROM sale_date) = year
      AND EXTRACT(MONTH FROM sale_date) = month
    GROUP BY product_id, product_name
);

-- Parameterized Table Function
CREATE OR REPLACE TABLE FUNCTION filter_events(
    start_date DATE,
    end_date DATE,
    event_types ARRAY<STRING>
)
AS (
    SELECT *
    FROM events
    WHERE DATE(event_timestamp) BETWEEN start_date AND end_date
      AND event_type IN UNNEST(event_types)
);

-- Dataset-qualified Function
CREATE OR REPLACE FUNCTION `analytics.calculate_retention_rate`(
    cohort_date DATE
)
RETURNS FLOAT64
AS (
    (
        SELECT
            COUNTIF(return_date IS NOT NULL) / COUNT(*)
        FROM user_cohorts
        WHERE cohort_start = cohort_date
    )
);

-- Simple View
CREATE OR REPLACE VIEW `project.dataset.v_active_users` AS
SELECT user_id, username, email, created_at
FROM `project.dataset.users`
WHERE active = TRUE;

-- View with aggregation
CREATE OR REPLACE VIEW v_sales_summary AS
SELECT
    DATE_TRUNC(sale_date, MONTH) as sale_month,
    product_category,
    COUNT(*) as transaction_count,
    SUM(amount) as total_revenue,
    AVG(amount) as avg_transaction
FROM sales
GROUP BY DATE_TRUNC(sale_date, MONTH), product_category;

-- Authorized View (access control)
CREATE OR REPLACE VIEW `analytics.v_user_metrics` AS
SELECT
    user_id,
    COUNT(DISTINCT DATE(event_timestamp)) as active_days,
    COUNT(*) as total_events,
    MAX(event_timestamp) as last_activity
FROM events
GROUP BY user_id;

-- View with STRUCT and ARRAY
CREATE OR REPLACE VIEW v_user_profiles AS
SELECT
    user_id,
    username,
    STRUCT(
        email,
        phone,
        address
    ) as contact_info,
    ARRAY_AGG(STRUCT(order_id, order_date, amount) ORDER BY order_date DESC LIMIT 10) as recent_orders
FROM users
LEFT JOIN orders USING (user_id)
GROUP BY user_id, username, email, phone, address;

-- Materialized View (BigQuery specific)
CREATE MATERIALIZED VIEW mv_hourly_metrics AS
SELECT
    TIMESTAMP_TRUNC(event_timestamp, HOUR) as event_hour,
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users
FROM events
GROUP BY TIMESTAMP_TRUNC(event_timestamp, HOUR), event_type;

-- View with window functions
CREATE OR REPLACE VIEW v_user_rankings AS
SELECT
    user_id,
    username,
    total_purchases,
    RANK() OVER (ORDER BY total_purchases DESC) as purchase_rank,
    PERCENT_RANK() OVER (ORDER BY total_purchases DESC) as percentile
FROM (
    SELECT
        user_id,
        username,
        COUNT(*) as total_purchases
    FROM users
    LEFT JOIN purchases USING (user_id)
    GROUP BY user_id, username
);
