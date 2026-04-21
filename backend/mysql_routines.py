from decimal import Decimal

from django.db import connection


def using_mysql():
    return connection.vendor == "mysql"


def _consume_results(cursor):
    while cursor.nextset():
        continue


def _fetch_scalar(query, params):
    with connection.cursor() as cursor:
        cursor.execute(query, params)
        row = cursor.fetchone()
    return row[0] if row else None


def get_database_error_message(exc):
    if getattr(exc, "args", None):
        return str(exc.args[-1])
    return str(exc)


def get_effective_price_value(product_id):
    if not using_mysql():
        return None

    value = _fetch_scalar("SELECT get_effective_price(%s)", [product_id])
    return Decimal(str(value)) if value is not None else None


def get_total_inventory_value(product_id):
    if not using_mysql():
        return None

    value = _fetch_scalar("SELECT get_total_inventory(%s)", [product_id])
    return int(value or 0)


def get_average_rating_value(product_id):
    if not using_mysql():
        return None

    value = _fetch_scalar("SELECT get_average_rating(%s)", [product_id])
    return Decimal(str(value)) if value is not None else None


def call_checkout_procedure(user_id, payment_method):
    with connection.cursor() as cursor:
        cursor.execute("CALL sp_checkout_cart(%s, %s)", [user_id, payment_method])
        row = cursor.fetchone()
        _consume_results(cursor)

    return row[0] if row else None


def call_stock_movement_procedure(product_id, warehouse_id, quantity, movement_type):
    with connection.cursor() as cursor:
        cursor.execute(
            "CALL sp_create_stock_movement(%s, %s, %s, %s)",
            [product_id, warehouse_id, quantity, movement_type],
        )
        row = cursor.fetchone()
        _consume_results(cursor)

    return row[0] if row else None


def call_refund_request_procedure(order_id):
    with connection.cursor() as cursor:
        cursor.execute("CALL sp_request_refund(%s)", [order_id])
        row = cursor.fetchone()
        _consume_results(cursor)

    return row[0] if row else None
