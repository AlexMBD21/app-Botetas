'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export default function SupportModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openSupportModal = () => {
    setIsModalOpen(true);
    document.body.classList.add('modal-open');
  };

  const closeSupportModal = () => {
    setIsModalOpen(false);
    document.body.classList.remove('modal-open');
  };

  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeSupportModal();
    }
  };

  return (
    <>
      {/* Botón flotante de información/tutorial */}
      <div className={`support-float ${isModalOpen ? 'hidden' : ''}`} id="supportFloat">
        <div className="support-icon" onClick={openSupportModal}>
          <span className="support-emoji">💡</span>
          <div className="support-pulse"></div>
        </div>
        <div className="support-tooltip">¿Cómo usar?</div>
      </div>

      {/* Modal de información/tutorial */}
      {isModalOpen && (
        <div className="support-modal" id="supportModal" onClick={handleModalClick}>
          <div className="support-modal-content">
            <div className="support-header">
              <h3>¿Cómo participar en la rifa?</h3>
              <button className="close-modal" onClick={closeSupportModal}>✖</button>
            </div>
            <div className="support-body">
              <div className="color-meanings">
                <h4>📋 Significado de los colores:</h4>
                <div className="color-legend">
                  <div className="color-item">
                    <div className="color-circle green"></div>
                    <div className="color-text">
                      <div className="color-name">Verde</div>
                      <div className="color-description">Números disponibles para seleccionar</div>
                    </div>
                  </div>
                  <div className="color-item">
                    <div className="color-circle blue"></div>
                    <div className="color-text">
                      <div className="color-name">Azul</div>
                      <div className="color-description">Números seleccionados (pendientes de pago)</div>
                    </div>
                  </div>
                  <div className="color-item">
                    <div className="color-circle red"></div>
                    <div className="color-text">
                      <div className="color-name">Rojo</div>
                      <div className="color-description">Números ya vendidos (no disponibles)</div>
                    </div>
                  </div>
                  <div className="color-item">
                    <div className="color-circle gray"></div>
                    <div className="color-text">
                      <div className="color-name">Gris</div>
                      <div className="color-description">Registros cerrados</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="support-options">
                <div className="support-option step">
                  <div className="support-icon-text">🎯</div>
                  <div>
                    <strong>Paso 1: Selecciona tus números</strong>
                    <span>Haz clic en los números verdes que quieras para tu rifa. Puedes seleccionar varios.</span>
                  </div>
                  <div className="step-media">
                    <Image src="/paso_1.gif" alt="Seleccionar números" className="step-gif" width={300} height={200} unoptimized />
                  </div>
                </div>

                <div className="support-option step">
                  <div className="support-icon-text">📝</div>
                  <div>
                    <strong>Paso 2: Registra tus datos</strong>
                    <span>Completa el formulario con tu nombre y teléfono para registrar tu participación.</span>
                  </div>
                  <div className="step-media">
                    <Image src="/paso_2.gif" alt="Registrar datos" className="step-gif" width={300} height={200} unoptimized />
                  </div>
                </div>

                <div className="support-option step">
                  <div className="support-icon-text">💰</div>
                  <div>
                    <strong>Paso 3: Realiza el pago</strong>
                    <span>Tienes 30 minutos para transferir el dinero. Incluye tu número de celular en el mensaje.</span>
                  </div>
                  <div className="step-media">
                    <Image src="/paso_3.png" alt="Realizar pago" className="step-image" width={300} height={200} />
                  </div>
                </div>
              </div>

              <div className="support-options">
                <div className="support-option whatsapp">
                  <div className="support-icon-text">📱</div>
                  <div>
                    <strong>WhatsApp</strong>
                    <span>+57 300 123 4567</span>
                  </div>
                </div>

                <div className="support-option email">
                  <div className="support-icon-text">📧</div>
                  <div>
                    <strong>Email</strong>
                    <span>soporte@rifas.com</span>
                  </div>
                </div>

                <div className="support-option phone">
                  <div className="support-icon-text">📞</div>
                  <div>
                    <strong>Teléfono</strong>
                    <span>+57 1 234 5678</span>
                  </div>
                </div>
              </div>

              <div className="support-hours">
                <p><strong>Horarios de atención:</strong></p>
                <p>Lunes a Viernes: 8:00 AM - 6:00 PM</p>
                <p>Sábados: 9:00 AM - 2:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
