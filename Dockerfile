# Use an official Node.js runtime
FROM node:lts

# Set working directory
WORKDIR /app

# Copy only package files first (layer cache)
COPY package*.json ./

# Install dependencies and PM2 globally (optional if not used)
RUN npm install && npm install -g pm2

# Copy the rest of your code
COPY . .

# Optional: Expose port only if you use a web server
# EXPOSE 9090

# Run the bot (choose one option)
# Option 1: Use pm2
# CMD ["pm2-runtime", "index.js"]

# Option 2: Use plain Node.js
CMD ["node", "index.js"]
