FROM node:20-alpine AS base
WORKDIR /app
# ffmpeg needed for video transcoding worker
RUN apk add --no-cache ffmpeg chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps     /app/node_modules ./node_modules
COPY --from=builder  /app/dist         ./dist
CMD ["node", "dist/workers/index.js"]
