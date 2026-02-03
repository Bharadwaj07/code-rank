FROM node:18-alpine AS builder

WORKDIR /app

# Copy root and app-specific manifest files for better layer caching
COPY package.json package-lock.json ./
COPY execution-orchestrator/package.json ./execution-orchestrator/package.json

# Install workspace deps
RUN npm i --no-audit --no-fund

# Copy full repository
COPY . .

# Build the project and run the prune targets to produce a pruned lockfile and workspace_modules
RUN npx nx build execution-orchestrator --configuration=production
RUN npx nx run execution-orchestrator:prune

FROM node:18-alpine

WORKDIR /app

# Copy pruned manifests from builder
COPY --from=builder /app/execution-orchestrator/dist/package.json ./package.json
COPY --from=builder /app/execution-orchestrator/dist/package-lock.json ./package-lock.json

# Install production deps according to the pruned lockfile
RUN npm ci --omit=dev --no-audit --no-fund

# Copy workspace modules produced by nx
COPY --from=builder /app/execution-orchestrator/dist/workspace_modules ./node_modules

# Copy built app
COPY --from=builder /app/execution-orchestrator/dist ./dist

# The orchestrator uses dockerode and expects the host socket to be mounted at runtime
EXPOSE 3000

CMD ["node", "dist/main.js"]
