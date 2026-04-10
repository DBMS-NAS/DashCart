from django.core.exceptions import ValidationError
from orders.models import Order, OrderItem
from inventory.models import Inventory


def checkout_cart(cart):

    order = Order.objects.create(
        order_id=f"ORD-{cart.pk}",
        user=cart.user,
        status="Pending"
    )

    for item in cart.items.all():
        inventory = Inventory.objects.get(product=item.product)

        if item.quantity > inventory.quantity:
            raise ValidationError(f"Not enough stock for {item.product.name}")

        OrderItem.objects.create(
            order=order,
            product=item.product,
            quantity=item.quantity,
            price=item.product.price
        )

        inventory.quantity -= item.quantity
        inventory.save()

    cart.items.all().delete()

    return order