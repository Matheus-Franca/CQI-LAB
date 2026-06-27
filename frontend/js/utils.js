/**
 * CQI-LAB — Funções Utilitárias
 */

// Labels de status para exibição
const STATUS_LABELS = {
  aguardando_coleta: 'Aguardando Coleta',
  coletada: 'Coletada',
  em_andamento: 'Em Andamento',
  finalizado: 'Finalizado',
  recoleta_solicitada: 'Recoleta Solicitada'
};

// Labels de perfis
const PERFIL_LABELS = {
  admin: 'Administrador',
  secretaria: 'Secretária',
  coletador: 'Coletador',
  tecnico: 'Técnico de Lab.',
  responsavel_tecnico: 'Resp. Técnico'
};

/**
 * Gera HTML de badge de status
 */
function badgeStatus(status) {
  const label = STATUS_LABELS[status] || status;
  return `<span class="badge badge-${status} badge-pulse">${label}</span>`;
}

/**
 * Gera HTML de badge de perfil
 */
function badgePerfil(perfil) {
  const label = PERFIL_LABELS[perfil] || perfil;
  return `<span class="badge badge-${perfil}">${label}</span>`;
}

/**
 * Formata data para exibição (dd/mm/aaaa)
 */
function formatarData(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('pt-BR');
}

/**
 * Formata data e hora
 */
function formatarDataHora(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * Exibe uma notificação Toast na tela
 * @param {string} mensagem - Texto da notificação
 * @param {'success'|'error'|'warning'|'info'} tipo - Tipo da notificação
 */
function toast(mensagem, tipo = 'success') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${tipo}`;

  const icon = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }[tipo] || '✓';

  el.innerHTML = `<span>${icon}</span><span>${mensagem}</span>`;
  container.appendChild(el);

  // Remove automaticamente após 4 segundos
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(80px)';
    el.style.transition = 'all 300ms ease';
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

/**
 * Abre o modal global com título e conteúdo HTML
 */
function abrirModal(titulo, htmlCorpo, largura = '620px') {
  document.getElementById('modal-title').textContent = titulo;
  document.getElementById('modal-body').innerHTML = htmlCorpo;
  document.getElementById('modal').style.maxWidth = largura;
  document.getElementById('modal-overlay').style.display = 'flex';
}

/**
 * Fecha o modal global
 */
function fecharModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.getElementById('modal-body').innerHTML = '';
}

/**
 * Fecha modal ao clicar fora (no overlay)
 */
document.getElementById('modal-overlay').addEventListener('click', function (e) {
  if (e.target === this) fecharModal();
});

/**
 * Gera cor da dot do timeline pelo status
 */
function corDotStatus(status) {
  const cores = {
    aguardando_coleta: '#6B7280',
    coletada: '#8B5CF6',
    em_andamento: '#3B82F6',
    finalizado: '#10B981',
    recoleta_solicitada: '#EF4444'
  };
  return cores[status] || '#6B7280';
}

/**
 * Toggle da senha no campo de login
 */
function toggleSenha() {
  const input = document.getElementById('login-senha');
  input.type = input.type === 'password' ? 'text' : 'password';
}

/**
 * Toggle da sidebar no mobile
 */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
}

/**
 * Inicializa as iniciais do nome do avatar
 */
function iniciais(nome) {
  if (!nome) return '?';
  return nome.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

/**
 * Renderiza paginação padrão
 */
function renderizarPaginacao(containerId, paginacao, onMudar) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const { total, pagina, totalPaginas } = paginacao;
  el.innerHTML = `
    <span>Mostrando ${Math.min((pagina - 1) * paginacao.limite + 1, total)}–${Math.min(pagina * paginacao.limite, total)} de ${total} registro(s)</span>
    <div class="pagination-btns">
      <button onclick="${onMudar}(${pagina - 1})" ${pagina <= 1 ? 'disabled' : ''}>← Anterior</button>
      ${Array.from({ length: totalPaginas }, (_, i) => i + 1).slice(Math.max(0, pagina - 3), pagina + 2).map(p => `
        <button onclick="${onMudar}(${p})" class="${p === pagina ? 'active' : ''}">${p}</button>
      `).join('')}
      <button onclick="${onMudar}(${pagina + 1})" ${pagina >= totalPaginas ? 'disabled' : ''}>Próxima →</button>
    </div>
  `;
}

/**
 * Máscara de CPF: 000.000.000-00
 */
function mascaraCPF(input) {
  input.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    v = v.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
    this.value = v;
  });
}