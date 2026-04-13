# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .

ARG VITE_ENABLE_CHECKOUT=true
ARG VITE_CONTACT_TYPE=none
ARG VITE_CONTACT_VALUE=
ARG VITE_CONTACT_MESSAGE=Hola, me interesa el producto: {nombre}

ENV VITE_ENABLE_CHECKOUT=$VITE_ENABLE_CHECKOUT
ENV VITE_CONTACT_TYPE=$VITE_CONTACT_TYPE
ENV VITE_CONTACT_VALUE=$VITE_CONTACT_VALUE
ENV VITE_CONTACT_MESSAGE=$VITE_CONTACT_MESSAGE

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS final
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
