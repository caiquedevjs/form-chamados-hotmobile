import axios from 'axios';

const api = axios.create({
  // Se existir a variável de ambiente, usa ela. Senão, usa localhost.
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// ... resto do arquivo (interceptors) igual