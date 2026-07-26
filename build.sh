#!/usr/bin/env bash
# Render build script for Nexora backend
set -o errexit

pip install -r requirements.txt

# Run all pending migrations (including 0003 which added complexity/empirical fields)
python manage.py migrate --no-input

# Collect static files
python manage.py collectstatic --no-input
