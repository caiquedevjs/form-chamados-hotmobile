import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

export default function PrivateRoute({ children }) {
  const { signed, loading } = useAuth();

  if (loading) {
    return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  }

  // Se não estiver logado, redireciona para Login
  if (!signed) {
    return <Navigate to="/login" />;
  }

  // Se logado, mostra a página (Kanban ou Dashboard)
  return children;
}