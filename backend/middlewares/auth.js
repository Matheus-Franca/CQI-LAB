/**
 * CQI-LAB — Middleware de Autenticação e Autorização
 * Verifica o token JWT e controla acesso por perfil
 */

const { verificarToken } = require('../config/jwt');

/**
 * Middleware: Verifica se o usuário está autenticado
 * Extrai o Bearer token do header Authorization
 */
const autenticar = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Aceita token via query param para downloads (ex: PDF)
  let token = req.query._token || null;

  if (!token) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token de autenticação não fornecido.'
      });
    }
    token = authHeader.split(' ')[1];
  }
  const payload = verificarToken(token);

  if (!payload) {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Token inválido ou expirado. Faça login novamente.'
    });
  }

  // Adiciona os dados do usuário na requisição
  req.usuario = payload;
  next();
};

/**
 * Middleware: Verifica se o usuário possui o(s) perfil(is) necessário(s)
 * @param {...string} perfisPermitidos - Perfis que têm acesso à rota
 */
const autorizar = (...perfisPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Usuário não autenticado.'
      });
    }

    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Você não tem permissão para acessar este recurso.'
      });
    }

    next();
  };
};

// Perfis do sistema para uso nas rotas
const PERFIS = {
  ADMIN: 'admin',
  SECRETARIA: 'secretaria',
  COLETADOR: 'coletador',
  TECNICO: 'tecnico',
  RESPONSAVEL_TECNICO: 'responsavel_tecnico'
};

module.exports = { autenticar, autorizar, PERFIS };