FROM node:20-alpine

WORKDIR /app

# FFmpeg/libass needs real fonts to burn subtitles into videos.
RUN apk add --no-cache fontconfig ttf-dejavu && fc-cache -f

COPY package*.json ./
COPY prisma ./prisma/

# Installer TOUTES les dépendances (dev inclus) pour le build
RUN npm install

COPY . .

# Builder avec nest cli disponible
RUN npm run build

# Vérifier que dist/main existe
RUN ls -la dist/src/

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
