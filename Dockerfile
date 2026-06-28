# =============================================
# CQI-LAB — Dockerfile
# =============================================

# Imagem base Node.js LTS
FROM node:18-alpine

# Diretório de trabalho dentro do container
WORKDIR /app

# Copia o package.json do backend e instala dependências
COPY backend/package*.json ./backend/
RUN cd backend && npm install --only=production

# Copia o restante do projeto
COPY . .

# Expõe a porta da aplicação
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "backend/server.js"]