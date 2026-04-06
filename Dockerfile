FROM node:20-alpine

# Install build deps for native modules (like better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy full project BEFORE install
COPY . .

# Install dependencies
RUN npm install

# Ensure data directory exists
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "src/server.js"]
