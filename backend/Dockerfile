# ------------------------------------------------------------------
# Backend Dockerfile — FastAPI + Uvicorn
# ------------------------------------------------------------------
# Uses a multi-stage build:
#   Stage 1 (builder): installs Python dependencies into a virtual env.
#   Stage 2 (runtime): copies only the built venv + app code into a
#                       slim image with a non-root user.
#
# Learning note — why multi-stage?
#   The builder stage has compilers and build tools (needed to install
#   psycopg2 etc.), but we don't want those in the final image.
#   Smaller image = faster deploys, fewer security vulnerabilities.
# ------------------------------------------------------------------

# ---- Stage 1: build dependencies ----
FROM python:3.11-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN python -m venv /app/venv && \
    /app/venv/bin/pip install --no-cache-dir -r requirements.txt


# ---- Stage 2: production runtime ----
FROM python:3.11-slim

WORKDIR /app

# Create a non-root user for security.
# Running as root inside a container is a bad practice — if an attacker
# escapes the app, they'd have root access to the container.
RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser

# Copy the pre-built virtual environment from the builder stage
COPY --from=builder /app/venv /app/venv

# Copy application code
COPY . .

# Make sure the venv's Python/pip are used instead of the system ones
ENV PATH="/app/venv/bin:$PATH"

# Switch to the non-root user
USER appuser

EXPOSE 8000

# Health check — Docker will call this periodically to verify the
# container is alive. If it fails 3 times, Docker restarts the container.
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
