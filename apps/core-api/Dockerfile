FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies (including devDependencies for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npx nx build core-api

# Production Stage
FROM node:18-alpine

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
# We need to generate a package.json for the specific app ideally, 
# but for simplicity in Monorepo, we often copy root or rely on nx generatePackageJson.
# Let's assume we run from root dist context or install prod deps.
# BETTER APPROACH for Nx:
# The build output in dist/apps/core-api usually contains a package.json if generatePackageJson: true.
# Let's check that assumption later. For now, we install root prod deps.
RUN npm ci --omit=dev

# Copy built assets
COPY --from=builder /app/dist/apps/core-api ./dist/apps/core-api
# We also need main.js location. Nx usually outputs to dist/apps/core-api/main.js

CMD ["node", "dist/apps/core-api/main.js"]
