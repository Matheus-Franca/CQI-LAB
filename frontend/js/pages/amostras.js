/**
 * CQI-LAB — Página: Amostras
 * Lista, detalhe, nova solicitação e atualização de status
 */

const PageAmostras = {
  paginaAtual: 1,

  async render() {
    const content = document.getElementById('app-content');
    const usuario = getUsuario();

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Amostras</h1>
          <p class="page-subtitle">Gerencie e acompanhe todas as amostras do laboratório</p>
        </div>
        ${['admin', 'secretaria'].includes(usuario.perfil) ? `
          <button class="btn btn-primary" onclick="navegar('nova_amostra')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova Solicitação
          </button>
        ` : ''}
      </div>

      <!-- Filtros -->
      <div class="table-wrapper">
        <div class="filter-bar" id="filtros-amostras">
          <input type="text" id="f-paciente" class="form-input" placeholder="Buscar paciente..." style="min-width:200px;" />
          <select id="f-status" class="form-select">
            <option value="">Todos os status</option>
            <option value="aguardando_coleta">Aguardando Coleta</option>
            <option value="coletada">Coletada</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="finalizado">Finalizado</option>
            <option value="recoleta_solicitada">Recoleta Solicitada</option>
          </select>
          <input type="date" id="f-data-inicio" class="form-input" />
          <input type="date" id="f-data-fim" class="form-input" />
          <button class="btn btn-secondary btn-sm" onclick="PageAmostras.buscar(1)">Filtrar</button>
          <button class="btn btn-ghost btn-sm" onclick="PageAmostras.limparFiltros()">Limpar</button>
        </div>

        <div id="tabela-amostras">
          <div class="empty-state"><div class="spinner spinner-dark" style="width:28px;height:28px;margin:0 auto;"></div></div>
        </div>
        <div class="pagination" id="paginacao-amostras"></div>
      </div>
    `;

    // Busca ao digitar com debounce
    let debounce;
    document.getElementById('f-paciente').addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => PageAmostras.buscar(1), 500);
    });

    await PageAmostras.buscar(1);
  },

  async buscar(pagina = 1) {
    this.paginaAtual = pagina;
    const params = {
      pagina,
      limite: 15,
      paciente: document.getElementById('f-paciente')?.value || '',
      status: document.getElementById('f-status')?.value || '',
      data_inicio: document.getElementById('f-data-inicio')?.value || '',
      data_fim: document.getElementById('f-data-fim')?.value || ''
    };

    // Remove params vazios
    Object.keys(params).forEach(k => { if (!params[k] && params[k] !== 0) delete params[k]; });

    const tabela = document.getElementById('tabela-amostras');
    if (tabela) tabela.innerHTML = `<div class="empty-state"><div class="spinner spinner-dark" style="width:24px;height:24px;margin:0 auto;"></div></div>`;

    try {
      const res = await Amostras.listar(params);
      const amostras = res.amostras || [];

      if (!amostras.length) {
        tabela.innerHTML = `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <h3>Nenhuma amostra encontrada</h3>
            <p>Tente ajustar os filtros de busca.</p>
          </div>
        `;
        document.getElementById('paginacao-amostras').innerHTML = '';
        return;
      }

      tabela.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Paciente</th>
              <th>Material</th>
              <th>Status</th>
              <th>Responsável</th>
              <th>Data Solicitação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${amostras.map(a => `
              <tr>
                <td><strong style="font-family:monospace;">${a.codigo}</strong></td>
                <td>
                  <div style="font-weight:600;">${a.paciente_nome || '—'}</div>
                  <div style="font-size:11px;color:var(--cor-texto-suave);">${a.paciente_cpf || ''}</div>
                </td>
                <td>${a.tipo_material || '—'}</td>
                <td>${badgeStatus(a.status)}</td>
                <td style="font-size:12px;">${a.coletador_nome || a.tecnico_nome || '—'}</td>
                <td>${formatarData(a.data_solicitacao)}</td>
                <td>
                  <div class="td-actions">
                    <button class="btn btn-ghost btn-sm" onclick="PageAmostras.verDetalhe('${a.id}')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      Ver
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      // Paginação
      if (res.paginacao) {
        renderizarPaginacao('paginacao-amostras', res.paginacao, 'PageAmostras.buscar');
      }

    } catch (err) {
      if (tabela) tabela.innerHTML = `<div class="alert alert-error" style="margin:20px">Erro ao carregar amostras.</div>`;
    }
  },

  limparFiltros() {
    ['f-paciente', 'f-status', 'f-data-inicio', 'f-data-fim'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    this.buscar(1);
  },

  async verDetalhe(id) {
    const content = document.getElementById('app-content');
    content.innerHTML = `<div class="empty-state"><div class="spinner spinner-dark" style="width:32px;height:32px;margin:0 auto;"></div><p>Carregando amostra...</p></div>`;

    try {
      const res = await Amostras.buscar(id);
      if (!res.sucesso) {
        toast('Amostra não encontrada.', 'error');
        navegar('amostras');
        return;
      }

      const a = res.amostra;
      const usuario = getUsuario();

      // Determina ações disponíveis para o perfil atual
      const acoes = this._getAcoesDisponiveis(a.status, usuario.perfil);

      content.innerHTML = `
        <div class="page-header">
          <div>
            <button class="btn btn-ghost btn-sm" onclick="navegar('amostras')" style="margin-bottom:8px;">← Voltar</button>
            <h1 class="page-title" style="font-family:monospace;">${a.codigo}</h1>
            <p class="page-subtitle">Criada em ${formatarDataHora(a.data_solicitacao)} por ${a.secretaria_nome || '—'}</p>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            ${badgeStatus(a.status)}
            ${acoes}
          </div>
        </div>

        <div class="detail-split">
          <!-- Coluna esquerda: dados da amostra -->
          <div style="display:flex;flex-direction:column;gap:20px;">

            <!-- Dados do paciente -->
            <div class="card">
              <div class="card-header">
                <span class="card-title">Paciente</span>
              </div>
              <div class="detail-info-grid">
                <div class="detail-field"><label>Nome</label><p>${a.paciente_nome || '—'}</p></div>
                <div class="detail-field"><label>CPF</label><p>${a.paciente_cpf || '—'}</p></div>
                <div class="detail-field"><label>Data de Nascimento</label><p>${formatarData(a.data_nascimento)}</p></div>
                <div class="detail-field"><label>Convênio</label><p>${a.convenio || '—'}</p></div>
                <div class="detail-field"><label>Médico Solicitante</label><p>${a.medico_solicitante || '—'}</p></div>
              </div>
            </div>

            <!-- Dados da amostra -->
            <div class="card">
              <div class="card-header">
                <span class="card-title">Dados da Amostra</span>
              </div>
              <div class="detail-info-grid">
                <div class="detail-field"><label>Material</label><p>${a.tipo_material_nome || '—'}</p></div>
                <div class="detail-field"><label>Coletador</label><p>${a.coletador_nome || '—'}</p></div>
                <div class="detail-field"><label>Técnico</label><p>${a.tecnico_nome || '—'}</p></div>
                <div class="detail-field"><label>Resp. Técnico</label><p>${a.responsavel_tecnico_nome || '—'}</p></div>
                <div class="detail-field"><label>Data Coleta</label><p>${formatarDataHora(a.data_coleta)}</p></div>
                <div class="detail-field"><label>Data Finalização</label><p>${formatarDataHora(a.data_finalizacao)}</p></div>
              </div>
              ${a.observacoes ? `<div style="margin-top:12px;"><label class="form-label">Observações</label><p style="margin-top:4px;font-size:13px;">${a.observacoes}</p></div>` : ''}
            </div>

            <!-- Exames -->
            <div class="card">
              <div class="card-header">
                <span class="card-title">Exames Solicitados</span>
              </div>
              ${a.exames && a.exames.length ? `
                <table>
                  <thead>
                    <tr><th>Exame</th><th>Código</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    ${a.exames.map(e => `
                      <tr>
                        <td>${e.exame_nome}</td>
                        <td><code style="font-size:11px;background:#F5F5F7;padding:2px 6px;border-radius:4px;">${e.codigo || '—'}</code></td>
                        <td>${badgeStatus(e.status)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<div class="empty-state" style="padding:20px;"><p>Nenhum exame registrado.</p></div>'}
            </div>
          </div>

          <!-- Coluna direita: trilha de auditoria -->
          <div class="card" style="position:sticky;top:80px;">
            <div class="card-header">
              <span class="card-title">Histórico de Status</span>
            </div>
            <div class="timeline">
              ${a.historico && a.historico.length ? a.historico.map(h => `
                <div class="timeline-item">
                  <div class="timeline-dot" style="background:${corDotStatus(h.status_novo)};"></div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <span class="timeline-status">${badgeStatus(h.status_novo)}</span>
                      <span class="timeline-date">${formatarDataHora(h.criado_em)}</span>
                    </div>
                    <div class="timeline-user">por ${h.usuario_nome || 'Sistema'} ${h.usuario_perfil ? `(${PERFIL_LABELS[h.usuario_perfil] || h.usuario_perfil})` : ''}</div>
                    ${h.motivo ? `<div class="timeline-motivo">⚠ ${h.motivo}</div>` : ''}
                  </div>
                </div>
              `).join('') : '<p style="font-size:13px;color:var(--cor-texto-suave);">Sem histórico.</p>'}
            </div>
          </div>
        </div>
      `;

    } catch (err) {
      toast('Erro ao carregar a amostra.', 'error');
      navegar('amostras');
    }
  },

  _getAcoesDisponiveis(status, perfil) {
    const acoesMap = {
      coletador: {
        aguardando_coleta: [{ label: 'Registrar Coleta', status: 'coletada', classe: 'btn-primary' }],
        recoleta_solicitada: [{ label: 'Registrar Recoleta', status: 'coletada', classe: 'btn-primary' }]
      },
      tecnico: {
        coletada: [
          { label: 'Iniciar Análise', status: 'em_andamento', classe: 'btn-primary' },
          { label: 'Solicitar Recoleta', status: 'recoleta_solicitada', classe: 'btn-danger', motivo: true }
        ],
        em_andamento: [
          { label: 'Solicitar Recoleta', status: 'recoleta_solicitada', classe: 'btn-danger', motivo: true }
        ]
      },
      responsavel_tecnico: {
        em_andamento: [
          { label: 'Finalizar', status: 'finalizado', classe: 'btn-primary' },
          { label: 'Solicitar Reexame', status: 'em_andamento', classe: 'btn-secondary', motivo: true },
          { label: 'Solicitar Recoleta', status: 'recoleta_solicitada', classe: 'btn-danger', motivo: true }
        ]
      }
    };

    if (perfil === 'admin') {
      // Admin vê todas as ações possíveis para o status atual
      const todasAcoes = Object.values(acoesMap).map(v => v[status] || []).flat();
      const acoesMapped = [...new Map(todasAcoes.map(a => [a.status + a.label, a])).values()];
      return acoesMapped.map(a => this._renderBtnAcao(a)).join('');
    }

    const acoes = (acoesMap[perfil] || {})[status] || [];
    return acoes.map(a => this._renderBtnAcao(a)).join('');
  },

  _renderBtnAcao(acao) {
    const id = `amostra-id-${Date.now()}`;
    return `
      <button class="btn ${acao.classe} btn-sm" 
        onclick="PageAmostras.confirmarAcao('${acao.status}', ${acao.motivo || false}, '${acao.label}')">
        ${acao.label}
      </button>
    `;
  },

  _amostraid: null,

  confirmarAcao(novoStatus, precisaMotivo, label) {
    // Pega o ID da URL atual via hash ou do DOM
    const idMatch = window.location.search.match(/id=([^&]+)/);
    // Pega o id da amostra do título (fallback: código) — lê o h1
    const codigoEl = document.querySelector('.page-title');
    const codigo = codigoEl ? codigoEl.textContent.trim() : '';

    // Abre modal de confirmação
    const htmlMotivo = precisaMotivo ? `
      <div class="form-group">
        <label class="form-label required">Motivo</label>
        <textarea id="motivo-input" class="form-textarea" placeholder="Descreva o motivo..." rows="3"></textarea>
      </div>
    ` : '';

    abrirModal(`Confirmar: ${label}`, `
      <p>Confirma a ação <strong>${label}</strong> para esta amostra?</p>
      ${htmlMotivo}
      <div id="acao-erro" class="alert alert-error" style="display:none;"></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="fecharModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="PageAmostras._executarAcao('${novoStatus}', ${precisaMotivo})">Confirmar</button>
      </div>
    `);
  },

  async _executarAcao(novoStatus, precisaMotivo) {
    const motivo = precisaMotivo ? document.getElementById('motivo-input')?.value?.trim() : null;
    const erroEl = document.getElementById('acao-erro');

    if (precisaMotivo && !motivo) {
      erroEl.textContent = 'O motivo é obrigatório.';
      erroEl.style.display = 'block';
      return;
    }

    fecharModal();
    toast('Aguarde...', 'info');

    try {
      // Pega o ID real da amostra a partir do DOM
      const res = await Amostras.atualizarStatus(PageAmostras._amostraid, { status: novoStatus, motivo });
      if (res.sucesso) {
        toast('Status atualizado com sucesso!', 'success');
        await PageAmostras.verDetalhe(PageAmostras._amostraid);
        await atualizarAlertas();
      } else {
        toast(res.mensagem || 'Erro ao atualizar status.', 'error');
      }
    } catch (err) {
      toast('Erro ao atualizar status.', 'error');
    }
  },

  async renderNova() {
    const content = document.getElementById('app-content');

    content.innerHTML = `
      <div class="page-header">
        <div>
          <button class="btn btn-ghost btn-sm" onclick="navegar('amostras')" style="margin-bottom:8px;">← Voltar</button>
          <h1 class="page-title">Nova Solicitação de Exames</h1>
          <p class="page-subtitle">Preencha os dados para criar uma nova solicitação</p>
        </div>
      </div>
      <div class="card" style="max-width:860px;">
        <form id="form-nova-amostra" novalidate>

          <div class="form-section-title" style="margin-bottom:16px;">Paciente</div>
          <div class="form-group">
            <label class="form-label required">Paciente</label>
            <input type="text" id="busca-paciente" class="form-input" placeholder="Digite o nome ou CPF do paciente..." autocomplete="off" />
            <div id="lista-pacientes" style="display:none;border:1px solid var(--cor-borda);border-radius:8px;margin-top:4px;background:white;box-shadow:var(--sombra-card);max-height:200px;overflow-y:auto;"></div>
            <input type="hidden" id="paciente-id-selecionado" />
            <div id="paciente-selecionado" style="display:none;margin-top:8px;padding:10px;background:var(--cor-primaria-clara);border-radius:8px;font-size:13px;"></div>
          </div>

          <div style="margin-top:20px;" class="form-section-title">Detalhes da Amostra</div>

          <div class="form-row" style="margin-top:16px;">
            <div class="form-group">
              <label class="form-label required">Tipo de Material</label>
              <select id="tipo-material-id" class="form-select">
                <option value="">Carregando materiais...</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Coletador Responsável</label>
              <select id="coletador-id" class="form-select">
                <option value="">Selecione o coletador...</option>
              </select>
            </div>
          </div>

          <div class="form-row" style="margin-top:16px;">
            <div class="form-group">
              <label class="form-label">Técnico Responsável</label>
              <select id="tecnico-id" class="form-select">
                <option value="">Selecione o técnico...</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Responsável Técnico (RT)</label>
              <select id="responsavel-id" class="form-select">
                <option value="">Selecione o RT...</option>
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-top:16px;">
            <label class="form-label">Observações</label>
            <textarea id="observacoes" class="form-textarea" placeholder="Informações adicionais sobre a amostra..."></textarea>
          </div>

          <div style="margin-top:20px;" class="form-section-title">Exames Solicitados</div>
          <div class="form-group" style="margin-top:16px;">
            <label class="form-label required">Selecione os exames</label>
            <input type="text" id="busca-exame" class="form-input exame-select-search" placeholder="Filtrar exames..." />
            <div id="lista-exames" class="checkbox-list" style="border:1px solid var(--cor-borda);border-radius:8px;padding:12px;max-height:250px;overflow-y:auto;margin-top:4px;">
              <span style="color:var(--cor-texto-suave);font-size:13px;">Carregando exames...</span>
            </div>
          </div>

          <div id="form-erro" class="alert alert-error" style="display:none;margin-top:16px;"></div>

          <div style="display:flex;gap:12px;margin-top:24px;justify-content:flex-end;">
            <button type="button" class="btn btn-ghost" onclick="navegar('amostras')">Cancelar</button>
            <button type="submit" class="btn btn-primary" id="btn-salvar">
              <span id="btn-salvar-text">Criar Solicitação</span>
              <span id="btn-salvar-loading" class="spinner" style="display:none;"></span>
            </button>
          </div>
        </form>
      </div>
    `;

    // Carrega dados dos selects em paralelo
    const [materiaisRes, usuariosRes, examesRes] = await Promise.all([
      Catalogo.listarMateriais({ ativo: true }),
      Usuarios.listar({ ativo: true }),
      Catalogo.listarExames({ ativo: true })
    ]);

    // Materiais
    const matSelect = document.getElementById('tipo-material-id');
    matSelect.innerHTML = '<option value="">Selecione o material...</option>' +
      (materiaisRes.materiais || []).map(m => `<option value="${m.id}">${m.nome}</option>`).join('');

    // Usuários por perfil
    const usuarios = usuariosRes.usuarios || [];
    const coletadores = usuarios.filter(u => u.perfil === 'coletador');
    const tecnicos = usuarios.filter(u => u.perfil === 'tecnico');
    const rts = usuarios.filter(u => u.perfil === 'responsavel_tecnico');

    document.getElementById('coletador-id').innerHTML =
      '<option value="">Selecione o coletador...</option>' +
      coletadores.map(u => `<option value="${u.id}">${u.nome}</option>`).join('');

    document.getElementById('tecnico-id').innerHTML =
      '<option value="">Selecione o técnico...</option>' +
      tecnicos.map(u => `<option value="${u.id}">${u.nome}</option>`).join('');

    document.getElementById('responsavel-id').innerHTML =
      '<option value="">Selecione o RT...</option>' +
      rts.map(u => `<option value="${u.id}">${u.nome}</option>`).join('');

    // Lista de exames com checkboxes
    const todosExames = examesRes.exames || [];
    const renderExames = (filtro = '') => {
      const filtrados = todosExames.filter(e =>
        e.nome.toLowerCase().includes(filtro.toLowerCase()) ||
        (e.codigo || '').toLowerCase().includes(filtro.toLowerCase())
      );
      document.getElementById('lista-exames').innerHTML = filtrados.length ?
        filtrados.map(e => `
          <label class="checkbox-item">
            <input type="checkbox" name="exame" value="${e.id}" />
            <span>${e.nome}${e.codigo ? ` <span style="font-size:11px;color:var(--cor-texto-suave)">(${e.codigo})</span>` : ''}</span>
          </label>
        `).join('') : '<span style="font-size:13px;color:var(--cor-texto-suave);">Nenhum exame encontrado.</span>';
    };
    renderExames();
    document.getElementById('busca-exame').addEventListener('input', (e) => renderExames(e.target.value));

    // Autocomplete de paciente
    let debounce;
    document.getElementById('busca-paciente').addEventListener('input', async function () {
      clearTimeout(debounce);
      const busca = this.value.trim();
      if (busca.length < 2) { document.getElementById('lista-pacientes').style.display = 'none'; return; }
      debounce = setTimeout(async () => {
        const res = await Pacientes.listar({ busca, limite: 8 });
        const lista = document.getElementById('lista-pacientes');
        const pacientes = res.pacientes || [];
        if (!pacientes.length) { lista.style.display = 'none'; return; }
        lista.innerHTML = pacientes.map(p => `
          <div style="padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--cor-borda);"
               onmouseover="this.style.background='#F5F5F7'" onmouseout="this.style.background=''"
               onclick="PageAmostras._selecionarPaciente('${p.id}','${p.nome}','${p.cpf}')">
            <strong>${p.nome}</strong> <span style="color:var(--cor-texto-suave);">${p.cpf}</span>
          </div>
        `).join('');
        lista.style.display = 'block';
      }, 300);
    });

    // Submit do formulário
    document.getElementById('form-nova-amostra').addEventListener('submit', async function (e) {
      e.preventDefault();
      const erroEl = document.getElementById('form-erro');
      const pacienteId = document.getElementById('paciente-id-selecionado').value;
      const examesSelecionados = [...document.querySelectorAll('input[name="exame"]:checked')].map(c => c.value);

      if (!pacienteId) {
        erroEl.textContent = 'Selecione um paciente.';
        erroEl.style.display = 'block';
        return;
      }
      if (!examesSelecionados.length) {
        erroEl.textContent = 'Selecione pelo menos um exame.';
        erroEl.style.display = 'block';
        return;
      }

      erroEl.style.display = 'none';
      document.getElementById('btn-salvar-text').style.display = 'none';
      document.getElementById('btn-salvar-loading').style.display = 'inline-block';
      document.getElementById('btn-salvar').disabled = true;

      try {
        const dados = {
          paciente_id: pacienteId,
          tipo_material_id: document.getElementById('tipo-material-id').value || null,
          coletador_id: document.getElementById('coletador-id').value || null,
          tecnico_id: document.getElementById('tecnico-id').value || null,
          responsavel_tecnico_id: document.getElementById('responsavel-id').value || null,
          observacoes: document.getElementById('observacoes').value || null,
          exames: examesSelecionados
        };

        const res = await Amostras.criar(dados);

        if (res.sucesso) {
          toast('Solicitação criada com sucesso!', 'success');
          PageAmostras._amostraid = res.amostra.id;
          await PageAmostras.verDetalhe(res.amostra.id);
        } else {
          erroEl.textContent = res.mensagem || 'Erro ao criar solicitação.';
          erroEl.style.display = 'block';
        }
      } catch (err) {
        erroEl.textContent = 'Erro ao salvar. Tente novamente.';
        erroEl.style.display = 'block';
      } finally {
        document.getElementById('btn-salvar-text').style.display = 'inline';
        document.getElementById('btn-salvar-loading').style.display = 'none';
        document.getElementById('btn-salvar').disabled = false;
      }
    });
  },

  _selecionarPaciente(id, nome, cpf) {
    document.getElementById('paciente-id-selecionado').value = id;
    document.getElementById('busca-paciente').value = nome;
    document.getElementById('lista-pacientes').style.display = 'none';
    document.getElementById('paciente-selecionado').innerHTML = `
      ✓ <strong>${nome}</strong> — CPF: ${cpf}
      <button type="button" style="margin-left:12px;background:none;border:none;color:var(--cor-primaria);cursor:pointer;font-size:12px;" 
              onclick="PageAmostras._limparPaciente()">Trocar</button>
    `;
    document.getElementById('paciente-selecionado').style.display = 'block';
  },

  _limparPaciente() {
    document.getElementById('paciente-id-selecionado').value = '';
    document.getElementById('busca-paciente').value = '';
    document.getElementById('paciente-selecionado').style.display = 'none';
  }
};

// Sobrescreve verDetalhe para salvar o ID globalmente
const _originalVerDetalhe = PageAmostras.verDetalhe.bind(PageAmostras);
PageAmostras.verDetalhe = async function(id) {
  PageAmostras._amostraid = id;
  return _originalVerDetalhe(id);
};