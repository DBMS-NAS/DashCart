from django.conf import settings
from django.db import migrations


def create_missing_account_profiles(apps, schema_editor):
    app_label, model_name = settings.AUTH_USER_MODEL.split(".")
    AuthUser = apps.get_model(app_label, model_name)
    AccountProfile = apps.get_model("users", "AccountProfile")

    for user in AuthUser.objects.all():
        if user.is_superuser:
            role = "admin"
        elif user.is_staff:
            role = "staff"
        else:
            role = "customer"

        AccountProfile.objects.get_or_create(
            user_id=user.pk,
            defaults={"role": role},
        )


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_alter_user_role"),
    ]

    operations = [
        migrations.RunPython(create_missing_account_profiles, migrations.RunPython.noop),
    ]
