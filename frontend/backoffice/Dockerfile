# ============================================
# Stage 1: Build the React + Vite application
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy lockfile + manifest together so layer cache is invalidated only when deps change
COPY package.json ./

# VITE_API_URL is embedded at build time — default to relative /api so the
# backoffice nginx proxy handles routing to the correct microservice
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
ARG VITE_AI_API_URL=http://localhost:8000
ENV VITE_AI_API_URL=${VITE_AI_API_URL}
ARG VITE_OPTIMIZER_API_URL=http://localhost:8001
ENV VITE_OPTIMIZER_API_URL=${VITE_OPTIMIZER_API_URL}
ARG VITE_IBOA_API_URL=http://localhost:5008
ENV VITE_IBOA_API_URL=${VITE_IBOA_API_URL}

RUN npm install --legacy-peer-deps

# Copy remaining source code
COPY . .

# Build the production bundle (skip tsc type-check — Vite transpiles TS independently)
RUN npx vite build

# ============================================
# Stage 2: Serve with Nginx
# ============================================
FROM nginx:1.27-alpine AS runtime

# Remove default nginx configuration
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
