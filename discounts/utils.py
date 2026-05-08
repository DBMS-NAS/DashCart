from decimal import Decimal
from django.utils import timezone


def get_best_discount(product):
    today = timezone.localdate()
    product_discount = (
        product.product_discounts
        .select_related("discount")
        .filter(start_date__lte=today, end_date__gte=today)
        .order_by("-discount__discount_percent")
        .first()
    )
    return product_discount.discount if product_discount else None


def get_effective_price(product):
    """Returns the actual price to charge, applying the best assigned discount if any."""
    return get_effective_price_for_base_price(product, product.price)


def get_effective_price_for_base_price(product, base_price):
    discount = get_best_discount(product)
    price = Decimal(base_price)
    if discount:
        reduction = price * Decimal(discount.discount_percent) / Decimal("100")
        return (price - reduction).quantize(Decimal("0.01"))
    return price
