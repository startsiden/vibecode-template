# syntax=docker/dockerfile:1.7
# Multi-stage build for an Astro server-rendered app.
# Targets Node 22 LTS, pnpm via corepack — same baseline as
# hegnar-bellsheep-web, but without the private @startsiden registry.

# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod=false

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# ---------- production deps only ----------
FROM node:22-alpine AS prod-deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod

# ---------- final ----------
FROM node:22-alpine AS final
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Drop privileges
RUN addgroup -S app && adduser -S app -G app
COPY --from=prod-deps --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/package.json ./package.json
USER app

EXPOSE 3000
CMD ["node", "./dist/server/entry.mjs"]
