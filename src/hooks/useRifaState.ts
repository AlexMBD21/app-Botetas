'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  escucharRegistrosRealtime,
  cargarRegistrosAlIniciar,
  obtenerConfiguracionSorteo,
  escucharBloqueoRegistros,
  verificarUsuario
} from '../lib/realTime';
import { RegistroRifa, EstadoNumero, ResultadoBusqueda } from '../types';

export function useRifaState() {
  // Estados principales
  const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(new Set());
  const [registros, setRegistros] = useState<RegistroRifa[]>([]);
  const [numberStatus, setNumberStatus] = useState<EstadoNumero>({});
  const [loading, setLoading] = useState(true);
  const [registrosLoading, setRegistrosLoading] = useState(false);
  
  // Estados de configuración
  const [pricePerTicket, setPricePerTicket] = useState(4000);
  const [tiempoTemporizadorMinutos, setTiempoTemporizadorMinutos] = useState(30);
  const [registrosBloquados, setRegistrosBloquados] = useState(false);
  const [fechaLimiteRegistros, setFechaLimiteRegistros] = useState<Date | null>(null);
  
  // Estados de búsqueda
  const [numeroBuscado, setNumeroBuscado] = useState('');
  const [resultadoBusqueda, setResultadoBusqueda] = useState<ResultadoBusqueda | null>(null);
  
  // Estados de autenticación
  const [tieneAccesoRegistros, setTieneAccesoRegistros] = useState(false);
  const [verificandoAcceso, setVerificandoAcceso] = useState(true);
  
  // Estados de conexión
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Función para actualizar el estado de los números (lógica exacta del script original)
  const updateNumberStatus = useCallback((registrosList: RegistroRifa[]) => {
    console.log('Actualizando estado de números con registros:', registrosList);
    const newStatus: EstadoNumero = {};
    
    // Inicializar todos los números del 0 al 9999 como disponibles (como en el script original)
    for (let i = 0; i <= 9999; i++) {
      newStatus[i] = { status: 'available' };
    }
    
    // Procesar registros para marcar números ocupados
    registrosList.forEach(registro => {
      if (registro.numbers && Array.isArray(registro.numbers)) {
        registro.numbers.forEach(num => {
          // Verificar que el número esté en el rango válido
          if (num >= 0 && num <= 9999) {
            if (registro.status === 'verified') {
              // Números verificados son 'confirmed' (como en el script original)
              newStatus[num] = { status: 'confirmed', registroId: registro.id };
            } else if (registro.status === 'pending') {
              // Solo marcar como pending si aún no ha expirado
              const now = Date.now();
              if (now < registro.timeoutEnd) {
                newStatus[num] = { status: 'pending', registroId: registro.id };
              } else {
                // Si expiró, liberar el número
                newStatus[num] = { status: 'available' };
              }
            }
          }
        });
      }
    });
    
    console.log('Nuevo estado de números:', Object.keys(newStatus).length, 'números procesados');
    setNumberStatus(newStatus);
  }, []);

  // Función para cargar configuración
  const cargarConfiguracion = useCallback(() => {
    obtenerConfiguracionSorteo((config) => {
      if (config) {
        setPricePerTicket(config.valorBoleta || 4000);
        setTiempoTemporizadorMinutos(config.tiempoTemporizador || 30);
        
        // Calcular fecha límite
        if (config.fechaSorteo && config.horaSorteo) {
          const fechaSorteo = new Date(`${config.fechaSorteo} ${config.horaSorteo}`);
          const horasAntes = config.horasAntesBloqueo || 2;
          const fechaLimite = new Date(fechaSorteo.getTime() - (horasAntes * 60 * 60 * 1000));
          setFechaLimiteRegistros(fechaLimite);
          
          // Verificar si ya pasó la fecha límite
          const ahora = new Date();
          setRegistrosBloquados(ahora >= fechaLimite);
        }
      }
    });
  }, []);

  // Función para verificar acceso a registros
  const verificarAccesoRegistros = useCallback(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      
      if (token) {
        verificarUsuario(token, (existe) => {
          setTieneAccesoRegistros(existe);
          setVerificandoAcceso(false);
        });
      } else {
        // Para desarrollo: permitir acceso sin token
        setTieneAccesoRegistros(true);
        setVerificandoAcceso(false);
      }
    }
  }, []);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    console.log('Iniciando carga de datos...');
    setConnectionStatus('connecting');
    
    // Verificar acceso
    verificarAccesoRegistros();
    
    // Cargar configuración
    cargarConfiguracion();
    
    // Cargar registros iniciales
    cargarRegistrosAlIniciar((registrosList) => {
      console.log('Registros cargados en el hook:', registrosList);
      setRegistros(registrosList);
      updateNumberStatus(registrosList);
      setLoading(false);
      setConnectionStatus('connected');
    });

    // Configurar escucha en tiempo real
    const unsubscribeRegistros = escucharRegistrosRealtime((registrosList) => {
      console.log('Registros actualizados en tiempo real en el hook:', registrosList);
      setRegistros(registrosList);
      updateNumberStatus(registrosList);
      setConnectionStatus('connected');
    });

    // Configurar escucha de bloqueo
    const unsubscribeBloqueo = escucharBloqueoRegistros((bloqueado) => {
      console.log('Estado de bloqueo actualizado:', bloqueado);
      setRegistrosBloquados(bloqueado);
    });

    // Cleanup
    return () => {
      console.log('Limpiando suscripciones...');
      unsubscribeRegistros();
      unsubscribeBloqueo();
    };
  }, [cargarConfiguracion, updateNumberStatus, verificarAccesoRegistros]);

  // Funciones utilitarias
  const addSelectedNumber = useCallback((number: number) => {
    setSelectedNumbers(prev => new Set([...prev, number]));
  }, []);

  const removeSelectedNumber = useCallback((number: number) => {
    setSelectedNumbers(prev => {
      const newSet = new Set(prev);
      newSet.delete(number);
      return newSet;
    });
  }, []);

  const clearSelectedNumbers = useCallback(() => {
    setSelectedNumbers(new Set());
  }, []);

  const getTotalPrice = useCallback(() => {
    return selectedNumbers.size * pricePerTicket;
  }, [selectedNumbers.size, pricePerTicket]);

  const getContadorRegistros = useCallback(() => {
    const confirmados = registros.filter(r => r.status === 'verified').length;
    const pendientes = registros.filter(r => r.status === 'pending').length;
    return { confirmados, pendientes };
  }, [registros]);

  return {
    // Estados
    selectedNumbers,
    registros,
    numberStatus,
    loading,
    registrosLoading,
    pricePerTicket,
    tiempoTemporizadorMinutos,
    registrosBloquados,
    fechaLimiteRegistros,
    numeroBuscado,
    resultadoBusqueda,
    tieneAccesoRegistros,
    verificandoAcceso,
    connectionStatus,
    
    // Setters
    setSelectedNumbers,
    setRegistros,
    setRegistrosLoading,
    setPricePerTicket,
    setTiempoTemporizadorMinutos,
    setNumeroBuscado,
    setResultadoBusqueda,
    setConnectionStatus,
    
    // Funciones
    addSelectedNumber,
    removeSelectedNumber,
    clearSelectedNumbers,
    getTotalPrice,
    getContadorRegistros,
    updateNumberStatus,
    cargarConfiguracion,
  };
}
