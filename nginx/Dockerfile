# Dockerfile for Nginx with multi-stage build

# Step 1: Build the React app with Vite
FROM node:14 as build

WORKDIR /app

COPY ./spotify-clone/package.json ./spotify-clone/package-lock.json ./
RUN npm install

COPY ./spotify-clone ./
RUN npm run build

# Step 2: Serve the React app with Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
