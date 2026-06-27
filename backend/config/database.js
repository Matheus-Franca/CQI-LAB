/**
 * CQI-LAB — Configuração da Conexão com o PostgreSQL
 * Utiliza o módulo pg (node-postgres) com pool de conexões
 */

const { Pool } = require('pg');

// Pool de conexões reutilizáveis ao banco de dados
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'cqilab',
  user: process.env.DB_USER || 'cqilab_user',
  password: process.env.DB_PASSWORD || 'cqilab_senha_segura',
  max: 10,                   // Máximo de conexões simultâneas
  idleTimeoutMillis: 30000,  // Tempo máximo de conexão ociosa
  connectionTimeoutMillis: 2000,
});

// Testa a conexão ao inicializar
pool.on('connect', () => {
  console.log('✅ Conexão com PostgreSQL estabelecida');
});

pool.on('error', (err) => {
  console.error('❌ Erro no pool de conexões PostgreSQL:', err.message);
});

/**
 * Executa uma query no banco de dados
 * @param {string} text - Query SQL
 * @param {Array} params - Parâmetros parametrizados
 * @returns {Promise} Resultado da query
 */
const query = (text, params) => pool.query(text, params);

/**
 * Obtém um cliente do pool (para transações)
 * @returns {Promise} Cliente do pool
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };