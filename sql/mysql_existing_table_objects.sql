USE dashcart;

DROP TRIGGER IF EXISTS trg_inventory_stock_movement;
DROP PROCEDURE IF EXISTS sp_low_stock_products;
DROP FUNCTION IF EXISTS fn_total_stock;

DELIMITER //

CREATE TRIGGER trg_inventory_stock_movement
AFTER UPDATE ON inventory_inventory
FOR EACH ROW
BEGIN
    DECLARE v_change INT;

    SET v_change = NEW.quantity - OLD.quantity;

    IF v_change <> 0 THEN
        INSERT INTO stock_movements (
            movement_id,
            product_id,
            warehouse_id,
            quantity,
            type,
            created_at
        )
        VALUES (
            CONCAT('MOV-', UPPER(LEFT(REPLACE(UUID(), '-', ''), 8))),
            NEW.product_id,
            NEW.warehouse_id,
            ABS(v_change),
            IF(v_change > 0, 'in', 'out'),
            NOW()
        );
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
        stock_summary.product_id,
        stock_summary.name,
        stock_summary.total_stock
    FROM (
        SELECT
            p.product_id,
            p.name,
            fn_total_stock(p.product_id) AS total_stock
        FROM products_product p
    ) AS stock_summary
    WHERE stock_summary.total_stock < p_threshold
    ORDER BY stock_summary.total_stock ASC, stock_summary.name ASC;
END//

DELIMITER ;

SHOW TRIGGERS;
SHOW FUNCTION STATUS WHERE Db = 'dashcart';
SHOW PROCEDURE STATUS WHERE Db = 'dashcart';
SHOW CREATE TRIGGER trg_inventory_stock_movement;
SHOW CREATE FUNCTION fn_total_stock;
SHOW CREATE PROCEDURE sp_low_stock_products;

CALL sp_low_stock_products(10);
SELECT fn_total_stock('YOUR_PRODUCT_ID');

SELECT * FROM inventory_inventory;

UPDATE inventory_inventory
SET quantity = quantity - 2
WHERE id = 1;

SELECT * FROM stock_movements ORDER BY created_at DESC;


