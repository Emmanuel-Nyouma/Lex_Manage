# ─── Build stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Vite inlines VITE_* at BUILD time, so these must be provided as build args
# (compose `args:` or `docker build --build-arg`). For a same-origin deploy set
# them to this frontend's own public URL; for a separate backend domain set them
# to the backend's URL.
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_ENABLE_AI=true
ARG VITE_SECURE_AUTH=true
ENV VITE_API_URL=$VITE_API_URL \
    VITE_WS_URL=$VITE_WS_URL \
    VITE_ENABLE_AI=$VITE_ENABLE_AI \
    VITE_SECURE_AUTH=$VITE_SECURE_AUTH

RUN npm run build

# ─── Serve stage ─────────────────────────────────────────────────────────────
FROM nginx:alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
