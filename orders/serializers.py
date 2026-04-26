from decimal import Decimal

from rest_framework import serializers

from .models import Order, OrderItem, OrderItemAllocation
from .query_utils import filter_allocations_for_store
from payments.serializers import PaymentSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["product_name", "quantity", "price", "subtotal"]

    def get_subtotal(self, obj):
        subtotal = Decimal(obj.quantity) * obj.price
        return f"{subtotal:.2f}"


class OrderSerializer(serializers.ModelSerializer):
    customer = serializers.CharField(source="user.name", read_only=True)
    items = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()
    payment = PaymentSerializer(read_only=True)

    class Meta:
        model = Order
        fields = ["order_id", "customer", "status", "created_at", "items", "total", "payment"]

    def _serialize_full_items(self, obj):
        return OrderItemSerializer(obj.orderitem_set.all(), many=True).data

    def _serialize_store_items(self, obj, store):
        allocations = filter_allocations_for_store(
            OrderItemAllocation.objects.select_related(
                "order_item__product",
                "warehouse",
            ).filter(order_item__order=obj),
            store,
        )
        grouped = {}

        for allocation in allocations:
            item_id = allocation.order_item_id
            if item_id not in grouped:
                grouped[item_id] = {
                    "product_name": allocation.order_item.product.name,
                    "quantity": 0,
                    "price": allocation.order_item.price,
                }
            grouped[item_id]["quantity"] += allocation.quantity

        serialized = []
        for item in grouped.values():
            subtotal = Decimal(item["quantity"]) * item["price"]
            serialized.append(
                {
                    "product_name": item["product_name"],
                    "quantity": item["quantity"],
                    "price": f"{item['price']:.2f}",
                    "subtotal": f"{subtotal:.2f}",
                }
            )
        return serialized

    def _get_total(self, obj):
        store = self.context.get("store")
        if not store:
            return sum(
                Decimal(item.quantity) * item.price
                for item in obj.orderitem_set.all()
            )

        allocations = filter_allocations_for_store(
            OrderItemAllocation.objects.select_related(
                "order_item"
            ).filter(order_item__order=obj),
            store,
        )
        return sum(
            Decimal(allocation.quantity) * allocation.order_item.price
            for allocation in allocations
        )

    def get_items(self, obj):
        store = self.context.get("store")
        if not store:
            return self._serialize_full_items(obj)
        return self._serialize_store_items(obj, store)

    def get_total(self, obj):
        total = self._get_total(obj)
        return f"{total:.2f}"
