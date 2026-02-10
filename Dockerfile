# --- Frontend build ---
FROM node:22-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Backend build ---
FROM rust:1.89-slim AS backend
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY backend/ backend/
RUN cargo build --release -p semleaf-backend

# --- Runtime ---
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=backend /app/target/release/semleaf-backend ./
COPY --from=frontend /app/frontend/dist ./dist
ENV STATIC_DIR=/app/dist
EXPOSE 16789
CMD ["./semleaf-backend"]
