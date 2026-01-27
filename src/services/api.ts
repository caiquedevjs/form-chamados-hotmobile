import axios from 'axios';

const api = axios.create({
  baseURL: 'https://form-chamados-hotmobile-production.up.railway.app',
});

// 1. Interceptor de REQUISIÇÃO (Você já tem)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. ✅ NOVO: Interceptor de RESPOSTA (Captura o token expirado)
api.interceptors.response.use(
  (response) => {
    // Se a resposta for sucesso, apenas retorna ela
    return response;
  },
  (error) => {
    // Se o servidor retornar 401, significa que o token expirou ou é inválido
    if (error.response && error.response.status === 401) {
      
      // Limpa os dados mortos do navegador
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redireciona para o login na força bruta
      // (Como estamos fora de um componente React, usamos window.location)
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;