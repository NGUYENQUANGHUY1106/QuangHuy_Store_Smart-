from datetime import date, datetime, time, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from django.db.models import Count, F, Max, OuterRef, Subquery, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import InventoryBalance, Product
from apps.identity.models import User
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
        period = request.query_params.get("days", "1")
        if period not in {"1", "7", "14", "30"}:
            raise ValidationError({"days": "Chọn 1, 7, 14 hoặc 30 ngày."})
        days = int(period)
        if day < date(2, 1, 1):
            raise ValidationError({"date": "Ngày báo cáo nằm ngoài phạm vi hỗ trợ."})
        first_day = day - timedelta(days=days - 1)
        start = datetime.combine(first_day, time.min, tzinfo=saigon_tz)
        end = datetime.combine(day + timedelta(days=1), time.min, tzinfo=saigon_tz)
        completion_time = (
            OrderStatusEvent.objects.filter(
                order_id=OuterRef("pk"), to_status=Order.Status.COMPLETED
            )
            .order_by("created_at", "pk")
            .values("created_at")[:1]
        )
        delivered = (
            Order.objects.filter(status=Order.Status.COMPLETED)
            .annotate(completed_at=Subquery(completion_time))
            .filter(completed_at__gte=start, completed_at__lt=end)
        )
        delivered_days = {
            row["day"]: row
            for row in delivered.annotate(
                day=TruncDate("completed_at", tzinfo=saigon_tz)
            )
            .values("day")
            .annotate(value=Sum(F("subtotal") - F("discount")), count=Count("id"))
        }
        period_orders = Order.objects.filter(created_at__gte=start, created_at__lt=end)
        order_days = dict(
            period_orders.annotate(day=TruncDate("created_at", tzinfo=saigon_tz))
            .values("day")
            .annotate(count=Count("id"))
            .values_list("day", "count")
        )
        series = []
        value = Decimal(0)
        for offset in range(days):
            current = first_day + timedelta(days=offset)
            delivery = delivered_days.get(current, {})
            daily_value = delivery.get("value", Decimal(0))
            value += daily_value
            series.append(
                {
                    "date": current.isoformat(),
                    "revenue_delivered": f"{daily_value:.2f}",
                    "orders_created": order_days.get(current, 0),
                    "orders_completed": delivery.get("count", 0),
                }
            )
        top_products = list(
            OrderItem.objects.filter(order__in=delivered)
            .values("sku_snapshot")
            .annotate(
                quantity=Sum("qty"),
                name=Max("product_name_snapshot"),
                color=Max("color_snapshot"),
                size=Max("size_snapshot"),
            )
            .order_by("-quantity", "sku_snapshot")[:10]
        )

        status_counts = dict(
            Order.objects.values("status")
            .annotate(count=Count("id"))
            .values_list("status", "count")
        )

        inventory = InventoryBalance.objects.filter(stock_qty__lte=5)
        low_stock_count = inventory.filter(stock_qty__gt=0).count()
        out_of_stock_count = inventory.filter(stock_qty=0).count()
        catalog = dict(
            Product.objects.values("status")
            .annotate(count=Count("id"))
            .values_list("status", "count")
        )
        recent = [
            {**order, "total": f"{order['total']:.2f}"}
            for order in period_orders.order_by("-created_at", "pk").values(
                "id", "number", "status", "created_at", "total"
            )[:6]
        ]

        return Response(
            {
                "timezone": "Asia/Saigon",
                "server_time": now_saigon.isoformat(),
                "date": day.isoformat(),
                "start_date": first_day.isoformat(),
                "revenue_delivered": f"{value:.2f}",
                "series": series,
                "recent_orders": recent,
                "catalog": {
                    "published": catalog.get(Product.Status.PUBLISHED, 0),
                    "draft": catalog.get(Product.Status.DRAFT, 0),
                    "archived": catalog.get(Product.Status.ARCHIVED, 0),
                    "active_customers": User.objects.filter(
                        role=User.Role.CUSTOMER, is_active=True
                    ).count(),
                },
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
                    "watch": list(
                        inventory.order_by("stock_qty", "variant__sku").values(
                            "variant__sku",
                            "variant__product__name",
                            "variant__color",
                            "variant__size",
                            "stock_qty",
                        )[:6]
                    ),
                },
                "top_products": [
                    {"sku_snapshot": row["sku_snapshot"], "quantity": row["quantity"]}
                    for row in top_products
                ],
                "top_skus": top_products,
                "metrics_policy": "dec_012",
            }
        )
