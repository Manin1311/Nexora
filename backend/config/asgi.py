"""
ASGI config for Nexora — supports both HTTP (Django) and WebSocket (Channels).
"""
import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from arena.routing import websocket_urlpatterns
from arena.middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    # Standard HTTP requests → Django
    "http": django_asgi_app,

    # WebSocket requests → Django Channels with JWT auth middleware
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddleware(
            URLRouter(websocket_urlpatterns)
        )
    ),
})


