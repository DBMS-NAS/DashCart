from decimal import Decimal


def get_best_discount(product):
    product_discount = (
        product.product_discounts
        .select_related("discount")
        .order_by("-discount__discount_percent")
        .first()
    )
    return product_discount.discount if product_discount else None


def get_effective_price(product):
    """Returns the actual price to charge, applying the best assigned discount if any."""
    discount = get_best_discount(product)
    if discount:
        reduction = Decimal(product.price) * Decimal(discount.discount_percent) / Decimal("100")
        return (Decimal(product.price) - reduction).quantize(Decimal("0.01"))
    return product.price
