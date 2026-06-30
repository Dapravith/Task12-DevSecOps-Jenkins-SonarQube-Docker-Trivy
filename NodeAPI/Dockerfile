FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev --no-audit --fund=false

COPY . .

RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

USER nodeapp

CMD ["npm", "start"]