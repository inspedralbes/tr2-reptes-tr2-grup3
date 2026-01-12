FROM node:18-alpine

# Instalar dependencias necesarias para compilar módulos nativos como bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar archivos de dependencias primero para aprovechar cache de Docker
COPY package*.json ./

# Instalar dependencias (incluye bcrypt y sus compilaciones nativas)
RUN npm ci --only=production && npm install nodemon

# Copiar el resto del código
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

