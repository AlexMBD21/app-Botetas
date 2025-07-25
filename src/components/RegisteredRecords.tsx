'use client';

import React, { useState } from 'react';
import { 
  eliminarTodosLosRegistrosFirebase, 
  eliminarRegistroFirebase,
  guardarConfiguracionSorteoFirebase,
  obtenerConfiguracionSorteo
} from '../lib/realTime';
import { RegistroRifa } from '../types';

interface RegisteredRecordsProps {
  registros: RegistroRifa[];
  registrosLoading: boolean;
  setRegistrosLoading: (loading: boolean) => void;
  getContadorRegistros: () => { confirmados: number; pendientes: number };
  pricePerTicket: number;
  setPricePerTicket: (price: number) => void;
  tiempoTemporizadorMinutos: number;
  setTiempoTemporizadorMinutos: (time: number) => void;
  cargarConfiguracion: () => void;
  setRegistros: (registros: RegistroRifa[]) => void;
  updateNumberStatus: (registros: RegistroRifa[]) => void;
}

export default function RegisteredRecords({
  registros,
  registrosLoading,
  setRegistrosLoading,
  getContadorRegistros,
  pricePerTicket,
  setPricePerTicket,
  tiempoTemporizadorMinutos,
  setTiempoTemporizadorMinutos,
  cargarConfiguracion,
  setRegistros,
  updateNumberStatus,
}: RegisteredRecordsProps) {
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [configData, setConfigData] = useState({
    valorBoleta: pricePerTicket,
    fechaInicioEvento: '',
    fechaSorteo: '',
    horaSorteo: '',
    horasAntesBloqueo: 2,
    tiempoTemporizador: tiempoTemporizadorMinutos,
  });

  const { confirmados, pendientes } = getContadorRegistros();

  const limpiarTodosLosRegistros = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar TODOS los registros? Esta acción no se puede deshacer.')) {
      setRegistrosLoading(true);
      try {
        await eliminarTodosLosRegistrosFirebase();
        setRegistros([]);
        updateNumberStatus([]);
        alert('Todos los registros han sido eliminados.');
      } catch (error) {
        console.error('Error al eliminar registros:', error);
        alert('Error al eliminar registros.');
      } finally {
        setRegistrosLoading(false);
      }
    }
  };

  const togglePanelConfiguracion = () => {
    setShowConfigPanel(!showConfigPanel);
    if (!showConfigPanel) {
      cargarConfiguracionActual();
    }
  };

  const cargarConfiguracionActual = () => {
    obtenerConfiguracionSorteo((config) => {
      if (config) {
        setConfigData({
          valorBoleta: config.valorBoleta || 4000,
          fechaInicioEvento: config.fechaInicioEvento || '',
          fechaSorteo: config.fechaSorteo || '',
          horaSorteo: config.horaSorteo || '',
          horasAntesBloqueo: config.horasAntesBloqueo || 2,
          tiempoTemporizador: config.tiempoTemporizador || 30,
        });
      }
    });
  };

  const guardarConfiguracion = async () => {
    try {
      const nuevaConfig = {
        valorBoleta: configData.valorBoleta,
        fechaInicioEvento: configData.fechaInicioEvento,
        fechaSorteo: configData.fechaSorteo,
        horaSorteo: configData.horaSorteo,
        horasAntesBloqueo: configData.horasAntesBloqueo,
        tiempoTemporizador: configData.tiempoTemporizador,
      };

      await guardarConfiguracionSorteoFirebase(nuevaConfig);
      
      // Actualizar estados locales
      setPricePerTicket(configData.valorBoleta);
      setTiempoTemporizadorMinutos(configData.tiempoTemporizador);
      
      // Recargar configuración
      cargarConfiguracion();
      
      setShowConfigPanel(false);
      alert('Configuración guardada exitosamente.');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert('Error al guardar configuración.');
    }
  };

  const confirmarPago = async (registroId: string) => {
    // Implementar lógica de confirmación de pago
    const registroIndex = registros.findIndex(r => r.id === registroId);
    if (registroIndex !== -1) {
      const nuevosRegistros = [...registros];
      nuevosRegistros[registroIndex].status = 'verified';
      setRegistros(nuevosRegistros);
      updateNumberStatus(nuevosRegistros);
    }
  };

  const eliminarRegistro = async (registroId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      try {
        await eliminarRegistroFirebase(registroId);
        const nuevosRegistros = registros.filter(r => r.id !== registroId);
        setRegistros(nuevosRegistros);
        updateNumberStatus(nuevosRegistros);
        alert('Registro eliminado exitosamente.');
      } catch (error) {
        console.error('Error al eliminar registro:', error);
        alert('Error al eliminar registro.');
      }
    }
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

  if (registrosLoading) {
    return (
      <section className="registro-guardado glass" style={{ marginTop: '2rem' }}>
        <h2>Registros Realizados</h2>
        <div id="registrosLoadingSpinner" className="registros-loading">
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p>Cargando registros...</p>
            <p className="loading-subtext">Obteniendo información actualizada</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="registro-guardado glass" style={{ marginTop: '2rem' }}>
      <h2>Registros Realizados</h2>
      <div id="registroCounts" style={{ textAlign: 'right', fontWeight: 'bold', marginBottom: '1rem' }}>
        <span style={{ color: 'rgb(170, 170, 180)' }}>
          Confirmados: <span id="confirmadosCount">{confirmados}</span>
        </span> |{' '}
        <span style={{ color: 'rgb(170, 170, 180)' }}>
          Pendientes: <span id="pendientesCount">{pendientes}</span>
        </span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <button 
          id="limpiarTodosBtn" 
          onClick={limpiarTodosLosRegistros}
          style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '0.8rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'background 0.2s',
            marginRight: '0.5rem'
          }}
        >
          🗑️ Limpiar Registros
        </button>
        <button 
          id="configurarSorteoBtn" 
          onClick={togglePanelConfiguracion}
          style={{
            background: '#2b2d3d',
            color: 'rgb(255, 255, 255)',
            border: 'none',
            padding: '0.8rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'background 0.2s'
          }}
        >
          ⚙️ Configurar Sorteo
        </button>
      </div>

      {showConfigPanel && (
        <div id="panelConfiguracion">
          <h3>⚙️ Configuración del Sorteo</h3>
          
          <div className="grid-inputs">
            <div>
              <label htmlFor="valorBoletaInput">💰 Valor de la Boleta (COP):</label>
              <input 
                type="number" 
                id="valorBoletaInput" 
                min="1000" 
                step="500" 
                placeholder="4000" 
                value={configData.valorBoleta}
                onChange={(e) => setConfigData(prev => ({ ...prev, valorBoleta: parseInt(e.target.value) || 4000 }))}
              />
            </div>
            <div>
              <label htmlFor="fechaInicioEventoInput">📅 Fecha de Inicio del Evento:</label>
              <input 
                type="date" 
                id="fechaInicioEventoInput"
                value={configData.fechaInicioEvento}
                onChange={(e) => setConfigData(prev => ({ ...prev, fechaInicioEvento: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="grid-inputs">
            <div>
              <label htmlFor="fechaSorteoInput">🎯 Fecha del Sorteo:</label>
              <input 
                type="date" 
                id="fechaSorteoInput"
                value={configData.fechaSorteo}
                onChange={(e) => setConfigData(prev => ({ ...prev, fechaSorteo: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="horaSorteoInput">🕐 Hora del Sorteo:</label>
              <input 
                type="time" 
                id="horaSorteoInput"
                value={configData.horaSorteo}
                onChange={(e) => setConfigData(prev => ({ ...prev, horaSorteo: e.target.value }))}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="horasAntesBloqueo">Horas antes del sorteo para cerrar registros:</label>
            <select 
              id="horasAntesBloqueo"
              value={configData.horasAntesBloqueo}
              onChange={(e) => setConfigData(prev => ({ ...prev, horasAntesBloqueo: parseInt(e.target.value) }))}
            >
              <option value="1">1 hora antes</option>
              <option value="2">2 horas antes</option>
              <option value="3">3 horas antes</option>
              <option value="6">6 horas antes</option>
              <option value="12">12 horas antes</option>
              <option value="24">24 horas antes</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="tiempoTemporizadorInput">⏰ Tiempo del temporizador para confirmar pago (minutos):</label>
            <select 
              id="tiempoTemporizadorInput"
              value={configData.tiempoTemporizador}
              onChange={(e) => setConfigData(prev => ({ ...prev, tiempoTemporizador: parseInt(e.target.value) }))}
            >
              <option value="15">15 minutos</option>
              <option value="20">20 minutos</option>
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">1 hora</option>
              <option value="90">1.5 horas</option>
              <option value="120">2 horas</option>
            </select>
          </div>
          
          <div className="botones-panel">
            <button id="guardarConfigBtn" onClick={guardarConfiguracion}>
              💾 Guardar Configuración
            </button>
            <button id="cancelarConfigBtn" onClick={() => setShowConfigPanel(false)}>
              ❌ Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="registro-list" id="registro-list">
        {registros.map((registro) => (
          <div key={registro.id} className="registro-item">
            <div>
              <strong>{registro.name}</strong> - {registro.phone}
            </div>
            <div>
              Números: {registro.numbers.map(n => n.toString().padStart(4, '0')).join(', ')}
            </div>
            <div>
              Registrado: {formatearTiempo(registro.timestamp)}
            </div>
            {registro.status === 'pending' && (
              <div className="temporizador">
                Tiempo restante: {getTiempoRestante(registro.timeoutEnd)}
              </div>
            )}
            <div style={{ marginTop: '0.5rem' }}>
              {registro.status === 'pending' && (
                <button 
                  className="btn-verificar"
                  onClick={() => confirmarPago(registro.id!)}
                  style={{
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '0.5rem'
                  }}
                >
                  Confirmar Pago
                </button>
              )}
              <button 
                onClick={() => eliminarRegistro(registro.id!)}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
