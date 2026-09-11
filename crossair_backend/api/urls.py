from django.urls import path

from . import views

urlpatterns = [
    path("auth/register/", views.register),
    path("auth/login/", views.login),
    path("auth/logout/", views.logout),
    path("auth/me/", views.me),
    path("flights/search/", views.search_flights),
    path("bookings/", views.BookingListCreateView.as_view()),
    path("bookings/my/", views.my_bookings),
]
