FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ENV NODE_ENV=development
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
RUN npm ci

ENV PORT=8080
ENV NODE_ENV=development
ENV HOST=0.0.0.0

EXPOSE 8080

CMD ["node", "build/index.js"] 