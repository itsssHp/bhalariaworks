# Use official Node.js image
FROM node:20-alpine

# Set app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Build Next.js app
RUN npm run build

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Start Next.js in production on port 8080
CMD ["npm", "start"]
