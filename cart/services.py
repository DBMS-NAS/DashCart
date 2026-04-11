from django.core.exceptions import ValidationError
from orders.models import Order, OrderItem


def checkout_cart(cart):

    order = Order.objects.create(
        order_id=f"ORD-{cart.pk}",
        user=cart.user,
        status="Pending"
    )

    try:
        for item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.price
            )
    except ValidationError:
        order.delete()
        raise

    cart.items.all().delete()

    return order
