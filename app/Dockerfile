# Frontend build
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci 2>/dev/null || npm install

COPY index.html vite.config.ts tsconfig.json tsconfig.node.json postcss.config.js tailwind.config.ts components.json eslint.config.js ./
COPY public ./public
COPY src ./src

RUN npm run build

# Static assets + nginx proxy to API service
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
