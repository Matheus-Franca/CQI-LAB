/**
 * CQI-LAB — Página: Mensagens de Contato (Admin)
 * Gerencia mensagens recebidas pelo formulário de contato
 */

const PageContatoAdmin = {
  async render() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Mensagens de Contato</h1>
          <p class="page-subtitle">Mensagens recebidas pelo formulário público</p>
        </div>
      </div>
      <div class="table-wrapper">
        <div id="tabela-contato">
          <div class="empty-state">
            <div class="spinner spinner-dark" style="width:28px;height:28px;margin:0 auto;"></div>
          </div>
        </div>
      </div>
    `;
    await PageContatoAdmin.carregar();
  },

  async carregar() {
    const tabela = document.getElementById('tabela-contato');
    try {
      const res = await Contato.listar();
      const mensagens = res.mensagens || [];

      if (!mensagens.length) {
        tabela.innerHTML = `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <h3>Nenhuma mensagem recebida</h3>
            <p>As mensagens enviadas pelo formulário de contato aparecerão aqui.</p>
          </div>
        `;
        return;
      }

      tabela.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Assunto</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${mensagens.map(m => `
              <tr style="${!m.lida ? 'font-weight:600;background:#FFFBEB;' : ''}">
                <td>
                  <span class="badge" style="background:${m.lida ? 'var(--cor-finalizado-bg)' : '#FEF3C7'};color:${m.lida ? 'var(--cor-finalizado)' : '#92400E'};">
                    ${m.lida ? '● Lida' : '● Nova'}
                  </span>
                </td>
                <td>${m.nome}</td>
                <td style="font-size:12px;">${m.email}</td>
                <td>${m.assunto}</td>
                <td style="font-size:12px;">${formatarDataHora(m.criado_em)}</td>
                <td>
                  <div class="td-actions">
                    <button class="btn btn-ghost btn-sm" onclick="PageContatoAdmin.verMensagem('${m.id}', '${m.nome}', '${m.email}', '${m.assunto}', \`${m.mensagem.replace(/`/g, "'")}\`, ${m.lida})">
                      Ver
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      tabela.innerHTML = `<div class="alert alert-error" style="margin:20px;">Erro ao carregar mensagens.</div>`;
    }
  },

  async verMensagem(id, nome, email, assunto, mensagem, lida) {
    abrirModal(`Mensagem de ${nome}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
        <div>
          <div style="font-size:11px;font-weight:600;color:var(--cor-texto-suave);text-transform:uppercase;letter-spacing:0.5px;">Remetente</div>
          <div style="font-size:14px;font-weight:600;margin-top:2px;">${nome}</div>
          <div style="font-size:13px;color:var(--cor-primaria);">${email}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:600;color:var(--cor-texto-suave);text-transform:uppercase;letter-spacing:0.5px;">Assunto</div>
          <div style="font-size:14px;font-weight:600;margin-top:2px;">${assunto}</div>
        </div>
      </div>
      <div style="background:var(--cor-fundo);border-radius:8px;padding:16px;font-size:14px;line-height:1.7;white-space:pre-wrap;">${mensagem}</div>
      <div class="modal-footer" style="margin-top:8px;">
        <button class="btn btn-ghost" onclick="fecharModal()">Fechar</button>
        ${!lida ? `<button class="btn btn-primary" onclick="PageContatoAdmin.marcarLida('${id}')">Marcar como Lida</button>` : `<span style="font-size:12px;color:var(--cor-finalizado);">✓ Mensagem já marcada como lida</span>`}
      </div>
    `);

    // Marca como lida automaticamente ao abrir
    if (!lida) {
      await Contato.marcarLida(id);
      await PageContatoAdmin.carregar();
    }
  },

  async marcarLida(id) {
    await Contato.marcarLida(id);
    fecharModal();
    toast('Mensagem marcada como lida.', 'success');
    await PageContatoAdmin.carregar();
  }
};