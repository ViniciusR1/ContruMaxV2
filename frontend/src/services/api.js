// Em produção (Netlify): usa VITE_API_URL = https://contrumaxv2.onrender.com
// Em desenvolvimento (local): usa proxy do Vite via '/api'
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

export const api = {
  // Products
  getProducts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/products${q ? '?' + q : ''}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (body) => request('/products', { method: 'POST', body }),
  updateProduct: (id, body) => request(`/products/${id}`, { method: 'PUT', body }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  getCategorias: () => request('/products/categorias/lista'),

  // Movimentacoes
  getMovimentacoes: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/movimentacoes${q ? '?' + q : ''}`);
  },
  createMovimentacao: (body) => request('/movimentacoes', { method: 'POST', body }),
  getDashboard: () => request('/movimentacoes/dashboard/stats'),
};
