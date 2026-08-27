# Use an official Node runtime as a parent image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the backend port (e.g., 5000)
EXPOSE 5000

# Start the server using the dev script (node --watch server.js)
CMD ["npm", "run", "dev"]
