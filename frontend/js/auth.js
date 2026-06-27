/**
 * CQI-LAB — Módulo de Autenticação do Frontend
 * Gerencia login, logout e estado do usuário logado
 */

/**
 * Retorna o usuário logado do localStorage (ou null)
 */
function getUsuario() {
  try {
    return JSON.parse(localStorage.getItem('cqilab_usuario')) || null;
  } catch {
    return null;
  }
}

/**
 * Salva token e dados do usuário após o login
 */
function salvarSessao(token, usuario) {
  localStorage.setItem('cqilab_token', token);
  localStorage.setItem('cqilab_usuario', JSON.stringify(usuario));
}

/**
 * Remove a sessão e volta para o login
 */
function logout() {
  localStorage.removeItem('cqilab_token');
  localStorage.removeItem('cqilab_usuario');
  document.getElementById('app-shell').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
}

/**
 * Verifica se o usuário tem um dos perfis informados
 */
function temPerfil(...perfis) {
  const usuario = getUsuario();
  return usuario && perfis.includes(usuario.perfil);
}

/**
 * Inicializa o formulário de login
 */
document.getElementById('login-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;
  const btnText = document.getElementById('login-btn-text');
  const btnLoading = document.getElementById('login-btn-loading');
  const erroEl = document.getElementById('login-erro');
  const btn = document.getElementById('login-btn');

  // UI de carregamento
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline-block';
  btn.disabled = true;
  erroEl.style.display = 'none';

  try {
    const res = await Auth.login(email, senha);

    if (!res.sucesso) {
      erroEl.textContent = res.mensagem || 'Credenciais inválidas.';
      erroEl.style.display = 'block';
      return;
    }

    salvarSessao(res.token, res.usuario);
    iniciarApp();

  } catch (err) {
    erroEl.textContent = 'Não foi possível conectar ao servidor.';
    erroEl.style.display = 'block';
  } finally {
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
    btn.disabled = false;
  }
});