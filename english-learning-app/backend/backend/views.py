import secrets
import logging
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model, authenticate
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import UserSerializer
from .models import RefreshToken
import jwt

logger = logging.getLogger(__name__)
User = get_user_model()


# INTERNAL HELPERS (not part of the public API)
# ---------------------------------------------------------------------------
# - Access token is a short-lived JWT (in body) used to authorize API endpoints.
# - Refresh token is a long-lived opaque random string stored in DB and HttpOnly cookie.


def _generate_access_token(user):
    """Generate a JWT access token with short TTL."""
    expiry = timezone.now() + timedelta(minutes=getattr(settings, 'JWT_ACCESS_TOKEN_LIFETIME_MINUTES', 15))
    payload = {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'exp': expiry,
        'iat': timezone.now(),
        # roles can be expanded if RBAC is needed later
        'roles': ['user'],
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _generate_refresh_token():
    """Generate a cryptographically secure opaque refresh token."""
    return secrets.token_urlsafe(64)


def _set_refresh_cookie(response, refresh_token):
    """Set HttpOnly (and optionally Secure) refresh token cookie on response."""
    secure_flag = not settings.DEBUG
    response.set_cookie(
        'refresh_token',
        refresh_token,
        httponly=True,
        secure=secure_flag,
        samesite='Lax',
        expires=timezone.now() + timedelta(days=getattr(settings, 'JWT_REFRESH_TOKEN_LIFETIME_DAYS', 30)),
        path='/'
    )


class RegisterView(APIView):
    """Endpoint: POST /api/register/

    - Validate input data
    - Prevent duplicated username/email
    - Create user
    - Return success (NO tokens - user must login manually)
    """
    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        username = request.data.get('username', '')
        email = request.data.get('email', '')
        
        logger.info(f"RegisterView: Signup attempt for username='{username}', email='{email}'")
        logger.info(f"Using database: {settings.DATABASES['default']['ENGINE']}")
        
        try:
            serializer = UserSerializer(data=request.data)
            if not serializer.is_valid():
                logger.warning(f"Signup validation failed for {username}: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            username = serializer.validated_data['username']
            email = serializer.validated_data['email']

            if User.objects.filter(username=username).exists():
                logger.warning(f"Signup rejected: username '{username}' already exists")
                return Response(
                    {'username': ['Tên người dùng này đã tồn tại. Vui lòng chọn tên khác.']},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if User.objects.filter(email=email).exists():
                logger.warning(f"Signup rejected: email '{email}' already exists")
                return Response(
                    {'email': ['Email này đã được sử dụng. Vui lòng sử dụng email khác.']},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create user using serializer (which calls our custom create() method)
            user = serializer.save()
            logger.info(f"User created: {username} (ID: {user.id})")

            # CRITICAL: Verify user actually exists in database
            if not User.objects.filter(id=user.id).exists():
                logger.error(f"CRITICAL BUG: User {username} (ID: {user.id}) created but NOT found in DB!")
                return Response(
                    {'error': 'Failed to save user to database. Please try again.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            logger.info(f"User {username} verified in database successfully")

            response = Response({
                'message': 'Đăng ký thành công! Vui lòng đăng nhập để bắt đầu học.',
                'user': {'id': user.pk, 'username': user.username, 'email': user.email},
            }, status=status.HTTP_201_CREATED)

            return response

        except Exception as e:
            logger.error(f"RegisterView exception for {username}: {str(e)}", exc_info=True)
            return Response(
                {'error': 'An unexpected error occurred. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoginView(APIView):
    """Endpoint: POST /api/login/

    - Verify username/password
    - Rotate refresh token (revoke previous active tokens)
    - Set new refresh token cookie
    - Return short-lived access token in response body
    """
    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        logger.info(f"LoginView: Login attempt for username='{username}'")
        
        user = authenticate(request, username=username, password=password)

        if not user:
            logger.warning(f"Login failed: Invalid credentials for username='{username}'")
            return Response({'detail': 'Tên đăng nhập hoặc mật khẩu không đúng.'}, status=status.HTTP_401_UNAUTHORIZED)

        access_token = _generate_access_token(user)
        refresh_token_value = _generate_refresh_token()

        # Revoke all previously issued refresh tokens for this user (rotation security)
        old_token_count = RefreshToken.objects.filter(user=user, revoked=False).update(revoked=True)
        refresh_token = RefreshToken.objects.create(
            user=user,
            token=refresh_token_value,
            expires_at=timezone.now() + timedelta(days=getattr(settings, 'JWT_REFRESH_TOKEN_LIFETIME_DAYS', 30))
        )
        
        logger.info(f"Login successful for {username}: revoked {old_token_count} old tokens, created new token")

        response = Response({
            'access_token': access_token,
            'user': {'id': user.pk, 'username': user.username, 'email': user.email}
        }, status=status.HTTP_200_OK)
        _set_refresh_cookie(response, refresh_token_value)
        return response


class RefreshTokenView(APIView):
    """Endpoint: POST /api/refresh/

    - Read refresh token from cookie
    - Validate it via DB and `is_active`
    - If invalid/expired, revoke all for security and force relogin
    - If valid, rotate refresh token and issue new access token
    """
    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        refresh_token_value = request.COOKIES.get('refresh_token')
        if not refresh_token_value:
            return Response({'detail': 'Refresh token không tìm thấy.'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            token_obj = RefreshToken.objects.get(token=refresh_token_value)
        except RefreshToken.DoesNotExist:
            return Response({'detail': 'Refresh token không hợp lệ.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not token_obj.is_active:
            # Session stolen or expired token used: revoke all to cut access
            token_obj.revoked = True
            token_obj.save()
            RefreshToken.objects.filter(user=token_obj.user).update(revoked=True)
            return Response({'detail': 'Refresh token hết hạn hoặc bị thu hồi. Vui lòng đăng nhập lại.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Token rotation: revoke current and issue fresh one
        token_obj.revoked = True
        token_obj.save()

        new_refresh_token = _generate_refresh_token()
        RefreshToken.objects.create(
            user=token_obj.user,
            token=new_refresh_token,
            expires_at=timezone.now() + timedelta(days=getattr(settings, 'JWT_REFRESH_TOKEN_LIFETIME_DAYS', 30))
        )

        access_token = _generate_access_token(token_obj.user)
        response = Response({'access_token': access_token}, status=status.HTTP_200_OK)
        _set_refresh_cookie(response, new_refresh_token)
        return response


class LogoutView(APIView):
    """Endpoint: POST /api/logout/

    - Revoke current refresh token from cookie
    - Delete refresh cookie client-side
    """
    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        refresh_token_value = request.COOKIES.get('refresh_token')
        if refresh_token_value:
            RefreshToken.objects.filter(token=refresh_token_value, revoked=False).update(revoked=True)

        response = Response({'detail': 'Đăng xuất thành công.'}, status=status.HTTP_200_OK)
        response.delete_cookie('refresh_token', path='/')
        return response


class MeView(APIView):
    """Endpoint: GET /api/me/

    - Requires Authorization: Bearer <access_token>
    - Returns current user info if token valid
    """
    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def get(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'detail': 'Authorization header thiếu hoặc không hợp lệ.'}, status=status.HTTP_401_UNAUTHORIZED)

        token = auth_header.split('Bearer ')[1]
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            user = User.objects.get(pk=payload['user_id'])
            return Response({'id': user.pk, 'username': user.username, 'email': user.email}, status=status.HTTP_200_OK)
        except (jwt.ExpiredSignatureError, jwt.DecodeError, User.DoesNotExist):
            return Response({'detail': 'Access token không hợp lệ hoặc đã hết hạn.'}, status=status.HTTP_401_UNAUTHORIZED)


class ProtectedView(APIView):
    # (Demo endpoint) exemplifies how IAuthenticated routes are protected.
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'detail': 'Bạn đang truy cập tài nguyên bảo vệ bằng xác thực.'})