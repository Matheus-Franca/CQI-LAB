/**
 * CQI-LAB — Controller de Contato
 * Formulário de contato com os desenvolvedores
 */

const { query } = require('../config/database');

/**
 * POST /api/contato
 * Salva mensagem de contato no banco
 */
const enviarMensagem = async (req, res) => {
  const { nome, email, assunto, mensagem } = req.body;

  if (!nome || !email || !assunto || !mensagem) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Todos os campos são obrigatórios.'
    });
  }

  // Validação básica de e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ sucesso: false, mensagem: 'E-mail inválido.' });
  }

  try {
    await query(
      `INSERT INTO mensagens_contato (nome, email, assunto, mensagem)
       VALUES ($1, $2, $3, $4)`,
      [nome.trim(), email.toLowerCase().trim(), assunto.trim(), mensagem.trim()]
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Mensagem enviada com sucesso! Nossa equipe entrará em contato em breve.'
    });

  } catch (err) {
    console.error('Erro ao salvar mensagem de contato:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

/**
 * GET /api/contato
 * Lista mensagens de contato (Admin)
 */
const listarMensagens = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT * FROM mensagens_contato ORDER BY criado_em DESC`
    );
    return res.json({ sucesso: true, mensagens: resultado.rows });
  } catch (err) {
    console.error('Erro ao listar mensagens:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

/**
 * PATCH /api/contato/:id/lida
 * Marca mensagem como lida (Admin)
 */
const marcarLida = async (req, res) => {
  try {
    await query('UPDATE mensagens_contato SET lida = true WHERE id = $1', [req.params.id]);
    return res.json({ sucesso: true, mensagem: 'Mensagem marcada como lida.' });
  } catch (err) {
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

module.exports = { enviarMensagem, listarMensagens, marcarLida };