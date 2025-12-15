// src/App.jsx
import React from 'react';
// 1. ADICIONEI OS IMPORTS QUE FALTAVAM AQUI:
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'
import ThemeProviderContext from './contexts/ThemeProviderContext';
import ToggleThemeButton from './components/ToggleThemeButton';
import MultilineTextFields from './components/form.component';
import NotificationProvider from './components/NotificationProvider';
import LogoHeader from './components/LogoHeader';
import Footer from './components/Footer';
import KanbanBoardView from './components/KanbanBoard';
import DashboardView from './components/DashboardView';
import LoginView from './components/LoginView'; // Tela de Login
import PrivateRoute from './components/PrivateRoute'; // Proteção de Rota

// 2. CORRIGI O CAMINHO (agora busca dentro de components):
import ClientTracking from './components/ClientTracking'; 

export default function App() {
  return (
    <ThemeProviderContext>
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
          overflow: 'scroll', // 🔒 bloqueia scroll externo
          backgroundColor: 'inherit',
          
        }}
      >
        <NotificationProvider />

        {/* 🔺 Logo fixada no topo esquerdo */}
        <LogoHeader />

        {/* 🔘 Botão modo escuro no topo direito */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 999,
          }}
        >
          <ToggleThemeButton />
        </div>

        {/* Roteamento */}
        <BrowserRouter>
          {/* Se você tiver um menu de navegação, ele deve ficar aqui dentro */}
          
          <Routes>
                  {/* --- ROTAS PÚBLICAS --- */}
                  
                  {/* Formulário Inicial (Centralizado por padrão) */}
                  <Route path="/" element={<MultilineTextFields />} />
                  
                  {/* Login */}
                  <Route path="/login" element={<LoginView />} />
                  
                  {/* Acompanhamento (Cliente) - Precisa de largura total */}
                  <Route 
                    path="/acompanhamento/:id" 
                    element={<div style={{ width: '100%' }}><ClientTracking /></div>} 
                  />

                  {/* --- ROTAS PRIVADAS (ADMIN) --- */}
                  
                  {/* Kanban */}
                  <Route 
                    path="/admin" 
                    element={
                      <PrivateRoute>
                        <div style={{ width: '100%' }}><KanbanBoardView /></div>
                      </PrivateRoute>
                    } 
                  />
                  
                  {/* Dashboard */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <PrivateRoute>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}><DashboardView /></div>
                      </PrivateRoute>
                    } 
                  />
                </Routes>
        </BrowserRouter>
        
      </div>
      </AuthProvider>
    </ThemeProviderContext>
  );
}