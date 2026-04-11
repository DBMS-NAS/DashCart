from django.contrib import admin
from django.contrib.admin.sites import NotRegistered
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import AccountProfile, User


@admin.register(User)
class DatabaseUserAdmin(admin.ModelAdmin):
    list_display = ("user_id", "name", "email", "role")
    list_filter = ("role",)
    search_fields = ("user_id", "name", "email")


class AccountProfileInline(admin.StackedInline):
    model = AccountProfile
    can_delete = False
    extra = 0
    max_num = 1

    def get_extra(self, request, obj=None, **kwargs):
        if obj and not hasattr(obj, "account_profile"):
            return 1
        return 0


AuthUser = get_user_model()


class AuthUserAdmin(DjangoUserAdmin):
    inlines = (AccountProfileInline,)
    list_display = DjangoUserAdmin.list_display + ("account_role",)

    @admin.display(description="Role")
    def account_role(self, obj):
        profile = getattr(obj, "account_profile", None)
        return profile.role if profile else "No role selected"


try:
    admin.site.unregister(AuthUser)
except NotRegistered:
    pass

admin.site.register(AuthUser, AuthUserAdmin)


@admin.register(AccountProfile)
class AccountProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "created_at")
    list_filter = ("role",)
    search_fields = ("user__username",)
