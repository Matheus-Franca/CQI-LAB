/**
 * CQI-LAB — Módulo de API
 * Funções para comunicação com o backend (REST API)
 */

const API_BASE = '/api';

/**
 * Faz uma requisição autenticada para a API
 * @param {string} endpoint - Caminho da API (ex: '/amostras')
 * @param {Object} options - Opções do fetch (method, body, etc.)
 * @returns {Promise<Object>} Dados da resposta
 */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('cqilab_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  // Token expirado — redireciona para login
  if (response.status === 401) {
    localStorage.removeItem('cqilab_token');
    localStorage.removeItem('cqilab_usuario');
    window.location.reload();
    return;
  }

  const data = await response.json();
  return { ok: response.ok, status: response.status, ...data };
}

// =============================================
// AUTH
// =============================================
const Auth = {
  login: (email, senha) => apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha })
  }),
  me: () => apiFetch('/auth/me'),
  alertas: () => apiFetch('/auth/alertas')
};

// =============================================
// USUÁRIOS
// =============================================
const Usuarios = {
  listar: (params = {}) => apiFetch('/usuarios?' + new URLSearchParams(params)),
  buscar: (id) => apiFetch(`/usuarios/${id}`),
  criar: (dados) => apiFetch('/usuarios', { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (id, dados) => apiFetch(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(dados) })
};

// =============================================
// PACIENTES
// =============================================
const Pacientes = {
  listar: (params = {}) => apiFetch('/pacientes?' + new URLSearchParams(params)),
  buscar: (id) => apiFetch(`/pacientes/${id}`),
  criar: (dados) => apiFetch('/pacientes', { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (id, dados) => apiFetch(`/pacientes/${id}`, { method: 'PUT', body: JSON.stringify(dados) })
};

// =============================================
// AMOSTRAS
// =============================================
const Amostras = {
  listar: (params = {}) => apiFetch('/amostras?' + new URLSearchParams(params)),
  buscar: (id) => apiFetch(`/amostras/${id}`),
  criar: (dados) => apiFetch('/amostras', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarStatus: (id, dados) => apiFetch(`/amostras/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(dados)
  })
};

// =============================================
// CATÁLOGO (Materiais e Exames)
// =============================================
const Catalogo = {
  listarMateriais: (params = {}) => apiFetch('/catalogo/materiais?' + new URLSearchParams(params)),
  criarMaterial: (dados) => apiFetch('/catalogo/materiais', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarMaterial: (id, dados) => apiFetch(`/catalogo/materiais/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerMaterial: (id) => apiFetch(`/catalogo/materiais/${id}`, { method: 'DELETE' }),

  listarExames: (params = {}) => apiFetch('/catalogo/exames?' + new URLSearchParams(params)),
  criarExame: (dados) => apiFetch('/catalogo/exames', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarExame: (id, dados) => apiFetch(`/catalogo/exames/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerExame: (id) => apiFetch(`/catalogo/exames/${id}`, { method: 'DELETE' })
};

// =============================================
// RELATÓRIOS
// =============================================
const Relatorios = {
  dadosGerencial: (params = {}) => apiFetch('/relatorios/gerencial?' + new URLSearchParams(params)),
  baixarPDF: (params = {}) => {
    const token = localStorage.getItem('cqilab_token');
    const url = `${API_BASE}/relatorios/gerencial/pdf?${new URLSearchParams(params)}`;
    // Abre em nova aba com o token no header via formulário
    const form = document.createElement('form');
    form.method = 'GET';
    form.action = url;
    form.target = '_blank';
    document.body.appendChild(form);
    // Cria link autenticado
    const link = document.createElement('a');
    link.href = url + `&_token=${token}`;
    link.target = '_blank';
    link.click();
    document.body.removeChild(form);
  }
};

// =============================================
// CONTATO
// =============================================
const Contato = {
  enviar: (dados) => apiFetch('/contato', { method: 'POST', body: JSON.stringify(dados) }),
  listar: () => apiFetch('/contato'),
  marcarLida: (id) => apiFetch(`/contato/${id}/lida`, { method: 'PATCH' })
};