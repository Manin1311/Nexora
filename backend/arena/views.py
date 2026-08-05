"""
REST API views for the Code Arena.

POST /api/arena/rooms/           — Create a new battle room
GET  /api/arena/rooms/<code>/    — Get room info (validates joinability)
"""

import random
import time

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from .challenges import ARENA_CHALLENGES
from .aptitude_challenges import APTITUDE_CHALLENGES
from .room_manager import ROOMS, create_unique_room_code, purge_stale_rooms


class CreateRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        purge_stale_rooms()

        language = request.data.get("language", "javascript")
        if language not in ("javascript", "python"):
            language = "javascript"

        mode = request.data.get("mode", "coding")
        if mode not in ("coding", "aptitude"):
            mode = "coding"

        room_code = create_unique_room_code()
        
        if mode == "aptitude":
            challenge = None
            easy_pool = [q for q in APTITUDE_CHALLENGES if q.get("difficulty") == "easy"]
            med_pool  = [q for q in APTITUDE_CHALLENGES if q.get("difficulty") == "medium"]
            hard_pool = [q for q in APTITUDE_CHALLENGES if q.get("difficulty") == "hard"]
            
            selected_easy = random.sample(easy_pool, min(len(easy_pool), 2))
            selected_med  = random.sample(med_pool, min(len(med_pool), 1))
            selected_hard = random.sample(hard_pool, min(len(hard_pool), 2))
            
            questions = selected_easy + selected_med + selected_hard
        else:
            challenge = random.choice(ARENA_CHALLENGES)
            questions = []

        user_id = str(request.user.id)

        ROOMS[room_code] = {
            "code": room_code,
            "host_id": user_id,
            "challenge": challenge,
            "questions": questions,
            "mode": mode,
            "language": language,
            "status": "waiting",
            "players": {},
            "winner": None,
            "created_at": time.time(),
        }

        response_data = {
            "room_code": room_code,
            "challenge": challenge,
            "language": language,
            "mode": mode,
        }
        if mode == "aptitude":
            response_data["questions"] = [{k: v for k, v in q.items() if k != "correct_option"} for q in questions]

        return Response(
            response_data,
            status=status.HTTP_201_CREATED,
        )


class GetRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_code):
        code_upper = room_code.upper()
        room = ROOMS.get(code_upper)
        if not room:
            if code_upper.startswith("NEXO-"):
                challenge = random.choice(ARENA_CHALLENGES)
                room = {
                    "code": code_upper,
                    "host_id": str(request.user.id),
                    "challenge": challenge,
                    "questions": [],
                    "mode": "coding",
                    "language": "javascript",
                    "status": "waiting",
                    "players": {},
                    "winner": None,
                    "created_at": time.time(),
                }
                ROOMS[code_upper] = room
            else:
                return Response({"error": "Room not found."}, status=status.HTTP_404_NOT_FOUND)

        if room["status"] == "finished":
            return Response({"error": "This battle has already ended."}, status=status.HTTP_410_GONE)

        user_id = str(request.user.id)
        host_id = room.get("host_id")

        # Prevent creator/host from self-joining their own room in another window
        if host_id and user_id == host_id and user_id in room["players"]:
            user_name = request.user.full_name or request.user.email.split('@')[0]
            return Response(
                {"error": f"Both browser windows are currently logged into the SAME account ('{user_name}'). Please log out in one window and log in with a DIFFERENT account to battle!"},
                status=status.HTTP_400_BAD_REQUEST
            )

        existing_user_ids = [p.get("user_id", k) for k, p in room["players"].items()]
        if len(room["players"]) >= 2 and user_id not in room["players"] and user_id not in existing_user_ids:
            return Response({"error": "Room is full."}, status=status.HTTP_409_CONFLICT)

        response_data = {
            "room_code": room_code,
            "challenge": room["challenge"],
            "language": room["language"],
            "player_count": len(room["players"]),
            "status": room["status"],
            "mode": room.get("mode", "coding"),
        }
        if room.get("mode") == "aptitude":
            response_data["questions"] = [{k: v for k, v in q.items() if k != "correct_option"} for q in room.get("questions", [])]

        return Response(response_data)
