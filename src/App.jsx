// src/App.jsx
import React from 'react';
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
import LoginView from './components/LoginView'; 
import PrivateRoute from './components/PrivateRoute'; 
import ClientTracking from './components/ClientTracking'; 

// 👇 1. IMPORT NOVO (Certifique-se que o arquivo está na pasta components)
import RegisterForm from './components/RegisterForm'; // <--- AQUI

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
          overflow: 'scroll', 
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
          {/* <ToggleThemeButton /> Se quiser ativar o botão */}
        </div>

        {/* Roteamento */}
        <BrowserRouter>
          
          <Routes>
                  {/* --- ROTAS PÚBLICAS --- */}
                  
                  {/* Formulário Inicial (Abertura de Chamado) */}
                  <Route path="/" element={<MultilineTextFields />} />
                  
                  {/* Login */}
                  <Route path="/login" element={<LoginView />} />

                  {/* 👇 2. NOVA ROTA DE CADASTRO */}
                  <Route path="/register" element={<RegisterForm />} /> 
                  
                  {/* Acompanhamento (Cliente) */}
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