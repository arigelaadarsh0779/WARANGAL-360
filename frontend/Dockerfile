# ============================================
# WARANGAL 360 — Frontend Dockerfile (React + Vite)
# Multi-stage Docker build with Nginx web server
# ============================================

# Stage 1: Build React Application
FROM node:20-alpine AS build
WORKDIR /app

# Copy package manifests and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build production bundle
COPY . .
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default Nginx static files
RUN rm -rf ./*

# Copy build artifacts from build stage
COPY --from=build /app/dist .

# Copy custom Nginx configuration for React SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
