# Use the official Node.js version 18
FROM node:18

# Create a folder inside the container for our code
WORKDIR /app

# Copy the "Shopping List" and install the libraries
COPY package*.json ./
RUN npm install

# Copy all our code into the container
COPY . .

# Open port 3000 for the world to see
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]