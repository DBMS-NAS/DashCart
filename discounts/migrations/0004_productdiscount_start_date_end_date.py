import datetime

from django.db import migrations, models


def default_end_date():
    return datetime.date.today() + datetime.timedelta(days=30)


class Migration(migrations.Migration):

    dependencies = [
        ("discounts", "0003_discount_store"),
    ]

    operations = [
        migrations.AddField(
            model_name="productdiscount",
            name="start_date",
            field=models.DateField(default=datetime.date.today),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="productdiscount",
            name="end_date",
            field=models.DateField(default=default_end_date),
            preserve_default=False,
        ),
    ]
