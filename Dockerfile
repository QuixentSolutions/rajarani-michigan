# --- Build Stage ---
FROM node:20 AS builder
WORKDIR /app

# Copy root package.json (optional, if you have one)
COPY package*.json ./

# Copy client and server code
COPY client ./client
COPY server ./server

# Install and build client
WORKDIR /app/client
RUN npm install && npm run build

# Install server dependencies
WORKDIR /app/server
RUN npm install

# --- Runtime Stage ---
FROM node:20
WORKDIR /app

# Copy server code
COPY --from=builder /app/server ./server

# Copy built React app into server/public (so Express serves it)
COPY --from=builder /app/client/build ./client/build

WORKDIR /app/server

EXPOSE 5001
CMD ["node", "index.js"]
