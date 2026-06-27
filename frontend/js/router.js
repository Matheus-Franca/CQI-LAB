/**
 * CQI-LAB — Roteador SPA Simples
 * Controla qual página é exibida no conteúdo principal
 */

// Página atual
let paginaAtual = null;

// Mapa de rotas: id → { titulo, fn de renderização }
const ROTAS = {
  dashboard:  { titulo: 'Dashboard',           fn: () => PageDashboard.render()   },
  amostras:   { titulo: 'Amostras',            fn: () => PageAmostras.render()    },
  nova_amostra: { titulo: 'Nova Solicitação',  fn: () => PageAmostras.renderNova() },
  consulta:   { titulo: 'Consulta / Pesquisa', fn: () => PageConsulta.render()    },
  pacientes:  { titulo: 'Pacientes',           fn: () => PagePacientes.render()   },
  usuarios:   { titulo: 'Usuários',            fn: () => PageUsuarios.render()    },
  catalogo:   { titulo: 'Catálogo',            fn: () => PageCatalogo.render()    },
  relatorios: { titulo: 'Relatórios',          fn: () => PageRelatorios.render()  },
  contato_admin: { titulo: 'Mensagens de Contato', fn: () => PageContatoAdmin.render() },
};

/**
 * Navega para uma rota
 */
function navegar(rota) {
  if (!ROTAS[rota]) {
    console.warn('Rota não encontrada:', rota);
    rota = 'dashboard';
  }

  paginaAtual = rota;

  // Atualiza o header
  document.getElementById('header-title').textContent = ROTAS[rota].titulo;

  // Marca o item ativo na sidebar
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.rota === rota);
  });

  // Fecha sidebar no mobile
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.remove('open');
  overlay.classList.remove('open');

  // Renderiza o conteúdo da página
  const content = document.getElementById('app-content');
  content.innerHTML = `
    <div class="empty-state">
      <div class="spinner spinner-dark" style="width:32px;height:32px;margin:0 auto 16px;"></div>
      <p>Carregando...</p>
    </div>
  `;

  // Pequeno delay para animação de carregamento
  setTimeout(() => {
    ROTAS[rota].fn();
  }, 80);
}

/**
 * Monta o menu lateral conforme o perfil do usuário
 */
function montarSidebar(usuario) {
  const perfil = usuario.perfil;
  const nav = document.getElementById('sidebar-nav');

  // Define os itens de menu por perfil
  const menus = [];

  menus.push({
    rota: 'dashboard', label: 'Dashboard',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
  });

  // Amostras
  menus.push({
    rota: 'amostras', label: 'Amostras',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/><polyline points="14,2 14,8 20,8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="11" y2="11"/></svg>`
  });

  // Nova solicitação (secretária e admin)
  if (['admin', 'secretaria'].includes(perfil)) {
    menus.push({
      rota: 'nova_amostra', label: 'Nova Solicitação',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`
    });
  }

  // Consulta
  menus.push({
    rota: 'consulta', label: 'Consulta',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`
  });

  // Pacientes (secretária e admin)
  if (['admin', 'secretaria'].includes(perfil)) {
    menus.push({
      rota: 'pacientes', label: 'Pacientes',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`
    });
  }

  // Admin-only
  if (perfil === 'admin') {
    menus.push(
      {
        rota: 'usuarios', label: 'Usuários',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
      },
      {
        rota: 'catalogo', label: 'Catálogo',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`
      },
      {
        rota: 'relatorios', label: 'Relatórios',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`
      },
      {
        rota: 'contato_admin', label: 'Mensagens',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`
      }
    );
  }

  // Renderiza os itens
  nav.innerHTML = menus.map(item => `
    <div class="nav-item" data-rota="${item.rota}" onclick="navegar('${item.rota}')">
      ${item.icon}
      <span>${item.label}</span>
      ${item.rota === 'amostras' ? '<span id="nav-badge-alerta" class="nav-badge" style="display:none;">0</span>' : ''}
    </div>
  `).join('');
}