from django.db import migrations


def convert_admin_roles_to_staff(apps, schema_editor):
    User = apps.get_model("users", "User")
    AccountProfile = apps.get_model("users", "AccountProfile")

    User.objects.filter(role="admin").update(role="staff")
    AccountProfile.objects.filter(role="admin").update(role="staff")


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0005_alter_accountprofile_role_alter_user_role"),
    ]

    operations = [
        migrations.RunPython(convert_admin_roles_to_staff, migrations.RunPython.noop),
    ]
