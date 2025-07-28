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
    connectionStatus,
    selectedNumbers,
    numberStatus,
    loading,
    registrosBloquados,
    addSelectedNumber,
    removeSelectedNumber,
    clearSelectedNumbers,
    getTotalPrice,
    updateNumberStatus,
    registros,
    setRegistros,
    tiempoTemporizadorMinutos,
    setTiempoTemporizadorMinutos,
    pricePerTicket,
    setPricePerTicket,
    registrosLoading,
    setRegistrosLoading,
    getContadorRegistros,
    cargarConfiguracion,
    numeroBuscado,
    setNumeroBuscado,
    resultadoBusqueda,
    setResultadoBusqueda,
  } = useRifaState();

  return (
    <>
      <Header connectionStatus={connectionStatus} />
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
          removeSelectedNumber={removeSelectedNumber}
        />

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
          pricePerTicket={pricePerTicket}
        />

        <div style={{ padding: '2rem', color: 'white' }}>
          <p>✅ Aplicación completa funcionando correctamente!</p>
          <p>Registros encontrados: {registros.length}</p>
          <p>Conexión: {connectionStatus}</p>
        </div>
      </main>
      
      <SupportModal />
    </>
  );
}
