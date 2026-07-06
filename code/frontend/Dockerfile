# --- Étape 1 : Build de l'app React/Vite ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Génère le dossier /app/dist avec les fichiers statiques finaux
RUN npm run build

# --- Étape 2 : Serveur Nginx léger pour servir le build + proxy API ---
FROM nginx:alpine

# On supprime la config par défaut de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Notre config personnalisée (voir nginx.conf à côté de ce Dockerfile)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# On copie le résultat du build Vite dans le dossier servi par Nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
