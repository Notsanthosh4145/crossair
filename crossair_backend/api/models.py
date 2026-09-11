import random
import string

from django.conf import settings
from django.db import models


def generate_pnr():
    """6-character alphanumeric PNR, e.g. 4KX9QZ."""
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=6))


class Booking(models.Model):
    """
    One confirmed booking. The flight and passenger list are stored as JSON
    "snapshots" (rather than foreign keys to a Flight table) because flights
    in this app are generated on the fly per search, not stored ahead of
    time — see api/flights.py.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings"
    )
    pnr = models.CharField(max_length=10, unique=True, default=generate_pnr)
    flight = models.JSONField()          # the selected flight object, as sent by the frontend
    passengers = models.JSONField()      # list of {name, age, gender, seat}
    travel_date = models.CharField(max_length=10)  # ISO date string, e.g. "2026-09-14"
    total = models.DecimalField(max_digits=10, decimal_places=2)
    # We deliberately do NOT store full card details — only the last 4 digits,
    # purely for display. This is a simulated payment, never a real charge.
    card_last4 = models.CharField(max_length=4, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.pnr} ({self.user.username})"

    def as_dict(self):
        """Shape expected by the CrossAir frontend (Confirmation / Trips screens)."""
        return {
            "pnr": self.pnr,
            "email": self.user.email,
            "flight": self.flight,
            "date": self.travel_date,
            "passengers": self.passengers,
            "total": float(self.total),
        }
