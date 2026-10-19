# ==========================================
# Practical 11: Backend Dockerfile
# Node.js + Express + Mongoose Backend Service
# ==========================================

# Official Node.js 20 LTS runtime
FROM node:20

# Set working directory inside container
WORKDIR /app 

# Copy package descriptors for layer caching
COPY package*.json ./

# Install application dependencies inside the container
RUN npm install --legacy-peer-deps

# Copy all application files (excluded by .dockerignore: node_modules, .env, .git)
COPY . .

# Expose backend API port
EXPOSE 5000

# Start Express server using the entry file
CMD ["node", "server.js"]
