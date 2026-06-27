/**
 * CQI-LAB — Controller de Usuários
 * CRUD de usuários (acesso restrito ao Admin)
 */

const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

/**
 * GET /api/usuarios
 * Lista todos os usuários
 */
const listar = async (req, res) => {
  try {
    const { perfil, ativo } = req.query;
    let sql = 'SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios WHERE 1=1';
    const params = [];

    if (perfil) {
      params.push(perfil);
      sql += ` AND perfil = $${params.length}`;
    }
    if (ativo !== undefined) {
      params.push(ativo === 'true');
      sql += ` AND ativo = $${params.length}`;
    }

    sql += ' ORDER BY nome ASC';

    const resultado = await query(sql, params);
    return res.json({ sucesso: true, usuarios: resultado.rows });

  } catch (err) {
    console.error('Erro ao listar usuários:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

/**
 * GET /api/usuarios/:id
 * Busca um usuário por ID
 */
const buscarPorId = async (req, res) => {
  try {
    const resultado = await query(
      'SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios WHERE id = $1',
      [req.params.id]
    );

    if (!resultado.rows[0]) {
      return res.status(404).json({ sucesso: false, mensagem: 'Usuário não encontrado.' });
    }

    return res.json({ sucesso: true, usuario: resultado.rows[0] });

  } catch (err) {
    console.error('Erro ao buscar usuário:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

/**
 * POST /api/usuarios
 * Cria um novo usuário
 */
const criar = async (req, res) => {
  const { nome, email, senha, perfil } = req.body;

  if (!nome || !email || !senha || !perfil) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Nome, e-mail, senha e perfil são obrigatórios.'
    });
  }

  const perfisValidos = ['admin', 'secretaria', 'coletador', 'tecnico', 'responsavel_tecnico'];
  if (!perfisValidos.includes(perfil)) {
    return res.status(400).json({ sucesso: false, mensagem: 'Perfil inválido.' });
  }

  try {
    // Verifica se o e-mail já está cadastrado
    const emailExiste = await query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (emailExiste.rows[0]) {
      return res.status(400).json({ sucesso: false, mensagem: 'Este e-mail já está cadastrado.' });
    }

    // Gera o hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    const resultado = await query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil) 
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, email, perfil, ativo, criado_em`,
      [nome.trim(), email.toLowerCase().trim(), senhaHash, perfil]
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Usuário criado com sucesso.',
      usuario: resultado.rows[0]
    });

  } catch (err) {
    console.error('Erro ao criar usuário:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

/**
 * PUT /api/usuarios/:id
 * Atualiza dados de um usuário
 */
const atualizar = async (req, res) => {
  const { nome, email, perfil, ativo, senha } = req.body;

  try {
    const existe = await query('SELECT id FROM usuarios WHERE id = $1', [req.params.id]);
    if (!existe.rows[0]) {
      return res.status(404).json({ sucesso: false, mensagem: 'Usuário não encontrado.' });
    }

    // Monta a query dinamicamente
    const campos = [];
    const params = [];

    if (nome) { params.push(nome.trim()); campos.push(`nome = $${params.length}`); }
    if (email) { params.push(email.toLowerCase().trim()); campos.push(`email = $${params.length}`); }
    if (perfil) { params.push(perfil); campos.push(`perfil = $${params.length}`); }
    if (ativo !== undefined) { params.push(ativo); campos.push(`ativo = $${params.length}`); }
    if (senha) {
      const hash = await bcrypt.hash(senha, 10);
      params.push(hash);
      campos.push(`senha_hash = $${params.length}`);
    }

    if (campos.length === 0) {
      return res.status(400).json({ sucesso: false, mensagem: 'Nenhum campo para atualizar.' });
    }

    params.push(req.params.id);
    const sql = `UPDATE usuarios SET ${campos.join(', ')} WHERE id = $${params.length} RETURNING id, nome, email, perfil, ativo`;

    const resultado = await query(sql, params);

    return res.json({
      sucesso: true,
      mensagem: 'Usuário atualizado com sucesso.',
      usuario: resultado.rows[0]
    });

  } catch (err) {
    console.error('Erro ao atualizar usuário:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

module.exports = { listar, buscarPorId, criar, atualizar };