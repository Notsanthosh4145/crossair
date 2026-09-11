from django.contrib import admin

from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("pnr", "user", "travel_date", "total", "created_at")
    search_fields = ("pnr", "user__username")
    list_filter = ("travel_date",)
