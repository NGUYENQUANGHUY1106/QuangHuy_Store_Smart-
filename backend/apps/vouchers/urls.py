from django.urls import path

from .admin_views import AdminVoucherDetail, AdminVoucherList
from .views import VoucherValidateView

urlpatterns = [
    path("admin/vouchers", AdminVoucherList.as_view()),
    path("admin/vouchers/<int:pk>", AdminVoucherDetail.as_view()),
    path("vouchers/validate", VoucherValidateView.as_view()),
]
