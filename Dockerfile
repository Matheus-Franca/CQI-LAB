# =============================================
# CQI-LAB — Dockerfile
# =============================================

# Imagem base Node.js LTS
FROM node:18-alpine

# Diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências de produção
RUN npm ci --only=production

# Copia o restante do projeto
COPY . .

# Expõe a porta da aplicação
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "backend/server.js"]