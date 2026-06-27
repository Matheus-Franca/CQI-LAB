/**
 * CQI-LAB — Página: Dashboard
 * Visão geral com KPIs e últimas amostras
 */

const PageDashboard = {
  async render() {
    const usuario = getUsuario();
    const content = document.getElementById('app-content');

    // Saudação personalizada
    const hora = new Date().getHours();
    const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">${saudacao}, ${usuario.nome.split(' ')[0]}. Aqui está o resumo do dia.</p>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid" id="kpi-grid">
        ${[1,2,3,4,5].map(() => `
          <div class="kpi-card">
            <div class="kpi-label">Carregando...</div>
            <div class="kpi-value" style="background:#F5F5F7;height:32px;border-radius:6px;width:60px;"></div>
          </div>
        `).join('')}
      </div>

      <!-- Tabela de últimas amostras -->
      <div class="table-wrapper">
        <div class="table-header">
          <div class="card-title">Últimas Amostras</div>
          <button class="btn btn-primary btn-sm" onclick="navegar('amostras')">Ver todas →</button>
        </div>
        <div id="dashboard-table">
          <div class="empty-state"><div class="spinner spinner-dark" style="width:28px;height:28px;margin:0 auto;"></div></div>
        </div>
      </div>
    `;

    // Carrega dados em paralelo
    try {
      const [amostrasRes, recoletasRes] = await Promise.all([
        Amostras.listar({ limite: 8 }),
        Amostras.listar({ status: 'recoleta_solicitada', limite: 1 })
      ]);

      // Monta KPIs
      const amostras = amostrasRes.amostras || [];
      const statusCount = {};
      amostras.forEach(a => { statusCount[a.status] = (statusCount[a.status] || 0) + 1; });

      // Busca contagem real de todos os status
      const allRes = await Amostras.listar({ limite: 200 });
      const todos = allRes.amostras || [];
      const contar = (s) => todos.filter(a => a.status === s).length;

      document.getElementById('kpi-grid').innerHTML = `
        <div class="kpi-card">
          <div class="kpi-label">Total de Amostras</div>
          <div class="kpi-value">${allRes.paginacao?.total || 0}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Aguardando Coleta</div>
          <div class="kpi-value" style="color:var(--cor-aguardando)">${contar('aguardando_coleta')}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Em Andamento</div>
          <div class="kpi-value" style="color:var(--cor-andamento)">${contar('em_andamento')}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Finalizadas</div>
          <div class="kpi-value" style="color:var(--cor-finalizado)">${contar('finalizado')}</div>
        </div>
        <div class="kpi-card" style="border-left: 3px solid var(--cor-recoleta)">
          <div class="kpi-label">⚠ Recoletas Pendentes</div>
          <div class="kpi-value" style="color:var(--cor-recoleta)">${contar('recoleta_solicitada')}</div>
        </div>
      `;

      // Tabela de amostras
      if (!amostras.length) {
        document.getElementById('dashboard-table').innerHTML = `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/></svg>
            <h3>Nenhuma amostra registrada</h3>
            <p>As amostras criadas aparecerão aqui.</p>
          </div>
        `;
        return;
      }

      document.getElementById('dashboard-table').innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Paciente</th>
              <th>Material</th>
              <th>Status</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${amostras.map(a => `
              <tr>
                <td><strong>${a.codigo}</strong></td>
                <td>${a.paciente_nome || '—'}</td>
                <td>${a.tipo_material || '—'}</td>
                <td>${badgeStatus(a.status)}</td>
                <td>${formatarData(a.data_solicitacao)}</td>
                <td>
                  <button class="btn btn-ghost btn-sm" onclick="PageAmostras.verDetalhe('${a.id}')">Ver</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

    } catch (err) {
      document.getElementById('kpi-grid').innerHTML = `
        <div class="alert alert-error" style="grid-column:1/-1">Erro ao carregar dados do dashboard.</div>
      `;
    }
  }
};