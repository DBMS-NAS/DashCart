from django.db import migrations, models
import django.db.models.deletion


def backfill_unambiguous_cart_warehouses(apps, schema_editor):
    CartItem = apps.get_model("cart", "CartItem")
    Inventory = apps.get_model("inventory", "Inventory")

    for item in CartItem.objects.filter(warehouse__isnull=True):
        warehouse_ids = list(
            Inventory.objects.filter(product=item.product)
            .values_list("warehouse_id", flat=True)
            .distinct()
        )
        if len(warehouse_ids) == 1:
            item.warehouse_id = warehouse_ids[0]
            item.save(update_fields=["warehouse"])


class Migration(migrations.Migration):
    dependencies = [
        ("stores", "0002_remove_store_manager_warehouse"),
        ("inventory", "0003_stockmovement"),
        ("cart", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="cartitem",
            name="warehouse",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="stores.warehouse",
            ),
        ),
        migrations.RunPython(
            backfill_unambiguous_cart_warehouses,
            migrations.RunPython.noop,
        ),
    ]
