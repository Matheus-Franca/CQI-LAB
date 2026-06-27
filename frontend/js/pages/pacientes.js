/**
 * CQI-LAB — Página: Pacientes
 * CRUD completo de pacientes
 */

const PagePacientes = {
  paginaAtual: 1,

  async render() {
    const content = document.getElementById('app-content');
    const usuario = getUsuario();
    const podeEditar = ['admin', 'secretaria'].includes(usuario.perfil);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Pacientes</h1>
          <p class="page-subtitle">Cadastro e gerenciamento de pacientes</p>
        </div>
        ${podeEditar ? `
          <button class="btn btn-primary" onclick="PagePacientes.abrirFormulario()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo Paciente
          </button>
        ` : ''}
      </div>

      <div class="table-wrapper">
        <div class="filter-bar">
          <input type="text" id="f-paciente-busca" class="form-input" placeholder="Buscar por nome ou CPF..." style="min-width:250px;" />
          <button class="btn btn-secondary btn-sm" onclick="PagePacientes.buscar(1)">Buscar</button>
          <button class="btn btn-ghost btn-sm" onclick="PagePacientes.limpar()">Limpar</button>
        </div>
        <div id="tabela-pacientes">
          <div class="empty-state"><div class="spinner spinner-dark" style="width:28px;height:28px;margin:0 auto;"></div></div>
        </div>
        <div class="pagination" id="paginacao-pacientes"></div>
      </div>
    `;

    let debounce;
    document.getElementById('f-paciente-busca').addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => PagePacientes.buscar(1), 400);
    });

    await PagePacientes.buscar(1);
  },

  async buscar(pagina = 1) {
    this.paginaAtual = pagina;
    const busca = document.getElementById('f-paciente-busca')?.value || '';
    const tabela = document.getElementById('tabela-pacientes');
    if (tabela) tabela.innerHTML = `<div class="empty-state"><div class="spinner spinner-dark" style="width:24px;height:24px;margin:0 auto;"></div></div>`;

    try {
      const res = await Pacientes.listar({ busca, pagina, limite: 15 });
      const pacientes = res.pacientes || [];
      const usuario = getUsuario();
      const podeEditar = ['admin', 'secretaria'].includes(usuario.perfil);

      if (!pacientes.length) {
        tabela.innerHTML = `<div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <h3>Nenhum paciente encontrado</h3>
          <p>Tente ajustar o termo de busca.</p>
        </div>`;
        document.getElementById('paginacao-pacientes').innerHTML = '';
        return;
      }

      tabela.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Nascimento</th>
              <th>Telefone</th>
              <th>Convênio</th>
              <th>Médico Solicitante</th>
              ${podeEditar ? '<th>Ações</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${pacientes.map(p => `
              <tr>
                <td><strong>${p.nome}</strong></td>
                <td style="font-family:monospace;">${p.cpf}</td>
                <td>${formatarData(p.data_nascimento)}</td>
                <td>${p.telefone || '—'}</td>
                <td>${p.convenio || '—'}</td>
                <td style="font-size:12px;">${p.medico_solicitante || '—'}</td>
                ${podeEditar ? `
                  <td>
                    <div class="td-actions">
                      <button class="btn btn-ghost btn-sm" onclick="PagePacientes.abrirFormulario('${p.id}')">Editar</button>
                    </div>
                  </td>
                ` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      if (res.paginacao) {
        renderizarPaginacao('paginacao-pacientes', res.paginacao, 'PagePacientes.buscar');
      }

    } catch (err) {
      if (tabela) tabela.innerHTML = `<div class="alert alert-error" style="margin:20px">Erro ao carregar pacientes.</div>`;
    }
  },

  limpar() {
    document.getElementById('f-paciente-busca').value = '';
    this.buscar(1);
  },

  async abrirFormulario(id = null) {
    let paciente = {};
    if (id) {
      const res = await Pacientes.buscar(id);
      if (res.sucesso) paciente = res.paciente;
    }

    const titulo = id ? 'Editar Paciente' : 'Novo Paciente';
    const html = `
      <div class="form-section-title">Dados Pessoais</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Nome Completo</label>
          <input type="text" id="p-nome" class="form-input" value="${paciente.nome || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label required">CPF</label>
          <input type="text" id="p-cpf" class="form-input" value="${paciente.cpf || ''}" placeholder="000.000.000-00" maxlength="14" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Data de Nascimento</label>
          <input type="date" id="p-nascimento" class="form-input" value="${paciente.data_nascimento ? paciente.data_nascimento.split('T')[0] : ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Telefone</label>
          <input type="tel" id="p-telefone" class="form-input" value="${paciente.telefone || ''}" placeholder="(00) 00000-0000" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">E-mail</label>
        <input type="email" id="p-email" class="form-input" value="${paciente.email || ''}" />
      </div>

      <div class="form-section-title" style="margin-top:8px;">Endereço</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">CEP</label>
          <input type="text" id="p-cep" class="form-input" value="${paciente.cep || ''}" placeholder="00000-000" />
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <input type="text" id="p-estado" class="form-input" value="${paciente.estado || ''}" maxlength="2" placeholder="SP" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Logradouro</label>
          <input type="text" id="p-logradouro" class="form-input" value="${paciente.logradouro || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Número</label>
          <input type="text" id="p-numero" class="form-input" value="${paciente.numero || ''}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Bairro</label>
          <input type="text" id="p-bairro" class="form-input" value="${paciente.bairro || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Cidade</label>
          <input type="text" id="p-cidade" class="form-input" value="${paciente.cidade || ''}" />
        </div>
      </div>

      <div class="form-section-title" style="margin-top:8px;">Convênio e Médico</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Convênio / Plano de Saúde</label>
          <input type="text" id="p-convenio" class="form-input" value="${paciente.convenio || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Nº Carteirinha</label>
          <input type="text" id="p-carteirinha" class="form-input" value="${paciente.numero_carteirinha || ''}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Médico Solicitante</label>
          <input type="text" id="p-medico" class="form-input" value="${paciente.medico_solicitante || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">CRM do Médico</label>
          <input type="text" id="p-crm" class="form-input" value="${paciente.crm_medico || ''}" placeholder="CRM/SP 12345" />
        </div>
      </div>

      <div id="p-erro" class="alert alert-error" style="display:none;"></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="fecharModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="PagePacientes.salvar('${id || ''}')">
          ${id ? 'Salvar Alterações' : 'Cadastrar Paciente'}
        </button>
      </div>
    `;

    abrirModal(titulo, html, '720px');

    // Máscara de CPF
    const cpfInput = document.getElementById('p-cpf');
    if (cpfInput) mascaraCPF(cpfInput);
  },

  async salvar(id) {
    const dados = {
      nome: document.getElementById('p-nome')?.value?.trim(),
      cpf: document.getElementById('p-cpf')?.value?.trim(),
      data_nascimento: document.getElementById('p-nascimento')?.value,
      telefone: document.getElementById('p-telefone')?.value?.trim(),
      email: document.getElementById('p-email')?.value?.trim(),
      cep: document.getElementById('p-cep')?.value?.trim(),
      logradouro: document.getElementById('p-logradouro')?.value?.trim(),
      numero: document.getElementById('p-numero')?.value?.trim(),
      bairro: document.getElementById('p-bairro')?.value?.trim(),
      cidade: document.getElementById('p-cidade')?.value?.trim(),
      estado: document.getElementById('p-estado')?.value?.trim(),
      convenio: document.getElementById('p-convenio')?.value?.trim(),
      numero_carteirinha: document.getElementById('p-carteirinha')?.value?.trim(),
      medico_solicitante: document.getElementById('p-medico')?.value?.trim(),
      crm_medico: document.getElementById('p-crm')?.value?.trim()
    };

    const erroEl = document.getElementById('p-erro');

    if (!dados.nome || !dados.cpf || !dados.data_nascimento) {
      erroEl.textContent = 'Nome, CPF e data de nascimento são obrigatórios.';
      erroEl.style.display = 'block';
      return;
    }

    try {
      const res = id
        ? await Pacientes.atualizar(id, dados)
        : await Pacientes.criar(dados);

      if (res.sucesso) {
        fecharModal();
        toast(`Paciente ${id ? 'atualizado' : 'cadastrado'} com sucesso!`, 'success');
        await PagePacientes.buscar(PagePacientes.paginaAtual);
      } else {
        erroEl.textContent = res.mensagem || 'Erro ao salvar.';
        erroEl.style.display = 'block';
      }
    } catch (err) {
      erroEl.textContent = 'Erro ao salvar. Tente novamente.';
      erroEl.style.display = 'block';
    }
  }
};