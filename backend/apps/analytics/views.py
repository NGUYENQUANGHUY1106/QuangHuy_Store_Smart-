from datetime import date, datetime, time, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from django.db.models import Count, F, Sum
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import InventoryBalance
from apps.identity.permissions import IsAdminRole
from apps.orders.models import Order, OrderItem, OrderStatusEvent


class AdminDashboardMetricsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request: Request) -> Response:
        saigon_tz = ZoneInfo("Asia/Saigon")
        now_saigon = timezone.now().astimezone(saigon_tz)
        day = now_saigon.date()
        requested_day = request.query_params.get("date")
        if requested_day is not None:
            try:
                day = date.fromisoformat(requested_day)
                if requested_day != day.isoformat() or day == date.max:
                    raise ValueError
            except ValueError as error:
                raise ValidationError({"date": "Dùng định dạng YYYY-MM-DD."}) from error
        start = datetime.combine(day, time.min, tzinfo=saigon_tz)
        end = start + timedelta(days=1)
        completion_ids = OrderStatusEvent.objects.filter(
            to_status=Order.Status.COMPLETED, created_at__gte=start, created_at__lt=end
        ).values("order_id")
        delivered = Order.objects.filter(
            status=Order.Status.COMPLETED, pk__in=completion_ids
        )
        value = delivered.aggregate(value=Sum(F("subtotal") - F("discount")))["value"]
        top_products = list(
            OrderItem.objects.filter(order__in=delivered)
            .values("sku_snapshot")
            .annotate(quantity=Sum("qty"))
            .order_by("-quantity", "sku_snapshot")[:10]
        )

        status_counts = dict(
            Order.objects.values("status")
            .annotate(count=Count("id"))
            .values_list("status", "count")
        )

        low_stock_count = InventoryBalance.objects.filter(
            stock_qty__gt=0, stock_qty__lte=5
        ).count()
        out_of_stock_count = InventoryBalance.objects.filter(stock_qty=0).count()

        return Response(
            {
                "timezone": "Asia/Saigon",
                "server_time": now_saigon.isoformat(),
                "date": day.isoformat(),
                "revenue_delivered": f"{value or Decimal(0):.2f}",
                "cod_collected": None,
                "orders": {
                    "pending": status_counts.get(Order.Status.PENDING, 0),
                    "confirmed": status_counts.get(Order.Status.CONFIRMED, 0),
                    "shipping": status_counts.get(Order.Status.SHIPPING, 0),
                    "completed": status_counts.get(Order.Status.COMPLETED, 0),
                    "cancelled": status_counts.get(Order.Status.CANCELLED, 0),
                    "total": sum(status_counts.values()),
                },
                "inventory": {
                    "low_stock_count": low_stock_count,
                    "out_of_stock_count": out_of_stock_count,
                },
                "top_products": top_products,
                "metrics_policy": "dec_012",
            }
        )
