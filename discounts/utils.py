from decimal import Decimal

from backend.mysql_routines import get_effective_price_value, using_mysql


def get_best_discount(product):
    return (
        product.product_discounts
        .select_related("discount")
        .order_by("-discount__discount_percent")
        .first()
    )


def get_effective_price(product):
    """Returns the actual price to charge, applying the best available discount."""
    if using_mysql():
        mysql_price = get_effective_price_value(product.product_id)
        if mysql_price is not None:
            return mysql_price

    product_discount = get_best_discount(product)
    if product_discount:
        reduction = (
            Decimal(product.price)
            * Decimal(product_discount.discount.discount_percent)
            / Decimal("100")
        )
        return (Decimal(product.price) - reduction).quantize(Decimal("0.01"))
    return Decimal(product.price)
