FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and app-specific manifest files for better layer caching
COPY package.json package-lock.json ./
COPY execution-orchestrator/package.json ./execution-orchestrator/package.json

# Install workspace deps
RUN npm i --no-audit --no-fund

# Copy full repository
COPY . .

# Build the project
RUN npx nx build execution-orchestrator --configuration=production

FROM node:20-alpine

WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy built app
COPY --from=builder /app/execution-orchestrator/dist ./dist

# The orchestrator uses dockerode and expects the host socket to be mounted at runtime
EXPOSE 3000

CMD ["node", "dist/main.js"]
