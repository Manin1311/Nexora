from django.urls import path
from .views import CreateRoomView, GetRoomView

urlpatterns = [
    path('rooms/',         CreateRoomView.as_view(), name='arena-create-room'),
    path('rooms/<str:room_code>/', GetRoomView.as_view(),    name='arena-get-room'),
]
