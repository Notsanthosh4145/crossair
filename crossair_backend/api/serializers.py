from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Booking

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("That username is already taken.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )


class PassengerSerializer(serializers.Serializer):
    name = serializers.CharField()
    age = serializers.CharField()  # frontend sends it as a string from the number input
    gender = serializers.ChoiceField(choices=["Male", "Female", "Other"])
    seat = serializers.ChoiceField(choices=["Window", "Aisle", "Middle"])


class PaymentSerializer(serializers.Serializer):
    name = serializers.CharField()
    number = serializers.CharField()
    expiry = serializers.CharField()
    cvv = serializers.CharField()


class BookingCreateSerializer(serializers.Serializer):
    """
    Validates the payload the frontend sends from the Payment screen:
    { flight: {...}, passengers: [...], travel_date: "YYYY-MM-DD", payment: {...} }
    """
    flight = serializers.JSONField()
    passengers = PassengerSerializer(many=True)
    travel_date = serializers.CharField()
    payment = PaymentSerializer()

    def validate_flight(self, value):
        required = {"from", "to", "airline", "flightNo", "dep", "arr", "price"}
        if not required.issubset(value.keys()):
            raise serializers.ValidationError("Flight object is missing required fields.")
        return value

    def validate_passengers(self, value):
        if not value:
            raise serializers.ValidationError("At least one passenger is required.")
        return value

    def validate_payment(self, value):
        digits = value["number"].replace(" ", "")
        if not digits.isdigit() or len(digits) != 16:
            raise serializers.ValidationError("Enter a valid 16-digit card number.")
        if not value["cvv"].isdigit() or not (3 <= len(value["cvv"]) <= 4):
            raise serializers.ValidationError("Enter a valid CVV.")
        return value


class BookingSerializer(serializers.ModelSerializer):
    """Read serializer — but the frontend actually wants Booking.as_dict()'s
    shape (flat, camelCase-ish flight fields), so views call as_dict()
    directly rather than relying on this for output. Kept for admin/debug use."""

    class Meta:
        model = Booking
        fields = ["pnr", "flight", "passengers", "travel_date", "total", "created_at"]
