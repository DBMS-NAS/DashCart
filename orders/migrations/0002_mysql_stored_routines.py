from django.db import migrations


DROP_SQL = [
    "DROP PROCEDURE IF EXISTS sp_request_refund",
    "DROP PROCEDURE IF EXISTS sp_create_stock_movement",
    "DROP PROCEDURE IF EXISTS sp_checkout_cart",
    "DROP FUNCTION IF EXISTS get_average_rating",
    "DROP FUNCTION IF EXISTS get_total_inventory",
    "DROP FUNCTION IF EXISTS get_effective_price",
]


CREATE_SQL = [
    """
    CREATE FUNCTION get_effective_price(p_product_id VARCHAR(50))
    RETURNS DECIMAL(10, 2)
    DETERMINISTIC
    READS SQL DATA
    BEGIN
        DECLARE v_price DECIMAL(10, 2);
        DECLARE v_discount DECIMAL(5, 2);

        SELECT price
        INTO v_price
        FROM products_product
        WHERE product_id = p_product_id
        LIMIT 1;

        IF v_price IS NULL THEN
            RETURN NULL;
        END IF;

        SELECT MAX(d.discount_percent)
        INTO v_discount
        FROM discounts_productdiscount pd
        INNER JOIN discounts_discount d
            ON d.discount_id = pd.discount_id
        WHERE pd.product_id = p_product_id;

        IF v_discount IS NULL THEN
            RETURN v_price;
        END IF;

        RETURN ROUND(v_price - ((v_price * v_discount) / 100), 2);
    END
    """,
    """
    CREATE FUNCTION get_total_inventory(p_product_id VARCHAR(50))
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
    END
    """,
    """
    CREATE FUNCTION get_average_rating(p_product_id VARCHAR(50))
    RETURNS DECIMAL(3, 2)
    DETERMINISTIC
    READS SQL DATA
    BEGIN
        DECLARE v_avg DECIMAL(3, 2);

        SELECT ROUND(AVG(rating), 2)
        INTO v_avg
        FROM reviews
        WHERE product_id = p_product_id;

        RETURN v_avg;
    END
    """,
    """
    CREATE PROCEDURE sp_create_stock_movement(
        IN p_product_id VARCHAR(50),
        IN p_warehouse_id VARCHAR(50),
        IN p_quantity INT,
        IN p_movement_type VARCHAR(10)
    )
    BEGIN
        DECLARE v_inventory_id BIGINT DEFAULT NULL;
        DECLARE v_current_quantity INT DEFAULT 0;
        DECLARE v_movement_id VARCHAR(50);

        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
            ROLLBACK;
            RESIGNAL;
        END;

        IF p_quantity <= 0 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Quantity must be greater than zero.';
        END IF;

        IF p_movement_type NOT IN ('in', 'out') THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Movement type must be either in or out.';
        END IF;

        START TRANSACTION;

        SELECT id, quantity
        INTO v_inventory_id, v_current_quantity
        FROM inventory_inventory
        WHERE product_id = p_product_id
          AND warehouse_id = p_warehouse_id
        LIMIT 1
        FOR UPDATE;

        IF v_inventory_id IS NULL THEN
            IF p_movement_type = 'out' THEN
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Cannot move out more stock than is available.';
            END IF;

            INSERT INTO inventory_inventory (product_id, warehouse_id, quantity)
            VALUES (p_product_id, p_warehouse_id, 0);

            SET v_inventory_id = LAST_INSERT_ID();
            SET v_current_quantity = 0;
        END IF;

        IF p_movement_type = 'in' THEN
            UPDATE inventory_inventory
            SET quantity = quantity + p_quantity
            WHERE id = v_inventory_id;
        ELSE
            IF v_current_quantity < p_quantity THEN
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Cannot move out more stock than is available.';
            END IF;

            UPDATE inventory_inventory
            SET quantity = quantity - p_quantity
            WHERE id = v_inventory_id;
        END IF;

        SET v_movement_id = CONCAT('MOV-', UPPER(LEFT(REPLACE(UUID(), '-', ''), 8)));

        INSERT INTO stock_movements (
            movement_id,
            product_id,
            warehouse_id,
            quantity,
            type,
            created_at
        )
        VALUES (
            v_movement_id,
            p_product_id,
            p_warehouse_id,
            p_quantity,
            p_movement_type,
            NOW()
        );

        COMMIT;

        SELECT v_movement_id AS movement_id;
    END
    """,
    """
    CREATE PROCEDURE sp_request_refund(IN p_order_id VARCHAR(50))
    BEGIN
        DECLARE v_payment_id VARCHAR(50);
        DECLARE v_payment_amount DECIMAL(10, 2);
        DECLARE v_order_status VARCHAR(50);
        DECLARE v_refund_id BIGINT;

        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
            ROLLBACK;
            RESIGNAL;
        END;

        START TRANSACTION;

        SELECT status
        INTO v_order_status
        FROM orders_order
        WHERE order_id = p_order_id
        LIMIT 1
        FOR UPDATE;

        IF v_order_status IS NULL THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Order not found.';
        END IF;

        IF v_order_status <> 'cancelled' THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Order must be cancelled before requesting a refund.';
        END IF;

        SELECT payment_id, amount
        INTO v_payment_id, v_payment_amount
        FROM payments_payment
        WHERE order_id = p_order_id
        LIMIT 1
        FOR UPDATE;

        IF v_payment_id IS NULL THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'No payment found for this order.';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM payments_refund
            WHERE payment_id = v_payment_id
        ) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'A refund was already requested for this order.';
        END IF;

        INSERT INTO payments_refund (
            payment_id,
            amount,
            requested_at,
            status
        )
        VALUES (
            v_payment_id,
            v_payment_amount,
            NOW(),
            'requested'
        );

        SET v_refund_id = LAST_INSERT_ID();

        COMMIT;

        SELECT v_refund_id AS refund_id;
    END
    """,
    """
    CREATE PROCEDURE sp_checkout_cart(
        IN p_user_id VARCHAR(50),
        IN p_payment_method VARCHAR(50)
    )
    BEGIN
        DECLARE v_cart_id BIGINT;
        DECLARE v_order_id VARCHAR(50);
        DECLARE v_payment_id VARCHAR(50);
        DECLARE v_item_count INT DEFAULT 0;
        DECLARE v_index INT DEFAULT 0;
        DECLARE v_product_id VARCHAR(50);
        DECLARE v_requested_quantity INT;
        DECLARE v_effective_price DECIMAL(10, 2);
        DECLARE v_order_total DECIMAL(10, 2) DEFAULT 0.00;
        DECLARE v_total_available INT DEFAULT 0;
        DECLARE v_remaining INT DEFAULT 0;
        DECLARE v_inventory_id BIGINT;
        DECLARE v_inventory_quantity INT DEFAULT 0;
        DECLARE v_take_quantity INT DEFAULT 0;

        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
            ROLLBACK;
            RESIGNAL;
        END;

        START TRANSACTION;

        SELECT cart_id
        INTO v_cart_id
        FROM cart_cart
        WHERE user_id = p_user_id
        ORDER BY cart_id
        LIMIT 1
        FOR UPDATE;

        IF v_cart_id IS NULL THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Your cart is empty.';
        END IF;

        SELECT COUNT(*)
        INTO v_item_count
        FROM cart_cartitem
        WHERE cart_id = v_cart_id;

        IF v_item_count = 0 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Your cart is empty.';
        END IF;

        SET v_order_id = CONCAT('ORD-', UPPER(LEFT(REPLACE(UUID(), '-', ''), 8)));

        INSERT INTO orders_order (
            order_id,
            user_id,
            created_at,
            status
        )
        VALUES (
            v_order_id,
            p_user_id,
            NOW(),
            'pending'
        );

        WHILE v_index < v_item_count DO
            SELECT product_id, quantity
            INTO v_product_id, v_requested_quantity
            FROM cart_cartitem
            WHERE cart_id = v_cart_id
            ORDER BY id
            LIMIT v_index, 1;

            SELECT COALESCE(SUM(quantity), 0)
            INTO v_total_available
            FROM inventory_inventory
            WHERE product_id = v_product_id;

            IF v_requested_quantity > v_total_available THEN
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Not enough stock to complete checkout.';
            END IF;

            SET v_effective_price = get_effective_price(v_product_id);

            INSERT INTO orders_orderitem (
                order_id,
                product_id,
                quantity,
                price
            )
            VALUES (
                v_order_id,
                v_product_id,
                v_requested_quantity,
                v_effective_price
            );

            SET v_order_total = v_order_total + (v_requested_quantity * v_effective_price);
            SET v_remaining = v_requested_quantity;

            WHILE v_remaining > 0 DO
                SELECT id
                INTO v_inventory_id
                FROM inventory_inventory
                WHERE product_id = v_product_id
                  AND quantity > 0
                ORDER BY id
                LIMIT 1
                FOR UPDATE;

                SELECT quantity
                INTO v_inventory_quantity
                FROM inventory_inventory
                WHERE id = v_inventory_id
                LIMIT 1;

                SET v_take_quantity = LEAST(v_inventory_quantity, v_remaining);

                UPDATE inventory_inventory
                SET quantity = quantity - v_take_quantity
                WHERE id = v_inventory_id;

                SET v_remaining = v_remaining - v_take_quantity;
            END WHILE;

            SET v_index = v_index + 1;
        END WHILE;

        SET v_payment_id = UPPER(REPLACE(UUID(), '-', ''));

        INSERT INTO payments_payment (
            payment_id,
            order_id,
            amount,
            method,
            status,
            created_at
        )
        VALUES (
            v_payment_id,
            v_order_id,
            ROUND(v_order_total, 2),
            COALESCE(NULLIF(TRIM(p_payment_method), ''), 'card'),
            'paid',
            NOW()
        );

        DELETE FROM cart_cartitem
        WHERE cart_id = v_cart_id;

        COMMIT;

        SELECT v_order_id AS order_id;
    END
    """,
]


def create_mysql_routines(apps, schema_editor):
    if schema_editor.connection.vendor != "mysql":
        return

    with schema_editor.connection.cursor() as cursor:
        for statement in DROP_SQL:
            cursor.execute(statement)
        for statement in CREATE_SQL:
            cursor.execute(statement)


def drop_mysql_routines(apps, schema_editor):
    if schema_editor.connection.vendor != "mysql":
        return

    with schema_editor.connection.cursor() as cursor:
        for statement in DROP_SQL:
            cursor.execute(statement)


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("users", "0007_accountprofile_store"),
        ("stores", "0002_remove_store_manager_warehouse"),
        ("products", "0003_alter_productcategory_unique_together"),
        ("inventory", "0003_stockmovement"),
        ("orders", "0001_initial"),
        ("payments", "0001_initial"),
        ("discounts", "0003_discount_store"),
        ("cart", "0001_initial"),
        ("reviews", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_mysql_routines, reverse_code=drop_mysql_routines),
    ]
