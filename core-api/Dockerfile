FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and app-specific manifest files to leverage layer caching
COPY package.json package-lock.json ./
COPY core-api/package.json ./core-api/package.json

# Install dependencies for the workspace
RUN npm i --no-audit --no-fund

# Copy entire repo after deps are installed
COPY . .

# Build the app
RUN npx nx build core-api --configuration=production

# Final image
FROM node:20-alpine

WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy built app
COPY --from=builder /app/core-api/dist ./dist

EXPOSE 3000

# Start the compiled app
CMD ["node", "dist/main.js"]
