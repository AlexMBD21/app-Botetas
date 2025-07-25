'use client';

import React, { useState } from 'react';
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
}

interface FormData {
  name: string;
  phone: string;
}

export default function RegistrationForm({
  selectedNumbers,
  tiempoTemporizadorMinutos,
  registrosBloquados,
  clearSelectedNumbers,
  getTotalPrice,
  updateNumberStatus,
  registros,
  setRegistros,
}: RegistrationFormProps) {
  const [formData, setFormData] = useState<FormData>({ name: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const mostrarNotificacionFormulario = (mensaje: string, tipo: 'success' | 'error' = 'success') => {
    // Buscar notificación anterior
    const notificacionAnterior = document.querySelector('.form-notification');
    if (notificacionAnterior) {
      notificacionAnterior.remove();
    }

    // Crear nueva notificación
    const form = document.getElementById('registrationForm');
    if (!form) return;

    const notificacion = document.createElement('div');
    notificacion.className = `form-notification ${tipo}`;
    notificacion.innerHTML = `
      <div class="notification-content">
        <button class="notification-close">✖</button>
        <span class="notification-icon">❤️</span>
        <div class="notification-text">
          <div class="notification-title">Registro realizado</div>
          <div class="notification-subtitle">Tienes ${tiempoTemporizadorMinutos} minutos para realizar el pago, recuerda poner tu número de celular en el mensaje de pago para encontrarte rápidamente. ¡Mucha suerte!✨</div>
          <div class="payment-info">
            <div class="payment-section">
              <div class="payment-header">💳 Cuenta Bancolombia</div>
              <div class="payment-number">1234-5678-9012</div>
            </div>
            <div class="payment-section">
              <div class="payment-header">📱 Nequi</div>
              <div class="payment-number">321 456 7890</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Estilos aplicados dinámicamente
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      .form-notification {
        position: relative;
        background: linear-gradient(135deg, #00c851, #007e33);
        color: white;
        padding: 24px 28px;
        border-radius: 12px;
        margin-top: 20px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 16px;
        font-weight: 600;
        transform: translateY(-30px);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border: 1px solid rgba(255,255,255,0.2);
        backdrop-filter: blur(10px);
        min-width: 400px;
        max-width: 100%;
        box-sizing: border-box;
      }
    `;
    document.head.appendChild(styleSheet);

    // Funcionalidad del botón cerrar
    const closeBtn = notificacion.querySelector('.notification-close') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => {
      notificacion.style.transform = 'translateY(-30px)';
      notificacion.style.opacity = '0';
      setTimeout(() => notificacion.remove(), 300);
    });

    // Insertar después del formulario
    form.parentNode?.insertBefore(notificacion, form.nextSibling);

    // Animación de entrada
    setTimeout(() => {
      notificacion.style.transform = 'translateY(0)';
      notificacion.style.opacity = '1';
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registrosBloquados) {
      alert('Los registros están cerrados.');
      return;
    }

    if (selectedNumbers.size === 0) {
      alert('Debes seleccionar al menos un número.');
      return;
    }

    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Todos los campos son obligatorios.');
      return;
    }

    setIsSubmitting(true);

    try {
      const timestamp = Date.now();
      const timeoutEnd = timestamp + (tiempoTemporizadorMinutos * 60 * 1000);
      
      const nuevoRegistro: RegistroRifa = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        numbers: Array.from(selectedNumbers),
        timestamp,
        timeoutEnd,
        status: 'pending'
      };

      await guardarRegistroFirebase(nuevoRegistro);
      
      // Actualizar estado local
      const nuevosRegistros = [...registros, nuevoRegistro];
      setRegistros(nuevosRegistros);
      updateNumberStatus(nuevosRegistros);

      // Limpiar formulario
      setFormData({ name: '', phone: '' });
      clearSelectedNumbers();

      // Mostrar notificación
      mostrarNotificacionFormulario('Registro realizado exitosamente');
      
      setConfirmation(`¡Registro exitoso! Tienes ${tiempoTemporizadorMinutos} minutos para confirmar el pago.`);
      setTimeout(() => setConfirmation(''), 5000);

    } catch (error) {
      console.error('Error al guardar registro:', error);
      alert('Error al registrar. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeSelectedNumber = (number: number) => {
    const newSelected = new Set(selectedNumbers);
    newSelected.delete(number);
    // Este método debería venir de props, pero como workaround:
    const event = new CustomEvent('removeNumber', { detail: number });
    window.dispatchEvent(event);
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
        />

        <div id="selectedNumbers">
          {Array.from(selectedNumbers).map(number => (
            <span key={number} className="selected-number">
              {number.toString().padStart(4, '0')}
              <button 
                type="button" 
                onClick={() => removeSelectedNumber(number)}
                aria-label={`Quitar número ${number}`}
              >
                ✖
              </button>
            </span>
          ))}
        </div>

        <p id="totalDisplay">Total a pagar: ${getTotalPrice().toLocaleString()}</p>
        
        <button type="submit" disabled={isSubmitting || registrosBloquados}>
          {isSubmitting ? 'Registrando...' : 'Registrar'}
        </button>
      </form>
      
      {confirmation && (
        <div id="confirmation">
          <div>{confirmation}</div>
        </div>
      )}
    </section>
  );
}
