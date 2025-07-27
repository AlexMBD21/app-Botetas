'use client';

import React, { useState, useCallback } from 'react';
import { guardarRegistroFirebase } from '../lib/realTime';
import { RegistroRifa } from '../types';

interface RegistrationFormProps {
  selectedNumbers: Set<number>;
  tiempoTemporizadorMinutos: number;
  registrosBloquados: boolean;
  clearSelectedNumbers: () => void;
  getTotalPrice: () => number;
  updateNumberStatus: (registros: RegistroRifa[]) => void;
  registros: RegistroRifa[];
  setRegistros: (registros: RegistroRifa[]) => void;
  removeSelectedNumber: (number: number) => void;
}

interface FormData {
  name: string;
  phone: string;
}

interface Notification {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

export default function RegistrationFormFixed({
  selectedNumbers,
  tiempoTemporizadorMinutos,
  registrosBloquados,
  clearSelectedNumbers,
  getTotalPrice,
  updateNumberStatus,
  registros,
  setRegistros,
  removeSelectedNumber,
}: RegistrationFormProps) {
  const [formData, setFormData] = useState<FormData>({ name: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<Notification>({ message: '', type: 'success', visible: false });
  const [phoneWarning, setPhoneWarning] = useState<string>(''); // Estado para mostrar advertencia de teléfono

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    
    // REMOVIDO: Verificación de teléfono en tiempo real para evitar mostrar mensaje automáticamente
    // Solo limpiar warning cuando se modifica el teléfono
    if (id === 'phone') {
      setPhoneWarning('');
    }
  };

  // Función para mostrar notificación usando React state
  const mostrarNotificacion = useCallback((mensaje: string, tipo: 'success' | 'error' = 'success') => {
    setNotification({ message: mensaje, type: tipo, visible: true });
    
    // NO auto-hide - solo se cierra con el botón
  }, []);

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, visible: false }));
  };

  // REMOVIDO: Efecto para revisar la advertencia cuando cambien los registros
  // Para evitar que aparezca el mensaje automáticamente mientras el usuario escribe
  // useEffect(() => {
  //   if (formData.phone.length === 10) {
  //     const telefonoExistente = registros.find(registro => 
  //       registro.phone === formData.phone && 
  //       (registro.status === 'pending' || registro.status === 'verified')
  //     );
  //     
  //     if (telefonoExistente) {
  //       setPhoneWarning(`⚠️ Este teléfono ya está registrado`);
  //     } else {
  //       setPhoneWarning('');
  //     }
  //   }
  // }, [registros, formData.phone]); // Se ejecuta cuando cambian los registros o el teléfono

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ocultar cualquier notificación anterior
    setNotification(prev => ({ ...prev, visible: false }));
    
    if (selectedNumbers.size === 0) {
      mostrarNotificacion('Debes seleccionar al menos un número.', 'error');
      return;
    }

    if (!formData.name.trim()) {
      mostrarNotificacion('El nombre es obligatorio.', 'error');
      return;
    }

    if (!formData.phone.trim() || !/^[0-9]{10}$/.test(formData.phone)) {
      mostrarNotificacion('El teléfono debe tener exactamente 10 dígitos.', 'error');
      return;
    }

    // NUEVA VALIDACIÓN: Verificar si el teléfono ya está registrado
    const telefonoExistente = registros.find(registro => 
      registro.phone === formData.phone.trim() && 
      (registro.status === 'pending' || registro.status === 'verified')
    );
    
    if (telefonoExistente) {
      mostrarNotificacion(
        `Este número de teléfono ya está registrado`, 
        'error'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const registro: RegistroRifa = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        numbers: Array.from(selectedNumbers),
        timestamp: Date.now(),
        status: 'pending',
        timeoutEnd: Date.now() + (tiempoTemporizadorMinutos * 60 * 1000)
      };

      await guardarRegistroFirebase(registro);
      
      // Actualizar registros locales
      const nuevosRegistros = [...registros, registro];
      setRegistros(nuevosRegistros);
      updateNumberStatus(nuevosRegistros);

      // Limpiar formulario
      setFormData({ name: '', phone: '' });
      clearSelectedNumbers();

      // Mostrar notificación de éxito
      mostrarNotificacion(`Tienes ${tiempoTemporizadorMinutos} minutos para realizar el pago, recuerda poner tu número de celular en el mensaje de pago para encontrarte rápidamente. ¡Mucha suerte! ✨`, 'success');

    } catch (error) {
      console.error('Error al guardar registro:', error);
      mostrarNotificacion('Error al registrar. Inténtalo de nuevo.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="form-section glass">
      <h2>Registra tus números</h2>
      
     

      <form id="registrationForm" onSubmit={handleSubmit}>
        <label htmlFor="name">Nombre</label>
        <input
          type="text"
          id="name"
          placeholder="Tu nombre completo"
          pattern="[A-Za-zÀ-ÿ\u00f1\u00d1\s]+"
          title="Solo se permiten letras y espacios"
          minLength={2}
          maxLength={50}
          value={formData.name}
          onChange={handleInputChange}
          required
        />

        <label htmlFor="phone">Teléfono</label>
        <input
          type="tel"
          id="phone"
          placeholder="Ej: 3001234567"
          pattern="[0-9]{10}"
          title="Debe tener exactamente 10 dígitos (solo números)"
          minLength={10}
          maxLength={10}
          value={formData.phone}
          onChange={handleInputChange}
          required
          style={{
            borderColor: phoneWarning ? '#dc3545' : undefined
          }}
        />
        
        {/* Mostrar advertencia de teléfono duplicado */}
        {phoneWarning && (
          <div style={{
            color: '#dc3545',
            fontSize: '0.8rem',
            marginTop: '0.25rem',
            marginBottom: '0.5rem',
            padding: '0.5rem',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}>
            {phoneWarning}
          </div>
        )}

        <div id="selectedNumbers">
          {selectedNumbers.size > 0 && (
            <div className="selected-numbers-display">
              <h3>Números seleccionados:</h3>
              <div className="selected-numbers-list">
                {Array.from(selectedNumbers)
                  .sort((a, b) => a - b)
                  .map(number => (
                    <span key={number} className="selected-number-item">
                      {number.toString().padStart(4, '0')}
                      <button
                        type="button"
                        onClick={() => removeSelectedNumber(number)}
                        className="remove-number-btn"
                        title="Quitar número"
                      >
                        ✖
                      </button>
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        <p id="totalDisplay">Total a pagar: ${getTotalPrice().toLocaleString()}</p>
        
        <button
          type="submit"
          disabled={isSubmitting || registrosBloquados || (phoneWarning !== '' && selectedNumbers.size > 0)}
          style={{
            opacity: (phoneWarning !== '' && selectedNumbers.size > 0) ? 0.5 : undefined,
            cursor: (phoneWarning !== '' && selectedNumbers.size > 0) ? 'not-allowed' : undefined
          }}
        >
          {isSubmitting ? 'Registrando...' : 
           (phoneWarning !== '' && selectedNumbers.size > 0) ? 'Teléfono ya registrado' : 
           'Registrar'}
        </button>
      </form>

       {notification.visible && (
        <div className={`form-notification ${notification.type}`}>
          {notification.type === 'success' ? (
            <div className="notification-content">
              <button className="notification-close" onClick={hideNotification}>✖</button>
              <span className="notification-icon">❤️</span>
              <div className="notification-text">
                <div className="notification-title">Registro realizado</div>
                <div className="notification-subtitle">{notification.message}</div>
                <div className="payment-info">
                  <div className="payment-section">
                    <div className="payment-header">💳 Bancolombia</div>
                    <div className="payment-number">1234-5678-9012</div>
                  </div>
                  <div className="payment-section">
                    <div className="payment-header">📱 Nequi</div>
                    <div className="payment-number">321 456 7890</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="notification-content-error">
              <span className="notification-icon-error">✖</span>
              <div className="notification-text-error">
                <div className="notification-message">{notification.message}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
