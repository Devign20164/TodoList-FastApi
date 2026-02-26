# ------------------------------------------------------------------
# Frontend Dockerfile — React + Nginx
# ------------------------------------------------------------------
# Multi-stage build:
#   Stage 1 (build): Node.js compiles TypeScript and bundles React
#                     into static HTML/CSS/JS files.
#   Stage 2 (serve): Nginx serves those static files.
#                     No Node.js in the final image — just a tiny
#                     web server and your built files.
#
# Learning note — why not just use Node in production?
#   Node.js is 900MB+. Nginx Alpine is ~25MB. For serving static
#   files, Nginx is faster, lighter, and more secure.
# ------------------------------------------------------------------

# ---- Stage 1: build the React app ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first — Docker caches this layer.
# If dependencies haven't changed, Docker skips `npm ci` on rebuild.
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build
COPY . .

# VITE_API_URL is empty so the frontend calls relative paths (e.g. /todos)
# which Nginx proxies to the backend. No hardcoded localhost URLs.
ENV VITE_API_URL=""
RUN npm run build


# ---- Stage 2: serve with Nginx ----
FROM nginx:alpine

# Remove the default Nginx page and replace with our config
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
