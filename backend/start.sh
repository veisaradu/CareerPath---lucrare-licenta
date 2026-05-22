#!/bin/sh
set -e

echo "Waiting for postgres..."
until python -c "import psycopg2; psycopg2.connect(host='$DB_HOST', dbname='$DB_NAME', user='$DB_USER', password='$DB_PASSWORD')" 2>/dev/null; do
  sleep 1
done
echo "Postgres is ready."

echo "Waiting for MinIO..."
until python -c "import urllib.request; urllib.request.urlopen('$MINIO_ENDPOINT/minio/health/live')" 2>/dev/null; do
  sleep 1
done
echo "MinIO is ready."

python manage.py migrate --no-input
python manage.py seed_jobs

exec python manage.py runserver 0.0.0.0:8000
