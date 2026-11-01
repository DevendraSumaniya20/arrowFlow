# Build from the repo root (the server shares the game engine in ../src):
#   docker build -f server/Dockerfile -t arrowflow-server .
FROM node:22-alpine AS build
WORKDIR /app
COPY server/package.json server/package-lock.json server/
RUN cd server && npm ci
COPY src/domain src/domain
COPY src/state/gameReducer.ts src/state/gameReducer.ts
COPY server server
RUN cd server && npm run build

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app/server
# prisma CLI stays installed so the container can apply migrations on start.
COPY --from=build /app/server/node_modules node_modules
COPY --from=build /app/server/dist dist
COPY server/package.json server/prisma.config.ts ./
COPY server/prisma prisma
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server/src/index.js"]
