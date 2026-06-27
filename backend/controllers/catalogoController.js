/**
 * CQI-LAB — Controller de Catálogo
 * CRUD de tipos de material e tipos de exame (Admin)
 */

const { query } = require('../config/database');

// =============================================
// TIPOS DE MATERIAL
// =============================================

const listarMateriais = async (req, res) => {
  try {
    const { ativo } = req.query;
    let sql = 'SELECT * FROM tipos_material WHERE 1=1';
    const params = [];
    if (ativo !== undefined) { params.push(ativo === 'true'); sql += ` AND ativo = $1`; }
    sql += ' ORDER BY nome ASC';
    const resultado = await query(sql, params);
    return res.json({ sucesso: true, materiais: resultado.rows });
  } catch (err) {
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

const criarMaterial = async (req, res) => {
  const { nome, descricao } = req.body;
  if (!nome) return res.status(400).json({ sucesso: false, mensagem: 'Nome é obrigatório.' });
  try {
    const r = await query(
      'INSERT INTO tipos_material (nome, descricao) VALUES ($1, $2) RETURNING *',
      [nome, descricao || null]
    );
    return res.status(201).json({ sucesso: true, material: r.rows[0] });
  } catch (err) {
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

const atualizarMaterial = async (req, res) => {
  const { nome, descricao, ativo } = req.body;
  try {
    const r = await query(
      `UPDATE tipos_material SET nome = COALESCE($1, nome), descricao = COALESCE($2, descricao), ativo = COALESCE($3, ativo)
       WHERE id = $4 RETURNING *`,
      [nome || null, descricao || null, ativo !== undefined ? ativo : null, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ sucesso: false, mensagem: 'Material não encontrado.' });
    return res.json({ sucesso: true, material: r.rows[0] });
  } catch (err) {
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

const removerMaterial = async (req, res) => {
  try {
    await query('UPDATE tipos_material SET ativo = false WHERE id = $1', [req.params.id]);
    return res.json({ sucesso: true, mensagem: 'Material desativado.' });
  } catch (err) {
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

// =============================================
// TIPOS DE EXAME
// =============================================

const listarExames = async (req, res) => {
  try {
    const { ativo } = req.query;
    let sql = 'SELECT * FROM tipos_exame WHERE 1=1';
    const params = [];
    if (ativo !== undefined) { params.push(ativo === 'true'); sql += ` AND ativo = $1`; }
    sql += ' ORDER BY nome ASC';
    const resultado = await query(sql, params);
    return res.json({ sucesso: true, exames: resultado.rows });
  } catch (err) {
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

const criarExame = async (req, res) => {
  const { nome, codigo, descricao } = req.body;
  if (!nome) return res.status(400).json({ sucesso: false, mensagem: 'Nome é obrigatório.' });
  try {
    const r = await query(
      'INSERT INTO tipos_exame (nome, codigo, descricao) VALUES ($1, $2, $3) RETURNING *',
      [nome, codigo || null, descricao || null]
    );
    return res.status(201).json({ sucesso: true, exame: r.rows[0] });
  } catch (err) {
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

const atualizarExame = async (req, res) => {
  const { nome, codigo, descricao, ativo } = req.body;
  try {
    const r = await query(
      `UPDATE tipos_exame SET nome = COALESCE($1, nome), codigo = COALESCE($2, codigo), 
       descricao = COALESCE($3, descricao), ativo = COALESCE($4, ativo)
       WHERE id = $5 RETURNING *`,
      [nome || null, codigo || null, descricao || null, ativo !== undefined ? ativo : null, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ sucesso: false, mensagem: 'Exame não encontrado.' });
    return res.json({ sucesso: true, exame: r.rows[0] });
  } catch (err) {
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

const removerExame = async (req, res) => {
  try {
    await query('UPDATE tipos_exame SET ativo = false WHERE id = $1', [req.params.id]);
    return res.json({ sucesso: true, mensagem: 'Exame desativado.' });
  } catch (err) {
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

module.exports = {
  listarMateriais, criarMaterial, atualizarMaterial, removerMaterial,
  listarExames, criarExame, atualizarExame, removerExame
};