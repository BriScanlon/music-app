# Dockerfile for React Frontend

FROM node:14

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the application code
COPY . .

# Build the React app
RUN npm run build

# Install serve to serve the static files
RUN npm install -g serve

# Expose the port
EXPOSE 3000

# Command to run the React app
CMD ["serve", "-s", "build"]
