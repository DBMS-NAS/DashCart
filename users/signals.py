from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import AccountProfile, UserRole


@receiver(post_save, sender=get_user_model())
def create_account_profile(sender, instance, created, **kwargs):
    if not created:
        return

    role = UserRole.STAFF if instance.is_staff else UserRole.CUSTOMER
    AccountProfile.objects.get_or_create(
        user=instance,
        defaults={"role": role},
    )
