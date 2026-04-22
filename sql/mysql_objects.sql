USE dashcart;

CREATE TABLE IF NOT EXISTS order_status_audit (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_order_status_audit;
DROP PROCEDURE IF EXISTS sp_low_stock_products;
DROP FUNCTION IF EXISTS fn_total_stock;

DELIMITER //

CREATE TRIGGER trg_order_status_audit
AFTER UPDATE ON orders_order
FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO order_status_audit (order_id, old_status, new_status)
        VALUES (NEW.order_id, OLD.status, NEW.status);
    END IF;
END//

CREATE FUNCTION fn_total_stock(p_product_id VARCHAR(50))
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total INT DEFAULT 0;

    SELECT COALESCE(SUM(quantity), 0)
    INTO v_total
    FROM inventory_inventory
    WHERE product_id = p_product_id;

    RETURN v_total;
END//

CREATE PROCEDURE sp_low_stock_products(IN p_threshold INT)
BEGIN
    SELECT
        p.product_id,
        p.name,
        fn_total_stock(p.product_id) AS total_stock
    FROM products_product p
    WHERE fn_total_stock(p.product_id) < p_threshold
    ORDER BY total_stock ASC, p.name ASC;
END//

DELIMITER ;

SHOW TRIGGERS;
SHOW FUNCTION STATUS WHERE Db = 'dashcart';
SHOW PROCEDURE STATUS WHERE Db = 'dashcart';
SHOW CREATE TRIGGER trg_order_status_audit;
SHOW CREATE FUNCTION fn_total_stock;
SHOW CREATE PROCEDURE sp_low_stock_products;




