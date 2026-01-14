// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'; // 👈 Importe o Outlet
import { AuthProvider } from './contexts/AuthContext'
import ThemeProviderContext from './contexts/ThemeProviderContext';
import MultilineTextFields from './components/form.component';
import NotificationProvider from './components/NotificationProvider';
import LogoHeader from './components/LogoHeader';
import KanbanBoardView from './components/KanbanBoard';
import DashboardView from './components/DashboardView';
import LoginView from './components/LoginView'; 
import PrivateRoute from './components/PrivateRoute'; 
import ClientTracking from './components/ClientTracking'; 
import RegisterForm from './components/RegisterForm'; 

// ✅ 1. Criamos um componente de Layout para o Admin
// Ele envolve as rotas filhas com o ThemeProvider
const AdminLayout = () => {
  return (
    <ThemeProviderContext>
      <Outlet /> {/* O Outlet renderiza a rota filha (Kanban ou Dashboard) */}
    </ThemeProviderContext>
  );
};

export default function App() {
  return (
      <AuthProvider>
      <div
        style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden', // Mudei para hidden para evitar scroll duplo com o Kanban
          backgroundColor: 'inherit',
        }}
      >
        <NotificationProvider />

        {/* 🔺 Logo fixada no topo esquerdo */}
        <LogoHeader />

        {/* Roteamento */}
        <BrowserRouter>
          <Routes>
              {/* --- ROTAS PÚBLICAS (Sem Tema Dark) --- */}
              
              <Route path="/" element={<MultilineTextFields />} />
              <Route path="/login" element={<LoginView />} />
              <Route path="/register" element={<RegisterForm />} /> 
              
              <Route 
                path="/acompanhamento/:id" 
                element={<div style={{ width: '100%', height: '100%' }}><ClientTracking /></div>} 
              />

              {/* --- ROTAS PRIVADAS (COM TEMA DARK) --- */}
              {/* ✅ 2. Usamos o AdminLayout para envolver as rotas protegidas */}
              <Route element={<AdminLayout />}>
                  
                  <Route 
                    path="/admin" 
                    element={
                      <PrivateRoute>
                        <div style={{ width: '100%' }}><KanbanBoardView /></div>
                      </PrivateRoute>
                    } 
                  />
                  
                  <Route 
                    path="/dashboard" 
                    element={
                      <PrivateRoute>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}><DashboardView /></div>
                      </PrivateRoute>
                    } 
                  />

              </Route>
          </Routes>
        </BrowserRouter>
        
      </div>
      </AuthProvider>
  );
}