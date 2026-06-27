/**
 * CQI-LAB — Controller de Pacientes
 * CRUD de pacientes (Secretária e Admin)
 */

const { query } = require('../config/database');

/**
 * GET /api/pacientes
 * Lista pacientes com filtros e paginação
 */
const listar = async (req, res) => {
  try {
    const { busca, pagina = 1, limite = 20 } = req.query;
    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    const params = [];

    let sql = `SELECT id, nome, cpf, data_nascimento, telefone, email, 
                      convenio, medico_solicitante, criado_em
               FROM pacientes WHERE 1=1`;

    if (busca) {
      params.push(`%${busca}%`);
      sql += ` AND (nome ILIKE $${params.length} OR cpf ILIKE $${params.length})`;
    }

    // Contagem total para paginação
    const contagem = await query(`SELECT COUNT(*) FROM pacientes WHERE 1=1${busca ? ` AND (nome ILIKE $1 OR cpf ILIKE $1)` : ''}`, busca ? [`%${busca}%`] : []);

    sql += ` ORDER BY nome ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limite), offset);

    const resultado = await query(sql, params);

    return res.json({
      sucesso: true,
      pacientes: resultado.rows,
      paginacao: {
        total: parseInt(contagem.rows[0].count),
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(parseInt(contagem.rows[0].count) / parseInt(limite))
      }
    });

  } catch (err) {
    console.error('Erro ao listar pacientes:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

/**
 * GET /api/pacientes/:id
 * Busca paciente completo por ID
 */
const buscarPorId = async (req, res) => {
  try {
    const resultado = await query(
      'SELECT * FROM pacientes WHERE id = $1',
      [req.params.id]
    );

    if (!resultado.rows[0]) {
      return res.status(404).json({ sucesso: false, mensagem: 'Paciente não encontrado.' });
    }

    return res.json({ sucesso: true, paciente: resultado.rows[0] });

  } catch (err) {
    console.error('Erro ao buscar paciente:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

/**
 * POST /api/pacientes
 * Cria um novo paciente
 */
const criar = async (req, res) => {
  const {
    nome, cpf, data_nascimento, telefone, email,
    cep, logradouro, numero, complemento, bairro, cidade, estado,
    convenio, numero_carteirinha, medico_solicitante, crm_medico
  } = req.body;

  if (!nome || !cpf || !data_nascimento) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Nome, CPF e data de nascimento são obrigatórios.'
    });
  }

  try {
    // Verifica CPF duplicado
    const cpfExiste = await query('SELECT id FROM pacientes WHERE cpf = $1', [cpf]);
    if (cpfExiste.rows[0]) {
      return res.status(400).json({ sucesso: false, mensagem: 'CPF já cadastrado no sistema.' });
    }

    const resultado = await query(
      `INSERT INTO pacientes 
        (nome, cpf, data_nascimento, telefone, email,
         cep, logradouro, numero, complemento, bairro, cidade, estado,
         convenio, numero_carteirinha, medico_solicitante, crm_medico, criado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [nome, cpf, data_nascimento, telefone, email,
       cep, logradouro, numero, complemento, bairro, cidade, estado,
       convenio, numero_carteirinha, medico_solicitante, crm_medico, req.usuario.id]
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Paciente cadastrado com sucesso.',
      paciente: resultado.rows[0]
    });

  } catch (err) {
    console.error('Erro ao criar paciente:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

/**
 * PUT /api/pacientes/:id
 * Atualiza dados de um paciente
 */
const atualizar = async (req, res) => {
  const campos = [
    'nome', 'cpf', 'data_nascimento', 'telefone', 'email',
    'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado',
    'convenio', 'numero_carteirinha', 'medico_solicitante', 'crm_medico'
  ];

  try {
    const sets = [];
    const params = [];

    campos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        params.push(req.body[campo]);
        sets.push(`${campo} = $${params.length}`);
      }
    });

    if (sets.length === 0) {
      return res.status(400).json({ sucesso: false, mensagem: 'Nenhum campo para atualizar.' });
    }

    params.push(req.params.id);
    const resultado = await query(
      `UPDATE pacientes SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    if (!resultado.rows[0]) {
      return res.status(404).json({ sucesso: false, mensagem: 'Paciente não encontrado.' });
    }

    return res.json({
      sucesso: true,
      mensagem: 'Paciente atualizado com sucesso.',
      paciente: resultado.rows[0]
    });

  } catch (err) {
    console.error('Erro ao atualizar paciente:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

module.exports = { listar, buscarPorId, criar, atualizar };