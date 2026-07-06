# ============================================
# Stage 1: Build the Next.js 14 application
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./

RUN npm install --legacy-peer-deps

COPY . .

# URL de l'API IAM (auth + MFA) — NEXT_PUBLIC_* est fige au build
ARG NEXT_PUBLIC_API_URL=http://localhost:5001/api
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ARG NEXT_PUBLIC_AI_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_AI_API_URL=${NEXT_PUBLIC_AI_API_URL}

RUN npm run build

# ============================================
# Stage 2: Run with Next.js production server
# ============================================
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
