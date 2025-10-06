# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Build-time API base, default to /api (proxied by nginx)
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE

COPY frontend/package.json ./
COPY frontend/ ./
RUN npm install && npm run build

# Runtime stage
FROM nginx:alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

