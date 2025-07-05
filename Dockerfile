# Use official Node.js LTS image
FROM node:lts

# Create app directory
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies & PM2 globally
RUN npm install && npm install -g pm2

# Copy all files to the container
COPY . .

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start the bot using PM2 and your package.json start script
CMD ["npm", "start"]
