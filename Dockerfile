FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN npm install

# Build frontend if needed (optional if handled inside npm start)
# RUN npm run build

# Expose port
EXPOSE 3000

# Start the unified app
CMD ["npm", "start"]
