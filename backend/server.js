/**
 * CQI-LAB — Servidor Principal (Express)
 * Ponto de entrada da aplicação backend
 */

// Carrega variáveis de ambiente do arquivo .env
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// Middlewares globais
// =============================================

// Permite requisições cross-origin (útil durante desenvolvimento)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse de JSON no corpo das requisições
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
const frontendPath = path.resolve(__dirname, '../frontend');
console.log('Servindo frontend de:', frontendPath);
app.use(express.static(frontendPath));

// =============================================
// Rotas da API REST
// =============================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/pacientes', require('./routes/pacientes'));
app.use('/api/amostras', require('./routes/amostras'));
app.use('/api/catalogo', require('./routes/catalogo'));
app.use('/api/relatorios', require('./routes/relatorios'));
app.use('/api/contato', require('./routes/contato'));

// =============================================
// Rota catch-all: serve o frontend (SPA)
// Todas as rotas não-API redirecionam para o index.html
// =============================================
app.get('*', (req, res) => {
  const indexPath = path.resolve(__dirname, '../frontend/index.html');
  res.sendFile(indexPath);
});

// =============================================
// Middleware de tratamento de erros globais
// =============================================
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err.stack);
  res.status(500).json({
    sucesso: false,
    mensagem: 'Erro interno do servidor.'
  });
});

// =============================================
// Inicia o servidor
// =============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 CQI-LAB rodando em http://localhost:${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Banco: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}\n`);
});

module.exports = app;