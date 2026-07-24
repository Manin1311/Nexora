from django.urls import re_path
from .consumers import ArenaConsumer

websocket_urlpatterns = [
    re_path(r"ws/arena/(?P<room_code>[A-Z0-9\-]+)/$", ArenaConsumer.as_asgi()),
]
