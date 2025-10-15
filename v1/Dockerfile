# Usa una imagen oficial de Node.js
FROM node:22.3.0

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias (incluyendo devDependencies para nodemon)
RUN npm install

# Copia el resto del código
COPY . .

# Expone el puerto (ajusta si usas otro)
EXPOSE 5000

# Comando para iniciar la app según el ambiente
ARG APP_ENV=prod
ENV APP_ENV=${APP_ENV}
CMD ["sh", "-c", "npm run $APP_ENV"] 