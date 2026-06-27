/**
 * CQI-LAB — Controller de Relatórios
 * Geração de relatórios gerenciais em PDF (Admin)
 */

const PDFDocument = require('pdfkit');
const { query } = require('../config/database');

// Mapa de labels dos status
const STATUS_LABELS = {
  aguardando_coleta: 'Aguardando Coleta',
  coletada: 'Coletada',
  em_andamento: 'Em Andamento',
  finalizado: 'Finalizado',
  recoleta_solicitada: 'Recoleta Solicitada'
};

/**
 * GET /api/relatorios/gerencial
 * Retorna dados do relatório em JSON
 */
const dadosGerencial = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    const params = [];
    let filtroData = '';

    if (data_inicio) { params.push(data_inicio); filtroData += ` AND a.criado_em >= $${params.length}`; }
    if (data_fim) { params.push(data_fim + ' 23:59:59'); filtroData += ` AND a.criado_em <= $${params.length}`; }

    // Total de amostras por status
    const porStatus = await query(
      `SELECT status, COUNT(*) as total FROM amostras a WHERE 1=1${filtroData} GROUP BY status ORDER BY status`,
      params
    );

    // Exames por tipo de exame
    const porExame = await query(
      `SELECT te.nome AS exame, COUNT(*) AS total
       FROM amostra_exames ae
       JOIN amostras a ON ae.amostra_id = a.id
       JOIN tipos_exame te ON ae.tipo_exame_id = te.id
       WHERE 1=1${filtroData}
       GROUP BY te.nome ORDER BY total DESC LIMIT 10`,
      params
    );

    // Amostras por responsável técnico
    const porRT = await query(
      `SELECT u.nome AS responsavel, COUNT(*) AS total
       FROM amostras a
       JOIN usuarios u ON a.responsavel_tecnico_id = u.id
       WHERE 1=1${filtroData}
       GROUP BY u.nome ORDER BY total DESC`,
      params
    );

    // Recoletas por motivo
    const recoletas = await query(
      `SELECT h.motivo, COUNT(*) AS total
       FROM historico_status h
       JOIN amostras a ON h.amostra_id = a.id
       WHERE h.status_novo = 'recoleta_solicitada'${filtroData}
       GROUP BY h.motivo ORDER BY total DESC`,
      params
    );

    // Total geral
    const totais = await query(
      `SELECT COUNT(*) AS total_amostras,
              COUNT(CASE WHEN status = 'finalizado' THEN 1 END) AS finalizadas,
              COUNT(CASE WHEN status = 'recoleta_solicitada' THEN 1 END) AS recoletas
       FROM amostras a WHERE 1=1${filtroData}`,
      params
    );

    return res.json({
      sucesso: true,
      dados: {
        periodo: { data_inicio, data_fim },
        totais: totais.rows[0],
        por_status: porStatus.rows,
        por_exame: porExame.rows,
        por_responsavel: porRT.rows,
        recoletas: recoletas.rows
      }
    });

  } catch (err) {
    console.error('Erro ao gerar dados do relatório:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
  }
};

/**
 * GET /api/relatorios/gerencial/pdf
 * Gera e retorna o PDF do relatório gerencial
 */
const gerarPDF = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    const params = [];
    let filtroData = '';

    if (data_inicio) { params.push(data_inicio); filtroData += ` AND a.criado_em >= $${params.length}`; }
    if (data_fim) { params.push(data_fim + ' 23:59:59'); filtroData += ` AND a.criado_em <= $${params.length}`; }

    // Busca todos os dados
    const [porStatus, porExame, porRT, recoletas, totais] = await Promise.all([
      query(`SELECT status, COUNT(*) as total FROM amostras a WHERE 1=1${filtroData} GROUP BY status`, params),
      query(`SELECT te.nome AS exame, COUNT(*) AS total FROM amostra_exames ae JOIN amostras a ON ae.amostra_id = a.id JOIN tipos_exame te ON ae.tipo_exame_id = te.id WHERE 1=1${filtroData} GROUP BY te.nome ORDER BY total DESC`, params),
      query(`SELECT u.nome AS responsavel, COUNT(*) AS total FROM amostras a JOIN usuarios u ON a.responsavel_tecnico_id = u.id WHERE 1=1${filtroData} GROUP BY u.nome ORDER BY total DESC`, params),
      query(`SELECT COALESCE(h.motivo, 'Sem motivo informado') AS motivo, COUNT(*) AS total FROM historico_status h JOIN amostras a ON h.amostra_id = a.id WHERE h.status_novo = 'recoleta_solicitada'${filtroData} GROUP BY h.motivo`, params),
      query(`SELECT COUNT(*) AS total, COUNT(CASE WHEN status = 'finalizado' THEN 1 END) AS finalizadas, COUNT(CASE WHEN status = 'recoleta_solicitada' THEN 1 END) AS recoletas FROM amostras a WHERE 1=1${filtroData}`, params)
    ]);

    // Cria o documento PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-cqilab-${Date.now()}.pdf"`);
    doc.pipe(res);

    // Cor azul institucional
    const azul = '#1565C0';
    const cinzaClaro = '#F5F5F5';

    // --- Cabeçalho ---
    doc.rect(0, 0, doc.page.width, 80).fill(azul);
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
      .text('CQI-LAB', 50, 20);
    doc.fontSize(12).font('Helvetica')
      .text('Relatório Gerencial de Amostras', 50, 48);

    const periodo = data_inicio || data_fim
      ? `Período: ${data_inicio || 'início'} a ${data_fim || 'hoje'}`
      : 'Período: Todos os registros';
    doc.text(periodo, 50, 62);

    doc.fillColor('black').moveDown(4);

    const dataGeracao = new Date().toLocaleString('pt-BR');
    doc.fontSize(9).fillColor('#666666')
      .text(`Gerado em: ${dataGeracao}`, { align: 'right' });

    // --- Resumo Geral ---
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold').fillColor(azul)
      .text('Resumo Geral');
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke(azul);
    doc.moveDown(0.5);

    const t = totais.rows[0];
    doc.fontSize(11).font('Helvetica').fillColor('black');
    doc.text(`Total de Amostras: ${t.total}`);
    doc.text(`Finalizadas: ${t.finalizadas}`);
    doc.text(`Recoletas Pendentes: ${t.recoletas}`);

    // --- Por Status ---
    doc.moveDown(1);
    doc.fontSize(14).font('Helvetica-Bold').fillColor(azul)
      .text('Amostras por Status');
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke(azul);
    doc.moveDown(0.5);

    porStatus.rows.forEach((row) => {
      doc.fontSize(11).font('Helvetica').fillColor('black')
        .text(`${STATUS_LABELS[row.status] || row.status}: ${row.total}`);
    });

    // --- Por Exame ---
    doc.moveDown(1);
    doc.fontSize(14).font('Helvetica-Bold').fillColor(azul)
      .text('Exames Mais Solicitados (Top 10)');
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke(azul);
    doc.moveDown(0.5);

    porExame.rows.forEach((row, i) => {
      doc.fontSize(11).font('Helvetica').fillColor('black')
        .text(`${i + 1}. ${row.exame}: ${row.total} solicitações`);
    });

    // --- Por Responsável Técnico ---
    if (porRT.rows.length > 0) {
      doc.moveDown(1);
      doc.fontSize(14).font('Helvetica-Bold').fillColor(azul)
        .text('Amostras por Responsável Técnico');
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke(azul);
      doc.moveDown(0.5);

      porRT.rows.forEach((row) => {
        doc.fontSize(11).font('Helvetica').fillColor('black')
          .text(`${row.responsavel}: ${row.total} amostras`);
      });
    }

    // --- Recoletas ---
    if (recoletas.rows.length > 0) {
      doc.moveDown(1);
      doc.fontSize(14).font('Helvetica-Bold').fillColor(azul)
        .text('Recoletas Solicitadas por Motivo');
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke(azul);
      doc.moveDown(0.5);

      recoletas.rows.forEach((row) => {
        doc.fontSize(11).font('Helvetica').fillColor('black')
          .text(`${row.motivo}: ${row.total} ocorrências`);
      });
    }

    // --- Rodapé ---
    doc.fontSize(9).fillColor('#999999')
      .text('CQI-LAB — Sistema de Gerenciamento de Amostras Laboratoriais', 50, doc.page.height - 40, { align: 'center' });

    doc.end();

  } catch (err) {
    console.error('Erro ao gerar PDF:', err.message);
    if (!res.headersSent) {
      return res.status(500).json({ sucesso: false, mensagem: 'Erro ao gerar o PDF.' });
    }
  }
};

module.exports = { dadosGerencial, gerarPDF };