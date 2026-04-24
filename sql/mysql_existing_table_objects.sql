-- MySQL trigger for logging inventory quantity changes into stock_movements.

DROP TRIGGER IF EXISTS trg_inventory_stock_movement;

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

DELIMITER ;
