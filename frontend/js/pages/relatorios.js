/**
 * CQI-LAB — Página: Relatórios (Admin)
 * Relatório gerencial com dados e download em PDF
 */

const PageRelatorios = {
  async render() {
    const content = document.getElementById('app-content');

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Relatórios Gerenciais</h1>
          <p class="page-subtitle">Análise de amostras e exames por período</p>
        </div>
      </div>

      <!-- Filtros de período -->
      <div class="card" style="margin-bottom:24px;">
        <div class="card-header">
          <span class="card-title">Filtro de Período</span>
        </div>
        <div style="display:flex;gap:16px;align-items:flex-end;flex-wrap:wrap;">
          <div class="form-group" style="flex:1;min-width:160px;">
            <label class="form-label">Data Início</label>
            <input type="date" id="r-data-inicio" class="form-input" />
          </div>
          <div class="form-group" style="flex:1;min-width:160px;">
            <label class="form-label">Data Fim</label>
            <input type="date" id="r-data-fim" class="form-input" />
          </div>
          <button class="btn btn-primary" onclick="PageRelatorios.gerar()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Gerar Relatório
          </button>
          <button class="btn btn-secondary" id="btn-pdf" onclick="PageRelatorios.baixarPDF()" style="display:none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Baixar PDF
          </button>
        </div>
      </div>

      <div id="relatorio-resultado"></div>
    `;

    // Define data padrão: mês atual
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    document.getElementById('r-data-inicio').value = inicio.toISOString().split('T')[0];
    document.getElementById('r-data-fim').value = hoje.toISOString().split('T')[0];

    await PageRelatorios.gerar();
  },

  _params: {},

  async gerar() {
    const dataInicio = document.getElementById('r-data-inicio').value;
    const dataFim = document.getElementById('r-data-fim').value;
    const resultado = document.getElementById('relatorio-resultado');

    this._params = { data_inicio: dataInicio, data_fim: dataFim };

    resultado.innerHTML = `<div class="empty-state"><div class="spinner spinner-dark" style="width:32px;height:32px;margin:0 auto;"></div><p>Gerando relatório...</p></div>`;

    try {
      const res = await Relatorios.dadosGerencial(this._params);

      if (!res.sucesso) {
        resultado.innerHTML = `<div class="alert alert-error">Erro ao gerar relatório.</div>`;
        return;
      }

      const d = res.dados;
      const total = parseInt(d.totais.total_amostras) || 0;
      const finalizadas = parseInt(d.totais.finalizadas) || 0;
      const recoletas = parseInt(d.totais.recoletas) || 0;

      document.getElementById('btn-pdf').style.display = 'flex';

      resultado.innerHTML = `
        <!-- KPIs do relatório -->
        <div class="kpi-grid" style="margin-bottom:24px;">
          <div class="kpi-card">
            <div class="kpi-label">Total de Amostras</div>
            <div class="kpi-value">${total}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Finalizadas</div>
            <div class="kpi-value" style="color:var(--cor-finalizado)">${finalizadas}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Taxa de Finalização</div>
            <div class="kpi-value">${total > 0 ? Math.round((finalizadas / total) * 100) : 0}%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Recoletas Pendentes</div>
            <div class="kpi-value" style="color:var(--cor-recoleta)">${recoletas}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
          <!-- Por Status -->
          <div class="card">
            <div class="card-title" style="margin-bottom:16px;">Amostras por Status</div>
            ${d.por_status.length ? d.por_status.map(s => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--cor-borda);">
                <span>${badgeStatus(s.status)}</span>
                <strong>${s.total}</strong>
              </div>
            `).join('') : '<p style="color:var(--cor-texto-suave);font-size:13px;">Sem dados.</p>'}
          </div>

          <!-- Por Responsável Técnico -->
          <div class="card">
            <div class="card-title" style="margin-bottom:16px;">Por Responsável Técnico</div>
            ${d.por_responsavel.length ? d.por_responsavel.map(r => `
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--cor-borda);font-size:13px;">
                <span>${r.responsavel}</span>
                <strong>${r.total} amostras</strong>
              </div>
            `).join('') : '<p style="color:var(--cor-texto-suave);font-size:13px;">Sem dados.</p>'}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <!-- Exames Mais Solicitados -->
          <div class="card">
            <div class="card-title" style="margin-bottom:16px;">Top 10 Exames Solicitados</div>
            ${d.por_exame.length ? d.por_exame.map((e, i) => `
              <div style="padding:8px 0;border-bottom:1px solid var(--cor-borda);font-size:13px;">
                <div style="display:flex;justify-content:space-between;">
                  <span>${i + 1}. ${e.exame}</span>
                  <strong>${e.total}</strong>
                </div>
                <div style="margin-top:4px;height:4px;background:var(--cor-fundo);border-radius:2px;overflow:hidden;">
                  <div style="height:100%;background:var(--cor-primaria);width:${Math.min(100, (parseInt(e.total) / parseInt(d.por_exame[0].total)) * 100)}%;border-radius:2px;"></div>
                </div>
              </div>
            `).join('') : '<p style="color:var(--cor-texto-suave);font-size:13px;">Sem dados.</p>'}
          </div>

          <!-- Recoletas por Motivo -->
          <div class="card">
            <div class="card-title" style="margin-bottom:16px;">Recoletas por Motivo</div>
            ${d.recoletas.length ? d.recoletas.map(r => `
              <div style="padding:8px 0;border-bottom:1px solid var(--cor-borda);font-size:13px;">
                <div style="display:flex;justify-content:space-between;">
                  <span style="color:var(--cor-recoleta);font-weight:500;">⚠ ${r.motivo || 'Sem motivo'}</span>
                  <strong>${r.total}</strong>
                </div>
              </div>
            `).join('') : '<div class="alert alert-success" style="margin-top:8px;">Nenhuma recoleta no período.</div>'}
          </div>
        </div>
      `;

    } catch (err) {
      resultado.innerHTML = `<div class="alert alert-error">Erro ao gerar relatório. Tente novamente.</div>`;
    }
  },

  baixarPDF() {
    const token = localStorage.getItem('cqilab_token');
    const params = new URLSearchParams(this._params);
    params.append('_token', token);
    window.open(`/api/relatorios/gerencial/pdf?${params}`, '_blank');
  }
};