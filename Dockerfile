# An example of using standalone Python builds with multistage images.

# First, build the application in the `/app` directory
FROM ghcr.io/astral-sh/uv:bookworm-slim AS builder
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

# Configure the Python directory so it is consistent
ENV UV_PYTHON_INSTALL_DIR=/python

# Only use the managed Python version
ENV UV_PYTHON_PREFERENCE=only-managed

# Install Python before the project for caching
RUN uv python install 3.12

WORKDIR /app
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project --no-dev
COPY ./main.py /app
COPY ./ngram.py /app
COPY ./download_nltk_data.py /app
COPY ./pyproject.toml /app
COPY ./uv.lock /app

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev

# Use the official lightweight Node.js image.
# https://hub.docker.com/_/node
FROM node:20-slim AS node_builder

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY client/package*.json ./client/
COPY client/tsconfig*.json ./client/
COPY client/vite.config.ts ./client/

# Install client dependencies
RUN cd client && npm ci && cd ..

# Copy local code to the container image.
COPY ./client/src ./client/src
COPY ./client/public ./client/public
COPY ./client/index.html ./client/

# Build the app
RUN cd client && npm run build


# Then, use a final image without uv
FROM debian:bookworm-slim

# Setup a non-root user
RUN groupadd --system --gid 999 nonroot \
 && useradd --system --gid 999 --uid 999 --create-home nonroot

# Copy the Python version
COPY --from=builder --chown=python:python /python /python

# Copy the application from the builder
COPY --from=builder --chown=nonroot:nonroot /app /app

# Copy the Node.js build artifacts
COPY --from=node_builder --chown=nonroot:nonroot /usr/src/app/client/dist /app/client/dist

COPY --chown=nonroot:nonroot model/3gram_model_bytes_ascii.cdb /app/model/
# COPY --chown=nonroot:nonroot model/3gram_model_bytes.cdb-wal /app/model/
# COPY --chown=nonroot:nonroot model/3gram_model_bytes.cdb-shm /app/model/

# Place executables in the environment at the front of the path
ENV PATH="/app/.venv/bin:$PATH"

# Use the non-root user to run our application
USER nonroot

# Use `/app` as the working directory
WORKDIR /app

# Download NLTK data
# RUN python -m nltk.downloader -d '/app/.venv/nltk_data' punkt_tab
RUN python download_nltk_data.py

# Run the FastAPI application by default
CMD ["fastapi", "run", "--host", "0.0.0.0", "main.py"]