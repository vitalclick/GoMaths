# AI services base — one image, three apps. Pass SERVICE=tutor|solver|
# validation as a build arg so the same image can host any of the three
# FastAPI processes.
#
# Build context MUST be the repo root (we need curriculum-data, which
# sits beside services/). Build from the repo root:
#
#   docker build -f services/ai-services/Dockerfile -t gomaths-ai-tutor      --build-arg SERVICE=tutor      .
#   docker build -f services/ai-services/Dockerfile -t gomaths-ai-solver     --build-arg SERVICE=solver     .
#   docker build -f services/ai-services/Dockerfile -t gomaths-ai-validation --build-arg SERVICE=validation .
#
# All three need the same Python deps (validator depends on sympy, tutor
# imports validator, solver imports validator). Separate images only
# differ in the CMD's --app target — keeps the build matrix tiny.

ARG PYTHON_VERSION=3.11
FROM python:${PYTHON_VERSION}-slim

RUN groupadd --system --gid 1001 app && \
    useradd --system --uid 1001 --gid app --create-home --home-dir /home/app app

# sympy is the moat — every other component imports it.
# uvicorn[standard] gives us httptools + watchfiles + uvloop.
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
      sympy \
      fastapi \
      'uvicorn[standard]' \
      pydantic \
      anthropic \
      openai

WORKDIR /app

COPY --chown=app:app services/ai-services /app/ai-services
COPY --chown=app:app curriculum-data /app/curriculum-data

USER app
ENV PYTHONPATH=/app/ai-services
ENV CURRICULUM_ROOT=/app/curriculum-data
ENV PORT=8080
EXPOSE 8080

ARG SERVICE=tutor
ENV SERVICE=${SERVICE}

# `sh -c` so $SERVICE expands at runtime, not build time. Health checks
# (defined per-service in fly.toml) probe /health.
CMD ["sh", "-c", "uvicorn ${SERVICE}.main:app --host 0.0.0.0 --port ${PORT} --workers 1"]
