FROM node:18-alpine AS builder

WORKDIR /app

# Copy root and app-specific manifest files to leverage layer caching
COPY package.json package-lock.json ./
COPY core-api/package.json ./core-api/package.json

# Install dependencies for the workspace
RUN npm i --no-audit --no-fund

# Copy entire repo after deps are installed
COPY . .

# Build the app and produce package-lock/package.json for the dist plus workspace modules
# This runs the build target then the prune target (prune-lockfile + copy-workspace-modules)
RUN npx nx build core-api --configuration=production
RUN npx nx run core-api:prune

# Final image
FROM node:18-alpine

WORKDIR /app

# Copy pruned package.json/package-lock and dist workspace modules from builder
COPY --from=builder /app/core-api/dist/package.json ./package.json
COPY --from=builder /app/core-api/dist/package-lock.json ./package-lock.json

# Install production dependencies according to the pruned lockfile
RUN npm ci --omit=dev --no-audit --no-fund

# Copy workspace modules (local packages) produced by the nx target
COPY --from=builder /app/core-api/dist/workspace_modules ./node_modules

# Copy built app
COPY --from=builder /app/core-api/dist ./dist

EXPOSE 3000

# Start the compiled app
CMD ["node", "dist/main.js"]
