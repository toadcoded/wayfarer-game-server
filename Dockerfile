FROM node:24.19.0-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-fund --no-audit
COPY tsconfig.json ./
COPY src ./src
COPY tools ./tools
COPY preview ./preview
RUN npm run build && npm prune --omit=dev

FROM node:24.19.0-bookworm-slim
ENV NODE_ENV=production PORT=8081 DATA_DIR=/data
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/tools ./tools
COPY --from=build --chown=node:node /app/preview ./preview
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 8081
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:8081/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "tools/server.mjs"]
