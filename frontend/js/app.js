/**
 * CQI-LAB — Inicializador da Aplicação
 * Verifica autenticação e inicializa o app
 */

/**
 * Inicia o app após o login bem-sucedido
 */
async function iniciarApp() {
  const usuario = getUsuario();
  if (!usuario) {
    mostrarLogin();
    return;
  }

  // Mostra o shell do app, oculta o login
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-shell').style.display = 'flex';

  // Preenche dados do usuário na sidebar
  document.getElementById('sidebar-avatar').textContent = iniciais(usuario.nome);
  document.getElementById('sidebar-user-nome').textContent = usuario.nome;
  document.getElementById('sidebar-user-perfil').innerHTML = badgePerfil(usuario.perfil);

  // Monta menu conforme perfil
  montarSidebar(usuario);

  // Busca alertas (recoletas) para coletador e admin
  await atualizarAlertas();

  // Inicia polling de alertas a cada 30 segundos
  setInterval(atualizarAlertas, 30000);

  // Navega para o dashboard
  navegar('dashboard');
}

/**
 * Atualiza a contagem de alertas de recoleta
 */
async function atualizarAlertas() {
  try {
    const res = await Auth.alertas();
    if (res && res.sucesso) {
      const count = res.alertas;
      const badge = document.getElementById('nav-badge-alerta');
      const badgeHeader = document.getElementById('alerta-count');
      const wrapper = document.getElementById('alerta-badge-wrapper');

      if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      }
      if (badgeHeader) {
        badgeHeader.textContent = count;
      }
      if (wrapper) {
        wrapper.style.display = count > 0 ? 'flex' : 'none';
      }
    }
  } catch (e) {
    // Silencioso — não interrompe o fluxo
  }
}

/**
 * Exibe a tela de login
 */
function mostrarLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-shell').style.display = 'none';
}

/**
 * Inicialização ao carregar a página
 * Verifica se há uma sessão ativa
 */
(async function () {
  const token = localStorage.getItem('cqilab_token');
  const usuario = getUsuario();

  if (token && usuario) {
    // Valida o token com o servidor
    try {
      const res = await Auth.me();
      if (res && res.sucesso) {
        iniciarApp();
      } else {
        mostrarLogin();
      }
    } catch {
      mostrarLogin();
    }
  } else {
    mostrarLogin();
  }
})();