FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 4000

# Applies pending migrations then starts the compiled server. In a real
# deployment you'd usually run migrations as a separate release step, but
# for a single-container demo this keeps it self-contained.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
