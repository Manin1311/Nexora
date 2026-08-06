"""
Task manager for the Code Arena — tracks in-memory room state.
All rooms live here. They are purged after 30 min of inactivity.
"""
import random
import string
import time

# ── In-memory room store ──────────────────────────────────────────────────────
# Structure:
# ROOMS[room_code] = {
#   "code": str,
#   "challenge": dict,
#   "language": "javascript" | "python",
#   "status": "waiting" | "battle" | "finished",
#   "created_at": float,
#   "players": {
#       user_id_str: {"name": str, "progress": int, "tests_passed": int}
#   },
#   "winner": str | None
# }
ROOMS: dict = {}
USER_ROOM_COUNTS: dict = {}

ROOM_TTL_SECONDS = 30 * 60  # 30 minutes


def generate_room_code() -> str:
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"NEXO-{suffix}"


def create_unique_room_code() -> str:
    code = generate_room_code()
    while code in ROOMS:
        code = generate_room_code()
    return code


def purge_stale_rooms() -> None:
    """Remove rooms older than ROOM_TTL_SECONDS."""
    now = time.time()
    stale = [
        code
        for code, room in ROOMS.items()
        if now - room.get("created_at", now) > ROOM_TTL_SECONDS
    ]
    for code in stale:
        del ROOMS[code]
