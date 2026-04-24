from .models import AccountProfile, User, UserRole


def get_account_role(auth_user):
    profile, _ = AccountProfile.objects.get_or_create(
        user=auth_user,
        defaults={"role": UserRole.STAFF if auth_user.is_staff else UserRole.CUSTOMER},
    )
    return profile.role


def get_or_create_database_user(auth_user):
    role = get_account_role(auth_user)
    email = auth_user.email or f"{auth_user.username}@dashcart.local"

    user, _ = User.objects.update_or_create(
        user_id=f"AUTH-{auth_user.id}",
        defaults={
            "name": auth_user.username,
            "email": email,
            "role": role,
        },
    )
    return user


def is_staff_account(auth_user):
    return get_account_role(auth_user) == UserRole.STAFF


def get_assigned_store(auth_user):
    profile = getattr(auth_user, "account_profile", None)
    return profile.store if profile else None
