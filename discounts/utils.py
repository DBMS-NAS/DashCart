from decimal import Decimal
from django.utils import timezone


def get_effective_price(product):
    """Returns the actual price to charge, applying the best active discount if any."""
    now = timezone.now()
    pd = (
        product.product_discounts
        .select_related("discount")
        .filter(
            discount__start_date__lte=now,
            discount__end_date__gte=now,
        )
        .order_by("-discount__discount_percent")
        .first()
    )
    if pd:
        reduction = Decimal(product.price) * Decimal(pd.discount.discount_percent) / Decimal("100")
        return (Decimal(product.price) - reduction).quantize(Decimal("0.01"))
    return product.price