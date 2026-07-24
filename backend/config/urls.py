"""
URL Configuration for Nexora backend.
Includes SPA catch-all routing for React frontend routes (/arena, /challenges, etc.)
"""
import os
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse, FileResponse, HttpResponse


def root_health_check(request):
    return JsonResponse({
        "status": "online",
        "system": "Nexora AI Engineering Platform API",
        "version": "1.0.0"
    })


def serve_spa(request, path=''):
    """
    Catch-all view for React SPA routes (e.g. /arena, /challenges, /profile, /roadmap).
    Serves frontend/dist/index.html if built, otherwise serves fallback HTML shell.
    """
    dist_index = settings.BASE_DIR.parent / 'frontend' / 'dist' / 'index.html'
    if os.path.exists(dist_index):
        return FileResponse(open(dist_index, 'rb'), content_type='text/html')
    
    static_index = settings.BASE_DIR / 'staticfiles' / 'index.html'
    if os.path.exists(static_index):
        return FileResponse(open(static_index, 'rb'), content_type='text/html')

    # Fallback HTML shell so React client-side router takes over
    html_content = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nexora — AI Engineering Platform</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>"""
    return HttpResponse(html_content, content_type='text/html')


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/',       include('users.urls')),   # existing auth routes
    path('api/users/',      include('users.urls')),   # resume + profile routes
    path('api/challenges/', include('challenges.urls')),
    path('api/interviews/', include('interviews.urls')),
    path('api/mentor/',     include('mentor.urls')),
    path('api/showcase/',   include('showcase.urls')),
    path('api/progress/',   include('progress.urls')),
    path('api/roadmap/',    include('roadmap.urls')),
    path('api/codereview/', include('codereview.urls')),
    path('api/arena/',      include('arena.urls')),
    path('api/health/',     root_health_check),
    # Catch-all rule for React SPA routing (e.g. /arena, /challenges, /profile, /roadmap)
    re_path(r'^(?!api/|admin/|media/|static/).*$', serve_spa),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
