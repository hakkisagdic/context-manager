-- ============================================================================
-- MySQL/MariaDB Sample File for Testing
-- Tests: Procedures, Functions, Triggers, Views, Events
-- ============================================================================

DELIMITER $$

-- Simple Procedure
CREATE PROCEDURE get_users()
BEGIN
    SELECT * FROM users;
END$$

-- Procedure with DEFINER
CREATE DEFINER=`root`@`localhost` PROCEDURE insert_user(
    IN p_username VARCHAR(50),
    IN p_email VARCHAR(100)
)
BEGIN
    INSERT INTO users (username, email) VALUES (p_username, p_email);
END$$

-- Function
CREATE FUNCTION calculate_total(quantity INT, price DECIMAL(10,2))
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    RETURN quantity * price;
END$$

-- Function with DEFINER
CREATE DEFINER=`admin`@`%` FUNCTION get_user_level(user_id INT)
RETURNS VARCHAR(20)
READS SQL DATA
BEGIN
    DECLARE level VARCHAR(20);
    SELECT role INTO level FROM users WHERE id = user_id;
    RETURN level;
END$$

DELIMITER ;

-- Trigger
CREATE TRIGGER before_user_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    SET NEW.created_at = NOW();
END;

-- Trigger with DEFINER
CREATE DEFINER=`root`@`localhost` TRIGGER after_user_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action, timestamp)
    VALUES (NEW.id, 'UPDATE', NOW());
END;

-- View
CREATE VIEW v_active_users AS
SELECT id, username, email
FROM users
WHERE active = 1;

-- View with DEFINER and ALGORITHM
CREATE OR REPLACE ALGORITHM=MERGE DEFINER=`root`@`localhost` VIEW v_user_orders AS
SELECT
    u.id,
    u.username,
    COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.username;

DELIMITER $$

-- Event (MySQL Event Scheduler)
CREATE EVENT cleanup_old_sessions
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
END$$

-- Event with DEFINER
CREATE DEFINER=`admin`@`localhost` EVENT daily_report_generation
ON SCHEDULE EVERY 1 DAY
STARTS '2025-01-01 00:00:00'
DO
BEGIN
    CALL generate_daily_report();
END$$

DELIMITER ;

-- Backtick-quoted names
CREATE PROCEDURE `get-user-stats`()
BEGIN
    SELECT COUNT(*) as total FROM `user-table`;
END;
