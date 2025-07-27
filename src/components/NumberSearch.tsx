'use client';

import React, { useState } from 'react';
import { eliminarRegistroFirebase, actualizarEstadoRegistro } from '../lib/realTime';
import { RegistroRifa, ResultadoBusqueda } from '../types';

interface NumberSearchProps {
  numeroBuscado: string;
  setNumeroBuscado: (numero: string) => void;
  resultadoBusqueda: ResultadoBusqueda | null;
  setResultadoBusqueda: (resultado: ResultadoBusqueda | null) => void;
  registros: RegistroRifa[];
  setRegistros: (registros: RegistroRifa[]) => void;
  updateNumberStatus: (registros: RegistroRifa[]) => void;
}

export default function NumberSearch({
  numeroBuscado,
  setNumeroBuscado,
  resultadoBusqueda,
  setResultadoBusqueda,
  registros,
  setRegistros,
  updateNumberStatus,
}: NumberSearchProps) {
  const [isSearching, setIsSearching] = useState(false);

  const buscarNumeroEnRegistros = () => {
    if (!numeroBuscado.trim()) {
      setResultadoBusqueda({
        registros: [],
        numeroEncontrado: false,
        mensaje: 'Ingresa un número para buscar'
      });
      return;
    }

    setIsSearching(true);

    // Simular delay de búsqueda
    setTimeout(() => {
      const busqueda = numeroBuscado.toLowerCase().trim();
      const registrosEncontrados: RegistroRifa[] = [];

      // Buscar por número de rifa
      const numeroRifa = parseInt(busqueda);
      if (!isNaN(numeroRifa) && numeroRifa >= 1 && numeroRifa <= 10000) {
        registros.forEach(registro => {
          if (registro.numbers.includes(numeroRifa)) {
            registrosEncontrados.push(registro);
          }
        });
      }

      // Buscar por teléfono
      registros.forEach(registro => {
        if (registro.phone.includes(busqueda) && !registrosEncontrados.find(r => r.id === registro.id)) {
          registrosEncontrados.push(registro);
        }
      });

      // Buscar por nombre (parcial)
      registros.forEach(registro => {
        if (registro.name.toLowerCase().includes(busqueda) && !registrosEncontrados.find(r => r.id === registro.id)) {
          registrosEncontrados.push(registro);
        }
      });

      setResultadoBusqueda({
        registros: registrosEncontrados,
        numeroEncontrado: registrosEncontrados.length > 0,
        mensaje: registrosEncontrados.length > 0 
          ? `Se encontraron ${registrosEncontrados.length} registro(s)`
          : 'No se encontraron registros con ese criterio'
      });

      setIsSearching(false);
    }, 500);
  };

  const confirmarPagoDesdeResultado = async (registroId: string, nombrePersona: string) => {
    if (confirm(`¿Confirmar pago para ${nombrePersona}?`)) {
      try {
        // Actualizar status en Firebase
        await actualizarEstadoRegistro(registroId, 'verified');
        
        const registroIndex = registros.findIndex(r => r.id === registroId);
        if (registroIndex !== -1) {
          const nuevosRegistros = [...registros];
          nuevosRegistros[registroIndex].status = 'verified';
          setRegistros(nuevosRegistros);
          updateNumberStatus(nuevosRegistros);
          
          // Actualizar resultado de búsqueda
          buscarNumeroEnRegistros();
          
          alert('Pago confirmado exitosamente.');
        }
      } catch (error) {
        console.error('Error al confirmar pago:', error);
        alert('Error al confirmar el pago. Inténtalo de nuevo.');
      }
    }
  };

  const eliminarRegistroDesdeResultado = async (registroId: string, nombrePersona: string) => {
    if (confirm(`¿Eliminar registro de ${nombrePersona}? Esta acción no se puede deshacer.`)) {
      try {
        await eliminarRegistroFirebase(registroId);
        const nuevosRegistros = registros.filter(r => r.id !== registroId);
        setRegistros(nuevosRegistros);
        updateNumberStatus(nuevosRegistros);
        
        // Actualizar resultado de búsqueda
        buscarNumeroEnRegistros();
        
        alert('Registro eliminado exitosamente.');
      } catch (error) {
        console.error('Error al eliminar registro:', error);
        alert('Error al eliminar registro.');
      }
    }
  };

  const limpiarBusqueda = () => {
    setNumeroBuscado('');
    setResultadoBusqueda(null);
  };

  const formatearTiempo = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTiempoRestante = (timeoutEnd: number) => {
    const ahora = Date.now();
    const restante = timeoutEnd - ahora;
    
    if (restante <= 0) return 'Expirado';
    
    const minutos = Math.floor(restante / (1000 * 60));
    const segundos = Math.floor((restante % (1000 * 60)) / 1000);
    
    return `${minutos}:${segundos.toString().padStart(2, '0')}`;
  };

  return (
    <section className="busqueda-numeros glass" style={{ marginTop: '2rem' }}>
      <h2>Buscar Número en Registros</h2>
      <div className="registro-search-wrapper">
        <div className="input-container">
          <input 
            type="text" 
            id="busquedaNumeroInput" 
            placeholder="Número de rifa o teléfono" 
            maxLength={15}
            value={numeroBuscado}
            onChange={(e) => setNumeroBuscado(e.target.value)}
          />
          <button 
            id="clearBusquedaBtn" 
            type="button" 
            title="Limpiar búsqueda"
            onClick={limpiarBusqueda}
          >
            ✖
          </button>
        </div>
        <button 
          id="busquedaNumeroBtn" 
          type="button" 
          onClick={buscarNumeroEnRegistros}
          disabled={isSearching}
        >
          {isSearching ? 'Buscando...' : 'Buscar'}
        </button>
      </div>
      
      <div id="resultadoBusqueda">
        {!resultadoBusqueda ? (
          <p style={{ color: '#6c757d', textAlign: 'center', margin: '0' }}>
            Ingresa un número para comenzar la búsqueda
          </p>
        ) : (
          <div>
            <p style={{ textAlign: 'center', marginBottom: '1rem', fontWeight: 'bold' }}>
              {resultadoBusqueda.mensaje}
            </p>
            
            {resultadoBusqueda.registros.map((registro) => (
              <div 
                key={registro.id} 
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
                
                <div style={{ marginBottom: '0.5rem' }}>
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
                
                <div style={{ fontSize: '0.9em', color: '#ccc', marginBottom: '0.5rem' }}>
                  Registrado: {formatearTiempo(registro.timestamp)}
                </div>
                
                <div style={{ fontSize: '0.9em', color: '#ccc', marginBottom: '0.5rem' }}>
                  Estado: 
                  <span style={{ 
                    color: registro.status === 'verified' ? '#28a745' : 
                           registro.status === 'pending' ? '#ffc107' : '#dc3545',
                    fontWeight: 'bold',
                    marginLeft: '0.5rem'
                  }}>
                    {registro.status === 'verified' ? 'Confirmado' : 
                     registro.status === 'pending' ? 'Pendiente' : 'Expirado'}
                  </span>
                </div>
                
                {registro.status === 'pending' && (
                  <div style={{ fontSize: '0.9em', color: '#ffc107', marginBottom: '0.5rem' }}>
                    Tiempo restante: {getTiempoRestante(registro.timeoutEnd)}
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {registro.status === 'pending' && (
                    <button 
                      onClick={() => confirmarPagoDesdeResultado(registro.id!, registro.name)}
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9em'
                      }}
                    >
                      Confirmar Pago
                    </button>
                  )}
                  <button 
                    onClick={() => eliminarRegistroDesdeResultado(registro.id!, registro.name)}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9em'
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
