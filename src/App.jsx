// src/App.jsx
import React from 'react';
// 1. ADICIONEI OS IMPORTS QUE FALTAVAM AQUI:
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import ThemeProviderContext from './contexts/ThemeProviderContext';
import ToggleThemeButton from './components/ToggleThemeButton';
import MultilineTextFields from './components/form.component';
import NotificationProvider from './components/NotificationProvider';
import LogoHeader from './components/LogoHeader';
import Footer from './components/Footer';
import KanbanBoardView from './components/KanbanBoard';
import DashboardView from './components/DashboardView';

// 2. CORRIGI O CAMINHO (agora busca dentro de components):
import ClientTracking from './components/ClientTracking'; 

export default function App() {
  return (
    <ThemeProviderContext>
      <div
        style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden', // 🔒 bloqueia scroll externo
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
            {/* Rota Raiz: Formulário */}
            <Route path="/" element={<MultilineTextFields />} />
            
            {/* Rota Admin: Kanban */}
            <Route path="/admin" element={<KanbanBoardView />} />
            
            {/* Rota Cliente: Acompanhamento */}
            <Route path="/acompanhamento/:id" element={<ClientTracking />} />
            <Route path="/dashboard" element={<div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '5%', overflow: 'scroll' }}><DashboardView /></div>} />
          </Routes>
        </BrowserRouter>
        
      </div>
      
    </ThemeProviderContext>
  );
}