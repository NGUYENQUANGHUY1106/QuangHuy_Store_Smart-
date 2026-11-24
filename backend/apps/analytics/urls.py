from django.urls import path

from .views import AdminDashboardMetricsView

urlpatterns = [
    path("admin/analytics/dashboard", AdminDashboardMetricsView.as_view()),
]
