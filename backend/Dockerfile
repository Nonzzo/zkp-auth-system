# Multi-stage build for minimal image size
FROM node:18 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
# Create zk-circuits directory
RUN mkdir -p /app/zk-circuits/circuit_js

# Copy circuit files with explicit paths
COPY zk-circuits/circuit_js/circuit.wasm /app/zk-circuits/circuit_js/
COPY zk-circuits/circuit.zkey /app/zk-circuits/
COPY zk-circuits/verification_key.json /app/zk-circuits/
COPY . .

# Add debug ls commands
RUN ls -la /app/zk-circuits
RUN ls -la /app/zk-circuits/circuit_js

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app .
CMD ["node", "server.js"]
EXPOSE 5000
