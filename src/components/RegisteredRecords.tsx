'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  eliminarTodosLosRegistrosFirebase, 
  eliminarRegistroFirebase,
  guardarConfiguracionSorteoFirebase,
  obtenerConfiguracionSorteo,
  actualizarEstadoRegistro
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

  // Mapa para controlar temporizadores activos
  const [temporizadoresActivos, setTemporizadoresActivos] = useState<Map<string, NodeJS.Timeout>>(new Map());
  
  // Estado para actualizar temporizadores visuales cada segundo
  const [tiempoActual, setTiempoActual] = useState(Date.now());
  
  // Estado para detectar si es móvil
  const [isMobile, setIsMobile] = useState(false);

  // Actualizar tiempo actual cada segundo para sincronizar temporizadores
  useEffect(() => {
    const interval = setInterval(() => {
      setTiempoActual(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Detectar si es móvil
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // Función para eliminar registro expirado automáticamente
  const eliminarRegistroExpirado = useCallback(async (registroId: string) => {
    console.log('🕐 Eliminando registro expirado con ID:', registroId);
    
    try {
      // Limpiar temporizador
      const timer = temporizadoresActivos.get(registroId);
      if (timer) {
        clearTimeout(timer);
        setTemporizadoresActivos(prev => {
          const newMap = new Map(prev);
          newMap.delete(registroId);
          return newMap;
        });
      }

      // Eliminar de Firebase
      await eliminarRegistroFirebase(registroId);
      
      // Actualizar estado local
      setRegistros(registros.filter(r => r.id !== registroId));
      updateNumberStatus(registros.filter(r => r.id !== registroId));
      
      console.log('✅ Registro expirado eliminado exitosamente');
    } catch (error) {
      console.error('❌ Error al eliminar registro expirado:', error);
    }
  }, [registros, temporizadoresActivos, setRegistros, updateNumberStatus]);

  // Efecto para crear/limpiar temporizadores cuando cambian los registros
  useEffect(() => {
    registros.forEach(registro => {
      if (registro.status === 'pending' && registro.id && !temporizadoresActivos.has(registro.id)) {
        const ahora = Date.now();
        const tiempoRestante = registro.timeoutEnd - ahora;
        
        if (tiempoRestante > 0) {
          console.log('⏰ Creando temporizador para:', registro.name, 'Tiempo restante:', Math.floor(tiempoRestante / 1000), 'segundos');
          
          const timer = setTimeout(() => {
            eliminarRegistroExpirado(registro.id!);
          }, tiempoRestante);
          
          setTemporizadoresActivos(prev => new Map(prev).set(registro.id!, timer));
        } else {
          // Si ya expiró, eliminarlo inmediatamente
          eliminarRegistroExpirado(registro.id);
        }
      }
    });

    // Limpiar temporizadores de registros que ya no existen o fueron confirmados
    temporizadoresActivos.forEach((timer, registroId) => {
      const registro = registros.find(r => r.id === registroId);
      if (!registro || registro.status !== 'pending') {
        clearTimeout(timer);
        setTemporizadoresActivos(prev => {
          const newMap = new Map(prev);
          newMap.delete(registroId);
          return newMap;
        });
      }
    });

    // Cleanup cuando el componente se desmonta
    return () => {
      temporizadoresActivos.forEach(timer => clearTimeout(timer));
    };
  }, [registros, temporizadoresActivos, eliminarRegistroExpirado]);

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
    try {
      console.log('🔄 Confirmando pago para registro:', registroId);
      
      // Limpiar temporizador activo
      const timer = temporizadoresActivos.get(registroId);
      if (timer) {
        clearTimeout(timer);
        setTemporizadoresActivos(prev => {
          const newMap = new Map(prev);
          newMap.delete(registroId);
          return newMap;
        });
      }

      // Actualizar status en Firebase
      await actualizarEstadoRegistro(registroId, 'verified');
      
      // Actualizar estado local
      const registroIndex = registros.findIndex(r => r.id === registroId);
      if (registroIndex !== -1) {
        const nuevosRegistros = [...registros];
        nuevosRegistros[registroIndex].status = 'verified';
        setRegistros(nuevosRegistros);
        updateNumberStatus(nuevosRegistros);
        
        console.log('✅ Pago confirmado exitosamente');
        alert('Pago confirmado. Los números ahora están registrados definitivamente.');
      }
    } catch (error) {
      console.error('❌ Error al confirmar pago:', error);
      alert('Error al confirmar el pago. Inténtalo de nuevo.');
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
    const restante = timeoutEnd - tiempoActual;
    
    if (restante <= 0) return 'Expirado';
    
    const horas = Math.floor(restante / (1000 * 60 * 60));
    const minutos = Math.floor((restante % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((restante % (1000 * 60)) / 1000);
    
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    }
    return `${minutos}:${segundos.toString().padStart(2, '0')}`;
  };

  // Función para calcular el valor total a pagar
  const calcularValorTotal = (cantidadNumeros: number) => {
    return (cantidadNumeros * pricePerTicket).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    });
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
    <section className="registro-guardado glass" style={{ 
      marginTop: '2rem',
      height: 'auto',
      minHeight: 'auto',
      maxHeight: 'none',
      overflow: 'visible'
    }}>
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

      <div className="registro-list" id="registro-list" style={{
        marginTop: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxHeight: 'none',
        height: 'auto',
        overflow: 'visible'
      }}>
        {[...registros]
          .sort((a, b) => {
            // Ordenar por timestamp descendente (más nuevos primero)
            const timestampA = a.timestamp || 0;
            const timestampB = b.timestamp || 0;
            return timestampB - timestampA;
          })
          .map((registro) => (
          <div 
            key={registro.id} 
            className={`registro-item ${registro.status}`}
            style={{
              background: registro.status === 'pending' 
                ? 'linear-gradient(135deg, #fff3cd, #ffeaa7)' 
                : 'linear-gradient(135deg, #d4edda, #c3e6cb)',
              border: `2px solid ${registro.status === 'pending' ? '#ffc107' : '#28a745'}`,
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'visible', // Cambió de hidden a visible
              height: 'auto',
              minHeight: 'auto'
            }}
          >
            {/* Badge de estado - responsive */}
            <div 
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                background: registro.status === 'pending' ? '#ffc107' : '#28a745',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                zIndex: 10
              }}
            >
              {registro.status === 'pending' ? '⏳ Pendiente' : '✅ Confirmado'}
            </div>

            {/* Información del usuario - Grid responsive */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginTop: '1.5rem',
              marginBottom: '1rem'
            }}>
              {/* Columna 1: Datos del usuario */}
              <div>
                <div style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold', 
                  color: '#2c3e50',
                  marginBottom: '0.5rem',
                  wordBreak: 'break-word'
                }}>
                  👤 {registro.name}
                </div>
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: '#6c757d',
                  marginBottom: '0.5rem',
                  wordBreak: 'break-all'
                }}>
                  📞 {registro.phone}
                </div>
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: '#495057',
                  wordBreak: 'break-word'
                }}>
                  📅 {formatearTiempo(registro.timestamp)}
                </div>
              </div>

              {/* Columna 2: Información financiera */}
              <div>
                <div style={{ 
                  background: 'rgba(0, 123, 255, 0.1)',
                  border: '1px solid #007bff',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#495057',
                    marginBottom: '0.25rem'
                  }}>
                    💰 Valor a pagar
                  </div>
                  <div style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold',
                    color: '#007bff'
                  }}>
                    {calcularValorTotal(registro.numbers.length)}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#6c757d',
                    marginTop: '0.25rem'
                  }}>
                    {registro.numbers.length} número{registro.numbers.length > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Números seleccionados - Responsive grid */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ 
                fontSize: '0.85rem', 
                color: '#495057', 
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                🎯 Números seleccionados:
              </div>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
                gap: '0.25rem',
                maxHeight: 'none', /* Removido límite de altura */
                overflowY: 'visible' /* Cambió de auto a visible */
              }}>
                {registro.numbers.map(n => (
                  <span 
                    key={n}
                    style={{
                      background: registro.status === 'pending' ? '#fff' : '#f8f9fa',
                      border: `1px solid ${registro.status === 'pending' ? '#ffc107' : '#28a745'}`,
                      color: registro.status === 'pending' ? '#856404' : '#155724',
                      padding: '0.5rem 0.25rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      minWidth: '50px'
                    }}
                  >
                    {n.toString().padStart(4, '0')}
                  </span>
                ))}
              </div>
            </div>

            {/* Temporizador para registros pendientes - Más prominente en móvil */}
            {registro.status === 'pending' && (
              <div 
                className="temporizador"
                style={{
                  background: 'rgba(255, 193, 7, 0.15)',
                  border: '2px solid #ffc107',
                  borderRadius: '12px',
                  padding: '0.4rem',
                  textAlign: 'center',
                }}
              >
                <div style={{
                  fontSize: '1.4rem',
                  fontWeight: 'bold',
                  color: '#853e04ff',
                }}>
                  ⏰ {getTiempoRestante(registro.timeoutEnd)}
                </div>
                
              </div>
            )}

            {/* Botones de acción - Stack en móvil */}
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: '0.5rem',
              justifyContent: 'flex-end'
            }}>
              {registro.status === 'pending' && (
                <button 
                  className="btn-verificar"
                  onClick={() => confirmarPago(registro.id!)}
                  style={{
                    background: 'linear-gradient(135deg, #28a745, #20c997)',
                    color: 'white',
                    border: 'none',
                    padding: '0.8rem 1.5rem',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s',
                    boxShadow: '0 3px 6px rgba(40, 167, 69, 0.3)',
                    width: isMobile ? '100%' : 'auto'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 5px 10px rgba(40, 167, 69, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 3px 6px rgba(40, 167, 69, 0.3)';
                  }}
                >
                   Confirmar Pago
                </button>
              )}
              <button 
                onClick={() => eliminarRegistro(registro.id!)}
                style={{
                  background: 'linear-gradient(135deg, #dc3545, #c82333)',
                  color: 'white',
                  border: 'none',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 3px 6px rgba(220, 53, 69, 0.3)',
                  width: isMobile ? '100%' : 'auto'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 5px 10px rgba(220, 53, 69, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 3px 6px rgba(220, 53, 69, 0.3)';
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
