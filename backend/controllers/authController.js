/**
 * CQI-LAB — Controller de Autenticação
 * Login, logout e dados do usuário logado
 */

const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { gerarToken } = require('../config/jwt');

/**
 * POST /api/auth/login
 * Autentica o usuário com e-mail e senha
 */
const login = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'E-mail e senha são obrigatórios.'
    });
  }

  try {
    // Busca o usuário pelo e-mail
    const resultado = await query(
      'SELECT id, nome, email, senha_hash, perfil, ativo FROM usuarios WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    const usuario = resultado.rows[0];

    if (!usuario) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'E-mail ou senha incorretos.'
      });
    }

    if (!usuario.ativo) {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Sua conta está desativada. Contate o administrador.'
      });
    }

    // Verifica a senha com bcrypt
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'E-mail ou senha incorretos.'
      });
    }

    // Gera o token JWT
    const token = gerarToken({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil
    });

    return res.json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso.',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
      }
    });

  } catch (err) {
    console.error('Erro no login:', err.message);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor.'
    });
  }
};

/**
 * GET /api/auth/me
 * Retorna os dados do usuário autenticado
 */
const me = async (req, res) => {
  try {
    const resultado = await query(
      'SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios WHERE id = $1',
      [req.usuario.id]
    );

    const usuario = resultado.rows[0];

    if (!usuario) {
      return res.status(404).json({ sucesso: false, mensagem: 'Usuário não encontrado.' });
    }

    return res.json({ sucesso: true, usuario });

  } catch (err) {
    console.error('Erro ao buscar usuário:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

/**
 * GET /api/auth/alertas
 * Retorna contagem de alertas para o usuário logado (recoletas pendentes)
 */
const alertas = async (req, res) => {
  try {
    let count = 0;

    if (req.usuario.perfil === 'coletador') {
      // Coletador vê recoletas atribuídas a ele
      const resultado = await query(
        `SELECT COUNT(*) FROM amostras 
         WHERE coletador_id = $1 AND status = 'recoleta_solicitada'`,
        [req.usuario.id]
      );
      count = parseInt(resultado.rows[0].count);
    } else if (req.usuario.perfil === 'admin') {
      // Admin vê todas as recoletas pendentes
      const resultado = await query(
        `SELECT COUNT(*) FROM amostras WHERE status = 'recoleta_solicitada'`
      );
      count = parseInt(resultado.rows[0].count);
    }

    return res.json({ sucesso: true, alertas: count });

  } catch (err) {
    console.error('Erro ao buscar alertas:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

module.exports = { login, me, alertas };