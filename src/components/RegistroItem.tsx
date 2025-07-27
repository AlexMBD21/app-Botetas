// ...existing code...
import React from 'react';
import { RegistroRifa } from '../types';

interface RegistroItemProps {
  registro: RegistroRifa;
  getTiempoRestante: (timeoutEnd: number) => string;
  calcularValorTotal: (cantidadNumeros: number) => string;
  confirmarPago?: (registroId: string, nombrePersona: string) => void;
  eliminarRegistro?: (registroId: string, nombrePersona: string) => void;
}

const RegistroItem: React.FC<RegistroItemProps> = ({
  registro,
  getTiempoRestante,
  calcularValorTotal,
  confirmarPago,
  eliminarRegistro
}) => (
  <div 
    style={{
      background: 'rgba(255, 255, 255, 0.1)',
      padding: '1rem',
      marginBottom: '1rem',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}
  >
    <div style={{ marginBottom: '0.5rem' }}>
      <strong style={{ color: '#fff' }}>{registro.name}</strong> - 
      <span style={{ color: '#ccc' }}> {registro.phone}</span>
    </div>
    <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <span style={{ color: '#fff' }}>Números: </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
          {registro.numbers.map(num => (
            <span 
              key={num}
              style={{
                background: registro.status === 'verified' ? '#28a745' : '#ffc107',
                color: registro.status === 'verified' ? 'white' : '#000',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              {num.toString().padStart(4, '0')}
            </span>
          ))}
        </div>
      </div>
      <div style={{
        background: 'rgba(0, 123, 255, 0.1)',
        border: '1px solid #007bff',
        borderRadius: '6px',
        padding: '0.3rem 0.7rem',
        textAlign: 'center',
        minWidth: '80px',
        marginLeft: '1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px'
      }}>
        <div style={{ fontSize: '1.1em', color: '#495057', marginBottom: '0.5rem', fontWeight: 'bold' }}>💰 Valor a pagar</div>
        <div style={{ fontSize: '1em', color: '#495057', marginBottom: '0.3rem' }}>Total a pagar:</div>
        <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#007bff', marginBottom: '0.3rem' }}>$ {calcularValorTotal(registro.numbers.length)}</div>
        <div style={{ fontSize: '1em', color: '#6c757d', marginTop: '0.3rem' }}>{registro.numbers.length} número{registro.numbers.length > 1 ? 's' : ''}</div>
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'flex-end',
        width: '220px',
        justifyContent: registro.status === 'pending' ? 'flex-start' : 'flex-end'
      }}>
        {/* Temporizador */}
        {registro.status === 'pending' && (
          <div style={{
            background: 'rgba(255, 193, 7, 0.15)',
            border: '2px solid #ffc107',
            borderRadius: '6px',
            padding: '0.4rem 0.8rem',
            textAlign: 'center',
            width: '105px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            whiteSpace: 'nowrap'
          }}>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 'bold',
              color: '#853e04ff',
            }}>
              ⏰ {getTiempoRestante(registro.timeoutEnd)}
            </span>
          </div>
        )}
        {/* Botón Confirmar Pago */}
        {registro.status === 'pending' && confirmarPago && (
          <button
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
              minWidth: '110px',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Confirmar Pago
          </button>
        )}
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
              minWidth: '90px',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
    </div>
  </div>
);

export default RegistroItem;
