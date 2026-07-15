# --- Backend : Node.js / Express ---
FROM node:20-alpine

WORKDIR /app

# On copie d'abord les fichiers de dépendances pour profiter du cache Docker
COPY package*.json ./

RUN npm install --omit=dev

# Copie du reste du code backend
COPY . .

# Port sur lequel Express écoute (confirmé : 3000)
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/metrics || exit 1

CMD ["node", "server.js"]
