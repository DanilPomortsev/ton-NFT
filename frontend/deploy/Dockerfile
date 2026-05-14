FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL=/v1
ARG VITE_API_BASE=https://attendance-backend-3731.onrender.com
ARG VITE_TONCONNECT_MANIFEST_URL
ARG VITE_TONCONNECT_TWA_RETURN_URL

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_TONCONNECT_MANIFEST_URL=${VITE_TONCONNECT_MANIFEST_URL}
ENV VITE_TONCONNECT_TWA_RETURN_URL=${VITE_TONCONNECT_TWA_RETURN_URL}

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY ./deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
