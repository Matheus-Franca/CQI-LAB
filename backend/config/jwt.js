/**
 * CQI-LAB — Configuração do JWT (JSON Web Token)
 * Funções utilitárias para geração e verificação de tokens
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cqilab_jwt_secret_mude_em_producao_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/**
 * Gera um token JWT para o usuário autenticado
 * @param {Object} payload - Dados do usuário (id, email, perfil)
 * @returns {string} Token JWT assinado
 */
const gerarToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verifica e decodifica um token JWT
 * @param {string} token - Token JWT recebido
 * @returns {Object|null} Payload decodificado ou null se inválido
 */
const verificarToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

module.exports = { gerarToken, verificarToken };