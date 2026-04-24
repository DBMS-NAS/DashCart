from django.db import migrations, models
import django.db.models.deletion


def backfill_unambiguous_allocations(apps, schema_editor):
    Inventory = apps.get_model("inventory", "Inventory")
    OrderItem = apps.get_model("orders", "OrderItem")
    OrderItemAllocation = apps.get_model("orders", "OrderItemAllocation")

    for order_item in OrderItem.objects.all():
        if OrderItemAllocation.objects.filter(order_item=order_item).exists():
            continue

        warehouse_ids = list(
            Inventory.objects.filter(product=order_item.product)
            .values_list("warehouse_id", flat=True)
            .distinct()
        )
        if len(warehouse_ids) != 1:
            continue

        OrderItemAllocation.objects.create(
            order_item=order_item,
            warehouse_id=warehouse_ids[0],
            quantity=order_item.quantity,
        )


class Migration(migrations.Migration):
    dependencies = [
        ("stores", "0002_remove_store_manager_warehouse"),
        ("orders", "0002_mysql_stored_routines"),
    ]

    operations = [
        migrations.CreateModel(
            name="OrderItemAllocation",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("quantity", models.PositiveIntegerField()),
                (
                    "order_item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="allocations",
                        to="orders.orderitem",
                    ),
                ),
                (
                    "warehouse",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="stores.warehouse",
                    ),
                ),
            ],
            options={"ordering": ["order_item_id", "warehouse_id"]},
        ),
        migrations.RunPython(
            backfill_unambiguous_allocations,
            migrations.RunPython.noop,
        ),
    ]
