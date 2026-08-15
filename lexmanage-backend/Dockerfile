# Install once so build and production stages share the exact same dependency tree.
FROM node:22-alpine AS dependencies
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma/
RUN --mount=type=cache,target=/root/.npm \
    npm ci --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-maxtimeout=120000
RUN npx prisma generate

FROM dependencies AS build
COPY . .
RUN npm run build

FROM dependencies AS production-deps
RUN npm prune --omit=dev

FROM node:22-alpine AS production
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=build /app/dist ./dist
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=production-deps /app/package*.json ./
COPY --from=build /app/prisma ./prisma

EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
