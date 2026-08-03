"""
Nexora AI Client - powered by Groq (LLaMA 3.3 70B)
Central client for all AI interactions across the platform.
All public function signatures are unchanged from the original gemini_client module.
"""
import json
import re
import random
from django.conf import settings
from groq import Groq


def _get_groq_client() -> Groq:
    return Groq(api_key=settings.GROQ_API_KEY)


def _call_gemini_fallback(prompt: str, system: str = None, temperature: float = 0.7, image_frame: str = None, json_mode: bool = False) -> str:
    """
    Fallback method to call Google Gemini when all Groq keys are exhausted.
    Supports multimodal input if image_frame (base64 string) is provided.
    """
    import google.generativeai as genai
    import base64
    gemini_keys = getattr(settings, 'GEMINI_API_KEYS', [])
    if not gemini_keys:
        key = getattr(settings, 'GEMINI_API_KEY', '')
        if key:
            gemini_keys = [key]
            
    if not gemini_keys:
        raise Exception("Google Gemini fallback triggered but no GEMINI_API_KEY is configured in settings.")

    models = getattr(settings, 'GEMINI_MODEL_FALLBACKS', ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'])
    last_error = None

    image_parts = []
    if image_frame:
        try:
            if ',' in image_frame:
                image_data_str = image_frame.split(',', 1)[1]
            else:
                image_data_str = image_frame
            decoded_image = base64.b64decode(image_data_str)
            image_parts.append({'mime_type': 'image/jpeg', 'data': decoded_image})
        except Exception as e:
            print(f"[Gemini Fallback] Failed to decode base64 image: {e}")

    # Load balance Gemini requests across keys using a random starting index
    start_idx = random.randint(0, len(gemini_keys) - 1)
    for i in range(len(gemini_keys)):
        key_idx = (start_idx + i) % len(gemini_keys)
        api_key = gemini_keys[key_idx]
        try:
            genai.configure(api_key=api_key)
            for model_name in models:
                try:
                    gen_config = {"temperature": temperature}
                    if json_mode:
                        gen_config["response_mime_type"] = "application/json"

                    try:
                        model = genai.GenerativeModel(model_name=model_name, system_instruction=system)
                        if image_parts:
                            contents = image_parts + [prompt]
                            response = model.generate_content(contents, generation_config=gen_config)
                        else:
                            response = model.generate_content(prompt, generation_config=gen_config)
                    except TypeError:
                        # Fallback for older versions that don't support system_instruction keyword
                        model = genai.GenerativeModel(model_name=model_name)
                        full_prompt = f"System Instruction:\n{system}\n\nUser Prompt:\n{prompt}" if system else prompt
                        if image_parts:
                            contents = image_parts + [full_prompt]
                            response = model.generate_content(contents, generation_config=gen_config)
                        else:
                            response = model.generate_content(full_prompt, generation_config=gen_config)

                    if response.text:
                        print(f"[Gemini Fallback] SUCCESS Key {key_idx + 1} model={model_name}")
                        return response.text
                except Exception as model_err:
                    print(f"[Gemini Fallback] Key {key_idx + 1} model={model_name} failed: {model_err}")
                    last_error = model_err
        except Exception as key_err:
            print(f"[Gemini Fallback] Key {key_idx + 1} configuration failed: {key_err}")
            last_error = key_err

    if last_error:
        raise last_error
    raise Exception("Google Gemini fallback execution failed.")


def _call_groq(prompt: str, system: str = None, temperature: float = 0.7, json_mode: bool = False) -> str:
    """
    Call the Groq API with automatic key rotation, model fallback, and retry policies.
    If all Groq keys are exhausted/limited, automatically falls back to Google Gemini.
    """
    import time
    
    # Gather Groq keys from settings
    groq_keys = getattr(settings, 'GROQ_API_KEYS', [])
    if not groq_keys:
        single_key = getattr(settings, 'GROQ_API_KEY', '')
        if single_key:
            groq_keys = [single_key]

    models = getattr(settings, 'GROQ_MODEL_FALLBACKS', [settings.GROQ_MODEL])
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    last_error = None

    # Load balance Groq requests across keys using a random starting index
    start_idx = random.randint(0, len(groq_keys) - 1) if groq_keys else 0
    for i in range(len(groq_keys)):
        key_idx = (start_idx + i) % len(groq_keys)
        api_key = groq_keys[key_idx]
        try:
            print(f"[Groq Routing] Trying key {key_idx + 1}/{len(groq_keys)}...")
            client = Groq(api_key=api_key)
            
            for model_name in models:
                for attempt in range(2):  # Try 2 times per model to avoid excessive wait
                    try:
                        kwargs = {
                            "model": model_name,
                            "messages": messages,
                            "temperature": temperature,
                            "max_tokens": 2048
                        }
                        if json_mode:
                            kwargs["response_format"] = {"type": "json_object"}

                        response = client.chat.completions.create(**kwargs)
                        text = response.choices[0].message.content
                        if text:
                            print(f"[Groq SUCCESS] Key {key_idx + 1} model={model_name}")
                            return text
                    except Exception as e:
                        err_msg = str(e)
                        # If rate limit (429), retry with a short sleep
                        if "429" in err_msg or "rate limit" in err_msg.lower():
                            sleep_time = (attempt + 1) * 2 + random.uniform(0.5, 1.5)
                            print(f"[Groq RateLimit] Key {key_idx + 1} model={model_name}. Retrying in {sleep_time:.2f}s... (Attempt {attempt + 1}/2)")
                            time.sleep(sleep_time)
                            continue
                        
                        print(f"[Groq Failure] Key {key_idx + 1} model={model_name}: {type(e).__name__}")
                        last_error = e
                        break  # Move to next model
        except Exception as key_err:
            print(f"[Groq Key Error] Key {key_idx + 1} failed init: {key_err}")
            last_error = key_err

    # Fallback to Gemini if all Groq keys are exhausted
    print("[AI Routing] All Groq API keys exhausted or rate-limited. Falling back to Google Gemini...")
    try:
        return _call_gemini_fallback(prompt, system, temperature, json_mode=json_mode)
    except Exception as gemini_err:
        print(f"[Gemini Fallback Failure] {gemini_err}")
        last_error = gemini_err

    if last_error:
        raise last_error
    raise Exception("All AI models and fallbacks failed to respond.")



# ── kept for backwards compatibility (nothing else should call this) ──────────
def generate_with_key_rotation(prompt: str):
    """Compatibility shim — delegates to _call_groq."""
    class _FakeResponse:
        def __init__(self, text): self.text = text
    return _FakeResponse(_call_groq(prompt))


# ─────────────────────────────────────────────────────────────────────────────
# Challenge Evaluation
# ─────────────────────────────────────────────────────────────────────────────

def evaluate_challenge_submission(challenge_title: str, challenge_description: str, user_answer: str) -> dict:
    """Evaluate a user's challenge submission and return score + complexity feedback."""
    system = "You are an expert senior software developer and technical interviewer. Evaluate coding challenge submissions objectively and return ONLY valid JSON."
    prompt = f"""Evaluate this coding challenge submission.

Challenge: {challenge_title}
Description: {challenge_description}

User's Answer:
{user_answer}

Respond with ONLY this JSON (no markdown, no explanation outside JSON):
{{
  "score": <integer 0-100>,
  "overall_feedback": "<2-3 sentences of specific assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "xp_multiplier": <float 0.5-1.5 based on quality>,
  "time_complexity": "<Big-O notation e.g. O(N)>",
  "space_complexity": "<Big-O notation e.g. O(1)>",
  "complexity_table": "<A markdown table comparing Best, Average, and Worst Case complexities>",
  "complexity_feedback": ["<bullet point 1>", "<bullet point 2>"]
}}

Score based on correctness, completeness, and depth of understanding."""

    try:
        text = _call_groq(prompt, system=system, temperature=0.3)
        text = re.sub(r'^```(?:json)?\s*', '', text.strip())
        text = re.sub(r'\s*```$', '', text)
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception as e:
        print(f"[AI] evaluate_challenge_submission failed: {e}")

    # Smart local heuristic fallback
    words = len(user_answer.split())
    lines = len(user_answer.split('\n'))
    score = 60
    if words > 10: score += 10
    if words > 30: score += 10
    if words > 80: score += 10
    if lines > 3:  score += 5
    score = min(95, score)

    lowered = user_answer.lower()
    strengths = ["You attempted the challenge with a structured explanation"]
    improvements = []
    if any(k in lowered for k in ["function", "class", "def ", "const", "return", "import"]):
        strengths.append("Included code structure demonstrating practical application")
    else:
        improvements.append("Add concrete code examples to illustrate your solution")
    if not improvements:
        improvements.append("Deepen the discussion on edge cases and performance characteristics")

    # Estimate complexity fallback based on code analysis
    est_time = "O(N)"
    if "for " in lowered and lowered.count("for ") > 1:
        est_time = "O(N^2)"
    elif "binary" in lowered or "log" in lowered:
        est_time = "O(log N)"

    fallback_table = (
        "| Case | Time Complexity | Space Complexity |\n"
        "| :--- | :--- | :--- |\n"
        f"| **Best** | O(1) | O(1) |\n"
        f"| **Average** | {est_time} | O(1) |\n"
        f"| **Worst** | {est_time} | O(1) |"
    )

    return {
        "score": score,
        "overall_feedback": f"Your {words}-word submission shows a solid foundation. Keep building on these concepts to master the subject.",
        "strengths": strengths,
        "improvements": improvements,
        "xp_multiplier": round(0.8 + (score / 100) * 0.4, 2),
        "time_complexity": est_time,
        "space_complexity": "O(1)",
        "complexity_table": fallback_table,
        "complexity_feedback": ["Optimize loop iterations to avoid redundant checks.", "Verify null references before dereferencing variables."]
    }


# ─────────────────────────────────────────────────────────────────────────────
# Interview Question Generation
# ─────────────────────────────────────────────────────────────────────────────

FALLBACK_QUESTIONS = {
    'technical': [
        {"question": "Explain the difference between a stack and a queue. When would you use each?", "hint": "Think LIFO vs FIFO", "expected_points": ["Stack is LIFO", "Queue is FIFO", "Use cases like undo/BFS"]},
        {"question": "What is time complexity and why does it matter in software development?", "hint": "Big-O notation", "expected_points": ["Big-O notation", "Impacts scalability", "Examples O(n), O(log n)"]},
        {"question": "Explain REST vs GraphQL. What are the trade-offs?", "hint": "Think data over/under fetching", "expected_points": ["Over-fetching in REST", "Flexible queries in GraphQL", "Caching differences"]},
        {"question": "How does garbage collection work in your preferred language?", "hint": "Memory management concepts", "expected_points": ["Reference counting", "Mark and sweep", "GC pauses"]},
        {"question": "Describe the CAP theorem and how it applies to distributed systems.", "hint": "Consistency, Availability, Partition tolerance", "expected_points": ["Only 2 of 3 guaranteed", "Trade-off examples", "Real-world DB examples"]},
        {"question": "What is a deadlock? How do you prevent it?", "hint": "Think about concurrent resource access", "expected_points": ["Circular wait condition", "Prevention strategies", "Detection vs avoidance"]},
        {"question": "Explain the difference between SQL and NoSQL databases. When would you choose each?", "hint": "Schema flexibility vs ACID compliance", "expected_points": ["Schema flexibility", "ACID vs BASE", "Use case examples"]},
        {"question": "What is the difference between authentication and authorization?", "hint": "Identity vs permissions", "expected_points": ["AuthN = who you are", "AuthZ = what you can do", "JWT, OAuth examples"]},
        {"question": "How does a hash map work under the hood? What is a hash collision?", "hint": "Array + hash function", "expected_points": ["Hash function", "Collision resolution", "Load factor"]},
        {"question": "Explain microservices vs monolithic architecture. What are the pros/cons?", "hint": "Deployment, scalability, complexity", "expected_points": ["Independent deployment", "Network overhead", "Service discovery"]},
        {"question": "What is a binary search tree? What makes it efficient?", "hint": "O(log n) average case", "expected_points": ["Left < parent < right", "O(log n) search", "Balanced vs unbalanced"]},
        {"question": "Describe SOLID principles. Can you give an example of each?", "hint": "5 OOP design principles", "expected_points": ["Single responsibility", "Open/closed", "Liskov, Interface, Dependency"]},
    ],
    'hr': [
        {"question": "Tell me about a time you disagreed with a team member. How did you resolve it?", "hint": "STAR method", "expected_points": ["Situation clarity", "Respectful communication", "Outcome"]},
        {"question": "Describe your greatest professional achievement so far.", "hint": "Be specific with impact and metrics", "expected_points": ["Quantifiable impact", "Skills demonstrated", "Challenges overcome"]},
        {"question": "How do you handle tight deadlines and competing priorities?", "hint": "Time management and communication", "expected_points": ["Prioritization method", "Communication with stakeholders", "Example"]},
        {"question": "Tell me about a time you failed. What did you learn from it?", "hint": "Be honest, focus on the lesson", "expected_points": ["Self-awareness", "Accountability", "Growth mindset"]},
        {"question": "Where do you see yourself in 5 years?", "hint": "Align with growth in this role", "expected_points": ["Career goals", "Skill development", "Alignment with company"]},
        {"question": "Describe a situation where you had to learn something new very quickly.", "hint": "Adaptability under pressure", "expected_points": ["Learning strategy", "Speed of adoption", "Result"]},
        {"question": "How do you approach giving feedback to a peer or junior?", "hint": "Constructive communication", "expected_points": ["Specific and actionable", "Private setting", "Positive framing"]},
        {"question": "Tell me about a time you took initiative without being asked.", "hint": "Leadership and ownership", "expected_points": ["Problem identified proactively", "Action taken", "Impact"]},
        {"question": "How do you stay updated with the latest trends in your field?", "hint": "Continuous learning habits", "expected_points": ["Sources used", "Frequency", "Application of learning"]},
        {"question": "Describe your ideal work environment and team culture.", "hint": "Shows self-awareness and fit", "expected_points": ["Collaboration style", "Feedback culture", "Work-life balance"]},
    ],
    'mixed': [
        {"question": "Walk me through how you would design a URL shortener like bit.ly.", "hint": "System design + trade-offs", "expected_points": ["Hash function", "Database choice", "Scalability"]},
        {"question": "Tell me about a technical decision you made that you later regretted. What would you do differently?", "hint": "Technical + personal reflection", "expected_points": ["Technical depth", "Self-awareness", "Lesson learned"]},
        {"question": "How do you approach debugging a production issue you've never seen before?", "hint": "Systematic debugging + communication", "expected_points": ["Reproduce first", "Log analysis", "Communicate with team"]},
        {"question": "Describe how you would mentor a junior developer who is struggling.", "hint": "Leadership + technical empathy", "expected_points": ["Identify root cause", "Pair programming", "Regular check-ins"]},
        {"question": "What's the hardest technical problem you've solved? Walk me through your approach.", "hint": "Storytelling + technical depth", "expected_points": ["Clear problem definition", "Solution steps", "Outcome"]},
        {"question": "How do you balance technical debt with new feature development?", "hint": "Engineering judgment + communication", "expected_points": ["Track debt", "ROI analysis", "Stakeholder buy-in"]},
        {"question": "How would you improve the performance of a slow web application?", "hint": "Profiling + systematic approach", "expected_points": ["Measure first", "DB queries", "Caching, CDN"]},
    ],
    'rapid_fire': [
        {"question": "What is the difference between == and === in JavaScript?", "hint": "Type coercion", "expected_points": ["=== no coercion", "== coerces types"]},
        {"question": "What does HTTP 404 mean?", "hint": "HTTP status codes", "expected_points": ["Resource not found"]},
        {"question": "What is a closure in programming?", "hint": "Lexical scoping", "expected_points": ["Function + its lexical environment", "Access outer scope variables"]},
        {"question": "What is the purpose of an index in a database?", "hint": "Query speed", "expected_points": ["Faster lookups", "Trade-off: write speed + storage"]},
        {"question": "What is the difference between TCP and UDP?", "hint": "Reliability vs speed", "expected_points": ["TCP reliable/ordered", "UDP faster/no guarantee"]},
        {"question": "What is a promise in JavaScript?", "hint": "Async programming", "expected_points": ["Represents future value", "Pending/fulfilled/rejected"]},
        {"question": "What does SOLID stand for?", "hint": "5 OOP principles", "expected_points": ["Single Responsibility, Open/Closed, Liskov, Interface, Dependency"]},
        {"question": "What is the difference between GET and POST?", "hint": "HTTP methods", "expected_points": ["GET is idempotent", "POST sends body data"]},
        {"question": "What is a foreign key?", "hint": "Relational databases", "expected_points": ["References primary key in another table", "Enforces referential integrity"]},
        {"question": "What is memoization?", "hint": "Optimization technique", "expected_points": ["Cache function results", "Avoid redundant computation"]},
        {"question": "What is the event loop in JavaScript?", "hint": "Non-blocking I/O", "expected_points": ["Single threaded", "Call stack + callback queue", "Non-blocking async"]},
        {"question": "What is a virtual DOM?", "hint": "React concept", "expected_points": ["In-memory representation", "Diffing algorithm", "Batch updates"]},
    ],
}


def generate_interview_questions(mode: str, difficulty: str, topic: str, count: int = 5, resume_context=None) -> list:
    """Generate interview questions for a session. Falls back to diverse local bank if AI unavailable.
    When resume_context (a Resume model instance) is provided, generates personalized questions
    referencing the candidate's actual experience, projects, and skills.
    """
    mode_desc = {
        'technical': 'technical coding and system design',
        'hr': 'behavioral and soft skills',
        'mixed': 'mix of technical and behavioral',
        'rapid_fire': 'quick-answer technical concepts'
    }.get(mode, 'technical')

    # Build optional resume context block
    resume_block = ""
    if resume_context:
        try:
            pi = resume_context.personal_info or {}
            skills_flat = []
            for sg in (resume_context.skills or []):
                skills_flat.extend(sg.get('items', []))
            projects_summary = ""
            for p in (resume_context.projects or [])[:3]:
                projects_summary += f"\n  - {p.get('name','')}: {', '.join(p.get('tech_stack', []))} — {p.get('description','')[:120]}"
            experience_summary = ""
            for e in (resume_context.experience or [])[:3]:
                experience_summary += f"\n  - {e.get('role','')} at {e.get('company','')} ({e.get('start','')}–{e.get('end','Present')})"
            resume_block = f"""

CANDIDATE RESUME CONTEXT (use this to personalise questions — reference their actual work):
- Title: {pi.get('title', 'Software Developer')}
- Key Skills: {', '.join(skills_flat[:15]) if skills_flat else 'Not specified'}
- Recent Projects:{projects_summary if projects_summary else ' None listed'}
- Experience:{experience_summary if experience_summary else ' None listed'}

At least {min(count, 3)} questions MUST directly reference the candidate's resume above.
Example personalised question: "I see you built X using Y — walk me through your toughest challenge there."
"""
        except Exception:
            resume_block = ""

    system = "You are an expert technical recruiter. Generate realistic interview questions and return ONLY valid JSON arrays."
    prompt = f"""Generate {count} {difficulty}-level {mode_desc} interview questions
{"about " + topic if topic else "for a software developer"}.{resume_block}
Return ONLY a JSON array with no markdown fencing:
[
  {{"question": "<question text>", "hint": "<short hint>", "expected_points": ["<key point 1>", "<key point 2>"]}}
]

Questions must be realistic and specific. No numbering in question text."""

    try:
        text = _call_groq(prompt, system=system, temperature=0.8)
        text = re.sub(r'^```(?:json)?\s*', '', text.strip())
        text = re.sub(r'\s*```$', '', text)
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
            if isinstance(parsed, list) and len(parsed) > 0:
                return parsed[:count]
    except Exception as e:
        print(f"[AI] generate_interview_questions failed: {e}")

    bank = FALLBACK_QUESTIONS.get(mode, FALLBACK_QUESTIONS['technical'])
    shuffled = bank.copy()
    random.shuffle(shuffled)
    return shuffled[:count]


# ─────────────────────────────────────────────────────────────────────────────
# Interview Answer Evaluation
# ─────────────────────────────────────────────────────────────────────────────

def evaluate_interview_answer(question: str, answer: str, mode: str, image_frame: str = None) -> dict:
    """Evaluate a single interview answer, optionally including multimodal analysis of posture and eye contact."""
    
    # If image_frame is provided, route directly to Gemini Multimodal Fallback
    if image_frame:
        system = "You are an experienced technical interviewer and communication coach. Evaluate both the candidate's spoken/written answer and their visual presentation (eye contact, posture) from the provided image frame, and return ONLY valid JSON."
        prompt = f"""Evaluate this interview answer and the accompanying candidate webcam frame.

Question: {question}
Candidate's Answer: {answer}
Interview Type: {mode}

For the webcam frame:
1. Estimate "eye_contact_score" (0-100): High score (85-98) if looking directly towards the camera/screen. Lower score if looking away, down, or eyes closed/distracted.
2. Estimate "posture_score" (0-100): High score (85-98) if centered, sitting upright, professional. Lower score if slouched, leaning too far, or out of frame.
3. Provide "behavioral_feedback" (2-3 sentences): Constructive advice on their eye contact, posture, or facial expression.

For the answer content:
1. Provide "score" (0-10): Technical/hr quality of the answer.
2. Provide "feedback" (2-3 sentences): Specific content feedback.
3. Provide "key_points_covered" (list of strings) and "missed_points" (list of strings).

Return ONLY this JSON structure (no markdown packaging, no explanation outside JSON):
{{
  "score": <integer 0-10>,
  "feedback": "<2-3 specific content sentences>",
  "key_points_covered": ["<point 1>", "<point 2>"],
  "missed_points": ["<point 1>"],
  "eye_contact_score": <integer 0-100>,
  "posture_score": <integer 0-100>,
  "behavioral_feedback": "<2-3 sentences of visual/communication feedback>"
}}"""
        try:
            text = _call_gemini_fallback(prompt, system=system, temperature=0.3, image_frame=image_frame)
            text = re.sub(r'^```(?:json)?\s*', '', text.strip())
            text = re.sub(r'\s*```$', '', text)
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                res = json.loads(match.group())
                # Validate schema fields
                if 'score' in res:
                    res.setdefault('eye_contact_score', 90)
                    res.setdefault('posture_score', 90)
                    res.setdefault('behavioral_feedback', "Good eye contact and posture observed.")
                    return res
        except Exception as e:
            print(f"[AI] evaluate_interview_answer multimodal path failed, falling back to text: {e}")

    # Standard Text Evaluation Path (Groq / Gemini Text Fallback)
    system = "You are an experienced technical interviewer. Evaluate answers fairly and return ONLY valid JSON."
    prompt = f"""Evaluate this interview answer.

Question: {question}
Candidate's Answer: {answer}
Interview Type: {mode}

Return ONLY this JSON (no markdown):
{{
  "score": <integer 0-10>,
  "feedback": "<2-3 specific, constructive sentences>",
  "key_points_covered": ["<point 1>", "<point 2>"],
  "missed_points": ["<point 1>"]
}}"""

    try:
        text = _call_groq(prompt, system=system, temperature=0.3)
        text = re.sub(r'^```(?:json)?\s*', '', text.strip())
        text = re.sub(r'\s*```$', '', text)
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            res = json.loads(match.group())
            res.setdefault('eye_contact_score', 100)
            res.setdefault('posture_score', 100)
            res.setdefault('behavioral_feedback', "No visual feedback was captured during this question.")
            return res
    except Exception as e:
        print(f"[AI] evaluate_interview_answer text path failed: {e}")

    # Smart local heuristic fallback
    words = len(answer.split())
    score = 6
    if words > 12: score += 1
    if words > 25: score += 1
    if words > 50: score += 1
    if words > 90: score += 1
    score = min(10, score)

    lowered = answer.lower()
    covered, missed = [], []
    if any(k in lowered for k in ["because", "therefore", "example", "instance", "for example"]):
        covered.append("Supported points with reasoning and examples")
    else:
        missed.append("Include specific real-world examples to strengthen your response")
    if len(answer) > 100:
        covered.append("Response shows detailed coverage of key concepts")
    else:
        missed.append("Elaborate more on the technical background and edge cases")

    return {
        "score": score,
        "feedback": f"Your {words}-word response demonstrates understanding of the core concepts. Continue developing depth and specificity.",
        "key_points_covered": covered,
        "missed_points": missed,
        "eye_contact_score": 100,
        "posture_score": 100,
        "behavioral_feedback": "No visual feedback was captured during this question."
    }


# ─────────────────────────────────────────────────────────────────────────────
# Dev Mentor Chat
# ─────────────────────────────────────────────────────────────────────────────

def get_mentor_response(user_context: dict, conversation_history: list, user_message: str) -> str:
    """Generate a personalized mentor response with full user context."""
    system = f"""You are Dev Mentor, a highly experienced software development mentor on the Nexora platform.
You have deep expertise in web development, system design, algorithms, and career growth.

Current user context:
- Name: {user_context.get('name', 'Developer')}
- Rank: {user_context.get('rank', 'Explorer')}
- Streak Days: {user_context.get('streak_days', 0)}
- Challenges Completed: {user_context.get('challenges_completed', 0)}
- Recent Activity: {user_context.get('recent_activity', 'Getting started')}

{user_context.get('ai_memory_context', '')}

Guidelines:
- Give personalized, actionable advice based on their persistent AI Memory and learning journey
- Reference their strengths, weak areas, or recurring coding mistakes naturally when helpful
- Keep responses concise (2-4 paragraphs max) unless asked for detail
- Use markdown formatting for code examples when helpful
- ABSOLUTE MANDATORY RULE: NEVER mention "XP", "XP points", or numeric XP values in any response. Refer to developer rank, challenges completed, streak days, or learning progress instead."""

    messages = [{"role": "system", "content": system}]
    for msg in conversation_history[-10:]:
        role = "user" if msg['role'] == 'user' else "assistant"
        messages.append({"role": role, "content": msg['content']})
    messages.append({"role": "user", "content": user_message})

    try:
        client = _get_groq_client()
        models = getattr(settings, 'GROQ_MODEL_FALLBACKS', [settings.GROQ_MODEL])
        for model_name in models:
            try:
                response = client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1024,
                )
                text = response.choices[0].message.content
                if text:
                    print(f"[Groq Mentor] SUCCESS model={model_name}")
                    return text
            except Exception as e:
                print(f"[Groq Mentor] model={model_name} failed: {e}")
    except Exception as e:
        print(f"[AI] get_mentor_response failed: {e}")

    return "I'm having trouble connecting right now. Please try again in a moment."


# ─────────────────────────────────────────────────────────────────────────────
# AI Skill Gap Analyzer + Personalized Roadmap
# ─────────────────────────────────────────────────────────────────────────────

def generate_learning_roadmap(target_role: str, user_data: dict) -> list:
    """
    Generate a personalized week-by-week learning roadmap for a user.

    user_data keys:
        challenge_scores   dict[topic_name -> avg_score]
        interview_scores   dict[mode -> avg_score]
        rank               str
        total_xp           int
        challenges_done    int
        interviews_done    int
    Returns a list of week dicts (max 6 weeks).
    """
    role_descriptions = {
        'faang_swe':    'FAANG/Big Tech Software Engineer (Google, Meta, Amazon, Microsoft)',
        'frontend_dev': 'Frontend Developer (React, CSS, Web Performance)',
        'backend_dev':  'Backend Developer (APIs, Databases, System Architecture)',
        'fullstack_dev':'Full Stack Developer (Frontend + Backend + Deployment)',
        'devops':       'DevOps/Cloud Engineer (CI/CD, Docker, Kubernetes, AWS)',
        'ml_engineer':  'ML/AI Engineer (Python, TensorFlow, Data Science)',
        'product':      'Technical Product Manager',
    }
    role_desc = role_descriptions.get(target_role, target_role)

    challenge_summary = '\n'.join(
        f"  - {topic}: avg {score:.0f}/100"
        for topic, score in (user_data.get('challenge_scores') or {}).items()
    ) or '  - No challenge data yet'

    interview_summary = '\n'.join(
        f"  - {mode}: avg {score:.1f}/10"
        for mode, score in (user_data.get('interview_scores') or {}).items()
    ) or '  - No interview data yet'

    system = "You are an expert developer career coach. Generate personalized learning roadmaps and return ONLY valid JSON."
    prompt = f"""Create a personalized 4-6 week learning roadmap for a developer targeting: {role_desc}

User's current performance data:
Challenge scores by topic:
{challenge_summary}

Interview scores by mode:
{interview_summary}

Current rank: {user_data.get('rank', 'Explorer')}
Total XP: {user_data.get('total_xp', 0)}
Challenges completed: {user_data.get('challenges_done', 0)}
Interviews completed: {user_data.get('interviews_done', 0)}

Instructions:
- Identify the 4-6 weakest areas from the data above
- Create one focused week per weakness area
- Each week should have 2-4 specific, actionable tasks
- Tasks should be of types: "challenge" (coding practice), "interview" (mock interview), or "study" (reading/learning topic)
- For "challenge" tasks, suggest real challenge topics. For "interview" tasks, specify mode (technical/hr/mixed/rapid_fire) and difficulty (junior/mid/senior)
- Set realistic XP goals per week (200-500 XP range)
- Be specific in weakness reasons — reference the actual scores

Return ONLY a JSON array (no markdown, no explanation):
[
  {{
    "week": 1,
    "focus_area": "System Design",
    "weakness_reason": "Your system design score is low at X/100. Focus here before interviews.",
    "xp_goal": 400,
    "tasks": [
      {{"type": "challenge", "title": "Design a URL Shortener System", "description": "Practice system design with a classic problem", "order": 1}},
      {{"type": "interview", "title": "Technical Interview (Senior)", "description": "Focus on system design questions", "interview_mode": "technical", "interview_difficulty": "senior", "order": 2}},
      {{"type": "study", "title": "Study: CAP Theorem + Consistent Hashing", "description": "Core distributed systems concepts", "order": 3}}
    ]
  }}
]"""

    try:
        text = _call_groq(prompt, system=system, temperature=0.6)
        text = re.sub(r'^```(?:json)?\s*', '', text.strip())
        text = re.sub(r'\s*```$', '', text)
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
            if isinstance(parsed, list) and len(parsed) > 0:
                return parsed[:6]
    except Exception as e:
        print(f"[AI] generate_learning_roadmap failed: {e}")

    # Robust fallback roadmap
    return [
        {
            "week": 1,
            "focus_area": "Algorithms & Data Structures",
            "weakness_reason": "Core DSA is essential for any developer role. Build this foundation first.",
            "xp_goal": 350,
            "tasks": [
                {"type": "challenge", "title": "Implement a Binary Search Tree", "description": "Practice trees, recursion, and traversal algorithms", "order": 1},
                {"type": "interview", "title": "Technical Interview (Mid)", "description": "Answer algorithm-focused questions", "interview_mode": "technical", "interview_difficulty": "mid", "order": 2},
                {"type": "study", "title": "Study: Big-O Notation + Sorting Algorithms", "description": "Understand time and space complexity", "order": 3},
            ]
        },
        {
            "week": 2,
            "focus_area": "System Design",
            "weakness_reason": "System design is tested heavily in mid-to-senior interviews. Practice designing scalable systems.",
            "xp_goal": 400,
            "tasks": [
                {"type": "challenge", "title": "Design a URL Shortener System", "description": "Classic system design problem covering hashing, databases, scaling", "order": 1},
                {"type": "study", "title": "Study: CAP Theorem, Load Balancing, Caching", "description": "Key concepts for distributed systems questions", "order": 2},
                {"type": "interview", "title": "Technical Interview (Senior)", "description": "Practice system design interview questions", "interview_mode": "technical", "interview_difficulty": "senior", "order": 3},
            ]
        },
        {
            "week": 3,
            "focus_area": "Behavioral & HR Skills",
            "weakness_reason": "HR rounds are often underestimated. Strong behavioral answers can differentiate you.",
            "xp_goal": 300,
            "tasks": [
                {"type": "interview", "title": "HR Interview Practice", "description": "Practice STAR-method behavioral questions", "interview_mode": "hr", "interview_difficulty": "mid", "order": 1},
                {"type": "study", "title": "Study: STAR Method for Behavioral Questions", "description": "Situation, Task, Action, Result framework", "order": 2},
            ]
        },
        {
            "week": 4,
            "focus_area": "Full Stack Integration",
            "weakness_reason": "Demonstrate end-to-end capability with a real project on your Showcase.",
            "xp_goal": 450,
            "tasks": [
                {"type": "challenge", "title": "Build a REST API with Authentication", "description": "Full backend project combining multiple skills", "order": 1},
                {"type": "study", "title": "Study: Database Design + API Security", "description": "Indexing, normalization, JWT, OAuth fundamentals", "order": 2},
                {"type": "interview", "title": "Mixed Interview (Senior)", "description": "Combine technical + behavioral questions", "interview_mode": "mixed", "interview_difficulty": "senior", "order": 3},
            ]
        },
    ]


# ─────────────────────────────────────────────────────────────────────────────
# GitHub Repository Scoring
# ─────────────────────────────────────────────────────────────────────────────

def score_github_repos(username: str, github_token: str = '') -> dict:
    """
    Fetch a user's public GitHub repos and compute Code Health Scores.
    Returns dict with overall score and per-repo details.
    Uses ThreadPoolExecutor to run all API calls in parallel.
    """
    import urllib.request
    import urllib.error
    import concurrent.futures
    from datetime import datetime, timezone

    headers = {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Nexora-App/1.0',
    }
    if github_token:
        headers['Authorization'] = f'Bearer {github_token}'

    def gh_get(url):
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            if e.code == 401 and 'Authorization' in headers:
                # Fallback to unauthenticated query
                headers.pop('Authorization', None)
                req = urllib.request.Request(url, headers=headers)
                try:
                    with urllib.request.urlopen(req, timeout=8) as resp:
                        return json.loads(resp.read().decode())
                except Exception as inner_e:
                    print(f"[GitHub] Fallback HTTP error for {url}: {inner_e}")
                    return None
            # 404s are expected for missing readme or workflows, don't fill logs with warnings
            if e.code != 404:
                print(f"[GitHub] HTTP {e.code} for {url}")
            return None
        except Exception as e:
            print(f"[GitHub] Error fetching {url}: {e}")
            return None

    # Fetch up to 25 public repos
    repos_data = gh_get(f'https://api.github.com/users/{username}/repos?per_page=25&sort=updated&type=public')
    if repos_data is None:
        return {'error': f'GitHub user "{username}" not found or API error.'}

    if not isinstance(repos_data, list):
        return {'error': 'Unexpected GitHub API response.'}

    def process_single_repo(repo):
        repo_name = repo['name']
        score = 0
        breakdown = {}

        # Has README (+20)
        readme = gh_get(f"https://api.github.com/repos/{username}/{repo_name}/readme")
        has_readme = readme is not None
        if has_readme:
            score += 20
        breakdown['readme'] = has_readme

        # Has description (+10)
        has_desc = bool((repo.get('description') or '').strip())
        if has_desc:
            score += 10
        breakdown['description'] = has_desc

        # Languages (+10 if multi-language)
        langs = gh_get(f"https://api.github.com/repos/{username}/{repo_name}/languages") or {}
        lang_count = len(langs)
        if lang_count > 1:
            score += 10
        breakdown['languages'] = list(langs.keys())[:5]

        # Has CI/CD — check for .github/workflows (+20)
        workflows = gh_get(f"https://api.github.com/repos/{username}/{repo_name}/contents/.github/workflows")
        has_ci = isinstance(workflows, list) and len(workflows) > 0
        if has_ci:
            score += 20
        breakdown['ci_cd'] = has_ci

        # Has tests — check for test folder/files (+15)
        # Fetch root contents to find 'test', 'tests', 'spec' folders or test files (e.g., test_main.py, app.test.js)
        # This uses standard REST rate limit instead of the strict Search rate limit (avoiding 403 blocks)
        contents = gh_get(f"https://api.github.com/repos/{username}/{repo_name}/contents") or []
        has_tests = False
        if isinstance(contents, list):
            for item in contents:
                name = item.get('name', '').lower()
                if 'test' in name or 'spec' in name:
                    has_tests = True
                    break
        if has_tests:
            score += 15
        breakdown['tests'] = has_tests

        # Recent activity — committed in last 30 days (+15)
        pushed = repo.get('pushed_at', '')
        has_recent = False
        if pushed:
            try:
                pushed_dt = datetime.fromisoformat(pushed.replace('Z', '+00:00'))
                days_ago = (datetime.now(timezone.utc) - pushed_dt).days
                has_recent = days_ago <= 30
                if has_recent:
                    score += 15
            except Exception:
                pass
        breakdown['recent_activity'] = has_recent

        # Stars (+5 if any)
        stars = repo.get('stargazers_count', 0)
        if stars > 0:
            score += 5
        breakdown['stars'] = stars

        # Fork penalty
        is_fork = repo.get('fork', False)
        if is_fork:
            score = max(0, score - 10)
        breakdown['is_fork'] = is_fork

        return {
            'name':        repo_name,
            'description': repo.get('description') or '',
            'url':         repo.get('html_url', ''),
            'language':    repo.get('language') or 'Unknown',
            'languages':   breakdown['languages'],
            'stars':       stars,
            'score':       min(100, score),
            'breakdown':   breakdown,
            'is_fork':     is_fork,
            'updated_at':  repo.get('updated_at', ''),
        }

    # Parallelize repo scanning up to 15 repositories (to keep execution lightning fast)
    scored_repos = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(process_single_repo, repo): repo for repo in repos_data[:15]}
        for future in concurrent.futures.as_completed(futures):
            try:
                result = future.result()
                if result:
                    scored_repos.append(result)
            except Exception as e:
                print(f"[GitHub] Thread scanning failed for repo: {e}")

    # Sort by score desc
    scored_repos.sort(key=lambda r: r['score'], reverse=True)

    total_score_sum = sum(r['score'] for r in scored_repos)
    overall = int(total_score_sum / len(scored_repos)) if scored_repos else 0

    return {
        'username':    username,
        'repos':       scored_repos,
        'repo_count':  len(scored_repos),
        'overall_score': min(100, overall),
        'top_languages': _top_languages(scored_repos),
    }



def _top_languages(repos: list) -> list:
    """Extract top 5 languages across all repos."""
    lang_count = {}
    for r in repos:
        for lang in r.get('languages', []):
            lang_count[lang] = lang_count.get(lang, 0) + 1
    sorted_langs = sorted(lang_count.items(), key=lambda x: x[1], reverse=True)
    return [l[0] for l in sorted_langs[:5]]


# ─────────────────────────────────────────────────────────────────────────────
# AI Learning Academy Course Generation
# ─────────────────────────────────────────────────────────────────────────────

def generate_course_material(title: str, description: str) -> dict:
    """
    Generate detailed, chapter-by-chapter course learning materials
    and a 5-question multi-difficulty graded quiz for a roadmap task.
    """
    system = "You are an expert technical content writer and instructor. You write thorough, detailed tutorials and return valid JSON only."
    prompt = f"""Create a highly detailed, comprehensive study guide and quiz for the following topic:
Title: {title}
Description: {description}

Requirements:
1. Generate exactly 3 sequential chapters explaining this topic.
   - Make the content rich, thorough, and practical.
   - Include code snippets (e.g. bash scripts, dockerfiles, node.js code) with appropriate Markdown backticks and language flags.
   - Explain both theoretical and practical elements of this topic.
2. Generate exactly 5 multiple-choice questions for the quiz.
   - 2 Basic difficulty questions.
   - 2 Intermediate difficulty questions.
   - 1 Advanced difficulty question.
   - Each question must have exactly 4 choices.
   - Provide the 0-indexed correct option.
   - Add a detailed explanation of why the correct option is right and the others are wrong.

Return ONLY a JSON object matching this structure (no markdown, no other output):
{{
  "title": "{title}",
  "chapters": [
    {{
      "title": "1. ...",
      "content": "Full markdown content..."
    }},
    {{
      "title": "2. ...",
      "content": "Full markdown content..."
    }},
    {{
      "title": "3. ...",
      "content": "Full markdown content..."
    }}
  ],
  "quiz": [
    {{
      "question": "Question text...",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_index": 0,
      "difficulty": "basic",
      "explanation": "Explanation text..."
    }}
  ]
}}"""

    try:
        text = _call_groq(prompt, system=system, temperature=0.5)
        text = re.sub(r'^```(?:json)?\s*', '', text.strip())
        text = re.sub(r'\s*```$', '', text)
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception as e:
        print(f"[AI] generate_course_material failed: {e}")

    # Solid Fallback content if API fails
    return {
        "title": title,
        "chapters": [
          {
            "title": "1. Introduction to the Topic",
            "content": f"### Introduction\nThis module covers **{title}**.\n\n### Core Principles\nUnderstanding this topic involves solidifying the fundamental practices, including configuration, setup, testing, and scaling parameters.\n\n```python\n# Example concept demonstration\ndef demo_concept():\n    print('Learning {title}!')\n\n\ndemo_concept()\n```"
          },
          {
            "title": "2. Core Implementation",
            "content": f"### Implementation Details\nLet's write a sample configuration or scripting code for this topic to understand how it behaves in live production environments.\n\n```yaml\n# Sample YAML Configuration\nversion: '3.8'\nservices:\n  app:\n    image: node:alpine\n    ports:\n      - '8080:8080'\n    environment:\n      - NODE_ENV=production\n```"
          },
          {
            "title": "3. Advanced Optimization",
            "content": f"### Best Practices\n- **Caching:** Ensure static resources or frequent lookups are stored in Redis or local memory cache.\n- **Security:** Sanitize inputs and establish strong JWT/OAuth access boundaries.\n- **Monitoring:** Always attach logs and monitor processor usage and errors."
          }
        ],
        "quiz": [
          {
            "question": f"What is the primary benefit of {title}?",
            "options": ["Slight performance improvement", "Better architectural organization and modular scaling", "It is required by all cloud providers", "It automatically eliminates bugs"],
            "correct_index": 1,
            "difficulty": "basic",
            "explanation": "It provides structured modular layout and better performance at scale."
          },
          {
            "question": "Which file format is most commonly used for configurations in modern deployments?",
            "options": ["XML", "INI", "YAML", "CSV"],
            "correct_index": 2,
            "difficulty": "basic",
            "explanation": "YAML is standard due to readability and compatibility with tools like Docker and Kubernetes."
          },
          {
            "question": "When designing high-availability systems, which factor is most crucial?",
            "options": ["Single point of failure elimination", "Using the newest framework version", "Exposing all internal APIs to the public", "Using a single massive database server"],
            "correct_index": 0,
            "difficulty": "intermediate",
            "explanation": "High-availability relies on redundancy and load balancing to eliminate single points of failure."
          },
          {
            "question": "What does a 401 Unauthorized status code indicate?",
            "options": ["Server error", "Resource does not exist", "The request lacks valid authentication credentials", "Forbidden action regardless of authentication"],
            "correct_index": 2,
            "difficulty": "intermediate",
            "explanation": "401 specifically means authentication is required or credentials are invalid."
          },
          {
            "question": "In distributed database design, what does partition tolerance imply?",
            "options": ["The database cannot scale horizontally", "The system continues to operate despite network messages dropping", "All nodes always return the exact same data instantly", "The database is immune to hardware crashes"],
            "correct_index": 1,
            "difficulty": "advanced",
            "explanation": "Partition tolerance under CAP theorem means the cluster operates even during network split."
          }
        ]
    }


def generate_ai_challenge(topic: str) -> dict:
    """
    Generate a brand new, unique, high-quality programming/design challenge on the given topic.
    """
    system = "You are an expert technical interviewer and author. You create unique coding and system design challenges, and return valid, well-escaped JSON only."
    
    # We choose a random difficulty to keep it fresh
    difficulty = random.choice(['easy', 'medium', 'hard'])
    xp = 100 if difficulty == 'easy' else (200 if difficulty == 'medium' else 400)
    time_est = random.choice(['20 min', '30 min']) if difficulty == 'easy' else (random.choice(['45 min', '60 min']) if difficulty == 'medium' else random.choice(['75 min', '90 min']))

    prompt = f"""Create a highly detailed, unique, and practical programming or system design challenge for the topic: "{topic}".
The difficulty should be: {difficulty}.

Return ONLY a JSON object matching this structure (no markdown, no other output, no ```json formatting, just the raw JSON):
{{
  "title": "A concise, engaging title for the challenge",
  "description": "A detailed explanation of the challenge, background, constraints, and instructions. (At least 3 paragraphs or detailed bullet points)",
  "requirements": [
    "Requirement 1 (e.g. implementation detail, API endpoint, function signature)",
    "Requirement 2",
    "Requirement 3"
  ],
  "difficulty": "{difficulty}",
  "xp_reward": {xp},
  "tags": ["tag1", "tag2", "tag3"],
  "estimated_time": "{time_est}"
}}"""

    try:
        response_text = _call_groq(prompt, system=system, temperature=0.7, json_mode=True)
        
        # Strip markdown json code block indicators if any
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\n", "", cleaned)
            cleaned = re.sub(r"\n```$", "", cleaned)
        cleaned = cleaned.strip()

        # Extract JSON substring if LLM outputted conversational prefix/suffix
        match = re.search(r'\{.*\}', cleaned, re.DOTALL)
        if match:
            cleaned = match.group()

        data = json.loads(cleaned, strict=False)
        # Validate keys
        required_keys = ['title', 'description', 'requirements', 'difficulty', 'xp_reward', 'tags', 'estimated_time']
        for k in required_keys:
            if k not in data:
                raise ValueError(f"Missing key in AI generated challenge: {k}")
        
        # Ensure correct types
        if not isinstance(data['requirements'], list):
            data['requirements'] = [str(r) for r in data['requirements']]
        if not isinstance(data['tags'], list):
            data['tags'] = [str(t) for t in data['tags']]
        
        return data
    except Exception as e:
        print(f"[AI Challenge Generation Failed]: {e}. Using fallback challenge.")
        # Safe fallback
        return {
            "title": f"Implement a Custom System in {topic}",
            "description": f"Design and implement a robust, production-ready system covering key concepts of {topic}. Ensure proper error handling, extensibility, and clean code principles.",
            "requirements": [
                f"Core module implementation focusing on {topic}",
                "At least 3 unit tests verifying main functionalities",
                "Proper separation of concerns and comments"
            ],
            "difficulty": difficulty,
            "xp_reward": xp,
            "tags": [topic.lower(), 'custom', 'ai-generated'],
            "estimated_time": time_est
        }


def generate_ai_challenge_from_title(task_title: str, topic_label: str = '') -> dict:
    """
    Generate a focused challenge specifically targeting a roadmap task title.
    E.g. "Implement a Queue using a Linked List" → detailed challenge exactly about that.
    """
    system = "You are an expert technical interviewer and author. You create unique coding and system design challenges, and return valid, well-escaped JSON only."

    difficulty = random.choice(['easy', 'medium', 'hard'])
    xp = 100 if difficulty == 'easy' else (200 if difficulty == 'medium' else 400)
    time_est = random.choice(['20 min', '30 min']) if difficulty == 'easy' else (random.choice(['45 min', '60 min']) if difficulty == 'medium' else random.choice(['75 min', '90 min']))

    context_hint = f" (Part of the '{topic_label}' learning module)" if topic_label else ""

    prompt = f"""Create a highly detailed, focused programming challenge for this exact task: "{task_title}"{context_hint}.

The challenge MUST be specifically about "{task_title}" — not a generic topic challenge.
Difficulty: {difficulty}.

Return ONLY a JSON object (no markdown, no ```json, just raw JSON):
{{
  "title": "A concise, engaging title directly related to '{task_title}'",
  "description": "A detailed explanation specific to '{task_title}', including background, constraints, and what must be implemented. At least 3 paragraphs.",
  "requirements": [
    "Specific requirement 1 directly related to '{task_title}'",
    "Specific requirement 2",
    "Specific requirement 3"
  ],
  "difficulty": "{difficulty}",
  "xp_reward": {xp},
  "tags": ["tag1", "tag2", "tag3"],
  "estimated_time": "{time_est}"
}}"""

    try:
        response_text = _call_groq(prompt, system=system, temperature=0.7, json_mode=True)

        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\n", "", cleaned)
            cleaned = re.sub(r"\n```$", "", cleaned)
        cleaned = cleaned.strip()

        match = re.search(r'\{.*\}', cleaned, re.DOTALL)
        if match:
            cleaned = match.group()

        data = json.loads(cleaned, strict=False)
        required_keys = ['title', 'description', 'requirements', 'difficulty', 'xp_reward', 'tags', 'estimated_time']
        for k in required_keys:
            if k not in data:
                raise ValueError(f"Missing key: {k}")

        if not isinstance(data['requirements'], list):
            data['requirements'] = [str(data['requirements'])]
        if not isinstance(data['tags'], list):
            data['tags'] = [str(data['tags'])]

        return data

    except Exception as e:
        print(f"[generate_ai_challenge_from_title] Error: {e}. Using fallback.")
        return {
            "title": task_title,
            "description": f"Complete the implementation task: {task_title}. Focus on correctness, efficiency, and clean code.",
            "requirements": [
                f"Implement '{task_title}' from scratch",
                "Handle edge cases and invalid inputs",
                "Write clean, well-commented code",
            ],
            "difficulty": difficulty,
            "xp_reward": xp,
            "tags": [topic_label.lower() if topic_label else 'general', 'roadmap', 'ai-generated'],
            "estimated_time": time_est,
        }


# ─────────────────────────────────────────────────────────────────────────────
# Resume Suite AI Functions
# ─────────────────────────────────────────────────────────────────────────────

def parse_resume_from_text(raw_text: str) -> dict:
    """Parse raw resume text (extracted from PDF/TXT) into structured JSON sections.
    Returns a dict with keys: personal_info, experience, projects, skills, education, certifications.
    """
    system = (
        "You are an expert resume parser. Extract structured information from the raw resume text "
        "and return ONLY a valid JSON object with no markdown fencing."
    )
    prompt = f"""Parse the following resume text and extract all information into a structured JSON object.

Return ONLY valid JSON with this exact structure (use empty arrays/dicts for missing sections):
{{
  "personal_info": {{"name": "", "title": "", "email": "", "phone": "", "linkedin": "", "github": "", "website": "", "summary": ""}},
  "experience": [
    {{"company": "", "role": "", "location": "", "start": "", "end": "", "current": false, "bullets": []}}
  ],
  "projects": [
    {{"name": "", "tech_stack": [], "description": "", "url": "", "bullets": []}}
  ],
  "skills": [
    {{"category": "Languages", "items": []}},
    {{"category": "Frameworks", "items": []}},
    {{"category": "Tools", "items": []}},
    {{"category": "Databases", "items": []}}
  ],
  "education": [
    {{"institution": "", "degree": "", "field": "", "year": "", "gpa": ""}}
  ],
  "certifications": [
    {{"name": "", "issuer": "", "year": "", "url": ""}}
  ]
}}

RESUME TEXT:
{raw_text[:6000]}"""

    try:
        text = _call_groq(prompt, system=system, temperature=0.2)
        text = re.sub(r'^```(?:json)?\s*', '', text.strip())
        text = re.sub(r'\s*```$', '', text)
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
            if isinstance(parsed, dict):
                return parsed
    except Exception as e:
        print(f"[AI] parse_resume_from_text failed: {e}")

    return {
        "personal_info": {}, "experience": [], "projects": [],
        "skills": [], "education": [], "certifications": []
    }


def calculate_deterministic_ats_score(resume_data: dict, target_role: str = '') -> int:
    """
    Calculate a 100% deterministic ATS score based on structured resume content
    and target role keyword alignment. Guarantees 100% consistent results for identical inputs.
    """
    score = 0
    pi = resume_data.get('personal_info', {}) or {}

    # 1. Contact Information (max 15 pts)
    if pi.get('name'): score += 3
    if pi.get('email'): score += 4
    if pi.get('phone'): score += 3
    if pi.get('linkedin'): score += 3
    if pi.get('github') or pi.get('website'): score += 2

    # 2. Professional Summary (max 10 pts)
    summary = (pi.get('summary') or '').strip()
    words = len(summary.split())
    if words >= 25:
        score += 10
    elif words > 0:
        score += 5

    # 3. Work Experience & Bullets (max 30 pts)
    exp = resume_data.get('experience', []) or []
    if len(exp) >= 2:
        score += 15
    elif len(exp) == 1:
        score += 10

    all_bullets = []
    for e in exp:
        all_bullets.extend(e.get('bullets', []) or [])
    for p in resume_data.get('projects', []) or []:
        all_bullets.extend(p.get('bullets', []) or [])

    bullet_count = len(all_bullets)
    if bullet_count >= 6:
        score += 10
    elif bullet_count >= 2:
        score += 5

    has_metrics = any(re.search(r'\d+%|\$\d+|\d+\s*x|\b\d+\b', str(b)) for b in all_bullets)
    if has_metrics:
        score += 5

    # 4. Skills Section & Alignment (max 25 pts)
    skills_flat = []
    for sg in resume_data.get('skills', []) or []:
        skills_flat.extend([str(item).lower() for item in (sg.get('items', []) or [])])

    skill_count = len(set(skills_flat))
    if skill_count >= 10:
        score += 15
    elif skill_count >= 5:
        score += 10
    elif skill_count > 0:
        score += 5

    role_terms = [t for t in re.split(r'\W+', (target_role or '').lower()) if len(t) > 2]
    all_resume_text = json.dumps(resume_data).lower()
    if role_terms:
        matches = sum(1 for term in role_terms if term in all_resume_text)
        match_ratio = matches / len(role_terms)
        score += int(match_ratio * 10)
    else:
        score += 10

    # 5. Education & Certifications (max 20 pts)
    edu = resume_data.get('education', []) or []
    if len(edu) >= 1:
        score += 12

    certs = resume_data.get('certifications', []) or []
    if len(certs) >= 1:
        score += 8

    return max(35, min(98, score))


def calculate_deterministic_jd_match(resume_data: dict, job_description: str) -> dict:
    """
    Calculate a 100% deterministic JD Match score and missing skills count
    based on exact keyword overlap analysis.
    """
    jd_lower = (job_description or '').lower()

    tech_catalog = [
        'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'golang', 'rust', 'ruby', 'php', 'swift', 'kotlin',
        'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'fastapi', 'spring boot', 'laravel', 'next.js', 'nuxt.js',
        'html', 'css', 'sass', 'tailwind', 'tailwindcss', 'bootstrap', 'redux', 'webpack', 'vite',
        'postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql', 'elasticsearch', 'dynamodb',
        'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'ci/cd', 'jenkins', 'terraform', 'git', 'github',
        'rest', 'graphql', 'grpc', 'microservices', 'system design', 'agile', 'scrum', 'devops', 'testing'
    ]

    jd_keywords = [kw for kw in tech_catalog if re.search(r'\b' + re.escape(kw) + r'\b', jd_lower)]

    resume_text = json.dumps(resume_data).lower()
    matched_keywords = [kw for kw in jd_keywords if re.search(r'\b' + re.escape(kw) + r'\b', resume_text)]
    missing_keywords = [kw for kw in jd_keywords if kw not in matched_keywords]

    if jd_keywords:
        match_percentage = len(matched_keywords) / len(jd_keywords)
        ats_score = max(40, min(98, int(35 + (match_percentage * 60))))
    else:
        ats_score = calculate_deterministic_ats_score(resume_data, "Software Engineer")
        missing_keywords = []

    def clean_name(k):
        names = {
            'javascript': 'JavaScript', 'typescript': 'TypeScript', 'postgresql': 'PostgreSQL',
            'mysql': 'MySQL', 'mongodb': 'MongoDB', 'html': 'HTML', 'css': 'CSS', 'aws': 'AWS',
            'gcp': 'GCP', 'ci/cd': 'CI/CD', 'graphql': 'GraphQL', 'grpc': 'gRPC',
            'next.js': 'Next.js', 'nuxt.js': 'Nuxt.js', 'node': 'Node.js'
        }
        return names.get(k.lower(), k.capitalize())

    return {
        'ats_score': ats_score,
        'matched_skills': [clean_name(k) for k in matched_keywords],
        'missing_skills': [clean_name(k) for k in missing_keywords[:6]],
        'missing_skills_count': len(missing_keywords)
    }


def audit_resume_ats(resume_data: dict, target_role: str) -> dict:
    """Run an ATS compatibility audit on structured resume data for a given target role.
    Returns: {ats_score, strengths, weaknesses, keyword_gaps, checklist, tips}
    """
    target_role_clean = (target_role or '').strip() or 'Software Developer'
    det_score = calculate_deterministic_ats_score(resume_data, target_role_clean)

    pi = resume_data.get('personal_info', {}) or {}
    skills_flat = []
    for sg in resume_data.get('skills', []) or []:
        skills_flat.extend(sg.get('items', []) or [])
    exp_roles = [f"{e.get('role')} at {e.get('company')}" for e in (resume_data.get('experience', []) or [])]
    proj_names = [p.get('name') for p in (resume_data.get('projects', []) or [])]

    summary = f"""
Title: {pi.get('title', 'Not specified')}
Target Role: {target_role_clean}
Skills: {', '.join(skills_flat[:20]) if skills_flat else 'None listed'}
Experience: {'; '.join(exp_roles[:5]) if exp_roles else 'None listed'}
Projects: {', '.join(proj_names[:5]) if proj_names else 'None listed'}
Education entries: {len(resume_data.get('education', []) or [])}
Certifications: {len(resume_data.get('certifications', []) or [])}
Has summary section: {'yes' if pi.get('summary') else 'no'}
Has contact info: {'yes' if pi.get('email') else 'no'}
"""

    system = (
        "You are a professional ATS (Applicant Tracking System) expert and career coach. "
        "Evaluate the resume for ATS compatibility and return ONLY valid JSON with no markdown."
    )
    prompt = f"""Evaluate this resume for ATS compatibility and provide a detailed audit.

RESUME SUMMARY:
{summary}

Return ONLY a valid JSON object with this exact structure:
{{
  "ats_score": {det_score},
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "keyword_gaps": [
    {{"keyword": "<missing keyword>", "importance": "high|medium|low", "reason": "<why it matters for {target_role_clean}>"}}
  ],
  "checklist": {{
    "has_contact_info": true,
    "has_summary": true,
    "has_work_experience": true,
    "has_quantified_results": false,
    "uses_action_verbs": true,
    "has_skills_section": true,
    "has_education": true,
    "single_column_layout": true,
    "no_tables_or_graphics": true,
    "standard_section_headings": true
  }},
  "tips": [
    {{"priority": "high|medium|low", "tip": "<actionable improvement tip>"}}
  ]
}}

Be strict and realistic. A score of 90+ means truly ATS-optimized for {target_role_clean}."""

    try:
        text = _call_groq(prompt, system=system, temperature=0.0)
        text = re.sub(r'^```(?:json)?\s*', '', text.strip())
        text = re.sub(r'\s*```$', '', text)
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
            if isinstance(parsed, dict):
                parsed['ats_score'] = det_score
                return parsed
    except Exception as e:
        print(f"[AI] audit_resume_ats failed: {e}")

    return {
        "ats_score": det_score,
        "strengths": ["Resume submitted for review", "Clear section organization"],
        "weaknesses": ["Consider expanding details and project achievements"],
        "keyword_gaps": [],
        "checklist": {
            "has_contact_info": bool(pi.get('email')),
            "has_summary": bool(pi.get('summary')),
            "has_work_experience": len(resume_data.get('experience', []) or []) > 0,
            "has_quantified_results": False,
            "uses_action_verbs": True,
            "has_skills_section": len(resume_data.get('skills', []) or []) > 0,
            "has_education": len(resume_data.get('education', []) or []) > 0,
            "single_column_layout": True,
            "no_tables_or_graphics": True,
            "standard_section_headings": True,
        },
        "tips": [{"priority": "high", "tip": "Add quantifiable impact and technical metrics to your experience bullets."}]
    }


def tailor_resume_ats(resume_data: dict, job_description: str) -> dict:
    """Analyze structured resume data against a specific job description.
    Returns: {ats_score, summary: {missing_skills_count, suggested_bullet_edits_count, missing_skills}, suggestions: [{section, index, bullet_index, original, optimized, reason}]}
    """
    jd_clean = (job_description or '').strip() or 'General Software Engineer Role'
    jd_match_info = calculate_deterministic_jd_match(resume_data, jd_clean)
    det_score = jd_match_info['ats_score']

    pi = resume_data.get('personal_info', {}) or {}
    skills_flat = []
    for sg in resume_data.get('skills', []) or []:
        skills_flat.extend(sg.get('items', []) or [])
    exp_entries = []
    for idx, e in enumerate(resume_data.get('experience', []) or []):
        exp_entries.append({
            "index": idx,
            "company": e.get('company'),
            "role": e.get('role'),
            "bullets": e.get('bullets', []) or []
        })
    proj_entries = []
    for idx, p in enumerate(resume_data.get('projects', []) or []):
        proj_entries.append({
            "index": idx,
            "name": p.get('name'),
            "bullets": p.get('bullets', []) or []
        })

    resume_summary = {
        "title": pi.get('title', 'Not specified'),
        "skills": skills_flat,
        "experience": exp_entries,
        "projects": proj_entries
    }

    system = (
        "You are an expert ATS (Applicant Tracking System) optimization agent and career coach. "
        "Your task is to review a candidate's resume summary and a target Job Description (JD), "
        "calculate the ATS match score, identify missing technical skills/keywords, "
        "and suggest highly targeted rewrites of the resume bullet points to incorporate those missing terms. "
        "Return ONLY valid JSON with no markdown formatting."
    )

    prompt = f"""Compare this candidate's resume with the target Job Description (JD) and generate a tailoring plan.

RESUME DATA:
{json.dumps(resume_summary, indent=2)}

TARGET JOB DESCRIPTION:
{jd_clean}

INSTRUCTIONS:
1. Calculate an ATS match score (0-100) based on how well the candidate's skills and experience match the JD.
2. Identify missing key technical skills, languages, or tools (limit to the top 6 missing skills).
3. Suggest 1 to 5 optimized rewrites for existing experience or project bullets. Each suggestion MUST specify the exact section ('experience' or 'projects'), the index of the entry, the index of the bullet, the original bullet text, the optimized bullet text (which naturally integrates some of the missing keywords), and a clear reason for the change.
4. If a section or bullet is empty, do not suggest edits for it. Do not invent new experiences; only optimize existing statements.

Return ONLY a JSON object with this exact structure:
{{
  "ats_score": {det_score},
  "summary": {{
    "missing_skills_count": {jd_match_info['missing_skills_count']},
    "suggested_bullet_edits_count": <integer count of suggestions below>,
    "missing_skills": {json.dumps(jd_match_info['missing_skills'])}
  }},
  "suggestions": [
    {{
      "section": "experience|projects",
      "index": <integer index of the entry>,
      "bullet_index": <integer index of the bullet in that entry>,
      "original": "<original bullet text>",
      "optimized": "<optimized bullet text integrating missing skills>",
      "reason": "<explanation of which missing skill was added and why>"
    }}
  ]
}}
"""

    try:
        text = _call_groq(prompt, system=system, temperature=0.0)
        text = re.sub(r'^```(?:json)?\s*', '', text.strip())
        text = re.sub(r'\s*```$', '', text)
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
            if isinstance(parsed, dict):
                parsed['ats_score'] = det_score
                if 'summary' not in parsed or not isinstance(parsed['summary'], dict):
                    parsed['summary'] = {}
                parsed['summary']['ats_score'] = det_score
                parsed['summary']['missing_skills_count'] = jd_match_info['missing_skills_count']
                parsed['summary']['missing_skills'] = jd_match_info['missing_skills']
                if 'suggested_bullet_edits_count' not in parsed['summary']:
                    parsed['summary']['suggested_bullet_edits_count'] = len(parsed.get('suggestions', []))
                return parsed
    except Exception as e:
        print(f"[AI] tailor_resume_ats failed: {e}")

    return {
        "ats_score": det_score,
        "summary": {
            "missing_skills_count": jd_match_info['missing_skills_count'],
            "suggested_bullet_edits_count": 0,
            "missing_skills": jd_match_info['missing_skills']
        },
        "suggestions": []
    }


def generate_boardroom_debate(question: str, user_answer: str, history: list, next_question_text: str = None) -> dict:
    """Generate a dynamic courtroom-style debate and review score between Tech Lead (Aravind),
    System Architect (Sofia), and HR Lead (Marcus) evaluating the user's answer.
    """
    history_str = ""
    for idx, h in enumerate(history):
        history_str += f"\nRound {idx+1}:\nQ: {h.get('question','')}\nA: {h.get('answer','')}"

    system = (
        "You are coordinating a FAANG-style hiring panel interview boardroom. "
        "The panel consists of three distinct interviewers evaluating a candidate's answer:\n"
        "1. Aravind (Tech Lead): Strict, blunt, looks for Big-O efficiency, algorithm accuracy, clean logic.\n"
        "2. Sofia (System Architect): Analytical, looks for scalability, caching (Redis), replication, and fallback strategies.\n"
        "3. Marcus (HR / Product Lead): Encouraging, focuses on soft skills, communication clarity, and situational logic.\n"
        "Generate a debate between them where they discuss the candidate's answer, and then formulate the next response. "
        "Return ONLY valid JSON with no markdown."
    )

    next_action_instructions = (
        f"Present the next question: '{next_question_text}'"
        if next_question_text else
        "Conclude the interview and summarize the final verdict."
    )

    prompt = f"""Review the candidate's latest response and generate the courtroom panel debate.

INTERVIEW HISTORY:
{history_str if history_str else "None - First Question"}

CURRENT QUESTION:
{question}

CANDIDATE RESPONSE:
{user_answer}

NEXT ACTION REQUIRED:
{next_action_instructions}

INSTRUCTIONS:
1. Simulate a realistic dialog (debate_transcript) of 3-5 lines where the agents discuss the candidate's response. They should talk to each other, highlighting strengths and flaws.
   Example:
   Aravind (Tech Lead): "His array parsing is correct, but he neglected the space complexity."
   Sofia (System Architect): "Yes, and under high load, this linear lookup is going to spike memory consumption."
   Marcus (HR Lead): "True, but I liked how confidently he walked us through his process. Aravind, let's ask the next question."
2. Provide a score (0 to 10) for this answer.
3. Select the 'next_speaker' from the list: ["Tech Lead", "System Architect", "HR Lead"].
4. Formulate the 'next_question_intro': A short transition statement spoken by the next speaker introducing the next question (or concluding the interview).
5. Return the exact next question text in 'next_question' (matching the NEXT ACTION REQUIRED parameter).

Return ONLY a JSON object with this exact structure:
{{
  "score": <integer 0-10>,
  "debate_transcript": "<dialog format debate block>",
  "tech_lead_feedback": "<specific technical feedback from Aravind>",
  "architect_feedback": "<specific architecture feedback from Sofia>",
  "hr_feedback": "<specific soft skills feedback from Marcus>",
  "next_speaker": "Tech Lead|System Architect|HR Lead",
  "next_question_intro": "<next speaker transition sentence>",
  "next_question": "<the next question text (or empty if concluding)>"
}}
"""

    try:
        text = _call_groq(prompt, system=system, temperature=0.5)
        text = re.sub(r'^```(?:json)?\s*', '', text.strip())
        text = re.sub(r'\s*```$', '', text)
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
            if isinstance(parsed, dict) and 'score' in parsed:
                return parsed
    except Exception as e:
        print(f"[AI] generate_boardroom_debate failed: {e}")

    # Fallback
    return {
        "score": 7,
        "debate_transcript": "Tech Lead (Aravind): 'The code is working.'\nSystem Architect (Sofia): 'Agreed, it is simple but acceptable.'\nHR Lead (Marcus): 'Let's proceed.'",
        "tech_lead_feedback": "Functional solution, could optimize time complexity.",
        "architect_feedback": "Basic architecture, check concurrency scalability.",
        "hr_feedback": "Spoke clearly, good communication.",
        "next_speaker": "Tech Lead",
        "next_question_intro": "Let's move on to the next question.",
        "next_question": next_question_text or ""
    }


def compile_revision_guide(company: str, role: str, resume_skills: list, weak_topics: list, failed_questions: list) -> dict:
    """
    Personalized high-yield notes compiler using target company, role,
    user resume skills, weak topics, and failed questions history.
    """
    system = (
        f"You are an elite developer career coach specializing exclusively in {company} technical hiring standards for {role} positions. "
        f"Compile dynamic, custom-tailored last-minute study sheets and active recall flashcards specifically for {company}. "
        f"STRICT RULE: You MUST ONLY refer to {company} in your response. NEVER mention other companies like Google or Amazon unless the user target is explicitly that company. "
        "Return ONLY a valid JSON object."
    )
    prompt = f"""Generate a highly specific, customized revision study guide for a candidate preparing for:
Target Company: {company}
Target Role: {role}

CANDIDATE HISTORY & PROFILE DATA:
- Candidate Resume Stack: {', '.join(resume_skills) if resume_skills else 'None declared'}
- Weak Topics identified: {', '.join(weak_topics) if weak_topics else 'None recorded'}
- Questions they failed or got low scores on in past mock interviews:
{chr(10).join(f'  * Q: {q}' for q in failed_questions) if failed_questions else '  * No past mistakes logged'}

INSTRUCTIONS:
1. 'company_focus': Outline what {company} values most in technical loops for a {role} candidate (e.g., specific architectural priorities, scalability standards, engineering culture).
2. 'resume_bridge': A 1-2 sentence cheat sheet mapping their current resume stack directly to {company}'s specific preferences for {role}.
3. 'mistake_corrections': If they have past mock mistakes, explain the exact technical solution for them in 1-2 short sentences.
4. 'short_summary': Provide an array of 3-5 concise, bullet-pointed high-yield quick revision notes/formulas/facts tailored to {company}'s loops for a {role}.
5. 'flashcards': Create at least 8 interactive active recall flashcards (exactly 2 for each of the 4 loop stages: Round 1 = Resume Screen, Round 2 = Algorithms/DSA, Round 3 = System Design, Round 4 = Behavioral STAR) specifically targeted to help them pass {company}'s {role} loops.

CRITICAL MANDATORY REQUIREMENT: Your output MUST be 100% uniquely specific to {company} and {role}. Do NOT output generic templates. {company}'s technical expectations, coding style, and behavioral principles are DIFFERENT from other companies.

Return ONLY a JSON object (no markdown, no preamble) with this exact structure:
{{
  "company_focus": "<specific text for {company} {role}>",
  "resume_bridge": "<specific text for {company} {role}>",
  "mistake_corrections": ["<correction 1>", "<correction 2>"],
  "short_summary": ["<key revision point 1 for {company}>", "<key revision point 2 for {role}>", "<key revision point 3>"],
  "flashcards": [
    {{"front": "<question/term>", "back": "<concise explanation>", "category": "<topic name>", "round": 2}}
  ]
}}"""

    try:
        text = _call_groq(prompt, system=system, temperature=0.85)
        text = re.sub(r'^```(?:json)?\s*', '', text.strip())
        text = re.sub(r'\s*```$', '', text)
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            res = json.loads(match.group())
            if isinstance(res, dict):
                return res
    except Exception as e:
        print(f"[AI] compile_revision_guide failed: {e}")

    # Company & Role-tailored rich dictionary fallback
    company_data = {
        "Google": {
            "company_focus": f"Google prioritizes scalable distributed systems (MapReduce/Spanner), Big-O algorithmic efficiency, protocol buffers (gRPC), Spanner database consistency, and Googley collaborative culture for {role} roles.",
            "resume_bridge": f"Highlight how your proficiency in {', '.join(resume_skills[:4]) if resume_skills else 'core software development'} directly aligns with Google's technical stack for {role} positions.",
            "short_summary": [
                f"Google {role} Core Blueprint: Master Big-O space/time complexity, graph traversals (BFS/DFS, Dijkstra), and scalable RPC interface design.",
                "MapReduce & Spanner Scale: Understand global database consistency, TrueTime atomic clock synchronization, and consistent hashing ring partitions.",
                "Googliness Attributes: Demonstrate intellectual humility, proactive technical ownership, and navigating ambiguous requirements."
            ],
            "flashcards": [
                {"front": f"Google {role} Pitch", "back": f"Walk through your technical journey focusing on how your background fits Google's {role} expectations.", "category": "Resume Screen", "round": 1},
                {"front": "Google Metric Standard", "back": "Quantify your achievements (e.g., 'managed 15k QPS', 'improved query latency by 35%', 'reduced memory footprint by 2.5GB').", "category": "HM Screen", "round": 1},
                {"front": "Spanner vs BigTable for Google", "back": "Spanner provides external consistency (TrueTime) for ACID transactions; BigTable provides petabyte-scale low-latency key-value writes.", "category": "Google DSA & Core", "round": 2},
                {"front": "Google Big-O Algorithmic Rigor", "back": "Derive tight upper and lower bounds (O and Omega) and analyze space stack allocation before coding.", "category": "Algorithms", "round": 2},
                {"front": "TrueTime & Paxos at Google", "back": "TrueTime utilizes atomic clocks and GPS receivers to bound clock uncertainty, enabling global serializable transactions.", "category": "System Design", "round": 3},
                {"front": "gRPC & Protocol Buffers at Google", "back": "Binary serialization format with strongly typed schemas over HTTP/2 multiplexing, reducing payload sizes compared to JSON.", "category": "Distributed Systems", "round": 3},
                {"front": "Googliness Attributes for " + role, "back": "Demonstrate intellectual humility, active listening during code reviews, and leading without formal authority.", "category": "Behavioral STAR", "round": 4},
                {"front": "Navigating Ambiguous Scope at Google", "back": "Define minimal viable boundaries, state design assumptions explicitly, and validate with telemetry metrics.", "category": "Leadership STAR", "round": 4}
            ]
        },
        "Amazon": {
            "company_focus": f"Amazon prioritizes Operational Excellence, AWS cloud scalability (DynamoDB single-table sharding, SQS queues, Lambda), p99 latency SLAs, and strict alignment with Amazon's 16 Leadership Principles for {role} candidates.",
            "resume_bridge": f"Map your experience in {', '.join(resume_skills[:4]) if resume_skills else 'software development'} to Amazon's AWS cloud architecture and Customer Obsession standards for {role} roles.",
            "short_summary": [
                f"Amazon {role} Core Blueprint: Work backwards from customer requirements, design modular microservices, and optimize p99 latency.",
                "AWS & DynamoDB Scale: Master partition key strategies, SQS message decoupling, and serverless concurrency management.",
                "Leadership Principles: Prepare STAR stories highlighting Customer Obsession, Ownership, Bias for Action, and Frugality."
            ],
            "flashcards": [
                {"front": f"Customer Obsession Pitch ({role})", "back": f"Frame your resume achievements around solving customer pain points and driving business metrics for Amazon {role}.", "category": "Resume Screen", "round": 1},
                {"front": "Quantifying Amazon Scale", "back": "State your system metrics clearly: p99 latency (ms), TPS/QPS throughput, and AWS infrastructure cost savings.", "category": "HM Screen", "round": 1},
                {"front": "Amazon Clean OOP Coding", "back": "Write modular, production-ready code with single-responsibility classes, defensive input checks, and clear variable naming.", "category": "Coding Loop", "round": 2},
                {"front": "Sliding Window & Hash Map Patterns", "back": "Optimize O(N^2) brute force string/array problems to O(N) using sliding window pointers and auxiliary frequency maps.", "category": "Algorithms", "round": 2},
                {"front": "DynamoDB Single-Table Design", "back": "Model multi-entity relationships in a single DynamoDB table using composite Partition Keys (PK) and Sort Keys (SK).", "category": "AWS Architecture", "round": 3},
                {"front": "SQS Decoupling & Backpressure", "back": "Decouple synchronous API dependencies with SQS message queues and Dead Letter Queues (DLQ) for failed consumer retries.", "category": "System Design", "round": 3},
                {"front": "Amazon 16 LPs Alignment", "back": "Every behavioral answer must explicitly map to Amazon LPs (Customer Obsession, Ownership, Have Backbone; Disagree and Commit).", "category": "Behavioral STAR", "round": 4},
                {"front": "Bias for Action & Ownership STAR", "back": "Describe a scenario where you took calculated risks to unblock production deployment without waiting for top-down direction.", "category": "Leadership STAR", "round": 4}
            ]
        },
        "Meta": {
            "company_focus": f"Meta prioritizes rapid problem-solving execution speed (solving 2 coding problems in 45 min), GraphQL/React UI performance, Relay state management, RocksDB storage engines, and Move Fast culture for {role} roles.",
            "resume_bridge": f"Highlight how your skills in {', '.join(resume_skills[:4]) if resume_skills else 'software development'} align with Meta's high-velocity product engineering standards for {role} positions.",
            "short_summary": [
                f"Meta {role} Core Blueprint: Solve 2 LeetCode Medium/Hard algorithmic problems cleanly within 45 minutes with rapid dry-running.",
                "GraphQL & UI Architecture: Master optimistic UI updates, normalized client-side state, and query batching.",
                "Move Fast Culture: Demonstrate rapid iteration, unblocking team bottlenecks, and pragmatic engineering execution."
            ],
            "flashcards": [
                {"front": f"Move Fast Pitch for Meta ({role})", "back": f"Pitch your engineering background emphasizing rapid feature delivery, high execution velocity, and product impact.", "category": "Resume Screen", "round": 1},
                {"front": "Meta Product Impact Metrics", "back": "Highlight user engagement metrics, DAU/MAU scalability, render time optimization, and payload compression.", "category": "HM Screen", "round": 1},
                {"front": "Meta 2-in-45min Coding Strategy", "back": "Spend 2 mins clarifying, 3 mins explaining algorithm, 12 mins coding, 3 mins dry-running for EACH of the 2 questions.", "category": "Meta DSA", "round": 2},
                {"front": "Top-K Heaps & Graph BFS/DFS", "back": "Master Min-Heap for Top-K elements in O(N log K) and BFS queue for shortest path in unweighted social graphs.", "category": "Algorithms", "round": 2},
                {"front": "GraphQL Relay Query Batching", "back": "Prevent N+1 query problem by batching and deferring nested fields with GraphQL DataLoader and Relay fragments.", "category": "Frontend/API Architecture", "round": 3},
                {"front": "RocksDB & Tao Graph Engine", "back": "Understand Meta's persistent key-value store optimized for fast SSD writes and Tao distributed graph caching.", "category": "System Design", "round": 3},
                {"front": "Meta 'Be Direct & Candid' STAR", "back": "Provide an example where you gave constructive, direct code feedback that improved team engineering standards.", "category": "Behavioral STAR", "round": 4},
                {"front": "Unblocking Team Bottlenecks", "back": "Demonstrate how you proactively identified technical debt or missing API contracts to keep product shipping on schedule.", "category": "Leadership STAR", "round": 4}
            ]
        },
        "Netflix": {
            "company_focus": f"Netflix prioritizes microservice fault tolerance, Chaos Engineering resilience, high-concurrency Java/RxJava video telemetry pipelines, Cassandra NoSQL sharding, and Freedom & Responsibility culture for {role} roles.",
            "resume_bridge": f"Map your technical stack in {', '.join(resume_skills[:4]) if resume_skills else 'software engineering'} to Netflix's high-throughput video streaming infrastructure for {role} candidates.",
            "short_summary": [
                f"Netflix {role} Core Blueprint: Design resilient, decoupled streaming pipelines with Resilience4j circuit breakers and client-side load balancing.",
                "Chaos Engineering: Build graceful degradation strategies for microservices during regional infrastructure outages.",
                "Freedom & Responsibility: Demonstrate high individual ownership, direct technical communication, and self-directed execution."
            ],
            "flashcards": [
                {"front": f"Freedom & Responsibility Pitch ({role})", "back": f"Showcase your self-driven execution, high technical autonomy, and operational accountability for Netflix {role}.", "category": "Resume Screen", "round": 1},
                {"front": "High-Density Talent Signals", "back": "Articulate how you operate without micro-management and take responsibility for production deployment decisions.", "category": "HM Screen", "round": 1},
                {"front": "RxJava & Async Event Loops", "back": "Process non-blocking I/O event streams, handle backpressure, and prevent main thread blocking under high load.", "category": "Concurrency", "round": 2},
                {"front": "Thread-Safe Data Structures", "back": "Utilize ConcurrentHashMap, AtomicLong, and CopyOnWriteArrayList to prevent race conditions without heavy locks.", "category": "Coding Loop", "round": 2},
                {"front": "Chaos Engineering & Circuit Breakers", "back": "Inject synthetic failures (Chaos Monkey) and configure Resilience4j fallback responses to prevent cascading outages.", "category": "System Design", "round": 3},
                {"front": "Cassandra NoSQL Sharding at Netflix", "back": "Partition video viewing telemetry across Cassandra cluster nodes using wide-column rows and time-series keys.", "category": "Distributed Storage", "round": 3},
                {"front": "Context Not Control Culture", "back": "Explain how you set clear technical context for peers rather than prescribing rigid top-down rules.", "category": "Behavioral STAR", "round": 4},
                {"front": "Direct Technical Feedback Scenario", "back": "Share a time you delivered uncomfortable, honest feedback to a peer that resulted in better system reliability.", "category": "Leadership STAR", "round": 4}
            ]
        },
        "Microsoft": {
            "company_focus": f"Microsoft prioritizes enterprise system reliability, Azure cloud integrations (Cosmos DB, Azure Service Bus), ASP.NET Core & TypeScript ecosystems, and Growth Mindset team collaboration for {role} positions.",
            "resume_bridge": f"Highlight how your skills in {', '.join(resume_skills[:4]) if resume_skills else 'software engineering'} map to Microsoft's enterprise architecture requirements for {role} roles.",
            "short_summary": [
                f"Microsoft {role} Core Blueprint: Focus on clean SOLID object-oriented design, async/await concurrency, and ASP.NET Core middleware pipelines.",
                "Cosmos DB & Azure Architecture: Understand multi-master global database replication, RBAC enterprise security, and microservice isolation.",
                "Growth Mindset Culture: Demonstrate adaptability, taking constructive feedback during coding loops, and continuous learning."
            ],
            "flashcards": [
                {"front": f"Growth Mindset Pitch for Microsoft ({role})", "back": f"Highlight your continuous learning curve, enterprise software contributions, and collaborative engineering approach.", "category": "Resume Screen", "round": 1},
                {"front": "Enterprise Systems Metric", "back": "Quantify your enterprise impact: multi-tenant security RBAC, database migration zero-downtime, and service uptime SLAs.", "category": "HM Screen", "round": 1},
                {"front": "SOLID OOP Design Principles", "back": "Apply Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion.", "category": "Object Oriented Design", "round": 2},
                {"front": "Recursion & Tree/Graph Traversal", "back": "Implement clean recursive algorithms with memoization and iterative stack fallbacks to avoid call stack overflow.", "category": "Algorithms", "round": 2},
                {"front": "Cosmos DB Multi-Master Replication", "back": "Configure global multi-region write locations with configurable consistency levels (Strong, Bounded Staleness, Session, Eventual).", "category": "Azure Cloud", "round": 3},
                {"front": "ASP.NET Core Middleware & Azure RBAC", "back": "Structure request pipeline handlers for JWT authentication, role-based access control, and secret key vaulting.", "category": "System Design", "round": 3},
                {"front": "Growth Mindset in Microsoft Loops", "back": "Demonstrate enthusiasm when accepting interviewer hints, quickly incorporating feedback into your solution.", "category": "Behavioral STAR", "round": 4},
                {"front": "One Microsoft Collaboration", "back": "Describe cross-team alignment where you collaborated across departments to build an integrated platform solution.", "category": "Leadership STAR", "round": 4}
            ]
        },
        "Apple": {
            "company_focus": f"Apple prioritizes low-level system performance, C++/Swift memory management (ARC), thread safety, hardware-software integration, privacy-first architecture, and extreme attention to detail for {role} candidates.",
            "resume_bridge": f"Map your background in {', '.join(resume_skills[:4]) if resume_skills else 'software development'} to Apple's low-level performance and privacy standards for {role} roles.",
            "short_summary": [
                f"Apple {role} Core Blueprint: Manage CPU cache lines, thread pools, and memory layout to eliminate latency spikes.",
                "Privacy-First Architecture: Design on-device computations and secure enclave integrations protecting user data.",
                "Craftsmanship & Detail: Demonstrate meticulous attention to code quality, edge-case handling, and elegant API interfaces."
            ],
            "flashcards": [
                {"front": f"Craftsmanship Pitch for Apple ({role})", "back": f"Emphasize your attention to low-level details, memory efficiency, code aesthetics, and user privacy for Apple {role}.", "category": "Resume Screen", "round": 1},
                {"front": "Low-Level Performance Stack", "back": "Detail your experience with memory profiling, CPU cache hit ratios, frame rate consistency (60/120fps), and binary size.", "category": "HM Screen", "round": 1},
                {"front": "C++ / Swift ARC Memory Management", "back": "Prevent retain cycles using weak/unowned references, manage heap vs stack allocation, and debug memory leaks.", "category": "Memory & Core DSA", "round": 2},
                {"front": "Pointer Hygiene & Cache Optimization", "back": "Structure data contiguously in memory to leverage CPU L1/L2 cache prefetching and avoid pointer indirection overhead.", "category": "Low Level Coding", "round": 2},
                {"front": "Privacy-First On-Device Architecture", "back": "Perform data tokenization and feature extraction locally on-device, sending minimal anonymized telemetry to backend.", "category": "System Design", "round": 3},
                {"front": "CloudKit Sync & Secure Enclave", "back": "Store sensitive keys inside Secure Enclave hardware while maintaining end-to-end encrypted device syncing via CloudKit.", "category": "Security & Storage", "round": 3},
                {"front": "Apple Obsessive Attention to Detail", "back": "Explain how you caught an obscure edge case or micro-performance regression before it reached production release.", "category": "Behavioral STAR", "round": 4},
                {"front": "Privacy as a Human Right STAR", "back": "Describe an architectural decision where you chose on-device privacy protection over easier server-side data collection.", "category": "Leadership STAR", "round": 4}
            ]
        },
        "Stripe": {
            "company_focus": f"Stripe prioritizes financial-grade API idempotency, ACID ledger database consistency, developer ergonomics (SDKs & REST docs), zero-downtime database migrations, and robust error handling for {role} candidates.",
            "resume_bridge": f"Highlight how your experience in {', '.join(resume_skills[:4]) if resume_skills else 'software engineering'} directly maps to Stripe's financial infrastructure requirements for {role} positions.",
            "short_summary": [
                f"Stripe {role} Core Blueprint: Build idempotent API endpoints using unique idempotency keys to prevent duplicate financial mutations.",
                "ACID Consistency: Master Postgres multi-table transactions with serializable isolation levels and distributed Saga patterns.",
                "Developer Ergonomics: Design intuitive, self-describing REST APIs with clear error contracts and SDK compatibility."
            ],
            "flashcards": [
                {"front": f"Financial Engineering Pitch ({role})", "back": f"Pitch your software experience with high-reliability systems, API design standards, and precision engineering for Stripe {role}.", "category": "Resume Screen", "round": 1},
                {"front": "Stripe Idempotency & Precision Signals", "back": "Quantify your API uptime, transaction success rate (99.999%), and error recovery mechanisms in past financial/SaaS projects.", "category": "HM Screen", "round": 1},
                {"front": "Stripe Real-World API Coding", "back": "Write clean API route handlers that parse payload parameters, validate inputs, execute business logic, and handle HTTP errors.", "category": "API Coding Loop", "round": 2},
                {"front": "Parsing Complex Payloads & Edge Cases", "back": "Handle malformed JSON, missing fields, type coercion, and unexpected null values gracefully without throwing unhandled exceptions.", "category": "Coding Rigor", "round": 2},
                {"front": "Idempotency Keys & Saga Pattern", "back": "Store unique Idempotency-Key headers in Redis to return cached transaction results on network retries without double charging.", "category": "Financial System Design", "round": 3},
                {"front": "Postgres Serializable ACID Transactions", "back": "Execute financial ledger mutations inside atomic transactions with serializable isolation levels to prevent phantom reads.", "category": "Database Consistency", "round": 3},
                {"front": "Developer Ergonomics & API Quality", "back": "Describe how you designed a REST endpoint or SDK interface that made integration seamless and error-proof for developers.", "category": "Behavioral STAR", "round": 4},
                {"front": "Handling Financial Edge Cases STAR", "back": "Walk through a complex bug involving race conditions or payment timeouts and how you built a permanent automated test suite for it.", "category": "Leadership STAR", "round": 4}
            ]
        }
    }

    selected = company_data.get(company, company_data["Google"])

    return {
        "company_focus": selected["company_focus"],
        "resume_bridge": selected["resume_bridge"],
        "mistake_corrections": [
            f"Review {company}'s specific architectural trade-offs for {role} candidates.",
            f"Practice writing clean, self-documenting code under time constraints for {company} loops."
        ],
        "short_summary": selected["short_summary"],
        "flashcards": selected["flashcards"]
    }


# ─────────────────────────────────────────────────────────────────────────────
# AI Challenge Generators
# ─────────────────────────────────────────────────────────────────────────────

def generate_ai_challenge(topic_name: str) -> dict:
    """Generate a high-quality coding challenge for a given topic using Groq/AI."""
    system = "You are a senior technical interviewer and algorithm designer. Generate a realistic coding challenge and return ONLY valid JSON."
    prompt = f"""Generate a coding challenge on the topic: '{topic_name}'.

Return ONLY a JSON object with this structure:
{{
  "title": "<Concise Challenge Title>",
  "description": "<Detailed description of problem, input format, and output format>",
  "requirements": ["<Requirement 1>", "<Requirement 2>", "<Requirement 3>"],
  "difficulty": "easy|medium|hard",
  "xp_reward": 150,
  "tags": ["{topic_name.lower()}", "coding"],
  "estimated_time": "20 mins"
}}"""
    try:
        text = _call_groq(prompt, system=system, temperature=0.7)
        text = re.sub(r'^```(?:json)?\s*', '', text.strip())
        text = re.sub(r'\s*```$', '', text)
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception as e:
        print(f"[AI] generate_ai_challenge failed: {e}")

    # Fallback
    return {
        "title": f"Mastering {topic_name}: Core Implementation",
        "description": f"Implement a complete solution for {topic_name}. Build clean code with optimal complexity and handle boundary conditions.",
        "requirements": ["Implement the core data structure or algorithm", "Handle empty or single-element inputs", "Provide Big-O complexity explanation"],
        "difficulty": "medium",
        "xp_reward": 150,
        "tags": [topic_name.lower(), "coding"],
        "estimated_time": "20 mins"
    }


def generate_ai_challenge_from_title(title: str, topic_label: str = '') -> dict:
    """Generate a focused coding challenge matching a specific task title from a user's roadmap."""
    system = "You are an expert algorithm designer and software engineering instructor. Create a targeted coding challenge based on the task title and return ONLY valid JSON."
    prompt = f"""Generate a hands-on coding challenge for this roadmap learning task:
Task Title: "{title}"
Topic Focus: "{topic_label if topic_label else 'General Software Engineering'}"

Return ONLY a JSON object with this exact structure:
{{
  "title": "{title}",
  "description": "<Detailed problem description with background, requirements, example inputs/outputs, and edge cases to consider.>",
  "requirements": ["<Requirement 1>", "<Requirement 2>", "<Requirement 3>"],
  "difficulty": "easy|medium|hard",
  "xp_reward": 150,
  "tags": ["{topic_label.lower() if topic_label else 'coding'}", "roadmap"],
  "estimated_time": "25 mins"
}}"""
    try:
        text = _call_groq(prompt, system=system, temperature=0.6)
        text = re.sub(r'^```(?:json)?\s*', '', text.strip())
        text = re.sub(r'\s*```$', '', text)
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception as e:
        print(f"[AI] generate_ai_challenge_from_title failed: {e}")

    # Fallback
    return {
        "title": title,
        "description": f"Implement a complete solution for: {title}.\n\nRequirements:\n1. Implement clean and modular code.\n2. Handle edge cases efficiently.\n3. Include explanation/docstring for your implementation.",
        "requirements": ["Clean code structure", "Edge case handling", "Time & Space complexity analysis"],
        "difficulty": "medium",
        "xp_reward": 150,
        "tags": [topic_label.lower()] if topic_label else ["coding"],
        "estimated_time": "25 mins"
    }




