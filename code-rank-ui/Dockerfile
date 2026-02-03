FROM node:18-alpine AS builder

WORKDIR /app

# Copy root and app-specific manifests for better cache
COPY package.json package-lock.json ./
COPY code-rank-ui/package.json ./code-rank-ui/package.json

# Install workspace deps
RUN npm i --no-audit --no-fund

# Copy repository
COPY . .

# Build the UI
RUN npx nx build code-rank-ui --configuration=production
RUN npx nx run code-rank-ui:prune || true

# Production Stage - Nginx
FROM nginx:alpine

# Copy built assets to Nginx html folder
COPY --from=builder /app/code-rank-ui/dist /usr/share/nginx/html
COPY --from=builder /app/dist/apps/code-rank-ui /usr/share/nginx/html

# If a pruned package produced workspace modules for static assets, copy if present
COPY --from=builder /app/code-rank-ui/dist/workspace_modules /usr/share/nginx/html/workspace_modules

# Copy custom Nginx config
COPY code-rank-ui/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
