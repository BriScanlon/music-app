# Dockerfile for Nginx

FROM nginx:alpine

# Copy the Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build files from the React app
COPY ./frontend/build /usr/share/nginx/html

# Expose port 80 for the Nginx server
EXPOSE 80
