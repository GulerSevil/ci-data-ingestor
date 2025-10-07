FROM node:22-alpine AS base
WORKDIR /app

ENV NODE_ENV=production

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

FROM base AS build
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY . .
RUN npm run build

FROM base AS runtime
USER node
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
# Allow configuring the exposed port via build arg/env; defaults to 3000
ARG PORT=3000
ENV PORT=$PORT
EXPOSE $PORT
CMD ["node", "dist/server.js"]



