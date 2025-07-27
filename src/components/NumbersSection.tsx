'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { EstadoNumero } from '../types';

interface NumbersSectionProps {
  selectedNumbers: Set<number>;
  numberStatus: EstadoNumero;
  loading: boolean;
  addSelectedNumber: (number: number) => void;
  removeSelectedNumber: (number: number) => void;
  registrosBloquados: boolean;
}

export default function NumbersSection({
  selectedNumbers,
  numberStatus,
  loading,
  addSelectedNumber,
  removeSelectedNumber,
  registrosBloquados,
}: NumbersSectionProps) {
  const [searchNumber, setSearchNumber] = useState('');
  const [filteredNumbers, setFilteredNumbers] = useState<number[]>([]);

  // Inicializar números al montar el componente
  useEffect(() => {
    const allNumbers = Array.from({ length: 10000 }, (_, i) => i);
    setFilteredNumbers(allNumbers);
  }, []);

  // Filtrar números cuando cambie la búsqueda - REMOVIDO para que no busque automáticamente
  // useEffect(() => {
  //   const allNumbers = Array.from({ length: 10000 }, (_, i) => i);
    
  //   if (searchNumber.trim() === '') {
  //     setFilteredNumbers(allNumbers);
  //   } else {
  //     const search = searchNumber.toLowerCase();
  //     const filtered = allNumbers.filter(num => 
  //       num.toString().padStart(4, '0').includes(search)
  //     );
  //     setFilteredNumbers(filtered);
  //   }
  // }, [searchNumber]);

  // Verificación de bloqueo de registros (lógica del script original)
  const verificarBloqueoRegistros = useCallback(() => {
    if (registrosBloquados) {
      alert('🚫 SELECCIÓN BLOQUEADA\n\nNo se pueden seleccionar números porque los registros han sido cerrados.\n\nLa fecha límite del sorteo ha sido alcanzada.');
      return true;
    }
    return false;
  }, [registrosBloquados]);

  // Función para manejar click en número (lógica exacta del script original)
  const handleNumberClick = (number: number) => {
    // VERIFICAR BLOQUEO DE REGISTROS ANTES DE PERMITIR SELECCIÓN
    if (verificarBloqueoRegistros()) {
      return;
    }

    const estadoActual = numberStatus[number]?.status || 'available';
    
    // No permitir selección si está pending o confirmed
    if (estadoActual === 'pending' || estadoActual === 'confirmed' || estadoActual === 'unavailable') {
      return;
    }

    if (selectedNumbers.has(number)) {
      removeSelectedNumber(number);
    } else {
      addSelectedNumber(number);
    }
  };

  // Función para obtener clase del botón (lógica exacta del script original)
  const getButtonClass = (number: number) => {
    const estado = numberStatus[number]?.status || 'available';
    
    // Si está seleccionado, mostrar como selected
    if (selectedNumbers.has(number)) {
      return 'number-btn selected';
    }
    
    // Asignar clase según estado
    if (estado === 'confirmed' || estado === 'unavailable') {
      return 'number-btn unavailable';
    } else if (estado === 'pending') {
      return 'number-btn pending';
    } else {
      return 'number-btn available';
    }
  };

  // Función para determinar si el botón debe estar deshabilitado
  const isButtonDisabled = (number: number) => {
    const estado = numberStatus[number]?.status || 'available';
    return registrosBloquados || estado === 'confirmed' || estado === 'pending' || estado === 'unavailable';
  };

  const clearSearch = () => {
    setSearchNumber('');
    // Restaurar todos los números cuando se limpia la búsqueda
    const allNumbers = Array.from({ length: 10000 }, (_, i) => i);
    setFilteredNumbers(allNumbers);
  };

  const searchSpecificNumber = () => {
    const allNumbers = Array.from({ length: 10000 }, (_, i) => i);
    
    if (searchNumber.trim() === '') {
      // Si no hay texto, mostrar todos los números
      setFilteredNumbers(allNumbers);
    } else {
      // Buscar números que contengan el texto ingresado
      const search = searchNumber.toLowerCase();
      const filtered = allNumbers.filter(num => 
        num.toString().padStart(4, '0').includes(search)
      );
      setFilteredNumbers(filtered);
      
      // Si se encontró al menos un resultado, hacer scroll al primero
      if (filtered.length > 0) {
        setTimeout(() => {
          const element = document.querySelector(`[data-number="${filtered[0]}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  };

  if (loading) {
    return (
      <section className="numbers-section glass">
        <h2>Selecciona tus números</h2>
        <div className="search-wrapper">
        <div className="input-container">
          <input 
            type="text" 
            id="searchInput" 
            placeholder="Busca tu número" 
            maxLength={4}
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
          />
          <button 
            id="clearSearch" 
            type="button" 
            title="Limpiar búsqueda"
            onClick={clearSearch}
          >
            ✖
          </button>
        </div>
        <button id="searchBtn" type="button" onClick={searchSpecificNumber}>
          Buscar
        </button>
      </div>

        <div id="numbersLoadingSpinner" className="numbers-loading">
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p>Cargando números...</p>
            <p className="loading-subtext">Generando 10,000 números</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="numbers-section glass">
      <h2>Selecciona tus números</h2>

      <div className="search-wrapper">
        <div className="input-container">
          <input 
            type="text" 
            id="searchInput" 
            placeholder="Busca tu número" 
            maxLength={4}
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                searchSpecificNumber();
              }
            }}
          />
          <button 
            id="clearSearch" 
            type="button" 
            title="Limpiar búsqueda"
            onClick={clearSearch}
          >
            ✖
          </button>
        </div>
        <button id="searchBtn" type="button" onClick={searchSpecificNumber}>
          Buscar
        </button>
      </div>

      <div id="numberGrid" className="scroll-grid">
        {filteredNumbers.map(number => (
          <button
            key={number}
            className={getButtonClass(number)}
            data-number={number}
            onClick={() => handleNumberClick(number)}
            disabled={isButtonDisabled(number)}
          >
            {number.toString().padStart(4, '0')}
          </button>
        ))}
      </div>

      <p id="selectedCount" className="selected-count-text">
        Has seleccionado {selectedNumbers.size} número{selectedNumbers.size !== 1 ? 's' : ''}.
      </p>
    </section>
  );
}
