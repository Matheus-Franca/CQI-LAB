/**
 * CQI-LAB — Controller de Amostras
 * Fluxo completo: criação, atualização de status e consultas
 */

const { query, getClient } = require('../config/database');

/**
 * Gera código único para a amostra (ex: AM2024001)
 */
const gerarCodigo = async () => {
  const ano = new Date().getFullYear();
  const resultado = await query(
    `SELECT COUNT(*) FROM amostras WHERE EXTRACT(YEAR FROM criado_em) = $1`,
    [ano]
  );
  const seq = parseInt(resultado.rows[0].count) + 1;
  return `AM${ano}${String(seq).padStart(4, '0')}`;
};

/**
 * Registra uma mudança de status na trilha de auditoria
 */
const registrarHistorico = async (client, amostraid, statusAnterior, statusNovo, usuarioId, motivo = null) => {
  await client.query(
    `INSERT INTO historico_status (amostra_id, status_anterior, status_novo, usuario_id, motivo)
     VALUES ($1, $2, $3, $4, $5)`,
    [amostraid, statusAnterior, statusNovo, usuarioId, motivo]
  );
};

/**
 * GET /api/amostras
 * Lista amostras com filtros avançados e paginação
 */
const listar = async (req, res) => {
  try {
    const {
      paciente, status, tipo_material, coletador_id,
      tecnico_id, responsavel_id, data_inicio, data_fim,
      pagina = 1, limite = 20
    } = req.query;

    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    const params = [];
    const filtros = [];

    // Filtro por perfil: cada usuário vê apenas o que é relevante para ele (ou o que está disponível para sua função)
const perfil = req.usuario.perfil;
  if (perfil === 'coletador') {
    params.push(req.usuario.id);
    filtros.push(`((a.coletador_id IS NULL OR a.coletador_id = $${params.length}) AND (a.status = 'aguardando_coleta' OR a.status = 'recoleta_solicitada'))`);
  } else if (perfil === 'tecnico') {
    params.push(req.usuario.id);
    filtros.push(`((a.tecnico_id IS NULL OR a.tecnico_id = $${params.length}) AND (a.status = 'coletada' OR a.status = 'em_andamento'))`);
  } else if (perfil === 'responsavel_tecnico') {
    params.push(req.usuario.id);
    filtros.push(`((a.responsavel_tecnico_id IS NULL OR a.responsavel_tecnico_id = $${params.length}) AND a.status = 'em_andamento')`);
  }

    // Filtros externos
    if (paciente) {
      params.push(`%${paciente}%`);
      filtros.push(`(p.nome ILIKE $${params.length} OR p.cpf ILIKE $${params.length})`);
    }
    if (status) {
      params.push(status);
      filtros.push(`a.status = $${params.length}`);
    }
    if (tipo_material) {
      params.push(tipo_material);
      filtros.push(`a.tipo_material_id = $${params.length}`);
    }
    if (coletador_id && perfil === 'admin') {
      params.push(coletador_id);
      filtros.push(`a.coletador_id = $${params.length}`);
    }
    if (tecnico_id && perfil === 'admin') {
      params.push(tecnico_id);
      filtros.push(`a.tecnico_id = $${params.length}`);
    }
    if (responsavel_id) {
      params.push(responsavel_id);
      filtros.push(`a.responsavel_tecnico_id = $${params.length}`);
    }
    if (data_inicio) {
      params.push(data_inicio);
      filtros.push(`a.data_solicitacao >= $${params.length}`);
    }
    if (data_fim) {
      params.push(data_fim + ' 23:59:59');
      filtros.push(`a.data_solicitacao <= $${params.length}`);
    }

    const where = filtros.length > 0 ? 'WHERE ' + filtros.join(' AND ') : '';

    const sqlBase = `
      FROM amostras a
      JOIN pacientes p ON a.paciente_id = p.id
      LEFT JOIN tipos_material tm ON a.tipo_material_id = tm.id
      LEFT JOIN usuarios col ON a.coletador_id = col.id
      LEFT JOIN usuarios tec ON a.tecnico_id = tec.id
      LEFT JOIN usuarios rt ON a.responsavel_tecnico_id = rt.id
      LEFT JOIN usuarios sec ON a.secretaria_id = sec.id
      ${where}
    `;

    const countResult = await query(`SELECT COUNT(*) ${sqlBase}`, params);

    params.push(parseInt(limite), offset);
    const sql = `
      SELECT 
        a.id, a.codigo, a.status, a.data_solicitacao, a.data_coleta, a.data_finalizacao, a.observacoes,
        p.id AS paciente_id, p.nome AS paciente_nome, p.cpf AS paciente_cpf,
        tm.nome AS tipo_material,
        col.nome AS coletador_nome,
        tec.nome AS tecnico_nome,
        rt.nome AS responsavel_tecnico_nome,
        sec.nome AS secretaria_nome
      ${sqlBase}
      ORDER BY a.criado_em DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const resultado = await query(sql, params);

    return res.json({
      sucesso: true,
      amostras: resultado.rows,
      paginacao: {
        total: parseInt(countResult.rows[0].count),
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limite))
      }
    });

  } catch (err) {
    console.error('Erro ao listar amostras:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

/**
 * GET /api/amostras/:id
 * Busca amostra completa com exames e histórico
 */
const buscarPorId = async (req, res) => {
  try {
    const amostraRes = await query(
      `SELECT 
        a.*,
        p.nome AS paciente_nome, p.cpf AS paciente_cpf, p.data_nascimento, p.telefone, p.email,
        p.convenio, p.medico_solicitante,
        tm.nome AS tipo_material_nome,
        col.nome AS coletador_nome,
        tec.nome AS tecnico_nome,
        rt.nome AS responsavel_tecnico_nome,
        sec.nome AS secretaria_nome
       FROM amostras a
       JOIN pacientes p ON a.paciente_id = p.id
       LEFT JOIN tipos_material tm ON a.tipo_material_id = tm.id
       LEFT JOIN usuarios col ON a.coletador_id = col.id
       LEFT JOIN usuarios tec ON a.tecnico_id = tec.id
       LEFT JOIN usuarios rt ON a.responsavel_tecnico_id = rt.id
       LEFT JOIN usuarios sec ON a.secretaria_id = sec.id
       WHERE a.id = $1`,
      [req.params.id]
    );

    if (!amostraRes.rows[0]) {
      return res.status(404).json({ sucesso: false, mensagem: 'Amostra não encontrada.' });
    }

    // Busca exames da amostra
    const examesRes = await query(
      `SELECT ae.id, ae.status, ae.criado_em, te.nome AS exame_nome, te.codigo
       FROM amostra_exames ae
       JOIN tipos_exame te ON ae.tipo_exame_id = te.id
       WHERE ae.amostra_id = $1
       ORDER BY te.nome`,
      [req.params.id]
    );

    // Busca histórico de status (trilha de auditoria)
    const historicoRes = await query(
      `SELECT h.*, u.nome AS usuario_nome, u.perfil AS usuario_perfil
       FROM historico_status h
       LEFT JOIN usuarios u ON h.usuario_id = u.id
       WHERE h.amostra_id = $1
       ORDER BY h.criado_em ASC`,
      [req.params.id]
    );

    return res.json({
      sucesso: true,
      amostra: {
        ...amostraRes.rows[0],
        exames: examesRes.rows,
        historico: historicoRes.rows
      }
    });

  } catch (err) {
    console.error('Erro ao buscar amostra:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

/**
 * POST /api/amostras
 * Cria nova solicitação de exames (Secretária)
 */
const criar = async (req, res) => {
  const { paciente_id, tipo_material_id, coletador_id, tecnico_id, responsavel_tecnico_id, exames, observacoes } = req.body;

  if (!paciente_id || !exames || exames.length === 0) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Paciente e pelo menos um exame são obrigatórios.'
    });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const codigo = await gerarCodigo();

    // Cria a amostra
    const amostraRes = await client.query(
      `INSERT INTO amostras (codigo, paciente_id, tipo_material_id, coletador_id, tecnico_id, responsavel_tecnico_id, secretaria_id, observacoes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'aguardando_coleta')
       RETURNING *`,
      [codigo, paciente_id, tipo_material_id || null, coletador_id || null, tecnico_id || null, responsavel_tecnico_id || null, req.usuario.id, observacoes || null]
    );

    const amostra = amostraRes.rows[0];

    // Insere os exames solicitados
    for (const exameId of exames) {
      await client.query(
        `INSERT INTO amostra_exames (amostra_id, tipo_exame_id, status)
         VALUES ($1, $2, 'aguardando_coleta')`,
        [amostra.id, exameId]
      );
    }

    // Registra o histórico inicial
    await registrarHistorico(client, amostra.id, null, 'aguardando_coleta', req.usuario.id, 'Solicitação criada');

    await client.query('COMMIT');

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Solicitação de exames criada com sucesso.',
      amostra
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar amostra:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  } finally {
    client.release();
  }
};

/**
 * PATCH /api/amostras/:id/status
 * Atualiza o status da amostra (com validação do fluxo)
 */
const atualizarStatus = async (req, res) => {
  const { status, motivo } = req.body;
  const { id } = req.params;
  const { perfil, id: usuarioId } = req.usuario;

  // Mapa de transições permitidas por perfil
  const transicoesPermitidas = {
    coletador: {
      aguardando_coleta: 'coletada',
      recoleta_solicitada: 'coletada'
    },
    tecnico: {
      coletada: 'em_andamento',
      coletada_recoleta: 'recoleta_solicitada', // para solicitar recoleta a partir de coletada
      em_andamento: 'recoleta_solicitada'  // técnico solicita recoleta
    },
    responsavel_tecnico: {
      em_andamento: 'finalizado',
      em_andamento_recoleta: 'recoleta_solicitada',
      em_andamento_reexame: 'em_andamento' // volta para o técnico
    },
    admin: {} // admin pode qualquer transição
  };

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const amRes = await client.query(
      'SELECT id, status, coletador_id, tecnico_id, responsavel_tecnico_id FROM amostras WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (!amRes.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ sucesso: false, mensagem: 'Amostra não encontrada.' });
    }

    const amostra = amRes.rows[0];
    const statusAtual = amostra.status;

    // Valida transições (admin pode tudo)
    if (perfil !== 'admin') {
      const permitidas = transicoesPermitidas[perfil] || {};
      const statusAlvo = status;
      let transicaoValida = false;

      // Verifica se a transição atual → novo é permitida
      for (const [origem, destino] of Object.entries(permitidas)) {
        if (statusAtual === origem.replace('_recoleta', '').replace('_reexame', '') && destino === statusAlvo) {
          transicaoValida = true;
          break;
        }
      }

      // Verificação simplificada por perfil
      if (perfil === 'coletador' && ['coletada'].includes(status) && ['aguardando_coleta', 'recoleta_solicitada'].includes(statusAtual)) {
        transicaoValida = true;
      } else if (perfil === 'tecnico' && status === 'em_andamento' && statusAtual === 'coletada') {
        transicaoValida = true;
      } else if (perfil === 'tecnico' && status === 'recoleta_solicitada' && ['coletada', 'em_andamento'].includes(statusAtual)) {
        transicaoValida = true;
        if (!motivo) {
          await client.query('ROLLBACK');
          return res.status(400).json({ sucesso: false, mensagem: 'Motivo da recoleta é obrigatório.' });
        }
      } else if (perfil === 'responsavel_tecnico' && status === 'finalizado' && statusAtual === 'em_andamento') {
        transicaoValida = true;
      } else if (perfil === 'responsavel_tecnico' && status === 'recoleta_solicitada' && statusAtual === 'em_andamento') {
        transicaoValida = true;
        if (!motivo) {
          await client.query('ROLLBACK');
          return res.status(400).json({ sucesso: false, mensagem: 'Motivo da recoleta é obrigatório.' });
        }
      } else if (perfil === 'responsavel_tecnico' && status === 'em_andamento' && statusAtual === 'em_andamento') {
        // Solicitar reexame: volta para em_andamento com novo registro no histórico
        transicaoValida = true;
        if (!motivo) {
          await client.query('ROLLBACK');
          return res.status(400).json({ sucesso: false, mensagem: 'Motivo do reexame é obrigatório.' });
        }
      }

      if (!transicaoValida && perfil !== 'admin') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          sucesso: false,
          mensagem: `Transição de "${statusAtual}" para "${status}" não permitida para seu perfil.`
        });
      }
    }

    // Atualiza os campos adicionais conforme o status
    let camposExtras = '';
    if (status === 'coletada') camposExtras = ', data_coleta = NOW()';
    if (status === 'finalizado') camposExtras = ', data_finalizacao = NOW()';
    if (status === 'recoleta_solicitada') camposExtras = ', data_coleta = NULL';

    await client.query(
      `UPDATE amostras SET status = $1${camposExtras} WHERE id = $2`,
      [status, id]
    );

    // Atualiza status dos exames da amostra
    await client.query(
      `UPDATE amostra_exames SET status = $1 WHERE amostra_id = $2`,
      [status, id]
    );

    // Registra o histórico
    await registrarHistorico(client, id, statusAtual, status, usuarioId, motivo || null);

    await client.query('COMMIT');

    return res.json({
      sucesso: true,
      mensagem: 'Status atualizado com sucesso.',
      status_anterior: statusAtual,
      status_novo: status
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar status:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  } finally {
    client.release();
  }
};

module.exports = { listar, buscarPorId, criar, atualizarStatus };