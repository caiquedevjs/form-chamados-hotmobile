// App.jsx
import React from 'react';
import ThemeProviderContext from './contexts/ThemeProviderContext';
import ToggleThemeButton from './components/ToggleThemeButton';
import MultilineTextFields from './components/form.component';
import NotificationProvider from './components/NotificationProvider';
import LogoHeader from './components/LogoHeader';
import Footer from './components/Footer';
import KanbanBoardView from './components/KanbanBoard';

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

        {/* 📝 Formulário centralizado */}
        {/*  <MultilineTextFields />  */}
        <KanbanBoardView/> 
        
      </div>
      <Footer />
    </ThemeProviderContext>
  );
}
