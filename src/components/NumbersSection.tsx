'use client';

import React, { useState, useEffect } from 'react';
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

  // Generar números del 1 al 10000
  const allNumbers = Array.from({ length: 10000 }, (_, i) => i + 1);

  useEffect(() => {
    if (searchNumber.trim() === '') {
      setFilteredNumbers(allNumbers);
    } else {
      const search = searchNumber.toLowerCase();
      const filtered = allNumbers.filter(num => 
        num.toString().padStart(4, '0').includes(search)
      );
      setFilteredNumbers(filtered);
    }
  }, [searchNumber, allNumbers]);

  const handleNumberClick = (number: number) => {
    if (registrosBloquados) return;
    
    const status = numberStatus[number]?.status || 'available';
    
    if (status === 'unavailable') return;
    
    if (selectedNumbers.has(number)) {
      removeSelectedNumber(number);
    } else {
      if (status === 'available') {
        addSelectedNumber(number);
      }
    }
  };

  const getButtonClass = (number: number) => {
    const status = numberStatus[number]?.status || 'available';
    const isSelected = selectedNumbers.has(number);
    
    if (isSelected) return 'number-btn selected';
    if (status === 'unavailable') return 'number-btn unavailable';
    return 'number-btn available';
  };

  const clearSearch = () => {
    setSearchNumber('');
  };

  const searchSpecificNumber = () => {
    if (searchNumber.trim()) {
      const num = parseInt(searchNumber);
      if (num >= 1 && num <= 10000) {
        const element = document.querySelector(`[data-number="${num}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  if (loading) {
    return (
      <section className="numbers-section glass">
        <h2>Selecciona tus números</h2>
        <div id="numbersLoadingSpinner" className="numbers-loading">
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p>Cargando números...</p>
            <p className="loading-subtext">Generando 10,000 números disponibles</p>
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
            disabled={registrosBloquados || numberStatus[number]?.status === 'unavailable'}
          >
            {number.toString().padStart(4, '0')}
          </button>
        ))}
      </div>

      <p id="selectedCount" className="selected-count-text">
        Has seleccionado {selectedNumbers.size} números.
      </p>
    </section>
  );
}
