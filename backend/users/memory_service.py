"""
AI Memory Engine Service for Nexora.
Tracks and updates user's long-term learning memory profile across all 10 modules.
"""
from django.utils import timezone
from .models import UserAIMemory

DEFAULT_MASTERY = {
    "Data Structures & Algorithms": 60,
    "Frontend & React": 70,
    "Backend & Python/Node": 65,
    "System Design": 50,
    "Database & SQL": 55,
    "Clean Code & Testing": 60
}

DEFAULT_STRENGTHS = ["Clean Code Practices", "Component Architecture", "Problem Solving"]
DEFAULT_WEAKNESSES = ["Graph Algorithms", "Database Query Optimization", "Concurrency"]
DEFAULT_MISTAKES = ["Boundary value checking in loops", "Null/undefined dereference handling"]

def get_or_create_ai_memory(user):
    """Retrieve or initialize the user's AI Memory Profile."""
    memory, created = UserAIMemory.objects.get_or_create(user=user)
    if created or not memory.skills_mastery:
        memory.skills_mastery = DEFAULT_MASTERY.copy()
        memory.strengths = DEFAULT_STRENGTHS.copy()
        memory.weaknesses = DEFAULT_WEAKNESSES.copy()
        memory.recurring_mistakes = DEFAULT_MISTAKES.copy()
        memory.career_goals = {
            "target_role": "Full Stack / Senior Software Engineer",
            "desired_stack": ["React", "Python", "System Design"],
            "target_companies": ["Top Tech", "High Growth Startups"]
        }
        memory.learning_habits = {
            "consistency_score": 85,
            "preferred_speed": "Steady & Thorough",
            "streak_days": user.profile.streak_days if hasattr(user, 'profile') else 1
        }
        memory.save()
    return memory

def record_module_activity(user, module_name, action_title, details=None):
    """
    Record an activity from any of the 10 Nexora modules into the user's persistent AI Memory profile.
    Modules: Challenges, Code Arena, Interview Lab, Roadmap, Code Review, Resume Hub, Revision Hub, Showcase, Progress, Dev Mentor
    """
    if not user or not user.is_authenticated:
        return None

    memory = get_or_create_ai_memory(user)
    
    timestamp = timezone.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = {
        "timestamp": timestamp,
        "module": module_name,
        "action": action_title,
        "details": details or {}
    }

    log = memory.activity_log or []
    log.insert(0, entry)
    # Keep up to 100 recent activities
    memory.activity_log = log[:100]

    # Dynamically update topic mastery & strengths/weaknesses based on module
    topic = (details or {}).get('topic') or (details or {}).get('category')
    if topic and topic in memory.skills_mastery:
        score_change = (details or {}).get('mastery_delta', 2)
        memory.skills_mastery[topic] = min(100, max(0, memory.skills_mastery[topic] + score_change))

    # Add recurring mistake if reported
    mistake = (details or {}).get('mistake_pattern')
    if mistake and mistake not in memory.recurring_mistakes:
        memory.recurring_mistakes.append(mistake)
        memory.recurring_mistakes = memory.recurring_mistakes[-5:]

    memory.save()
    return memory

def get_ai_context_for_mentor(user):
    """
    Build a comprehensive, memory-aware context prompt snippet for Dev Mentor.
    """
    if not user or not user.is_authenticated:
        return ""

    memory = get_or_create_ai_memory(user)
    
    context = (
        f"\n[AI MEMORY ENGINE CONTEXT FOR USER: {user.full_name} ({user.email})]\n"
        f"- Target Career Goal: {memory.career_goals.get('target_role', 'Software Engineer')}\n"
        f"- Current Topic Mastery: {memory.skills_mastery}\n"
        f"- Verified Strengths: {', '.join(memory.strengths)}\n"
        f"- Areas Needing Improvement: {', '.join(memory.weaknesses)}\n"
        f"- Recurring Coding Patterns / Mistakes to watch for: {', '.join(memory.recurring_mistakes)}\n"
    )

    if memory.activity_log:
        recent = memory.activity_log[:3]
        recent_str = "; ".join([f"{item['module']}: {item['action']}" for item in recent])
        context += f"- Recent Activity: {recent_str}\n"

    context += "Use this long-term memory to tailor your responses, reference their past work, and give specific guidance.\n"
    return context
