# ==========================================
# Practical 11: Frontend Multi-Stage Dockerfile
# React (Vite) Application
# ==========================================

# ------------------------------------------
# Stage 1: Build Stage (Node 20+ required for Vite 8 and React Router 7)
# ------------------------------------------
FROM node:20 AS build

WORKDIR /app

# Copy package definitions for dependency layer caching
COPY package*.json ./

# Install dependencies (using legacy peer deps to ensure smooth resolution with React 19)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the production React bundle into /app/dist
RUN npm run build

# ------------------------------------------
# Stage 2: Production Serving Stage (Multi-Stage Optimization)
# Uses lightweight Nginx (~45MB) instead of full Node.js runtime (~1.2GB)
# ------------------------------------------
FROM nginx:alpine

# Copy built production assets from build stage to Nginx web root
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration listening on port 5173 with SPA routing support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose standard frontend port
EXPOSE 5173

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
