# syntax=docker/dockerfile:1
FROM python:3.12-slim

# lxml and chromadb both need build tooling to compile native extensions on
# install; removed from the final layer isn't worth the complexity here since
# Render bills by instance size, not image size.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copied and installed before the rest of the source so Docker's layer cache
# skips the (slow) dependency install on every code-only change.
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend backend

# Render injects PORT at runtime; it is not known at build time, so it has to
# be read in shell form (not exec form) for the ${PORT} expansion to happen.
ENV PORT=8000
EXPOSE 8000
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}
