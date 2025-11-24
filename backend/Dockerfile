FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app . .

RUN if [ -f .env.example ]; then cp .env.example .env; else echo "PORT=5000\nNODE_ENV=production\nJWT_SECRET=your_secret_key_change_in_production\nMONGODB_URI=mongodb://root:password@mongodb:27017/pocketllm?authSource=admin\nOLLAMA_URL=http://ollama:11434/api/generate\nOLLAMA_MODEL=llama2:7b-chat" > .env; fi

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
