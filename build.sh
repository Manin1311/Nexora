#!/usr/bin/env bash
# Render build script for Nexora backend
set -o errexit

if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
elif [ -f "backend/requirements.txt" ]; then
    pip install -r backend/requirements.txt
fi

if [ -f "backend/manage.py" ]; then
    cd backend
fi

# Run all pending migrations
python manage.py migrate --no-input

# Collect static files
python manage.py collectstatic --no-input

