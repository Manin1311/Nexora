from datetime import date, timedelta
from django.db import transaction
from django.utils import timezone
from .models import ScheduledTask
import random


def _get_current_roadmap_week(user, today):
    """
    Returns the RoadmapWeek that corresponds to today based on the
    user's active LearningPath creation date.
    Week 1 starts on the day the roadmap was created.
    Returns None if no active roadmap found.
    """
    try:
        from roadmap.models import LearningPath, RoadmapWeek
        path = LearningPath.objects.filter(user=user, is_active=True).order_by('-created_at').first()
        if not path:
            return None, None

        start_date = path.created_at.date()
        days_elapsed = (today - start_date).days
        current_week_number = (days_elapsed // 7) + 1  # Week 1-indexed

        # Get the roadmap week matching the current week number
        week = RoadmapWeek.objects.filter(
            path=path, week_number=current_week_number
        ).first()

        # If we've gone past all weeks, return the last week
        if not week:
            week = RoadmapWeek.objects.filter(path=path).order_by('-week_number').first()

        return path, week
    except Exception:
        return None, None


def _resolve_challenge_url(week_task):
    """
    Resolves the best target URL for a challenge WeekTask.
    Uses the direct challenge_id link if available and exists in DB, else generic /challenges.
    """
    if week_task.challenge_id:
        from challenges.models import Challenge
        if Challenge.objects.filter(id=week_task.challenge_id, is_active=True).exists():
            return f"/challenges/{week_task.challenge_id}"
    return "/challenges"


def _seed_from_roadmap(user, today, week):
    """
    Seeds ScheduledTask entries from the given RoadmapWeek's WeekTasks.
    Maps WeekTask types to ScheduledTask types and preserves topic_label.
    """
    from roadmap.models import WeekTask

    week_tasks = list(week.tasks.filter(is_done=False).order_by('order')[:6])
    if not week_tasks:
        return False

    PRIORITY_MAP = {
        'challenge': 3,  # High — active practice
        'interview': 2,  # Medium — mock sessions
        'study':     1,  # Low — reading/revision
    }

    created_count = 0
    for wt in week_tasks:
        # Avoid duplicating tasks already scheduled for today from this week
        already_exists = ScheduledTask.objects.filter(
            user=user,
            roadmap_week=week,
            title=wt.title,
            scheduled_date=today,
        ).exists()
        if already_exists:
            continue

        # Resolve the best URL for this task type
        if wt.task_type == 'challenge':
            target_url = _resolve_challenge_url(wt)
        elif wt.task_type == 'interview':
            target_url = '/interview'
        else:
            target_url = '/revision'

        ScheduledTask.objects.create(
            user=user,
            task_type=wt.task_type,
            title=wt.title,
            description=wt.description or f"Complete this {wt.task_type} task for {week.focus_area}.",
            scheduled_date=today,
            priority=PRIORITY_MAP.get(wt.task_type, 2),
            target_url=target_url,
            topic_label=week.focus_area,
            roadmap_week=week,
        )
        created_count += 1
        if created_count >= 3:  # Cap today at 3 new tasks
            break

    return created_count > 0


# _seed_generic is intentionally removed.
# New users without a roadmap should see an empty scheduler with a prompt to create one.
# Generic placeholder tasks add confusion and false expectations.


@transaction.atomic
def load_balance_schedule(user):
    """
    Core dynamic scheduling algorithm — now roadmap-aware and self-cleaning.

    1. If user has an active roadmap, delete any incomplete generic/non-roadmap tasks.
    2. De-duplicate any incomplete tasks with identical titles.
    3. Sanitize invalid target_urls pointing to non-existent challenges.
    4. Seed today's tasks from the active roadmap week if no tasks exist.
    5. Move overdue high priority tasks to today, push others to future dates.
    6. Ensure Today and subsequent dates have a strict max cap of 3 tasks, pushing overflow forward.
    """
    today = date.today()

    # --- 1. Cleanup: if roadmap is active, purge ALL stale incomplete tasks ---
    # This handles both generic tasks AND any tasks incorrectly back-filled
    # with a roadmap_week that don't match the actual roadmap WeekTasks.
    from roadmap.models import LearningPath
    path = LearningPath.objects.filter(user=user, is_active=True).order_by('-created_at').first()

    if path:
        # Get the real WeekTask titles from this roadmap
        from roadmap.models import WeekTask
        valid_titles = set(
            WeekTask.objects.filter(week__path=path)
            .values_list('title', flat=True)
        )
        # Delete any incomplete task whose title is NOT a genuine roadmap WeekTask
        ScheduledTask.objects.filter(
            user=user,
            completed=False,
        ).exclude(title__in=valid_titles).delete()

    # --- 2. De-duplicate incomplete tasks ---
    all_incomplete = ScheduledTask.objects.filter(user=user, completed=False)
    seen_titles = set()
    to_delete_ids = []
    for t in all_incomplete:
        # Unique check by title + scheduled_date
        key = (t.title.strip().lower(), t.scheduled_date)
        if key in seen_titles:
            to_delete_ids.append(t.id)
        else:
            seen_titles.add(key)
    
    if to_delete_ids:
        ScheduledTask.objects.filter(id__in=to_delete_ids).delete()

    # --- 2b. Sanitize target_urls: if target_url points to a /challenges/<id> that is missing, set to /challenges ---
    challenge_tasks = ScheduledTask.objects.filter(
        user=user,
        completed=False,
        task_type='challenge',
        target_url__startswith='/challenges/'
    )
    from challenges.models import Challenge
    for ct in challenge_tasks:
        try:
            parts = ct.target_url.strip('/').split('/')
            if len(parts) >= 2 and parts[1].isdigit():
                c_id = int(parts[1])
                if not Challenge.objects.filter(id=c_id, is_active=True).exists():
                    ct.target_url = '/challenges'
                    ct.save(update_fields=['target_url'])
            else:
                ct.target_url = '/challenges'
                ct.save(update_fields=['target_url'])
        except Exception:
            ct.target_url = '/challenges'
            ct.save(update_fields=['target_url'])

    # --- 3. First-time seed from roadmap only ---
    # If user has no tasks at all, try to seed from their active roadmap week.
    # If no roadmap exists yet, leave empty — the widget shows the 'Create Roadmap' prompt.
    if not ScheduledTask.objects.filter(user=user).exists():
        _, week = _get_current_roadmap_week(user, today)
        if week:
            _seed_from_roadmap(user, today, week)

    # --- 4. Shift overdue tasks ---
    overdue_tasks = ScheduledTask.objects.filter(
        user=user,
        completed=False,
        scheduled_date__lt=today,
    )

    adapted = False
    if overdue_tasks.exists():
        high_priority = list(overdue_tasks.filter(priority=3))
        low_medium_priority = list(overdue_tasks.exclude(priority=3))

        # Move high priority to today
        for t in high_priority:
            t.scheduled_date = today
            t.save()
            adapted = True

        # Push lower priority to future slots (cap: 3 tasks per day)
        future_date = today + timedelta(days=1)
        for t in low_medium_priority:
            day_to_schedule = future_date
            while True:
                cnt = ScheduledTask.objects.filter(
                    user=user, scheduled_date=day_to_schedule, completed=False
                ).count()
                if cnt < 3:
                    break
                day_to_schedule += timedelta(days=1)
            t.scheduled_date = day_to_schedule
            t.save()
            adapted = True

    # --- 5. If today still has no tasks, seed from current roadmap week ---
    today_count = ScheduledTask.objects.filter(user=user, scheduled_date=today).count()
    if today_count == 0:
        _, week = _get_current_roadmap_week(user, today)
        if week:
            _seed_from_roadmap(user, today, week)

    # --- 6. Enforce STRICT limit of 3 incomplete tasks per day starting today ---
    # If today or future days exceed 3 tasks (due to manual creation, seeding or shifts),
    # push the lower priority tasks to subsequent days.
    check_date = today
    # Limit check window to 14 days forward to prevent infinite loops
    for _ in range(14):
        day_tasks = list(ScheduledTask.objects.filter(
            user=user,
            scheduled_date=check_date,
            completed=False
        ).order_by('-priority', '-id'))

        if len(day_tasks) > 3:
            # Keep top 3, push the rest to tomorrow
            excess = day_tasks[3:]
            tomorrow = check_date + timedelta(days=1)
            for t in excess:
                t.scheduled_date = tomorrow
                t.save()
                adapted = True
        
        check_date += timedelta(days=1)

    return adapted

