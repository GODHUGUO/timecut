FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Installer TOUTES les dépendances (dev inclus) pour le build
RUN npm install

COPY . .

# Builder avec nest cli disponible
RUN npm run build

# Vérifier que dist/main existe
RUN ls -la dist/

EXPOSE 3000

CMD ["node", "dist/main.js"]