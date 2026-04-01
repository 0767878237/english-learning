from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class User(AbstractUser):
    """User model extension point.

    Keep simple for this sample: no additional user fields needed now.
    """
    pass


class RefreshToken(models.Model):
    """Opaque refresh tokens used for rotation flow.

    - `token`: randomly generated string returned via HttpOnly cookie.
    - `issued_at`: creation timestamp.
    - `expires_at`: absolute TTL.
    - `revoked`: manual invalidation flag (when user logs out, token rotation,
      or suspicious reuse detected).
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='refresh_tokens')
    token = models.CharField(max_length=255, unique=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    revoked = models.BooleanField(default=False)

    def __str__(self):
        return f"RefreshToken(user={self.user.username}, revoked={self.revoked})"

    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() >= self.expires_at

    @property
    def is_active(self):
        return not self.revoked and not self.is_expired
