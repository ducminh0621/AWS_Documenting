# Stage 1: Build
FROM node:22 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Nginx serve
FROM nginx:1.25-alpine
RUN apk update && \
    apk add --no-cache \
    bash \
    curl \
    nginx \
    python3 \
    py3-pip \
    && pip3 install --upgrade pip && \
    pip3 install certbot certbot-nginx
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]