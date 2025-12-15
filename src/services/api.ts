import axios from 'axios';

const api = axios.create({
  baseURL: 'https://form-chamados-hotmobile.onrender.com', // Sua URL do Backend
});

// Interceptor: Antes de cada requisição, ele roda isso
api.interceptors.request.use((config) => {
  // Pega o token do armazenamento local
  const token = localStorage.getItem('token');
  
  if (token) {
    // Se tiver token, coloca no cabeçalho: Authorization: Bearer <token>
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export default api;