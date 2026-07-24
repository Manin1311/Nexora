"""
Utility functions for progress tracking, XP awarding, and activity logging.
"""
from django.utils import timezone
import uuid


def award_xp(user, xp_amount: int):
    """Award XP to a user and update their rank."""
    try:
        profile = user.profile
        profile.total_xp += xp_amount
        profile.update_rank()
        # Update streak
        today = timezone.now().date()
        if profile.last_active_date:
            delta = (today - profile.last_active_date).days
            if delta == 1:
                profile.streak_days += 1
            elif delta > 1:
                profile.streak_days = 1
        else:
            profile.streak_days = 1
        profile.last_active_date = today
        profile.save()
    except Exception:
        pass


def log_activity(user, activity_type: str, description: str, xp_earned: int = 0, metadata: dict = None):
    """Log a user activity to the timeline."""
    try:
        from progress.models import UserActivity
        UserActivity.objects.create(
            user=user,
            activity_type=activity_type,
            description=description,
            xp_earned=xp_earned,
            metadata=metadata or {}
        )
        
        # Create a notification for the activity
        from users.models import Notification
        title = "Activity Logged! 📈" if xp_earned == 0 else f"+{xp_earned} XP Earned! ⚡"
        # If it's a code arena activity, make it sound combat-ready!
        if activity_type == 'arena_battle':
            title = "Arena Battle Logged! ⚔️"
        Notification.objects.create(
            user=user,
            title=title,
            message=description
        )
    except Exception:
        pass

    # Trigger achievement checks (prevent recursion loop by checking activity_type)
    if activity_type != 'achievement_earned':
        try:
            check_and_award_achievements(user)
        except Exception as e:
            print(f"[Achievements] Trigger from log_activity failed: {e}")


def generate_certificate_id():
    """Generate a unique certificate ID."""
    return f"NXR-{uuid.uuid4().hex[:12].upper()}"


def award_certificate(user, challenge, score: int):
    """
    Issue a certificate when a Hard or Medium challenge is completed with score >= 70.
    Returns the Certificate object if created, None otherwise.
    """
    try:
        from progress.models import Certificate
        # Only hard/medium challenges with a passing score earn certificates
        if challenge.difficulty not in ('hard', 'medium') or score < 70:
            return None
        # Avoid duplicate certificates for the same challenge
        if Certificate.objects.filter(user=user, challenge=challenge).exists():
            return Certificate.objects.get(user=user, challenge=challenge)
        difficulty_label = challenge.difficulty.capitalize()
        cert = Certificate.objects.create(
            user=user,
            challenge=challenge,
            title=f"{difficulty_label} Challenge Certificate: {challenge.title}",
            description=(
                f"This certifies that {user.full_name or user.email} successfully completed "
                f"the {difficulty_label} challenge \u2018{challenge.title}\u2019 "
                f"on the Nexora platform with a score of {score}/100."
            ),
            certificate_id=generate_certificate_id(),
        )
        log_activity(
            user,
            'achievement_earned',
            f'Earned certificate for: {challenge.title}',
            0,
            {'certificate_id': cert.certificate_id, 'challenge_id': challenge.id}
        )
        return cert
    except Exception as e:
        print(f"[Certificate] award_certificate failed: {e}")
        return None


def award_roadmap_certificate(user, week):
    """
    Issue a competency certificate when all tasks in a roadmap week are completed.
    """
    try:
        from progress.models import Certificate
        focus_title = f"Competency in {week.focus_area}"
        # Prevent duplicates
        if Certificate.objects.filter(user=user, title__icontains=focus_title).exists():
            return Certificate.objects.get(user=user, title__icontains=focus_title)

        cert = Certificate.objects.create(
            user=user,
            title=f"Competency in {week.focus_area}",
            description=(
                f"This certifies that {user.full_name or user.email} successfully completed "
                f"the AI-curated curriculum and tests for '{week.focus_area}' "
                f"on the Nexora platform."
            ),
            certificate_id=generate_certificate_id(),
        )
        log_activity(
            user,
            'achievement_earned',
            f"Earned competency certificate: {week.focus_area}",
            100, # bonus XP!
            {'certificate_id': cert.certificate_id, 'week_id': week.id}
        )
        award_xp(user, 100)
        return cert
    except Exception as e:
        print(f"[Certificate] award_roadmap_certificate failed: {e}")
        return None


def seed_default_achievements():
    """Seed standard platform achievements if they do not exist in the database."""
    from progress.models import Achievement
    defaults = [
        {
            'name': 'First Steps',
            'description': 'Complete your first coding challenge.',
            'icon': '🌱',
            'xp_reward': 50,
            'criteria': {'type': 'challenges_completed', 'value': 1}
        },
        {
            'name': 'Coding Hobbyist',
            'description': 'Complete 5 coding challenges.',
            'icon': '💻',
            'xp_reward': 100,
            'criteria': {'type': 'challenges_completed', 'value': 5}
        },
        {
            'name': 'Coding Warrior',
            'description': 'Complete 10 coding challenges.',
            'icon': '⚔️',
            'xp_reward': 200,
            'criteria': {'type': 'challenges_completed', 'value': 10}
        },
        {
            'name': 'Mock Pioneer',
            'description': 'Complete your first mock interview.',
            'icon': '🗣️',
            'xp_reward': 50,
            'criteria': {'type': 'interviews_completed', 'value': 1}
        },
        {
            'name': 'Interview Master',
            'description': 'Complete 5 mock interviews.',
            'icon': '🎓',
            'xp_reward': 200,
            'criteria': {'type': 'interviews_completed', 'value': 5}
        },
        {
            'name': 'Showcase Star',
            'description': 'Add 2 projects to your showcase portfolio.',
            'icon': '🎨',
            'xp_reward': 100,
            'criteria': {'type': 'projects_added', 'value': 2}
        },
        {
            'name': 'Consistency Champ',
            'description': 'Achieve a 3-day active streak.',
            'icon': '🔥',
            'xp_reward': 100,
            'criteria': {'type': 'streak_days', 'value': 3}
        }
    ]
    for d in defaults:
        Achievement.objects.get_or_create(
            name=d['name'],
            defaults={
                'description': d['description'],
                'icon': d['icon'],
                'xp_reward': d['xp_reward'],
                'criteria': d['criteria']
            }
        )


def check_and_award_achievements(user):
    """
    Evaluate user progress metrics and award any newly unlocked achievements.
    """
    try:
        from progress.models import Achievement, UserAchievement
        
        # 1. Seed achievements if database is empty
        if Achievement.objects.count() == 0:
            seed_default_achievements()

        # 2. Gather user progress metrics
        challenges_count = user.submissions.filter(status='evaluated').count()
        interviews_count = user.interview_sessions.filter(status='completed').count()
        projects_count = user.projects.count()
        
        profile = getattr(user, 'profile', None)
        streak_days = profile.streak_days if profile else 0

        # 3. Check and award achievements
        achievements = Achievement.objects.all()
        for ach in achievements:
            if UserAchievement.objects.filter(user=user, achievement=ach).exists():
                continue
                
            criteria = ach.criteria or {}
            c_type = criteria.get('type')
            c_val = criteria.get('value', 0)
            
            earned = False
            if c_type == 'challenges_completed' and challenges_count >= c_val:
                earned = True
            elif c_type == 'interviews_completed' and interviews_count >= c_val:
                earned = True
            elif c_type == 'projects_added' and projects_count >= c_val:
                earned = True
            elif c_type == 'streak_days' and streak_days >= c_val:
                earned = True
                
            if earned:
                UserAchievement.objects.create(user=user, achievement=ach)
                award_xp(user, ach.xp_reward)
                log_activity(
                    user,
                    'achievement_earned',
                    f"Earned achievement: {ach.name} - {ach.description}",
                    ach.xp_reward,
                    {'achievement_id': ach.id}
                )
    except Exception as e:
        print(f"[Achievements] check_and_award_achievements failed: {e}")


