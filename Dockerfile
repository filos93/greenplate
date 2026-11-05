# ==========================================
# STAGE 1: Build the Vite SPA Application
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definition files to leverage Docker layer caching
COPY package*.json ./

# Perform a clean installation of project dependencies
RUN npm ci

# Copy the remaining source code
COPY . .

# Pass build-time environment variables required by Vite
ARG VITE_SPOONACULAR_API_KEY
ARG VITE_SENTRY_DSN
ENV VITE_SPOONACULAR_API_KEY=$VITE_SPOONACULAR_API_KEY
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN

# Compile static distribution artifacts (outputs to /app/dist)
RUN npm run build

# ==========================================
# STAGE 2: Serve Static Assets via Nginx Alpine
# ==========================================
FROM nginx:alpine AS runner

WORKDIR /usr/share/nginx/html

# Remove default Nginx static files
RUN rm -rf ./*

# Copy compiled static artifacts from the builder stage
COPY --from=builder /app/dist .

# Copy custom Nginx configuration for client-side SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]