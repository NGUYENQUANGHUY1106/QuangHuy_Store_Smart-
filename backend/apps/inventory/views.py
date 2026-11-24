from uuid import UUID

from django.db import transaction
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import InventoryBalance, InventoryMovement, ProductVariant
from apps.identity.models import User
from apps.identity.permissions import IsAdminRole


class InventoryAdjustView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request: Request) -> Response:
        user = request.user
        assert isinstance(user, User)
        variant_id = request.data.get("variant_id")
        delta = request.data.get("delta")
        reason = str(request.data.get("reason", "")).strip()
        operation_key = request.data.get("operation_key")
        try:
            variant_id = UUID(str(variant_id))
        except ValueError:
            variant_id = None

        if (
            variant_id is None
            or type(delta) is not int
            or not 0 < abs(delta) <= 2_147_483_647
        ):
            return Response(
                {
                    "error": {
                        "code": "validation_error",
                        "message": "Delta phải là số nguyên khác 0 và có variant_id.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if (
            not isinstance(operation_key, str)
            or not 1 <= len(operation_key.strip()) <= 128
            or not 1 <= len(reason) <= 255
        ):
            return Response(
                {
                    "error": {
                        "code": "validation_error",
                        "message": "Cần lý do 1–255 ký tự và khóa dài 1–128 ký tự.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        operation_key = operation_key.strip()

        def replay(movement: InventoryMovement) -> Response:
            if (
                movement.variant_id != variant_id
                or movement.delta != delta
                or movement.reason != reason
                or (movement.actor_id is not None and movement.actor_id != user.pk)
            ):
                return Response(
                    {
                        "error": {
                            "code": "idempotency_conflict",
                            "message": "Khóa đã dùng cho điều chỉnh khác.",
                        }
                    },
                    status=409,
                )
            return Response(
                {
                    "replayed": True,
                    "variant_id": str(variant_id),
                    "stock_qty": movement.after_qty,
                    "movement_id": str(movement.id),
                }
            )

        with transaction.atomic():
            variant = (
                ProductVariant.objects.select_for_update().filter(id=variant_id).first()
            )
            if not variant:
                return Response(
                    {
                        "error": {
                            "code": "not_found",
                            "message": "Không tìm thấy biến thể sản phẩm.",
                        }
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

            balance, _ = InventoryBalance.objects.select_for_update().get_or_create(
                variant=variant,
                defaults={"stock_qty": 0},
            )

            movements = InventoryMovement.objects.filter(
                kind=InventoryMovement.Kind.ADJUST
            )
            existing = movements.filter(operation_key=operation_key).first()
            if existing:
                return replay(existing)

            before_qty = balance.stock_qty
            after_qty = before_qty + delta

            if after_qty > 2_147_483_647:
                return Response(
                    {
                        "error": {
                            "code": "stock_limit",
                            "message": "Tồn kho vượt giới hạn.",
                        }
                    },
                    status=409,
                )
            if after_qty < 0:
                return Response(
                    {
                        "error": {
                            "code": "insufficient_stock",
                            "message": (
                                f"Tồn kho ({before_qty}) không đủ để giảm {abs(delta)}."
                            ),
                        }
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            movement, created = movements.get_or_create(
                operation_key=operation_key,
                kind=InventoryMovement.Kind.ADJUST,
                defaults={
                    "variant": variant,
                    "delta": delta,
                    "before_qty": before_qty,
                    "after_qty": after_qty,
                    "reason": reason,
                    "actor": user,
                },
            )
            if not created:
                return replay(movement)
            balance.stock_qty = after_qty
            balance.save(update_fields=["stock_qty", "updated_at"])

        return Response(
            {
                "variant_id": str(variant.id),
                "sku": variant.sku,
                "before_qty": before_qty,
                "delta": delta,
                "after_qty": after_qty,
                "movement_id": str(movement.id),
                "reason": movement.reason,
            },
            status=status.HTTP_201_CREATED,
        )


class InventoryMovementListView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request: Request) -> Response:
        queryset = InventoryMovement.objects.select_related(
            "variant", "variant__product"
        ).order_by("-created_at")
        variant_id = request.query_params.get("variant_id")
        if variant_id:
            try:
                variant_uuid = UUID(variant_id)
            except ValueError as exc:
                raise ValidationError({"variant_id": "Invalid UUID."}) from exc
            queryset = queryset.filter(variant_id=variant_uuid)
        kind = request.query_params.get("kind")
        if kind:
            queryset = queryset.filter(kind=kind)

        results = [
            {
                "id": str(m.id),
                "variant_id": str(m.variant_id),
                "sku": m.variant.sku,
                "product_name": m.variant.product.name,
                "kind": m.kind,
                "delta": m.delta,
                "before_qty": m.before_qty,
                "after_qty": m.after_qty,
                "reason": m.reason,
                "operation_key": m.operation_key,
                "actor_id": str(m.actor_id) if m.actor_id else None,
                "created_at": m.created_at.isoformat(),
            }
            for m in queryset[:100]
        ]
        return Response({"count": len(results), "results": results})


class InventoryBalanceListView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request: Request) -> Response:
        balances = InventoryBalance.objects.select_related(
            "variant", "variant__product"
        ).order_by("variant__sku")
        results = [
            {
                "variant_id": str(b.variant_id),
                "sku": b.variant.sku,
                "product_name": b.variant.product.name,
                "size": b.variant.size,
                "color": b.variant.color,
                "stock_qty": b.stock_qty,
                "updated_at": b.updated_at.isoformat(),
            }
            for b in balances
        ]
        return Response({"count": len(results), "results": results})
