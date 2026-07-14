FROM node:18-alpine AS build
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN NODE_OPTIONS=--openssl-legacy-provider npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/build /app/build
COPY --from=build /app/server.js /app/server.js
COPY --from=build /app/src /app/src
RUN mkdir -p /app/build/temp-assets && chown -R node:node /app

ENV NODE_ENV=development
ENV PORT=8080
ENV SECURE_PORT=8443

EXPOSE 8080
EXPOSE 8443

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||8080)+'/',r=>process.exit(r.statusCode===200?0:1))"

USER node

CMD ["node", "server.js"]
