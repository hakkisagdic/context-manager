-- ============================================================================
-- SQLite Sample File for Testing
-- Tests: Triggers, Views, Indexes
-- ============================================================================

-- Simple Trigger
CREATE TRIGGER trg_update_timestamp
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Insert Trigger
CREATE TRIGGER trg_audit_insert
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, action, record_id, timestamp)
    VALUES ('orders', 'INSERT', NEW.id, CURRENT_TIMESTAMP);
END;

-- Delete Trigger
CREATE TRIGGER trg_cascade_delete
BEFORE DELETE ON customers
FOR EACH ROW
BEGIN
    DELETE FROM orders WHERE customer_id = OLD.id;
    DELETE FROM addresses WHERE customer_id = OLD.id;
END;

-- INSTEAD OF Trigger (for views)
CREATE TRIGGER trg_updateable_view
INSTEAD OF UPDATE ON v_user_summary
FOR EACH ROW
BEGIN
    UPDATE users SET name = NEW.name WHERE id = NEW.id;
    UPDATE profiles SET bio = NEW.bio WHERE user_id = NEW.id;
END;

-- Temporary Trigger
CREATE TEMP TRIGGER trg_temp_validation
BEFORE INSERT ON temp_imports
FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Invalid email')
    WHERE NEW.email NOT LIKE '%@%.%';
END;

-- Simple View
CREATE VIEW v_active_users AS
SELECT id, username, email, created_at
FROM users
WHERE active = 1;

-- Complex View with JOIN
CREATE VIEW v_order_summary AS
SELECT
    o.id as order_id,
    c.name as customer_name,
    SUM(oi.quantity * oi.price) as total_amount,
    COUNT(oi.id) as item_count
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, c.name;

-- Temporary View
CREATE TEMP VIEW v_temp_stats AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as user_count
FROM users
GROUP BY DATE(created_at);

-- IF NOT EXISTS View
CREATE VIEW IF NOT EXISTS v_recent_orders AS
SELECT * FROM orders
WHERE created_at > datetime('now', '-30 days');

-- Simple Index
CREATE INDEX idx_users_email ON users(email);

-- Unique Index
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- Composite Index
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);

-- Partial Index (with WHERE clause)
CREATE INDEX idx_active_users ON users(username)
WHERE active = 1;

-- Expression Index
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

-- IF NOT EXISTS Index
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- Descending Index
CREATE INDEX idx_orders_date_desc ON orders(order_date DESC);

-- Index on multiple columns with mixed order
CREATE INDEX idx_sales_region_date ON sales(region ASC, sale_date DESC);
