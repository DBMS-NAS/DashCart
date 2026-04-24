from django.db.models import QuerySet

from .models import Order, OrderItem, OrderItemAllocation


def filter_orders_for_store(queryset: QuerySet[Order], store):
    return queryset.filter(
        orderitem__allocations__warehouse__store=store
    ).distinct()


def filter_order_items_for_store(queryset: QuerySet[OrderItem], store):
    return queryset.filter(allocations__warehouse__store=store).distinct()


def filter_allocations_for_store(queryset: QuerySet[OrderItemAllocation], store):
    return queryset.filter(warehouse__store=store)
