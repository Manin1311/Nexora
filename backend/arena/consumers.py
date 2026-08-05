"""
WebSocket consumer for the Nexora Code Arena.

Each room has at most 2 players. State is held in the module-level ROOMS dict
(backed by arena.room_manager). The channel layer is used only for pub/sub
broadcasting — the source of truth is always ROOMS.

Event protocol (client → server):
  { "type": "progress_update", "progress": 0-100, "tests_passed": int }
  { "type": "battle_finish" }   — sent when all tests pass
  { "type": "ping" }            — keepalive

Event protocol (server → client):
  { "type": "room_state",    "room": {...} }
  { "type": "player_joined", "player": {...}, "room": {...} }
  { "type": "battle_start",  "room": {...} }
  { "type": "progress_update", "player_id": str, "progress": int, "tests_passed": int }
  { "type": "battle_finish", "winner_id": str, "winner_name": str }
  { "type": "player_left",   "player_id": str }
  { "type": "error",         "message": str }
"""

import asyncio
import json
import logging

from channels.generic.websocket import AsyncWebsocketConsumer

from .room_manager import ROOMS

logger = logging.getLogger(__name__)


class ArenaConsumer(AsyncWebsocketConsumer):
    # ── Lifecycle ──────────────────────────────────────────────────────────────

    async def connect(self):
        self.room_code = self.scope["url_route"]["kwargs"]["room_code"]
        self.room_group = f"arena_{self.room_code}"

        # Require authenticated user
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        self.user_id = str(user.id)
        self.username = user.full_name or (user.email.split('@')[0] if getattr(user, 'email', None) else "Developer")

        room = ROOMS.get(self.room_code)
        if room is None:
            await self.close(code=4004)
            return

        # Reject if room is finished
        if room["status"] == "finished":
            await self.close(code=4003)
            return

        self.player_key = self.user_id
        host_id = room.get("host_id")

        # Reject if the room creator tries to join their own room again from a second browser/tab
        if host_id and self.user_id == host_id and self.user_id in room["players"]:
            await self.accept()
            await self._send_json({
                "type": "error",
                "message": f"Both browser windows are currently logged into the SAME account ('{self.username}'). Please log out in one window and log in with a DIFFERENT account to battle!"
            })
            await self.close(code=4000)
            return

        # Reject if room is full and this connection key is not in it
        if len(room["players"]) >= 2 and self.player_key not in room["players"]:
            await self.close(code=4002)
            return

        player_display_name = self.username

        # Register player
        room["players"][self.player_key] = {
            "id": self.player_key,
            "user_id": self.user_id,
            "name": player_display_name,
            "progress": 0,
            "tests_passed": 0,
            "health": 0 if room.get("mode") == "aptitude" else 100,
            "score": 0,
            "answered_in_round": False,
            "last_answer_correct": None,
            "last_answer": None,
        }

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

        # Send current room snapshot to this client
        await self._send_json({"type": "room_state", "room": self._room_snapshot()})

        # Notify everyone in the room
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "ws_event",
                "payload": {
                    "type": "player_joined",
                    "player": {"id": self.player_key, "name": player_display_name},
                    "room": self._room_snapshot(),
                },
            },
        )

        # Auto-start when second player arrives
        if len(room["players"]) == 2 and room["status"] == "waiting":
            if room.get("mode") == "aptitude":
                # Start the async game loop task on the consumer's loop
                loop_task = asyncio.create_task(self.run_aptitude_game_loop(self.room_code))
                room["game_loop_task"] = loop_task
            else:
                room["status"] = "battle"
                await self.channel_layer.group_send(
                    self.room_group,
                    {
                        "type": "ws_event",
                        "payload": {"type": "battle_start", "room": self._room_snapshot()},
                    },
                )

    async def disconnect(self, close_code):
        room = ROOMS.get(self.room_code)
        player_key = getattr(self, "player_key", getattr(self, "user_id", None))

        if room and player_key and player_key in room["players"]:
            del room["players"][player_key]

            # Cancel task if a player leaves
            if "game_loop_task" in room:
                try:
                    room["game_loop_task"].cancel()
                except Exception:
                    pass

            # Notify remaining players
            await self.channel_layer.group_send(
                self.room_group,
                {
                    "type": "ws_event",
                    "payload": {"type": "player_left", "player_id": player_key},
                },
            )

            # Clean up empty finished/abandoned rooms
            if len(room["players"]) == 0:
                ROOMS.pop(self.room_code, None)

        if hasattr(self, "room_group"):
            await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        event_type = data.get("type")

        if event_type == "ping":
            await self._send_json({"type": "pong"})
            return

        if event_type == "progress_update":
            room = ROOMS.get(self.room_code)
            if room and self.player_key in room["players"]:
                room["players"][self.player_key]["progress"] = int(data.get("progress", 0))
                room["players"][self.player_key]["tests_passed"] = int(data.get("tests_passed", 0))

            await self.channel_layer.group_send(
                self.room_group,
                {
                    "type": "ws_event",
                    "payload": {
                        "type": "progress_update",
                        "player_id": self.player_key,
                        "progress": int(data.get("progress", 0)),
                        "tests_passed": int(data.get("tests_passed", 0)),
                    },
                },
            )

        elif event_type == "battle_finish":
            room = ROOMS.get(self.room_code)
            if room and room["status"] == "battle":
                room["status"] = "finished"
                room["winner"] = self.player_key

                await self.channel_layer.group_send(
                    self.room_group,
                    {
                        "type": "ws_event",
                        "payload": {
                            "type": "battle_finish",
                            "winner_id": self.player_key,
                            "winner_name": self.username,
                        },
                    },
                )

        elif event_type == "submit_answer":
            room = ROOMS.get(self.room_code)
            if room and room.get("mode") == "aptitude" and room["status"] == "battle":
                player = room["players"].get(self.player_key)
                if player and not player.get("answered_in_round", False):
                    player["answered_in_round"] = True
                    player["last_answer"] = data.get("answer")
                    
                    # Notify everyone that this player answered (hide the exact index)
                    await self.channel_layer.group_send(
                        self.room_group,
                        {
                            "type": "ws_event",
                            "payload": {
                                "type": "player_answered",
                                "player_id": self.player_key,
                            },
                        },
                    )

    # ── Channel layer message handler ──────────────────────────────────────────

    async def ws_event(self, event):
        """Relay any group broadcast to this WebSocket connection."""
        await self._send_json(event["payload"])

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def _send_json(self, data: dict):
        await self.send(text_data=json.dumps(data))

    def _room_snapshot(self) -> dict:
        room = ROOMS.get(self.room_code, {})
        snapshot = {
            "code": self.room_code,
            "status": room.get("status", "waiting"),
            "language": room.get("language", "javascript"),
            "challenge": room.get("challenge"),
            "mode": room.get("mode", "coding"),
            "players": {
                pid: {
                    "id": pid,
                    "name": p["name"],
                    "progress": p["progress"],
                    "tests_passed": p.get("tests_passed", 0),
                    "health": p.get("health", 100),
                    "score": p.get("score", 0),
                    "answered_in_round": p.get("answered_in_round", False),
                    "last_answer_correct": p.get("last_answer_correct", None),
                }
                for pid, p in room.get("players", {}).items()
            },
        }
        if room.get("mode") == "aptitude":
            snapshot["current_question_index"] = room.get("current_question_index", 0)
            snapshot["question_timer"] = room.get("question_timer", 30)
            snapshot["questions"] = [{k: v for k, v in q.items() if k != "correct_option"} for q in room.get("questions", [])]
        return snapshot

    async def run_aptitude_game_loop(self, room_code):
        room = ROOMS.get(room_code)
        if not room:
            return
        
        # 1. Start battle
        room["status"] = "battle"
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "ws_event",
                "payload": {
                    "type": "battle_start",
                    "room": self._room_snapshot()
                }
            }
        )

        questions = room.get("questions", [])
        num_questions = len(questions)

        try:
            for q_idx in range(num_questions):
                room = ROOMS.get(room_code)
                if not room or room["status"] != "battle":
                    break

                # Initialize round
                room["current_question_index"] = q_idx
                room["question_timer"] = 30
                for pid, player in room["players"].items():
                    player["answered_in_round"] = False
                    player["last_answer"] = None
                    player["last_answer_correct"] = None
                
                # Send round start
                await self.channel_layer.group_send(
                    self.room_group,
                    {
                        "type": "ws_event",
                        "payload": {
                            "type": "round_start",
                            "question_index": q_idx,
                            "room": self._room_snapshot()
                        }
                    }
                )

                # Countdown tick loop
                while room["question_timer"] > 0:
                    await asyncio.sleep(1)
                    room = ROOMS.get(room_code)
                    if not room or room["status"] != "battle":
                        return

                    room["question_timer"] -= 1

                    # Send tick update
                    await self.channel_layer.group_send(
                        self.room_group,
                        {
                            "type": "ws_event",
                            "payload": {
                                "type": "timer_tick",
                                "timer": room["question_timer"]
                            }
                        }
                    )

                    # Check if all players answered
                    active_players = room["players"]
                    if len(active_players) > 0 and all(p.get("answered_in_round", False) for p in active_players.values()):
                        break

                # Round end evaluation
                room = ROOMS.get(room_code)
                if not room or room["status"] != "battle":
                    return

                q_obj = questions[q_idx]
                correct_opt = q_obj["correct_option"]
                q_diff = q_obj.get("difficulty", "easy")
                points_for_q = 10 if q_diff == "easy" else (20 if q_diff == "medium" else 30)

                player_ids = list(room["players"].keys())
                correctness = {}

                for pid in player_ids:
                    p = room["players"][pid]
                    ans = p.get("last_answer")
                    if ans == correct_opt:
                        correctness[pid] = True
                        p["progress"] = min(p.get("progress", 0) + 20, 100)
                        p["score"] = p.get("score", 0) + points_for_q
                        p["health"] = min(p.get("health", 0) + points_for_q, 100)
                    else:
                        correctness[pid] = False

                for pid in player_ids:
                    p = room["players"][pid]
                    p["last_answer_correct"] = correctness[pid]

                # Send round end event
                await self.channel_layer.group_send(
                    self.room_group,
                    {
                        "type": "ws_event",
                        "payload": {
                            "type": "round_end",
                            "correct_option": correct_opt,
                            "room": self._room_snapshot()
                        }
                    }
                )

                # Check if game should end early
                if any(p.get("health", 100) <= 0 for p in room["players"].values()):
                    break

                # Wait before starting the next question
                await asyncio.sleep(4)

            # Game is finished
            room = ROOMS.get(room_code)
            if not room or room["status"] != "battle":
                return

            room["status"] = "finished"
            
            winner_id = None
            winner_name = None
            
            players_list = list(room["players"].items())
            if len(players_list) == 2:
                p1_id, p1 = players_list[0]
                p2_id, p2 = players_list[1]
                
                if p1["health"] > p2["health"]:
                    winner_id, winner_name = p1_id, p1["name"]
                elif p2["health"] > p1["health"]:
                    winner_id, winner_name = p2_id, p2["name"]
                else:
                    if p1["score"] > p2["score"]:
                        winner_id, winner_name = p1_id, p1["name"]
                    elif p2["score"] > p1["score"]:
                        winner_id, winner_name = p2_id, p2["name"]
            elif len(players_list) == 1:
                winner_id, winner_name = players_list[0][0], players_list[0][1]["name"]

            room["winner"] = winner_id

            await self.channel_layer.group_send(
                self.room_group,
                {
                    "type": "ws_event",
                    "payload": {
                        "type": "battle_finish",
                        "winner_id": winner_id,
                        "winner_name": winner_name
                    }
                }
            )
        except asyncio.CancelledError:
            pass
