from io import BytesIO
from uuid import UUID, uuid4

from django.core.files.uploadedfile import UploadedFile
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from PIL import Image, ImageOps, UnidentifiedImageError
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ProfileAvatar, User
from .presentation import avatar_url


class ProfileAvatarView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def put(self, request: Request) -> Response:
        user = request.user
        assert isinstance(user, User)
        upload = request.FILES.get("avatar")
        if (
            not isinstance(upload, UploadedFile)
            or upload.size is None
            or not 0 < upload.size <= 5 * 1024 * 1024
        ):
            raise ValidationError({"detail": "Chọn một ảnh tối đa 5 MB."})
        output = BytesIO()
        try:
            with Image.open(upload, formats=["JPEG", "PNG", "WEBP"]) as image:
                if not 0 < image.width * image.height <= 16_000_000:
                    raise ValidationError(
                        {"detail": "Ảnh vượt quá kích thước cho phép."}
                    )
                ImageOps.fit(
                    ImageOps.exif_transpose(image).convert("RGB"), (256, 256)
                ).save(output, "WEBP", quality=88)
        except (
            UnidentifiedImageError,
            Image.DecompressionBombError,
            OSError,
            ValueError,
        ):
            raise ValidationError(
                {"detail": "Vui lòng chọn ảnh JPEG, PNG hoặc WebP hợp lệ."}
            ) from None
        # Replace the opaque URL each time so current reviews use the new image.
        avatar, _ = ProfileAvatar.objects.update_or_create(
            user=user, defaults={"webp": output.getvalue(), "key": uuid4()}
        )
        user.avatar = avatar
        return Response({"avatar_url": avatar_url(user)})

    def delete(self, request: Request) -> Response:
        user = request.user
        assert isinstance(user, User)
        ProfileAvatar.objects.filter(user=user).delete()
        return Response({"avatar_url": None})


class ProfileAvatarImageView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list[type] = []

    def get(self, request: Request, key: UUID) -> HttpResponse:
        avatar = get_object_or_404(ProfileAvatar.objects.only("webp"), key=key)
        response = HttpResponse(bytes(avatar.webp), content_type="image/webp")
        response["Cache-Control"] = "no-store"
        response["X-Content-Type-Options"] = "nosniff"
        return response
