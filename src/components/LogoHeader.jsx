// components/LogoHeader.jsx
import React from 'react';

export default function LogoHeader() {
  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        zIndex: 999,
      }}
    >
      <img
        src="https://painel.hotmobile.com.br/arquivos/email/img_1_9703_20250722_114828.png"
        alt="Logo"
        style={{ height: '40px', objectFit: 'contain' }}
      />
    </div>
  );
}
