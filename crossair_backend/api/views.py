from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from .flights import generate_flights
from .models import Booking
from .serializers import (
    BookingCreateSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()


def tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


# ---------------------------------------------------------------------------
# AUTH
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    # Best-effort confirmation email — a failure here (e.g. bad SMTP
    # credentials) should never block the account from being created.
    try:
        send_mail(
            subject="Welcome to CrossAir!",
            message=(
                f"Hi {user.username},\n\n"
                "Your CrossAir account has been created successfully. "
                "You can now log in and start booking flights.\n\n"
                "— The CrossAir Team"
            ),
            from_email=None,  # uses DEFAULT_FROM_EMAIL
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception:
        pass

    return Response(
        {"detail": "Registered successfully! Check your email for confirmation, then log in."},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get("username", "")
    password = request.data.get("password", "")
    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response({"detail": "Invalid username or password."}, status=status.HTTP_401_UNAUTHORIZED)
    data = tokens_for_user(user)
    data["user"] = UserSerializer(user).data
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    refresh_token = request.data.get("refresh")
    if refresh_token:
        try:
            RefreshToken(refresh_token).blacklist()
        except TokenError:
            pass  # already invalid/expired — logout should still succeed client-side
    return Response({"detail": "Logged out."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


# ---------------------------------------------------------------------------
# FLIGHTS
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search_flights(request):
    from_city = request.query_params.get("from", "").strip()
    to_city = request.query_params.get("to", "").strip()
    date = request.query_params.get("date", "").strip()

    if not from_city or not to_city or not date:
        return Response(
            {"detail": "Query params 'from', 'to' and 'date' are all required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if from_city == to_city:
        return Response(
            {"detail": "Origin and destination can't be the same city."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    flights = generate_flights(from_city, to_city, date)
    return Response(flights)


# ---------------------------------------------------------------------------
# BOOKINGS
# ---------------------------------------------------------------------------

class BookingListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        flight = data["flight"]
        passengers = data["passengers"]
        total = float(flight["price"]) * len(passengers)
        card_last4 = data["payment"]["number"].replace(" ", "")[-4:]

        booking = Booking.objects.create(
            user=request.user,
            flight=flight,
            passengers=passengers,
            travel_date=data["travel_date"],
            total=total,
            card_last4=card_last4,
        )
        return Response(booking.as_dict(), status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_bookings(request):
    bookings = request.user.bookings.all()
    return Response([b.as_dict() for b in bookings])
