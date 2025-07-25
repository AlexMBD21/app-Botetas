'use client';

import React from 'react';

interface HeaderProps {
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  setConnectionStatus?: (status: 'connecting' | 'connected' | 'disconnected') => void;
}

export default function Header({ connectionStatus }: HeaderProps) {
  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Conectando...';
      case 'connected':
        return 'Conectado';
      case 'disconnected':
        return 'Desconectado';
      default:
        return 'Conectando...';
    }
  };

  return (
    <header>
      <h1>El Compa Herna 🎁</h1>
      <div className="connection-indicator" id="connectionIndicator">
        <div className={`connection-light ${connectionStatus}`} id="connectionLight"></div>
        <span className="connection-text" id="connectionText">{getConnectionText()}</span>
      </div>
    </header>
  );
}
