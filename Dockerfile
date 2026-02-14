FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port (Railway will assign $PORT)
EXPOSE 3000

# Start serve on the PORT assigned by Railway
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
