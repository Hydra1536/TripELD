from django.urls import path
from .views import TripCreateView

urlpatterns = [
    path('create/', TripCreateView.as_view()),
]
