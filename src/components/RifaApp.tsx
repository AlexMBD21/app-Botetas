'use client';

import React from 'react';
import { useRifaState } from '../hooks/useRifaState';
import Header from './Header';
import NumbersSection from './NumbersSection';
import RegistrationForm from './RegistrationForm';
import RegisteredRecords from './RegisteredRecords';
import NumberSearch from './NumberSearch';
import SupportModal from './SupportModal';

export default function RifaApp() {
  const {
    selectedNumbers,
    registros,
    numberStatus,
    loading,
    registrosLoading,
    pricePerTicket,
    tiempoTemporizadorMinutos,
    registrosBloquados,
    numeroBuscado,
    resultadoBusqueda,
    tieneAccesoRegistros,
    verificandoAcceso,
    connectionStatus,
    setRegistros,
    setRegistrosLoading,
    setPricePerTicket,
    setTiempoTemporizadorMinutos,
    setNumeroBuscado,
    setResultadoBusqueda,
    setConnectionStatus,
    addSelectedNumber,
    removeSelectedNumber,
    clearSelectedNumbers,
    getTotalPrice,
    getContadorRegistros,
    updateNumberStatus,
    cargarConfiguracion,
  } = useRifaState();

  return (
    <>
      <Header 
        connectionStatus={connectionStatus}
        setConnectionStatus={setConnectionStatus}
      />
      
      <main className="container">
        <NumbersSection
          selectedNumbers={selectedNumbers}
          numberStatus={numberStatus}
          loading={loading}
          addSelectedNumber={addSelectedNumber}
          removeSelectedNumber={removeSelectedNumber}
          registrosBloquados={registrosBloquados}
        />

        <RegistrationForm
          selectedNumbers={selectedNumbers}
          tiempoTemporizadorMinutos={tiempoTemporizadorMinutos}
          registrosBloquados={registrosBloquados}
          clearSelectedNumbers={clearSelectedNumbers}
          getTotalPrice={getTotalPrice}
          updateNumberStatus={updateNumberStatus}
          registros={registros}
          setRegistros={setRegistros}
        />

        {tieneAccesoRegistros && (
          <>
            <RegisteredRecords
              registros={registros}
              registrosLoading={registrosLoading}
              setRegistrosLoading={setRegistrosLoading}
              getContadorRegistros={getContadorRegistros}
              pricePerTicket={pricePerTicket}
              setPricePerTicket={setPricePerTicket}
              tiempoTemporizadorMinutos={tiempoTemporizadorMinutos}
              setTiempoTemporizadorMinutos={setTiempoTemporizadorMinutos}
              cargarConfiguracion={cargarConfiguracion}
              setRegistros={setRegistros}
              updateNumberStatus={updateNumberStatus}
            />

            <NumberSearch
              numeroBuscado={numeroBuscado}
              setNumeroBuscado={setNumeroBuscado}
              resultadoBusqueda={resultadoBusqueda}
              setResultadoBusqueda={setResultadoBusqueda}
              registros={registros}
              setRegistros={setRegistros}
              updateNumberStatus={updateNumberStatus}
            />
          </>
        )}

        {verificandoAcceso && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#ffffff' }}>
            <span style={{ fontSize: '2em' }}>⏳</span>
            <span> Verificando acceso...</span>
          </div>
        )}
      </main>

      <SupportModal />
    </>
  );
}
