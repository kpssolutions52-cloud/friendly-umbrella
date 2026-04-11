FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies from monorepo root
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/frontend/package.json packages/frontend/package.json
RUN npm ci

# Copy source needed to build shared + frontend
COPY docs ./docs
COPY packages/shared ./packages/shared
COPY packages/frontend ./packages/frontend

# Build workspace dependencies first, then frontend
RUN npm run build --workspace=@platform/shared
RUN npm run build --workspace=@platform/frontend

FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Reuse workspace install and build artifacts
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/packages/frontend ./packages/frontend

WORKDIR /app/packages/frontend
EXPOSE 3000

CMD ["npm", "start"]
