# ============================================================
# Stage 1 : Build du frontend (React/Vite)
# ============================================================
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# ============================================================
# Stage 2 : Backend Django + fichiers statiques frontend
# ============================================================
FROM python:3.11-slim AS backend

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Dépendances système
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Dépendances Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Code backend
COPY backend/ .

# Fichiers frontend buildés → dossier servi par nginx
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Config nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Collecter les fichiers statiques Django
RUN python manage.py collectstatic --noinput || true

EXPOSE 80

# Lancer nginx + gunicorn ensemble
CMD ["sh", "-c", "nginx && gunicorn --bind 0.0.0.0:8000 config.wsgi:application"]
