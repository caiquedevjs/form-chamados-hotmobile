// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'
import ThemeProviderContext from './contexts/ThemeProviderContext';
import ToggleThemeButton from './components/ToggleThemeButton';
import MultilineTextFields from './components/form.component';
import NotificationProvider from './components/NotificationProvider';
import LogoHeader from './components/LogoHeader';
import KanbanBoardView from './components/KanbanBoard';
import DashboardView from './components/DashboardView';
import LoginView from './components/LoginView'; 
import PrivateRoute from './components/PrivateRoute'; 
import ClientTracking from './components/ClientTracking'; 

export default function App() {
  return (
    <ThemeProviderContext>
      <AuthProvider>
        
        {/* REMOVIDA A DIV RESTRITIVA GIGANTE */}
        {/* Agora usamos um container limpo que ocupa a tela sem forçar alinhamento */}
        <div style={{ minHeight: '100vh', position: 'relative' }}>
          
          <NotificationProvider />

          {/* 🔺 Logo fixada (Pode ajustar para não sobrepor em mobile se quiser) */}
          <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
             <LogoHeader />
          </div>

          {/* 🔘 Botão modo escuro */}
          <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
            <ToggleThemeButton />
          </div>

          <BrowserRouter>
            <Routes>
                  {/* --- ROTA 1: FORMULÁRIO (Precisa ser centralizado) --- */}
                  <Route 
                    path="/" 
                    element={
                      <div style={{ 
                        minHeight: '100vh', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        padding: '20px' // Espaço para não colar na borda no mobile
                      }}>
                        <MultilineTextFields />
                      </div>
                    } 
                  />
                  
                  {/* --- ROTA 2: LOGIN (Também centralizado) --- */}
                  <Route 
                    path="/login" 
                    element={
                      <div style={{ 
                        minHeight: '100vh', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center' 
                      }}>
                        <LoginView />
                      </div>
                    } 
                  />
                  
                  {/* --- ROTA 3: CLIENTE (Já tem layout próprio responsivo) --- */}
                  <Route 
                    path="/acompanhamento/:id" 
                    element={<ClientTracking />} 
                  />

                  {/* --- ROTAS PRIVADAS (ADMIN) --- */}
                  <Route 
                    path="/admin" 
                    element={
                      <PrivateRoute>
                        <KanbanBoardView />
                      </PrivateRoute>
                    } 
                  />
                  
                  <Route 
                    path="/dashboard" 
                    element={
                      <PrivateRoute>
                        <DashboardView />
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