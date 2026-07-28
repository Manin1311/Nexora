from django.views import View
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json

from .models import LandingReview

# Seed reviews returned when DB is empty
SEED_REVIEWS = [
    {"name": "Arjun Mehta",  "role": "Backend Engineer at Zomato",  "text": "Nexora transformed how I practice. The AI feedback is brutally honest and incredibly helpful. Went from Explorer to Creator in 3 months.",    "rating": 5},
    {"name": "Priya Sharma", "role": "Full Stack Dev at Razorpay",   "text": "The daily challenges feel like real work, not textbook problems. Dev Mentor actually knows my progress and doesn't suggest what I've mastered.", "rating": 5},
    {"name": "Rahul Verma",  "role": "SDE-2 at Flipkart",            "text": "After 60 days on Interview Lab, I cleared 4 rounds at Flipkart. The AI scoring with detailed feedback made all the difference.",              "rating": 5},
]


@method_decorator(csrf_exempt, name='dispatch')
class LandingReviewView(View):
    """GET  /api/reviews/  — list all reviews (newest first)
       POST /api/reviews/  — submit a new review (no auth required)
    """

    def get(self, request, *args, **kwargs):
        reviews = list(
            LandingReview.objects.values('id', 'name', 'role', 'text', 'rating', 'created_at')
        )
        # If the DB is still empty, return seed data so the carousel is never blank
        if not reviews:
            return JsonResponse({'reviews': SEED_REVIEWS}, status=200)
        # Convert datetime to str
        for r in reviews:
            r['created_at'] = r['created_at'].isoformat()
        return JsonResponse({'reviews': reviews}, status=200)

    def post(self, request, *args, **kwargs):
        try:
            body = json.loads(request.body)
        except (json.JSONDecodeError, UnicodeDecodeError):
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        name = str(body.get('name', '')).strip()[:100]
        role = str(body.get('role', 'Software Developer')).strip()[:150] or 'Software Developer'
        text = str(body.get('text', '')).strip()
        rating = max(1, min(5, int(body.get('rating', 5))))

        if not name or not text:
            return JsonResponse({'error': 'name and text are required'}, status=400)

        review = LandingReview.objects.create(name=name, role=role, text=text, rating=rating)
        return JsonResponse({
            'id': review.id,
            'name': review.name,
            'role': review.role,
            'text': review.text,
            'rating': review.rating,
            'created_at': review.created_at.isoformat(),
        }, status=201)
