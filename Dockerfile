# syntax = docker/dockerfile:1

# ARG SENTRY_AUTH_TOKEN
# ARG SENTRY_DSN
# Setup common environment
FROM node:22.13-slim AS base
WORKDIR /app

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    poppler-utils \
    postgresql-client \
    python3 \
    pkg-config \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally using npm
RUN npm install -g pnpm@latest-10

# Set up user
RUN useradd -r -u 1001 -g node nodejs && \
    chown -R nodejs:node /app

# Stage for installing dependencies
FROM base AS deps
ENV NODE_ENV=development

USER nodejs:node

COPY --chown=nodejs:node package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Stage for build application
FROM base AS builder
ENV NODE_ENV=production

USER nodejs:node

# Copy application with correct ownership
COPY --chown=nodejs:node . .
COPY --chown=nodejs:node --from=deps /app/package.json package.json
COPY --chown=nodejs:node --from=deps /app/pnpm-lock.yaml pnpm-lock.yaml
COPY --chown=nodejs:node --from=deps /app/node_modules node_modules

#ENV NODE_OPTIONS="--experimental-require-module"
# Run application build
# ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
# ENV SENTRY_DSN=$SENTRY_DSN
RUN npx prisma generate && pnpm build
# RUN pnpm sentry:sourcemaps

# Final stage for run application
FROM base AS runner
ENV NODE_ENV=production

COPY --chown=nodejs:node --from=builder /app/docker-entrypoint.sh ./
COPY --chown=nodejs:node --from=builder /app/ap-southeast-1-bundle.pem ./
COPY --chown=nodejs:node --from=builder /app/dist/ ./dist/
COPY --chown=nodejs:node --from=builder /app/prisma ./prisma
COPY --chown=nodejs:node --from=builder /app/package.json ./package.json
COPY --chown=nodejs:node --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --chown=nodejs:node --from=builder /app/node_modules/ ./node_modules/

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nodejs:node

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["pnpm","start:prod"]

