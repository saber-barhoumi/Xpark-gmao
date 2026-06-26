# ============================================
# Stage 1: Build the React + Vite application
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy only package.json first for layer caching
COPY package.json ./

# VITE_API_URL is embedded at build time — default to relative /api so the
# backoffice nginx proxy handles routing to the correct microservice
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# google-maps-react@2 requires react@16 but the project uses react@18
# --legacy-peer-deps ignores that incompatibility safely
RUN npm install --legacy-peer-deps

# Copy remaining source code
COPY . .

# Build the production bundle
RUN npm run build

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
