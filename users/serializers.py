from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import AccountProfile, UserRole


def get_or_create_profile_for_user(user):
    role = UserRole.STAFF if user.is_staff else UserRole.CUSTOMER
    profile, _ = AccountProfile.objects.get_or_create(
        user=user,
        defaults={"role": role},
    )
    return profile


class DashCartTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        profile = get_or_create_profile_for_user(self.user)

        data["username"] = self.user.username
        data["role"] = profile.role
        return data


class RegisterSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=UserRole.choices)
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_username(self, value):
        User = get_user_model()
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        role = validated_data.pop("role")
        User = get_user_model()
        user = User.objects.create_user(**validated_data)
        AccountProfile.objects.update_or_create(user=user, defaults={"role": role})
        return user

    def to_representation(self, instance):
        profile = AccountProfile.objects.filter(user=instance).first()

        return {
            "id": instance.id,
            "username": instance.username,
            "role": profile.role if profile else UserRole.CUSTOMER,
        }
