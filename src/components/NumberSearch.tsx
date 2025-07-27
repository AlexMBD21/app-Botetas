'use client';

import React, { useState } from 'react';
import RegistroVisualItem from './RegistroVisualItem';
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
  pricePerTicket: number;
}

export default function NumberSearch({
  numeroBuscado,
  setNumeroBuscado,
  resultadoBusqueda,
  setResultadoBusqueda,
  registros,
  setRegistros,
  updateNumberStatus,
  pricePerTicket,
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

    setTimeout(() => {
      const busqueda = numeroBuscado.toLowerCase().trim();
      let registrosEncontrados: RegistroRifa[] = [];
      let mensaje = '';

      // Buscar por número de rifa (4 cifras)
      if (/^\d{4}$/.test(busqueda)) {
        const numeroRifa = parseInt(busqueda);
        // Ganador
        const ganador = registros.find(registro => registro.numbers.includes(numeroRifa));
        // Segundo premio (número invertido)
        const invertido = parseInt(busqueda.split('').reverse().join(''));
        const segundoPremio = registros.find(registro => registro.numbers.includes(invertido));
        registrosEncontrados = [];
        if (ganador) registrosEncontrados.push(ganador);
        if (segundoPremio && (!ganador || ganador.id !== segundoPremio.id)) registrosEncontrados.push(segundoPremio);
        if (registrosEncontrados.length === 0) {
          mensaje = 'No se encontró ganador ni segundo premio para ese número.';
        } else {
          mensaje = `Resultado para el número ${busqueda}:\n`;
          if (ganador) mensaje += `Ganador: ${ganador.name} (${ganador.phone})\n`;
          if (segundoPremio && (!ganador || ganador.id !== segundoPremio.id)) mensaje += `Segundo premio (invertido): ${segundoPremio.name} (${segundoPremio.phone})`;
        }
      }
      // Buscar por teléfono
      else if (/^\d{7,}$/.test(busqueda)) {
        const porTelefono = registros.filter(registro => registro.phone.includes(busqueda));
        registrosEncontrados = porTelefono;
        if (porTelefono.length === 1) {
          mensaje = `Registro encontrado para el número de celular: ${porTelefono[0].phone}`;
        } else if (porTelefono.length > 1) {
          mensaje = `Se encontraron ${porTelefono.length} registros para el número de celular.`;
        } else {
          mensaje = 'No se encontraron registros con ese celular';
        }
      }
      // Buscar por nombre (parcial)
      else {
        const porNombre = registros.filter(registro => registro.name.toLowerCase().includes(busqueda));
        registrosEncontrados = porNombre;
        mensaje = porNombre.length > 0 ? `Se encontraron ${porNombre.length} registro(s) por nombre` : 'No se encontraron registros con ese nombre';
      }

      setResultadoBusqueda({
        registros: registrosEncontrados,
        numeroEncontrado: registrosEncontrados.length > 0,
        mensaje
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
            {resultadoBusqueda.registros.map((registroItem) => (
              <RegistroVisualItem
                key={registroItem.id}
                registro={registroItem}
                isMobile={window.innerWidth < 768}
                formatearTiempo={formatearTiempo}
                getTiempoRestante={getTiempoRestante}
                calcularValorTotal={(cantidadNumeros) => {
                  const precio = typeof pricePerTicket === 'number' && !isNaN(pricePerTicket) ? pricePerTicket : 0;
                  const total = cantidadNumeros * precio;
                  return total >= 0
                    ? total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })
                    : '$0';
                }}
                confirmarPago={confirmarPagoDesdeResultado}
                eliminarRegistro={eliminarRegistroDesdeResultado}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
