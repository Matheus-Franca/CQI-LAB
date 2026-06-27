/**
 * CQI-LAB — Página: Consulta / Pesquisa Avançada
 * Busca de amostras com múltiplos filtros
 */

const PageConsulta = {
  paginaAtual: 1,

  async render() {
    const content = document.getElementById('app-content');

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Consulta / Pesquisa</h1>
          <p class="page-subtitle">Busca avançada de amostras com múltiplos filtros</p>
        </div>
      </div>

      <!-- Painel de filtros -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-title" style="margin-bottom:16px;">Filtros de Pesquisa</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">
          <div class="form-group">
            <label class="form-label">Paciente (nome ou CPF)</label>
            <input type="text" id="c-paciente" class="form-input" placeholder="Buscar paciente..." />
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="c-status" class="form-select">
              <option value="">Todos</option>
              <option value="aguardando_coleta">Aguardando Coleta</option>
              <option value="coletada">Coletada</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="finalizado">Finalizado</option>
              <option value="recoleta_solicitada">Recoleta Solicitada</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tipo de Material</label>
            <select id="c-material" class="form-select">
              <option value="">Todos</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Data Início</label>
            <input type="date" id="c-data-inicio" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Data Fim</label>
            <input type="date" id="c-data-fim" class="form-input" />
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end;">
          <button class="btn btn-ghost" onclick="PageConsulta.limpar()">Limpar</button>
          <button class="btn btn-primary" onclick="PageConsulta.buscar(1)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Pesquisar
          </button>
        </div>
      </div>

      <!-- Resultados -->
      <div id="consulta-resultado"></div>
    `;

    // Carrega materiais para o select
    const materiaisRes = await Catalogo.listarMateriais({ ativo: true });
    const matSelect = document.getElementById('c-material');
    (materiaisRes.materiais || []).forEach(m => {
      const op = document.createElement('option');
      op.value = m.id;
      op.textContent = m.nome;
      matSelect.appendChild(op);
    });

    // Busca inicial
    await PageConsulta.buscar(1);
  },

  async buscar(pagina = 1) {
    this.paginaAtual = pagina;
    const resultado = document.getElementById('consulta-resultado');
    resultado.innerHTML = `<div class="empty-state"><div class="spinner spinner-dark" style="width:24px;height:24px;margin:0 auto;"></div></div>`;

    const params = {
      pagina,
      limite: 20,
      paciente: document.getElementById('c-paciente')?.value || '',
      status: document.getElementById('c-status')?.value || '',
      tipo_material: document.getElementById('c-material')?.value || '',
      data_inicio: document.getElementById('c-data-inicio')?.value || '',
      data_fim: document.getElementById('c-data-fim')?.value || ''
    };

    Object.keys(params).forEach(k => { if (!params[k] && params[k] !== 0) delete params[k]; });

    try {
      const res = await Amostras.listar(params);
      const amostras = res.amostras || [];

      if (!amostras.length) {
        resultado.innerHTML = `
          <div class="table-wrapper">
            <div class="empty-state" style="padding:60px;">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <h3>Nenhuma amostra encontrada</h3>
              <p>Tente ajustar os filtros de pesquisa.</p>
            </div>
          </div>
        `;
        return;
      }

      resultado.innerHTML = `
        <div class="table-wrapper">
          <div class="table-header">
            <span class="card-title">Resultados (${res.paginacao?.total || 0} amostras)</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Paciente</th>
                <th>CPF</th>
                <th>Material</th>
                <th>Status</th>
                <th>Coletador</th>
                <th>Técnico</th>
                <th>Data Solicitação</th>
                <th>Data Coleta</th>
                <th>Data Finalização</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${amostras.map(a => `
                <tr>
                  <td><strong style="font-family:monospace;font-size:12px;">${a.codigo}</strong></td>
                  <td>${a.paciente_nome || '—'}</td>
                  <td style="font-family:monospace;font-size:12px;">${a.paciente_cpf || '—'}</td>
                  <td>${a.tipo_material || '—'}</td>
                  <td>${badgeStatus(a.status)}</td>
                  <td style="font-size:12px;">${a.coletador_nome || '—'}</td>
                  <td style="font-size:12px;">${a.tecnico_nome || '—'}</td>
                  <td style="font-size:12px;">${formatarData(a.data_solicitacao)}</td>
                  <td style="font-size:12px;">${formatarData(a.data_coleta)}</td>
                  <td style="font-size:12px;">${formatarData(a.data_finalizacao)}</td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="PageAmostras.verDetalhe('${a.id}')">Ver</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="pagination" id="paginacao-consulta"></div>
        </div>
      `;

      if (res.paginacao) {
        renderizarPaginacao('paginacao-consulta', res.paginacao, 'PageConsulta.buscar');
      }

    } catch (err) {
      resultado.innerHTML = `<div class="alert alert-error">Erro ao realizar a consulta.</div>`;
    }
  },

  limpar() {
    ['c-paciente', 'c-status', 'c-material', 'c-data-inicio', 'c-data-fim'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    this.buscar(1);
  }
};