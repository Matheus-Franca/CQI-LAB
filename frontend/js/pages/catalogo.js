/**
 * CQI-LAB — Página: Catálogo (Admin)
 * CRUD de tipos de material e tipos de exame
 */

const PageCatalogo = {
  aba: 'materiais',

  render() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Catálogo</h1>
          <p class="page-subtitle">Gerencie os tipos de material e exames disponíveis</p>
        </div>
      </div>

      <div class="tabs">
        <button class="tab-btn ${this.aba === 'materiais' ? 'active' : ''}" onclick="PageCatalogo.mudarAba('materiais')">Tipos de Material</button>
        <button class="tab-btn ${this.aba === 'exames' ? 'active' : ''}" onclick="PageCatalogo.mudarAba('exames')">Tipos de Exame</button>
      </div>

      <div id="catalogo-conteudo"></div>
    `;

    this.carregarAba();
  },

  mudarAba(aba) {
    this.aba = aba;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-btn')[aba === 'materiais' ? 0 : 1].classList.add('active');
    this.carregarAba();
  },

  async carregarAba() {
    if (this.aba === 'materiais') {
      await this.renderMateriais();
    } else {
      await this.renderExames();
    }
  },

  async renderMateriais() {
    const c = document.getElementById('catalogo-conteudo');
    c.innerHTML = `<div class="empty-state"><div class="spinner spinner-dark" style="width:24px;height:24px;margin:0 auto;"></div></div>`;

    const res = await Catalogo.listarMateriais();
    const materiais = res.materiais || [];

    c.innerHTML = `
      <div class="table-wrapper">
        <div class="table-header">
          <span class="card-title">Tipos de Material (${materiais.length})</span>
          <button class="btn btn-primary btn-sm" onclick="PageCatalogo.formMaterial()">+ Novo Material</button>
        </div>
        ${materiais.length ? `
          <table>
            <thead><tr><th>Nome</th><th>Descrição</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              ${materiais.map(m => `
                <tr>
                  <td><strong>${m.nome}</strong></td>
                  <td style="font-size:12px;color:var(--cor-texto-suave);">${m.descricao || '—'}</td>
                  <td>
                    <span class="badge" style="background:${m.ativo ? 'var(--cor-finalizado-bg)' : '#F3F4F6'};color:${m.ativo ? 'var(--cor-finalizado)' : 'var(--cor-aguardando)'};">
                      ${m.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div class="td-actions">
                      <button class="btn btn-ghost btn-sm" onclick="PageCatalogo.formMaterial('${m.id}', '${m.nome}', \`${m.descricao || ''}\`)">Editar</button>
                      <button class="btn btn-ghost btn-sm" onclick="PageCatalogo.removerMaterial('${m.id}')">${m.ativo ? 'Desativar' : 'Ativar'}</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div class="empty-state" style="padding:40px;"><p>Nenhum material cadastrado.</p></div>'}
      </div>
    `;
  },

  async renderExames() {
    const c = document.getElementById('catalogo-conteudo');
    c.innerHTML = `<div class="empty-state"><div class="spinner spinner-dark" style="width:24px;height:24px;margin:0 auto;"></div></div>`;

    const res = await Catalogo.listarExames();
    const exames = res.exames || [];

    c.innerHTML = `
      <div class="table-wrapper">
        <div class="table-header">
          <span class="card-title">Tipos de Exame (${exames.length})</span>
          <button class="btn btn-primary btn-sm" onclick="PageCatalogo.formExame()">+ Novo Exame</button>
        </div>
        ${exames.length ? `
          <table>
            <thead><tr><th>Nome</th><th>Código</th><th>Descrição</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              ${exames.map(e => `
                <tr>
                  <td><strong>${e.nome}</strong></td>
                  <td><code style="font-size:11px;background:#F5F5F7;padding:2px 6px;border-radius:4px;">${e.codigo || '—'}</code></td>
                  <td style="font-size:12px;color:var(--cor-texto-suave);max-width:250px;">${e.descricao || '—'}</td>
                  <td>
                    <span class="badge" style="background:${e.ativo ? 'var(--cor-finalizado-bg)' : '#F3F4F6'};color:${e.ativo ? 'var(--cor-finalizado)' : 'var(--cor-aguardando)'};">
                      ${e.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div class="td-actions">
                      <button class="btn btn-ghost btn-sm" onclick="PageCatalogo.formExame('${e.id}', '${e.nome}', '${e.codigo || ''}', \`${e.descricao || ''}\`)">Editar</button>
                      <button class="btn btn-ghost btn-sm" onclick="PageCatalogo.removerExame('${e.id}')">Desativar</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div class="empty-state" style="padding:40px;"><p>Nenhum exame cadastrado.</p></div>'}
      </div>
    `;
  },

  formMaterial(id = '', nome = '', desc = '') {
    abrirModal(id ? 'Editar Material' : 'Novo Material', `
      <div class="form-group">
        <label class="form-label required">Nome do Material</label>
        <input type="text" id="m-nome" class="form-input" value="${nome}" placeholder="Ex: Sangue Total" />
      </div>
      <div class="form-group">
        <label class="form-label">Descrição</label>
        <textarea id="m-desc" class="form-textarea" rows="3">${desc}</textarea>
      </div>
      <div id="m-erro" class="alert alert-error" style="display:none;"></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="fecharModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="PageCatalogo.salvarMaterial('${id}')">Salvar</button>
      </div>
    `);
  },

  async salvarMaterial(id) {
    const nome = document.getElementById('m-nome').value.trim();
    const descricao = document.getElementById('m-desc').value.trim();
    const erroEl = document.getElementById('m-erro');
    if (!nome) { erroEl.textContent = 'Nome é obrigatório.'; erroEl.style.display = 'block'; return; }
    const res = id
      ? await Catalogo.atualizarMaterial(id, { nome, descricao })
      : await Catalogo.criarMaterial({ nome, descricao });
    if (res.sucesso) {
      fecharModal(); toast('Material salvo!', 'success');
      await this.renderMateriais();
    } else {
      erroEl.textContent = res.mensagem || 'Erro.'; erroEl.style.display = 'block';
    }
  },

  async removerMaterial(id) {
    await Catalogo.removerMaterial(id);
    toast('Material desativado.', 'success');
    await this.renderMateriais();
  },

  formExame(id = '', nome = '', codigo = '', desc = '') {
    abrirModal(id ? 'Editar Exame' : 'Novo Exame', `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Nome do Exame</label>
          <input type="text" id="e-nome" class="form-input" value="${nome}" />
        </div>
        <div class="form-group">
          <label class="form-label">Código</label>
          <input type="text" id="e-codigo" class="form-input" value="${codigo}" placeholder="Ex: HMG" maxlength="20" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Descrição</label>
        <textarea id="e-desc" class="form-textarea" rows="3">${desc}</textarea>
      </div>
      <div id="e-erro" class="alert alert-error" style="display:none;"></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="fecharModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="PageCatalogo.salvarExame('${id}')">Salvar</button>
      </div>
    `);
  },

  async salvarExame(id) {
    const nome = document.getElementById('e-nome').value.trim();
    const codigo = document.getElementById('e-codigo').value.trim();
    const descricao = document.getElementById('e-desc').value.trim();
    const erroEl = document.getElementById('e-erro');
    if (!nome) { erroEl.textContent = 'Nome é obrigatório.'; erroEl.style.display = 'block'; return; }
    const res = id
      ? await Catalogo.atualizarExame(id, { nome, codigo, descricao })
      : await Catalogo.criarExame({ nome, codigo, descricao });
    if (res.sucesso) {
      fecharModal(); toast('Exame salvo!', 'success');
      await this.renderExames();
    } else {
      erroEl.textContent = res.mensagem || 'Erro.'; erroEl.style.display = 'block';
    }
  },

  async removerExame(id) {
    await Catalogo.removerExame(id);
    toast('Exame desativado.', 'success');
    await this.renderExames();
  }
};