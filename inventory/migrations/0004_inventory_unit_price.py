from django.db import migrations, models


def backfill_unit_prices(apps, schema_editor):
    Inventory = apps.get_model("inventory", "Inventory")

    for inventory in Inventory.objects.select_related("product").all():
        if inventory.unit_price is None:
            inventory.unit_price = inventory.product.price
            inventory.save(update_fields=["unit_price"])


class Migration(migrations.Migration):

    dependencies = [
        ("inventory", "0003_stockmovement"),
    ]

    operations = [
        migrations.AddField(
            model_name="inventory",
            name="unit_price",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
        migrations.RunPython(backfill_unit_prices, migrations.RunPython.noop),
    ]
