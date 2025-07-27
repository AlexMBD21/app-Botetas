
import React, { useEffect, useState } from 'react';
import { RegistroRifa } from '../types';

interface RegistroVisualItemProps {
  registro: RegistroRifa;
  isMobile: boolean;
  formatearTiempo: (timestamp: number) => string;
  getTiempoRestante: (timeoutEnd: number) => string;
  calcularValorTotal: (cantidadNumeros: number) => string;
  confirmarPago?: (registroId: string, nombrePersona: string) => void;
  eliminarRegistro?: (registroId: string, nombrePersona: string) => void;
}

const RegistroVisualItem: React.FC<RegistroVisualItemProps> = ({
  registro,
  isMobile,
  formatearTiempo,
  getTiempoRestante,
  calcularValorTotal,
  confirmarPago,
  eliminarRegistro
}) => {
  const [tiempoRestante, setTiempoRestante] = useState(getTiempoRestante(registro.timeoutEnd));

  useEffect(() => {
    if (registro.status !== 'pending') return;
    const interval = setInterval(() => {
      setTiempoRestante(getTiempoRestante(registro.timeoutEnd));
    }, 1000);
    return () => clearInterval(interval);
  }, [registro.status, registro.timeoutEnd, getTiempoRestante]);

  return (
    <div 
      className={`registro-item ${registro.status}`}
      style={{
        background: registro.status === 'pending' 
          ? 'linear-gradient(135deg, #fff3cd, #ffeaa7)' 
          : 'linear-gradient(135deg, #d4edda, #c3e6cb)',
        border: `2px solid ${registro.status === 'pending' ? '#ffc107' : '#28a745'}`,
        borderRadius: '10px',
        padding: '0.5rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        maxWidth: '95%',
        width: '95%',
        margin: '0 auto',
        cursor: 'default',
      }}
    >
    {/* Badge de estado - responsive */}
    <div 
      style={{
        position: 'absolute',
        top: '0.2rem',
        right: '0.2rem',
        background: registro.status === 'pending' ? '#ffc107' : '#28a745',
        color: 'white',
        padding: '0.2rem 0.4rem',
        borderRadius: '6px',
        fontSize: '0.6rem',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        zIndex: 10,
        maxWidth: '85px',
        textAlign: 'center'
      }}
    >
      {registro.status === 'pending' ? ' Pendiente' : ' Confirmado'}
    </div>

    {/* Información del usuario con valor a pagar en la esquina */}
    <div style={{ 
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginTop: '0.4rem',
      marginBottom: '0.3rem',
      marginRight: '6rem'
    }}>
      {/* Datos del usuario */}
      <div>
        <div style={{ 
          fontSize: '0.85rem', 
          fontWeight: 'bold', 
          color: '#2c3e50',
          marginBottom: '0.1rem',
          wordBreak: 'break-word'
        }}>
          👤 {registro.name}
        </div>
        <div style={{ 
          fontSize: '0.7rem', 
          color: '#6c757d',
          marginBottom: '0.1rem',
          wordBreak: 'break-all'
        }}>
          📞 {registro.phone}
        </div>
        <div style={{ 
          fontSize: '0.65rem', 
          color: '#495057',
          wordBreak: 'break-word'
        }}>
          📅 {formatearTiempo(registro.timestamp)}
        </div>
      </div>

      {/* Valor a pagar en la esquina superior derecha */}
      <div style={{ 
        background: 'rgba(0, 123, 255, 0.1)',
        border: '1px solid #007bff',
        borderRadius: '6px',
        padding: '0.4rem',
        textAlign: 'center',
        minWidth: '80px',
        flexShrink: 0
      }}>
        <div style={{ 
          fontSize: '0.6rem', 
          color: '#495057',
          marginBottom: '0.1rem'
        }}>
          💰 Valor a pagar
        </div>
        <div style={{ 
          fontSize: '0.9rem', 
          fontWeight: 'bold',
          color: '#007bff'
        }}>
          {calcularValorTotal(registro.numbers.length)}
        </div>
        <div style={{ 
          fontSize: '0.6rem', 
          color: '#6c757d',
          marginTop: '0.1rem'
        }}>
          {registro.numbers.length} número{registro.numbers.length > 1 ? 's' : ''}
        </div>
      </div>
    </div>

    {/* Números seleccionados - Responsive grid */}
    <div style={{ marginBottom: '0.3rem' }}>
      <div style={{ 
        fontSize: '0.65rem', 
        color: '#495057', 
        marginBottom: '0.15rem',
        fontWeight: '500'
      }}>
        🎯 Números seleccionados:
      </div>
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(32px, 1fr))',
        gap: '0.1rem',
        maxHeight: 'none',
        overflowY: 'visible'
      }}>
        {registro.numbers.map((n: number) => (
          <span 
            key={n}
            style={{
              background: registro.status === 'pending' ? '#fff' : '#f8f9fa',
              border: `1px solid ${registro.status === 'pending' ? '#ffc107' : '#28a745'}`,
              color: registro.status === 'pending' ? '#856404' : '#155724',
              padding: '0.15rem 0.05rem',
              borderRadius: '2px',
              fontSize: '0.6rem',
              fontWeight: 'bold',
              textAlign: 'center',
              minWidth: '30px'
            }}
          >
            {n.toString().padStart(4, '0')}
          </span>
        ))}
      </div>
    </div>

    {/* Temporizador y botones de acción - Alineados en misma línea base */}
    <div style={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row',
      gap: '0.5rem',
      justifyContent: 'center',
      alignItems: isMobile ? 'stretch' : 'flex-end',
      marginTop: '0.2rem',
      minHeight: '40px'
    }}>
      {/* Contenedor para temporizador y confirmar pago - con ancho fijo */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '0.5rem',
        alignItems: isMobile ? 'stretch' : 'flex-end',
        width: isMobile ? '100%' : '220px',
        justifyContent: registro.status === 'pending' ? 'flex-start' : 'flex-end'
      }}>
        {/* Temporizador para registros pendientes */}
        {registro.status === 'pending' && (
          <div 
            className="temporizador"
            style={{
              background: 'rgba(255, 193, 7, 0.15)',
              border: '2px solid #ffc107',
              borderRadius: '6px',
              padding: '0.4rem 0.8rem',
              textAlign: 'center',
              width: isMobile ? '100%' : '105px',
              marginBottom: isMobile ? '0.25rem' : '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 'bold',
              color: '#853e04ff',
            }}>
              ⏰ {tiempoRestante}
            </div>
          </div>
        )}

        {/* Botón Confirmar Pago */}
        {registro.status === 'pending' && confirmarPago && (
          <button 
            className="btn-verificar"
            onClick={() => confirmarPago(registro.id!, registro.name)}
            style={{
              background: 'linear-gradient(135deg, #28a745, #20c997)',
              color: 'white',
              border: 'none',
              padding: '0.5rem 0.9rem',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.75rem',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(40, 167, 69, 0.3)',
              width: isMobile ? '100%' : 'auto',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '110px'
            }}
          >
             Confirmar Pago
          </button>
        )}
      </div>

      {/* Botón Eliminar */}
      {eliminarRegistro && (
        <button 
          onClick={() => eliminarRegistro(registro.id!, registro.name)}
          style={{
            background: 'linear-gradient(135deg, #dc3545, #c82333)',
            color: 'white',
            border: 'none',
            padding: '0.5rem 0.9rem',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.75rem',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)',
            width: isMobile ? '100%' : 'auto',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '90px'
          }}
        >
           Eliminar
        </button>
      )}
    </div>
  </div>
  );
}

export default RegistroVisualItem;
