/**
 * CQI-LAB — Página: Usuários (Admin)
 * CRUD de usuários do sistema
 */

const PageUsuarios = {
  async render() {
    const content = document.getElementById('app-content');

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Usuários</h1>
          <p class="page-subtitle">Gerenciamento de contas e perfis de acesso</p>
        </div>
        <button class="btn btn-primary" onclick="PageUsuarios.abrirFormulario()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Usuário
        </button>
      </div>

      <div class="table-wrapper">
        <div class="filter-bar">
          <select id="f-u-perfil" class="form-select">
            <option value="">Todos os perfis</option>
            <option value="admin">Administrador</option>
            <option value="secretaria">Secretária</option>
            <option value="coletador">Coletador</option>
            <option value="tecnico">Técnico</option>
            <option value="responsavel_tecnico">Resp. Técnico</option>
          </select>
          <select id="f-u-ativo" class="form-select">
            <option value="">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
          <button class="btn btn-secondary btn-sm" onclick="PageUsuarios.buscar()">Filtrar</button>
        </div>
        <div id="tabela-usuarios">
          <div class="empty-state"><div class="spinner spinner-dark" style="width:28px;height:28px;margin:0 auto;"></div></div>
        </div>
      </div>
    `;

    await PageUsuarios.buscar();
  },

  async buscar() {
    const perfil = document.getElementById('f-u-perfil')?.value || '';
    const ativo = document.getElementById('f-u-ativo')?.value || '';
    const tabela = document.getElementById('tabela-usuarios');

    try {
      const res = await Usuarios.listar({ perfil, ativo });
      const usuarios = res.usuarios || [];

      if (!usuarios.length) {
        tabela.innerHTML = `<div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <h3>Nenhum usuário encontrado</h3>
        </div>`;
        return;
      }

      tabela.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${usuarios.map(u => `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:32px;height:32px;border-radius:50%;background:var(--cor-primaria-clara);color:var(--cor-primaria);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0;">
                      ${iniciais(u.nome)}
                    </div>
                    <strong>${u.nome}</strong>
                  </div>
                </td>
                <td>${u.email}</td>
                <td>${badgePerfil(u.perfil)}</td>
                <td>
                  <span class="badge" style="background:${u.ativo ? 'var(--cor-finalizado-bg)' : '#F3F4F6'};color:${u.ativo ? 'var(--cor-finalizado)' : 'var(--cor-aguardando)'};">
                    ${u.ativo ? '● Ativo' : '○ Inativo'}
                  </span>
                </td>
                <td>${formatarData(u.criado_em)}</td>
                <td>
                  <div class="td-actions">
                    <button class="btn btn-ghost btn-sm" onclick="PageUsuarios.abrirFormulario('${u.id}')">Editar</button>
                    <button class="btn btn-ghost btn-sm" onclick="PageUsuarios.toggleAtivo('${u.id}', ${u.ativo})">
                      ${u.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

    } catch (err) {
      tabela.innerHTML = `<div class="alert alert-error" style="margin:20px">Erro ao carregar usuários.</div>`;
    }
  },

  async abrirFormulario(id = null) {
    let usuario = {};
    if (id) {
      const res = await Usuarios.buscar(id);
      if (res.sucesso) usuario = res.usuario;
    }

    abrirModal(id ? 'Editar Usuário' : 'Novo Usuário', `
      <div class="form-group">
        <label class="form-label required">Nome Completo</label>
        <input type="text" id="u-nome" class="form-input" value="${usuario.nome || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label required">E-mail</label>
        <input type="email" id="u-email" class="form-input" value="${usuario.email || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label ${!id ? 'required' : ''}">${id ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}</label>
        <input type="password" id="u-senha" class="form-input" placeholder="${id ? '••••••••' : 'Mínimo 6 caracteres'}" />
      </div>
      <div class="form-group">
        <label class="form-label required">Perfil de Acesso</label>
        <select id="u-perfil" class="form-select">
          <option value="secretaria" ${usuario.perfil === 'secretaria' ? 'selected' : ''}>Secretária</option>
          <option value="coletador" ${usuario.perfil === 'coletador' ? 'selected' : ''}>Coletador</option>
          <option value="tecnico" ${usuario.perfil === 'tecnico' ? 'selected' : ''}>Técnico de Laboratório</option>
          <option value="responsavel_tecnico" ${usuario.perfil === 'responsavel_tecnico' ? 'selected' : ''}>Responsável Técnico (RT)</option>
          <option value="admin" ${usuario.perfil === 'admin' ? 'selected' : ''}>Administrador</option>
        </select>
      </div>
      <div id="u-erro" class="alert alert-error" style="display:none;"></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="fecharModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="PageUsuarios.salvar('${id || ''}')">
          ${id ? 'Salvar' : 'Criar Usuário'}
        </button>
      </div>
    `);
  },

  async salvar(id) {
    const dados = {
      nome: document.getElementById('u-nome').value.trim(),
      email: document.getElementById('u-email').value.trim(),
      perfil: document.getElementById('u-perfil').value,
      senha: document.getElementById('u-senha').value
    };

    const erroEl = document.getElementById('u-erro');

    if (!dados.nome || !dados.email || !dados.perfil) {
      erroEl.textContent = 'Nome, e-mail e perfil são obrigatórios.';
      erroEl.style.display = 'block';
      return;
    }
    if (!id && !dados.senha) {
      erroEl.textContent = 'Senha é obrigatória para novos usuários.';
      erroEl.style.display = 'block';
      return;
    }

    // Remove senha vazia (edição)
    if (!dados.senha) delete dados.senha;

    try {
      const res = id
        ? await Usuarios.atualizar(id, dados)
        : await Usuarios.criar(dados);

      if (res.sucesso) {
        fecharModal();
        toast(`Usuário ${id ? 'atualizado' : 'criado'} com sucesso!`, 'success');
        await PageUsuarios.buscar();
      } else {
        erroEl.textContent = res.mensagem || 'Erro ao salvar.';
        erroEl.style.display = 'block';
      }
    } catch (err) {
      erroEl.textContent = 'Erro ao salvar. Tente novamente.';
      erroEl.style.display = 'block';
    }
  },

  async toggleAtivo(id, ativoAtual) {
    const res = await Usuarios.atualizar(id, { ativo: !ativoAtual });
    if (res.sucesso) {
      toast(`Usuário ${!ativoAtual ? 'ativado' : 'desativado'}.`, 'success');
      await PageUsuarios.buscar();
    } else {
      toast(res.mensagem || 'Erro ao alterar status.', 'error');
    }
  }
};