-- ============================================================================
-- PostgreSQL (PL/pgSQL) Sample File for Testing
-- Tests: Functions, Procedures, Triggers, Views, Types, Domains
-- ============================================================================

-- Simple Function with LANGUAGE plpgsql
CREATE FUNCTION get_user_count()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM users);
END;
$$;

-- CREATE OR REPLACE FUNCTION
CREATE OR REPLACE FUNCTION calculate_discount(amount DECIMAL, rate DECIMAL)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN amount * (1 - rate / 100);
END;
$$;

-- Function with schema
CREATE OR REPLACE FUNCTION public.get_active_users()
RETURNS TABLE(id INT, username VARCHAR)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY SELECT id, username FROM users WHERE active = true;
END;
$$;

-- Procedure (PostgreSQL 11+)
CREATE OR REPLACE PROCEDURE insert_user(p_username VARCHAR, p_email VARCHAR)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO users (username, email) VALUES (p_username, p_email);
    COMMIT;
END;
$$;

-- Trigger Function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO audit_log VALUES (NEW.id, NOW());
    RETURN NEW;
END;
$$;

-- Trigger
CREATE TRIGGER users_audit_trigger
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION audit_trigger_func();

-- Materialized View
CREATE MATERIALIZED VIEW mv_user_stats AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as user_count
FROM users
GROUP BY DATE(created_at);

-- Regular View
CREATE OR REPLACE VIEW v_active_users AS
SELECT id, username, email
FROM users
WHERE active = true;

-- Composite Type
CREATE TYPE address_type AS (
    street VARCHAR(100),
    city VARCHAR(50),
    zipcode VARCHAR(10)
);

-- Enum Type
CREATE TYPE user_role AS ENUM ('admin', 'user', 'guest');

-- Domain
CREATE DOMAIN email_domain AS VARCHAR(255)
CHECK (VALUE ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');

-- Rule
CREATE OR REPLACE RULE update_users_rule AS
ON UPDATE TO users
DO ALSO
INSERT INTO user_updates VALUES (NEW.id, NOW());

-- Custom Operator (example)
CREATE OPERATOR public.@@ (
    LEFTARG = text,
    RIGHTARG = text,
    PROCEDURE = textsend
);
