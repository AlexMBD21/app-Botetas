// Selección de elementos clave del DOM (se inicializarán en DOMContentLoaded)
let grid;
const selectedNumbers = new Set();
let selectedNumbersDisplay;
let totalDisplay;
let form;
let registrosList;

// Configuración
const pricePerTicket = 4000;
const timeoutMs = 30 * 60 * 1000; // 30 minutos
const numberStatus = {}; // Estado por número

// CONFIGURACIÓN DE FECHA LÍMITE PARA REGISTROS
// Fecha y hora del sorteo (formato: YYYY-MM-DD HH:MM:SS en hora local)
let FECHA_SORTEO = '2025-07-30 20:00:00'; // Fecha por defecto
let HORAS_ANTES_BLOQUEO = 2; // Horas antes del sorteo para bloquear registros

// Variables de control de bloqueo
let registrosBloquados = false;
let fechaLimiteRegistros = null;

// Variables globales para búsqueda
let busquedaNumeroInput;
let busquedaNumeroBtn;
let clearBusquedaBtn;
let resultadoBusqueda;
let registrosGlobal = [];
let numeroBuscado = '';

// Variables globales para indicador de conexión
let connectionLight;
let connectionText;

// Función para mostrar notificaciones tipo toast
function mostrarNotificacion(mensaje, tipo = 'success', duracion = 4000) {
  // Crear elemento de notificación
  const notificacion = document.createElement('div');
  notificacion.className = `notification ${tipo}`;
  notificacion.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : 'ℹ️'}</span>
      <span class="notification-message">${mensaje}</span>
    </div>
  `;
  
  // Estilos inline para la notificación
  notificacion.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${tipo === 'success' ? 'linear-gradient(135deg, #4CAF50, #45a049)' : 
                tipo === 'error' ? 'linear-gradient(135deg, #f44336, #da190b)' : 
                'linear-gradient(135deg, #2196F3, #1976D2)'};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    min-width: 300px;
    max-width: 500px;
    transform: translateX(400px);
    transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
    opacity: 0;
  `;
  
  // Estilos para el contenido
  const content = notificacion.querySelector('.notification-content');
  content.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
  `;
  
  const icon = notificacion.querySelector('.notification-icon');
  icon.style.cssText = `
    font-size: 18px;
    flex-shrink: 0;
  `;
  
  const message = notificacion.querySelector('.notification-message');
  message.style.cssText = `
    flex: 1;
    line-height: 1.4;
  `;
  
  // Agregar al DOM
  document.body.appendChild(notificacion);
  
  // Animación de entrada
  setTimeout(() => {
    notificacion.style.transform = 'translateX(0)';
    notificacion.style.opacity = '1';
  }, 100);
  
  // Eliminar después del tiempo especificado
  setTimeout(() => {
    notificacion.style.transform = 'translateX(400px)';
    notificacion.style.opacity = '0';
    setTimeout(() => {
      if (notificacion.parentNode) {
        notificacion.parentNode.removeChild(notificacion);
      }
    }, 300);
  }, duracion);
  
  return notificacion;
}

// Función para mostrar notificación debajo del formulario
function mostrarNotificacionFormulario(mensaje, tipo = 'success', duracion = null) {
  const form = document.getElementById('registrationForm');
  if (!form) return;
  
  // Eliminar notificación anterior si existe
  const notificacionAnterior = document.querySelector('.form-notification');
  if (notificacionAnterior) {
    notificacionAnterior.remove();
  }
  
  // Crear nueva notificación
  const notificacion = document.createElement('div');
  notificacion.className = `form-notification ${tipo}`;
  notificacion.innerHTML = `
    <div class="notification-content">
      <button class="notification-close">✖</button>
      <span class="notification-icon">❤️</span>
      <div class="notification-text">
        <div class="notification-title">Registro realizado</div>
        <div class="notification-subtitle">Tienes 30 minutos para realizar el pago, recuerda poner tu número de celular en el mensaje de pago para encontrarte rápidamente. ¡Mucha suerte!✨</div>
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
  
  // Estilos para la notificación del formulario
  notificacion.style.cssText = `
    position: relative;
    background: ${tipo === 'success' ? 'linear-gradient(135deg, #00c851, #007e33)' : 
                tipo === 'error' ? 'linear-gradient(135deg, #ff4444, #cc0000)' : 
                'linear-gradient(135deg, #33b5e5, #0099cc)'};
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
  `;
  
  // Estilos para el contenido
  const content = notificacion.querySelector('.notification-content');
  content.style.cssText = `
    display: flex;
    align-items: flex-start;
    gap: 16px;
    position: relative;
  `;
  
  const closeBtn = notificacion.querySelector('.notification-close');
  closeBtn.style.cssText = `
    position: absolute;
    top: -12px;
    right: -12px;
    background: rgba(255,255,255,0.9);
    color: #333;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  
  // Funcionalidad del botón cerrar
  closeBtn.addEventListener('click', () => {
    notificacion.style.transform = 'translateY(-30px)';
    notificacion.style.opacity = '0';
    setTimeout(() => {
      if (notificacion.parentNode) {
        notificacion.parentNode.removeChild(notificacion);
      }
    }, 400);
  });
  
  // Efecto hover para el botón cerrar
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = 'rgba(255,255,255,1)';
    closeBtn.style.transform = 'scale(1.1)';
  });
  
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'rgba(255,255,255,0.9)';
    closeBtn.style.transform = 'scale(1)';
  });
  
  const icon = notificacion.querySelector('.notification-icon');
  icon.style.cssText = `
    font-size: 20px;
    flex-shrink: 0;
    margin-top: 2px;
  `;
  
  const textContainer = notificacion.querySelector('.notification-text');
  textContainer.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  `;
  
  const title = notificacion.querySelector('.notification-title');
  title.style.cssText = `
    font-size: 18px;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 2px;
  `;
  
  const subtitle = notificacion.querySelector('.notification-subtitle');
  subtitle.style.cssText = `
    font-size: 14px;
    font-weight: 400;
    line-height: 1.4;
    opacity: 0.95;
    margin-bottom: 12px;
  `;
  
  const paymentInfo = notificacion.querySelector('.payment-info');
  paymentInfo.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255,255,255,0.3);
  `;
  
  const paymentSections = notificacion.querySelectorAll('.payment-section');
  paymentSections.forEach(section => {
    section.style.cssText = `
      background: rgba(255,255,255,0.15);
      padding: 8px 12px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.2);
    `;
  });
  
  const paymentHeaders = notificacion.querySelectorAll('.payment-header');
  paymentHeaders.forEach(header => {
    header.style.cssText = `
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 4px;
      opacity: 0.9;
    `;
  });
  
  const paymentNumbers = notificacion.querySelectorAll('.payment-number');
  paymentNumbers.forEach(number => {
    number.style.cssText = `
      font-size: 13px;
      font-weight: 700;
      font-family: 'Courier New', monospace;
      letter-spacing: 0.5px;
      color: #fff;
    `;
  });
  
  // Insertar después del formulario
  form.parentNode.insertBefore(notificacion, form.nextSibling);
  
  // Animación de entrada
  setTimeout(() => {
    notificacion.style.transform = 'translateY(0)';
    notificacion.style.opacity = '1';
  }, 50);
  
  // La notificación permanece hasta que el usuario la cierre manualmente
  // No hay cierre automático para dar tiempo a copiar los números de cuenta
  
  return notificacion;
}

// =============== FUNCIONES DE CONTROL DE FECHA LÍMITE ===============

// Cargar configuración desde Firebase
function cargarConfiguracionDesdeFirebase() {
  if (typeof obtenerConfiguracionSorteo !== 'undefined') {
    obtenerConfiguracionSorteo((config) => {
      if (config && config.fechaSorteo) {
        console.log('Configuración cargada desde Firebase:', config);
        FECHA_SORTEO = config.fechaSorteo;
        HORAS_ANTES_BLOQUEO = config.horasAntesBloqueo || 2;
        
        // Recalcular con la nueva configuración
        calcularFechaLimiteRegistros();
        
        // Verificar si los registros deben estar bloqueados
        if (verificarBloqueoRegistros()) {
          mostrarMensajeBloqueo();
        } else {
          iniciarContadorRegresivo();
        }
      } else {
        console.log('No hay configuración en Firebase, usando valores por defecto');
        calcularFechaLimiteRegistros();
        iniciarContadorRegresivo();
      }
    });
  } else {
    console.log('Función obtenerConfiguracionSorteo no disponible, usando valores por defecto');
    calcularFechaLimiteRegistros();
    iniciarContadorRegresivo();
  }
}

// Calcular fecha límite para registros
function calcularFechaLimiteRegistros() {
  try {
    // Parsear la fecha del sorteo
    const [fecha, hora] = FECHA_SORTEO.split(' ');
    const [año, mes, dia] = fecha.split('-');
    const [horas, minutos, segundos] = hora.split(':');
    
    // Crear fecha del sorteo
    const fechaSorteo = new Date(año, mes - 1, dia, horas, minutos, segundos);
    
    // Calcular fecha límite (X horas antes del sorteo)
    fechaLimiteRegistros = new Date(fechaSorteo.getTime() - (HORAS_ANTES_BLOQUEO * 60 * 60 * 1000));
    
    console.log('Fecha del sorteo:', fechaSorteo.toLocaleString());
    console.log('Fecha límite para registros:', fechaLimiteRegistros.toLocaleString());
    
    return fechaLimiteRegistros;
  } catch (error) {
    console.error('Error al calcular fecha límite:', error);
    return null;
  }
}

// Verificar si los registros están bloqueados
function verificarBloqueoRegistros() {
  if (!fechaLimiteRegistros) {
    calcularFechaLimiteRegistros();
  }
  
  if (!fechaLimiteRegistros) {
    console.error('No se pudo calcular la fecha límite');
    return false;
  }
  
  const ahora = new Date();
  registrosBloquados = ahora >= fechaLimiteRegistros;
  
  if (registrosBloquados) {
    console.log('REGISTROS BLOQUEADOS - Fecha límite alcanzada');
  }
  
  return registrosBloquados;
}

// Mostrar mensaje de bloqueo en la interfaz
function mostrarMensajeBloqueo() {
  const formSection = document.querySelector('.form-section');
  const numbersSection = document.querySelector('.numbers-section');
  
  if (formSection && numbersSection) {
    // Crear mensaje de bloqueo
    const mensajeBloqueo = document.createElement('div');
    mensajeBloqueo.id = 'mensajeBloqueoRegistros';
    mensajeBloqueo.style.cssText = `
      background: linear-gradient(135deg, #dc3545, #c82333);
      color: white;
      padding: 2rem;
      border-radius: 15px;
      text-align: center;
      margin: 2rem 0;
      border: 2px solid #a71e2a;
      box-shadow: 0 8px 20px rgba(220, 53, 69, 0.3);
    `;
    
    const fechaSorteoLocal = new Date(FECHA_SORTEO.replace(' ', 'T')).toLocaleString();
    
    mensajeBloqueo.innerHTML = `
      <h2 style="margin-bottom: 1rem; font-size: 1.8rem;">🚫 REGISTROS CERRADOS</h2>
      <p style="font-size: 1.2rem; margin-bottom: 1rem;">
        Los registros han sido bloqueados porque se ha alcanzado la fecha límite.
      </p>
      <p style="font-size: 1rem; opacity: 0.9;">
        <strong>Fecha del sorteo:</strong> ${fechaSorteoLocal}
      </p>
      <p style="font-size: 0.9rem; opacity: 0.8; margin-top: 1rem;">
        Los registros se cerraron ${HORAS_ANTES_BLOQUEO} hora${HORAS_ANTES_BLOQUEO !== 1 ? 's' : ''} antes del sorteo para garantizar la transparencia.
      </p>
    `;
    
    // Deshabilitar selección de números
    const numberGrid = document.getElementById('numberGrid');
    if (numberGrid) {
      numberGrid.style.pointerEvents = 'none';
      numberGrid.style.opacity = '0.5';
    }
    
    // Deshabilitar formulario
    const form = document.getElementById('registrationForm');
    if (form) {
      const inputs = form.querySelectorAll('input, button');
      inputs.forEach(input => input.disabled = true);
      form.style.opacity = '0.5';
    }
    
    // Insertar mensaje antes del formulario
    formSection.parentNode.insertBefore(mensajeBloqueo, formSection);
  }
}

// Actualizar contador regresivo en tiempo real
function iniciarContadorRegresivo() {
  if (!fechaLimiteRegistros) return;
  
  const actualizarContador = () => {
    const ahora = new Date();
    const tiempoRestante = fechaLimiteRegistros.getTime() - ahora.getTime();
    
    if (tiempoRestante <= 0) {
      if (!registrosBloquados) {
        registrosBloquados = true;
        mostrarMensajeBloqueo();
      }
      return;
    }
    
    // Mostrar contador en el header si quedan menos de 24 horas
    if (tiempoRestante <= 24 * 60 * 60 * 1000) {
      mostrarContadorEnHeader(tiempoRestante);
    }
  };
  
  // Actualizar inmediatamente y luego cada minuto
  actualizarContador();
  setInterval(actualizarContador, 60000); // Cada minuto
}

// Mostrar contador regresivo en el header
function mostrarContadorEnHeader(tiempoRestante) {
  const header = document.querySelector('header h1');
  if (!header) return;
  
  const horas = Math.floor(tiempoRestante / (1000 * 60 * 60));
  const minutos = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));
  
  let contadorExistente = document.getElementById('contadorRegistros');
  if (!contadorExistente) {
    contadorExistente = document.createElement('div');
    contadorExistente.id = 'contadorRegistros';
    contadorExistente.style.cssText = `
      font-size: 0.8rem;
      color: #ffc107;
      margin-top: 0.5rem;
      font-weight: bold;
    `;
    header.appendChild(contadorExistente);
  }
  
  if (horas > 0) {
    contadorExistente.textContent = `⏰ Registros cierran en: ${horas}h ${minutos}m`;
  } else {
    contadorExistente.textContent = `⏰ Registros cierran en: ${minutos} minutos`;
  }
  
  // Cambiar color si queda menos de 1 hora
  if (horas === 0) {
    contadorExistente.style.color = '#dc3545';
  }
}

// Funciones para manejar el indicador de conexión
function updateConnectionStatus(status, message) {
  if (!connectionLight || !connectionText) {
    connectionLight = document.getElementById('connectionLight');
    connectionText = document.getElementById('connectionText');
  }
  
  if (connectionLight && connectionText) {
    // Limpiar clases anteriores
    connectionLight.className = 'connection-light';
    
    // Agregar nueva clase
    connectionLight.classList.add(status);
    connectionText.textContent = message;
  }
}

// Crear botón del número
function createButton(number) {
  const btn = document.createElement('button');
  btn.textContent = number.toString().padStart(4, '0');
  btn.dataset.number = number;

  const estado = numberStatus[number];

  // Asigna clase y bloqueo según estado
  if (estado === 'confirmed') {
    btn.className = 'number-btn unavailable';
    btn.disabled = true;
  } else if (estado === 'pending') {
    btn.className = 'number-btn pending';
    btn.disabled = true;
  } else {
    btn.className = 'number-btn available';
  }

  // Interacción de usuario solo si está disponible
  btn.addEventListener('click', () => {
    // VERIFICAR BLOQUEO DE REGISTROS ANTES DE PERMITIR SELECCIÓN
    if (verificarBloqueoRegistros()) {
      alert('🚫 SELECCIÓN BLOQUEADA\n\nNo se pueden seleccionar números porque los registros han sido cerrados.\n\nLa fecha límite del sorteo ha sido alcanzada.');
      return;
    }

    const estadoActual = numberStatus[number];
    if (estadoActual === 'pending' || estadoActual === 'confirmed') return;

    if (selectedNumbers.has(number)) {
      selectedNumbers.delete(number);
      btn.className = 'number-btn available';
    } else {
      selectedNumbers.add(number);
      btn.className = 'number-btn selected';
    }

    renderSelectedNumbers();
    updateTotal();
  });

  return btn;
}

// Renderizar selección
function renderSelectedNumbers() {
  selectedNumbersDisplay.innerHTML = '';
  selectedNumbers.forEach(num => {
    const div = document.createElement('div');
    div.className = 'selected-number';
    div.innerHTML = `${num.toString().padStart(4, '0')} <button onclick="removeSelected(${num})">x</button>`;
    selectedNumbersDisplay.appendChild(div);
  });
}

// Eliminar número seleccionado
function removeSelected(num) {
  selectedNumbers.delete(num);
  const btn = document.querySelector(`button[data-number='${num}']`);
  if (btn) btn.className = 'number-btn available';
  renderSelectedNumbers();
  updateTotal();
}

// Actualizar total y cantidad seleccionada
function updateTotal() {
  totalDisplay.textContent = `Total a pagar: $${selectedNumbers.size * pricePerTicket}`;
  const countDisplay = document.getElementById('selectedCount');
  if (countDisplay) {
    countDisplay.textContent = `Has seleccionado ${selectedNumbers.size} número${selectedNumbers.size !== 1 ? 's' : ''}.`;
  }
}

// Crear temporizador visual (función corregida)
function crearTemporizadorVisual(timestampLimite, onExpire, contenedor, registroId) {
  const temporizador = document.createElement('span');
  temporizador.className = 'temporizador';
  contenedor.appendChild(temporizador);

  const interval = setInterval(() => {
    const ahora = Date.now();
    const restante = timestampLimite - ahora;
    
    if (restante <= 0) {
      clearInterval(interval);
      temporizador.textContent = '⏰ Expirado';
      temporizador.style.color = '#dc3545';
      temporizador.style.fontWeight = 'bold';
      
      // Ejecutar callback de expiración
      if (typeof onExpire === 'function') {
        console.log('Ejecutando callback de expiración para registro:', registroId);
        onExpire();
      }
      return;
    }
    
    const h = String(Math.floor(restante / 3600000)).padStart(2, '0');
    const m = String(Math.floor((restante % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((restante % 60000) / 1000)).padStart(2, '0');
    temporizador.textContent = `⏳ ${h}:${m}:${s}`;
  }, 1000);

  return { temporizador, interval };
}

// Función para renderizar registro (parte corregida del temporizador)
function renderRegistro(registro, highlightNum = '') {
  if (!registro || !registro.name) return;

  console.log('Renderizando registro:', {
    name: registro.name,
    estado: registro.estado,
    expiraEn: registro.expiraEn,
    tiempoRestante: registro.expiraEn ? registro.expiraEn - Date.now() : 'N/A',
    id: registro.id
  });

  const { name, phone, numbers, timestamp, expiraEn, estado, id } = registro;

  const item = document.createElement('div');
  item.className = 'registro-item';
  item.dataset.timestamp = timestamp;
  item.dataset.registroId = id; // Agregar ID del registro
  item.style.position = 'relative';
  
  let numerosHTML = '';
  if (Array.isArray(numbers)) {
    numerosHTML = numbers.map(n => {
      let numStr = typeof n === 'number' ? n.toString().padStart(4, '0') : String(n).padStart(4, '0');
      if (highlightNum && numStr === highlightNum) {
        return `<span style="background:#ffc107;color:#222;padding:2px 6px;border-radius:8px;font-weight:bold;">${numStr}</span>`;
      }
      return numStr;
    }).join(', ');
  }

  item.innerHTML = `
    <strong>${name}</strong>
    <span>📞 ${phone}</span>
    <span>🎟️ Números: ${numerosHTML}</span>
    <span>💰 Total: $${numbers ? numbers.length * pricePerTicket : 0}</span>
  `;

  // Función para eliminar registro completamente
  function eliminarRegistroCompleto() {
    console.log('Eliminando registro completo:', name, id);
    
    // Liberar números
    if (Array.isArray(numbers)) {
      numbers.forEach(num => {
        numberStatus[num] = 'available';
        const btn = document.querySelector(`button[data-number='${num}']`);
        if (btn) {
          btn.className = 'number-btn available';
          btn.disabled = false;
        }
      });
    }
    
    // Eliminar de Firebase
    if (id && typeof eliminarRegistroFirebase !== 'undefined') {
      console.log('Eliminando de Firebase:', id);
      eliminarRegistroFirebase(id);
    }
    
    // Eliminar del DOM
    if (item.parentNode) {
      item.parentNode.removeChild(item);
    }
    
    // Actualizar contador de pendientes
    const pendientesElement = document.getElementById('pendientesCount');
    if (pendientesElement) {
      const currentCount = parseInt(pendientesElement.textContent) || 0;
      pendientesElement.textContent = Math.max(0, currentCount - 1);
    }
  }

  // Botón eliminar en la esquina superior derecha
  const eliminarBtnTop = document.createElement('button');
  eliminarBtnTop.textContent = '✖';
  eliminarBtnTop.title = 'Eliminar registro';
  eliminarBtnTop.style.position = 'absolute';
  eliminarBtnTop.style.top = '8px';
  eliminarBtnTop.style.right = '8px';
  eliminarBtnTop.style.background = '#dc3545';
  eliminarBtnTop.style.color = 'white';
  eliminarBtnTop.style.border = 'none';
  eliminarBtnTop.style.borderRadius = '50%';
  eliminarBtnTop.style.width = '32px';
  eliminarBtnTop.style.height = '32px';
  eliminarBtnTop.style.cursor = 'pointer';
  eliminarBtnTop.style.fontSize = '1.2em';
  eliminarBtnTop.style.zIndex = '2';
  eliminarBtnTop.addEventListener('click', function(e) {
    e.stopPropagation();
    const confirmar = confirm('¿Seguro que deseas eliminar este registro?');
    if (confirmar) {
      eliminarRegistroCompleto();
    }
  });
  item.appendChild(eliminarBtnTop);

  // Botón confirmar pago y temporizador para registros pendientes
  let temporizadorControl = null;
  
  if (estado !== 'confirmed') {
    const confirmarBtn = document.createElement('button');
    confirmarBtn.textContent = 'Confirmar Pago';
    confirmarBtn.className = 'btn-verificar';
    confirmarBtn.style.backgroundColor = '#ffc107';
    confirmarBtn.style.color = 'black';
    confirmarBtn.style.margin = '5px';
    confirmarBtn.style.padding = '8px 16px';
    confirmarBtn.style.border = 'none';
    confirmarBtn.style.borderRadius = '4px';
    confirmarBtn.style.cursor = 'pointer';
    
    confirmarBtn.addEventListener('click', () => {
      console.log('Confirmando pago para:', name);
      
      // Marcar números como confirmados
      if (Array.isArray(numbers)) {
        numbers.forEach(num => {
          const btn = document.querySelector(`button[data-number='${num}']`);
          if (btn) {
            btn.className = 'number-btn unavailable';
            btn.disabled = true;
          }
          numberStatus[num] = 'confirmed';
        });
      }
      
      // Actualizar en Firebase
      if (id && typeof db !== 'undefined') {
        db.ref('registros/' + id).update({ estado: 'confirmed' });
      }
      
      // Remover botón de confirmar
      confirmarBtn.remove();
      
      // Limpiar temporizador si existe
      if (temporizadorControl) {
        clearInterval(temporizadorControl.interval);
        temporizadorControl.temporizador.textContent = '✅ Pago confirmado';
        temporizadorControl.temporizador.style.color = '#28a745';
        temporizadorControl.temporizador.style.fontWeight = 'bold';
      }
      
      // Actualizar contadores
      const pendientesElement = document.getElementById('pendientesCount');
      const confirmadosElement = document.getElementById('confirmadosCount');
      if (pendientesElement) {
        const currentPendientes = parseInt(pendientesElement.textContent) || 0;
        pendientesElement.textContent = Math.max(0, currentPendientes - 1);
      }
      if (confirmadosElement) {
        const currentConfirmados = parseInt(confirmadosElement.textContent) || 0;
        confirmadosElement.textContent = currentConfirmados + 1;
      }
    });
    
    item.appendChild(confirmarBtn);
    
    // Crear temporizador para registros pendientes
    if (expiraEn && expiraEn > Date.now()) {
      console.log('Creando temporizador para:', name, 'ID:', id, 'Expira en:', new Date(expiraEn));
      
      temporizadorControl = crearTemporizadorVisual(expiraEn, () => {
        console.log('🕐 Temporizador EXPIRADO para:', name, 'ID:', id);
        
        // Verificar que el registro aún existe y está pendiente
        const elementoActual = document.querySelector(`[data-registro-id="${id}"]`);
        if (elementoActual) {
          console.log('Eliminando registro expirado:', name);
          eliminarRegistroCompleto();
        } else {
          console.log('El registro ya fue eliminado previamente');
        }
      }, item, id);
    } else {
      console.log('No se creó temporizador para:', name, 'Razón:', !expiraEn ? 'Sin expiraEn' : 'Ya expirado');
    }
  }

  registrosList.appendChild(item);
}

// Función de búsqueda - Números de rifa, teléfonos y sistema de doble ganador
function buscarNumeroEnRegistros() {
  const query = busquedaNumeroInput.value.trim();
  numeroBuscado = '';
  
  // Limpiar resultado anterior
  resultadoBusqueda.innerHTML = '';

  if (!query) {
    resultadoBusqueda.innerHTML = '<p style="color: #6c757d; text-align: center; margin: 0;">Ingresa un número de rifa (4 cifras) o teléfono para buscar</p>';
    return;
  }

  // Detectar tipo de búsqueda
  const esNumeroTelefono = query.length >= 7 && /^\d+$/.test(query); // 7+ dígitos solo números
  const esNumeroRifa = query.length === 4 && /^\d{4}$/.test(query); // Exactamente 4 dígitos

  if (!esNumeroTelefono && !esNumeroRifa) {
    resultadoBusqueda.innerHTML = `
      <div style="color: #dc3545; text-align: center; padding: 1rem;">
        <strong>⚠️ Formato incorrecto:</strong><br>
        • Para números de rifa: 4 cifras exactas (ej: 1234)<br>
        • Para teléfonos: mínimo 7 dígitos (ej: 3201234567)
      </div>
    `;
    return;
  }

  numeroBuscado = query;
  
  // BÚSQUEDA POR TELÉFONO
  if (esNumeroTelefono) {
    resultadoBusqueda.innerHTML = `
      <div style="text-align: center; color: #007bff; padding: 1rem;">
        <span style="font-size: 1.5em;">📞</span> 
        <div style="margin-top: 0.5rem;">
          <strong>Buscando registro por teléfono: ${query}</strong>
        </div>
        <div style="font-size: 0.9em; color: #6c757d; margin-top: 0.5rem;">
          Para confirmar pagos por Nequi o encontrar registros específicos
        </div>
      </div>
    `;
    
    // Buscar en Firebase por teléfono
    if (typeof db !== 'undefined') {
      db.ref('registros').once('value', snapshot => {
        const data = snapshot.val() || {};
        const registros = Object.values(data);
        
        // Buscar coincidencias de teléfono
        const registrosEncontrados = registros.filter(registro => {
          if (!registro.phone) return false;
          // Limpiar números para comparación (eliminar espacios, guiones, etc.)
          const telefonoRegistro = registro.phone.replace(/\D/g, '');
          const telefonoBusqueda = query.replace(/\D/g, '');
          
          // Buscar coincidencia exacta o parcial
          return telefonoRegistro.includes(telefonoBusqueda) || telefonoBusqueda.includes(telefonoRegistro);
        });

        if (registrosEncontrados.length > 0) {
          let resultadoHTML = `
            <div style="border: 2px solid #007bff; border-radius: 12px; padding: 1.5rem; background: linear-gradient(135deg, #f0f8ff, #e6f3ff); margin-bottom: 1rem;">
              <div style="text-align: center; margin-bottom: 1rem;">
                <span style="font-size: 2em;">📞</span>
                <h3 style="margin: 0.5rem 0; color: #007bff;">Registro${registrosEncontrados.length > 1 ? 's' : ''} encontrado${registrosEncontrados.length > 1 ? 's' : ''}</h3>
                <div style="background: #007bff; color: white; padding: 0.5rem 1rem; border-radius: 20px; display: inline-block; font-size: 0.9em;">
                  ${registrosEncontrados.length} coincidencia${registrosEncontrados.length > 1 ? 's' : ''} para: ${query}
                </div>
              </div>
          `;

          registrosEncontrados.forEach((registro, index) => {
            const { name, phone, numbers, timestamp, estado, id } = registro;
            
            // Crear HTML de números
            const numerosHTML = Array.isArray(numbers) ? numbers.map(n => {
              let numStr = typeof n === 'number' ? n.toString().padStart(4, '0') : String(n).padStart(4, '0');
              return `<span style="background:#e9ecef;padding:3px 7px;border-radius:5px;border:1px solid #dee2e6;margin:2px;display:inline-block;font-family:monospace;">${numStr}</span>`;
            }).join(' ') : 'Sin números';

            const fechaRegistro = new Date(timestamp).toLocaleString('es-CO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const estadoTexto = estado === 'confirmed' ? 
              '<span style="background:#28a745;color:white;padding:4px 8px;border-radius:15px;font-size:0.85em;font-weight:bold;">✅ CONFIRMADO</span>' : 
              '<span style="background:#ffc107;color:#000;padding:4px 8px;border-radius:15px;font-size:0.85em;font-weight:bold;">⏳ PENDIENTE</span>';

            resultadoHTML += `
              <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #007bff; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,123,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                  <h4 style="margin: 0; color: #007bff; font-size: 1.2em;">${name}</h4>
                  ${estadoTexto}
                </div>
                
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1rem; align-items: center; font-size: 1em;">
                  <strong style="color: #495057;">📞 Teléfono:</strong>
                  <span style="color: #007bff; font-weight: bold; font-size: 1.1em;">${phone}</span>
                  
                  <strong style="color: #495057;">🎫 Números:</strong>
                  <div style="margin: 0.3rem 0;">${numerosHTML}</div>
                  
                  <strong style="color: #495057;">💰 Total:</strong>
                  <span style="color: #28a745; font-weight: bold;">$${Array.isArray(numbers) ? numbers.length * pricePerTicket : 0}</span>
                  
                  <strong style="color: #495057;">📅 Registrado:</strong>
                  <span style="color: #6c757d;">${fechaRegistro}</span>
                </div>
                
                ${estado !== 'confirmed' ? `
                  <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #dee2e6;">
                    <button onclick="confirmarPagoDesdeResultado('${id}', '${name}')" 
                            style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                      ✅ Confirmar Pago
                    </button>
                    <small style="color: #6c757d; margin-left: 1rem;">
                      💡 Úsalo después de verificar el pago por Nequi
                    </small>
                  </div>
                ` : ''}
              </div>
            `;
          });

          resultadoHTML += '</div>';
          resultadoBusqueda.innerHTML = resultadoHTML;

        } else {
          resultadoBusqueda.innerHTML = `
            <div style="border: 2px solid #ffc107; border-radius: 12px; padding: 2rem; background: linear-gradient(135deg, #fffdf5, #fff3cd); text-align: center;">
              <div style="font-size: 2.5em; margin-bottom: 1rem;">📞</div>
              <h3 style="margin: 0 0 1rem 0; color: #856404;">No se encontró ningún registro</h3>
              <p style="margin: 0; color: #856404; font-size: 1.1em;">
                <strong>Teléfono buscado:</strong> ${query}
              </p>
              <div style="margin-top: 1rem; padding: 1rem; background: rgba(255, 193, 7, 0.2); border-radius: 8px;">
                <p style="margin: 0; color: #856404;">
                  No hay registros con este número de teléfono
                </p>
              </div>
            </div>
          `;
        }
      }).catch(error => {
        console.error('Error al buscar por teléfono:', error);
        resultadoBusqueda.innerHTML = `
          <div style="color: #dc3545; text-align: center; padding: 1rem;">
            <strong>❌ Error:</strong> No se pudo realizar la búsqueda. 
            <br><small>Verifica tu conexión a internet.</small>
          </div>
        `;
      });
    }
  }
  
  // BÚSQUEDA POR NÚMERO DE RIFA (código original)
  if (esNumeroRifa) {
    const numeroSorteado = query.padStart(4, '0');
    const numeroInvertido = query.split('').reverse().join('').padStart(4, '0');
    
    // Mostrar mensaje de búsqueda
    resultadoBusqueda.innerHTML = `
      <div style="text-align: center; color: #007bff; padding: 1rem;">
        <span style="font-size: 1.5em;">🔍</span> 
        <div style="margin-top: 0.5rem;">
          <strong>Buscando ganadores del número sorteado: ${numeroSorteado}</strong>
        </div>
        <div style="font-size: 0.9em; color: #6c757d; margin-top: 0.5rem;">
          🥇 Ganador Principal: ${numeroSorteado} | 🥈 Ganador Secundario: ${numeroInvertido}
        </div>
      </div>
    `;
    
    // Buscar directamente en Firebase
    if (typeof db !== 'undefined') {
      db.ref('registros').orderByChild('estado').equalTo('confirmed').once('value', snapshot => {
        const data = snapshot.val() || {};
        const registros = Object.values(data);
        
        // Buscar ganadores principal y secundario
        let ganadorPrincipal = null;
        let ganadorSecundario = null;
        
        registros.forEach(registro => {
          if (!Array.isArray(registro.numbers)) return;
          
          registro.numbers.forEach(num => {
            let numStr = String(num).replace(/\s+/g, '').padStart(4, '0');
            
            // GANADOR PRINCIPAL: número exacto
            if (numStr === numeroSorteado) {
              ganadorPrincipal = { 
                registro, 
                numeroGanador: numStr,
                numeroSorteado: numeroSorteado,
                tipo: 'principal'
              };
            }
            
            // GANADOR SECUNDARIO: número invertido
            if (numStr === numeroInvertido && numeroSorteado !== numeroInvertido) {
              ganadorSecundario = { 
                registro, 
                numeroGanador: numStr,
                numeroSorteado: numeroSorteado,
                tipo: 'secundario'
              };
            }
          });
        });

        // Mostrar resultados
        let resultadoHTML = '';

        // Mostrar ganador principal
        if (ganadorPrincipal) {
          const { registro, numeroGanador } = ganadorPrincipal;
          const { name, phone, numbers, timestamp } = registro;
          
          // Crear HTML de números resaltando el ganador
          const numerosHTML = numbers.map(n => {
            let numStr = typeof n === 'number' ? n.toString().padStart(4, '0') : String(n).padStart(4, '0');
            if (numStr === numeroGanador) {
              return `<span style="background:#FFD700;color:#000;padding:4px 8px;border-radius:6px;font-weight:bold;font-size:1.2em;box-shadow: 0 2px 4px rgba(255,215,0,0.4);">🥇 ${numStr}</span>`;
          }
          return `<span style="background:#f8f9fa;padding:2px 6px;border-radius:4px;border:1px solid #dee2e6;color:#6c757d;">${numStr}</span>`;
        }).join(' ');

        const fechaRegistro = new Date(timestamp).toLocaleString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        resultadoHTML += `
          <div style="border: 3px solid #FFD700; border-radius: 12px; padding: 2rem; background: linear-gradient(135deg, #fffdf0, #fff8dc); margin-bottom: 1rem; box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);">
            <div style="text-align: center; margin-bottom: 1.5rem;">
              <div style="font-size: 3em; margin-bottom: 0.5rem;">🥇</div>
              <h2 style="margin: 0; color: #B8860B; font-size: 1.8em;">¡GANADOR PRINCIPAL!</h2>
              <div style="background: #FFD700; color: #000; padding: 0.5rem 1rem; border-radius: 25px; display: inline-block; margin-top: 1rem; font-weight: bold; font-size: 1.1em;">
                Número exacto: ${numeroSorteado}
              </div>
            </div>
            
            <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 2px solid #FFD700; box-shadow: inset 0 2px 4px rgba(255, 215, 0, 0.1);">
              <div style="display: grid; grid-template-columns: auto 1fr; gap: 1rem 1.5rem; align-items: center; font-size: 1.1em;">
                <strong style="color: #495057;">🥇 Ganador Principal:</strong>
                <span style="font-size: 1.3em; color: #B8860B; font-weight: bold;">${name}</span>
                
                <strong style="color: #495057;">📞 Teléfono:</strong>
                <span style="color: #212529;">${phone}</span>
                
                <strong style="color: #495057;">🎫 Todos sus números:</strong>
                <div style="margin: 0.5rem 0;">${numerosHTML}</div>
                
                <strong style="color: #495057;">💰 Total pagado:</strong>
                <span style="color: #28a745; font-weight: bold;">$${numbers.length * pricePerTicket}</span>
                
                <strong style="color: #495057;">📅 Fecha de registro:</strong>
                <span style="color: #6c757d;">${fechaRegistro}</span>
              </div>
            </div>
          </div>
        `;
      }

      // Mostrar ganador secundario
      if (ganadorSecundario) {
        const { registro, numeroGanador } = ganadorSecundario;
        const { name, phone, numbers, timestamp } = registro;
        
        // Crear HTML de números resaltando el ganador
        const numerosHTML = numbers.map(n => {
          let numStr = typeof n === 'number' ? n.toString().padStart(4, '0') : String(n).padStart(4, '0');
          if (numStr === numeroGanador) {
            return `<span style="background:#C0C0C0;color:#000;padding:4px 8px;border-radius:6px;font-weight:bold;font-size:1.2em;box-shadow: 0 2px 4px rgba(192,192,192,0.4);">🥈 ${numStr}</span>`;
          }
          return `<span style="background:#f8f9fa;padding:2px 6px;border-radius:4px;border:1px solid #dee2e6;color:#6c757d;">${numStr}</span>`;
        }).join(' ');

        const fechaRegistro = new Date(timestamp).toLocaleString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        resultadoHTML += `
          <div style="border: 3px solid #C0C0C0; border-radius: 12px; padding: 2rem; background: linear-gradient(135deg, #f8f8ff, #f0f0f0); margin-bottom: 1rem; box-shadow: 0 4px 12px rgba(192, 192, 192, 0.3);">
            <div style="text-align: center; margin-bottom: 1.5rem;">
              <div style="font-size: 3em; margin-bottom: 0.5rem;">🥈</div>
              <h2 style="margin: 0; color: #696969; font-size: 1.8em;">¡GANADOR SECUNDARIO!</h2>
              <div style="background: #C0C0C0; color: #000; padding: 0.5rem 1rem; border-radius: 25px; display: inline-block; margin-top: 1rem; font-weight: bold; font-size: 1.1em;">
                Número invertido: ${numeroSorteado} → ${numeroInvertido}
              </div>
            </div>
            
            <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 2px solid #C0C0C0; box-shadow: inset 0 2px 4px rgba(192, 192, 192, 0.1);">
              <div style="display: grid; grid-template-columns: auto 1fr; gap: 1rem 1.5rem; align-items: center; font-size: 1.1em;">
                <strong style="color: #495057;">🥈 Ganador Secundario:</strong>
                <span style="font-size: 1.3em; color: #696969; font-weight: bold;">${name}</span>
                
                <strong style="color: #495057;">📞 Teléfono:</strong>
                <span style="color: #212529;">${phone}</span>
                
                <strong style="color: #495057;">🎫 Todos sus números:</strong>
                <div style="margin: 0.5rem 0;">${numerosHTML}</div>
                
                <strong style="color: #495057;">💰 Total pagado:</strong>
                <span style="color: #28a745; font-weight: bold;">$${numbers.length * pricePerTicket}</span>
                
                <strong style="color: #495057;">📅 Fecha de registro:</strong>
                <span style="color: #6c757d;">${fechaRegistro}</span>
              </div>
            </div>
          </div>
        `;
      }

      // Si no hay ganadores
      if (!ganadorPrincipal && !ganadorSecundario) {
        resultadoHTML = `
          <div style="border: 2px solid #ffc107; border-radius: 12px; padding: 2rem; background: linear-gradient(135deg, #fffdf5, #fff3cd); text-align: center;">
            <div style="font-size: 3em; margin-bottom: 1rem;">😔</div>
            <h3 style="margin: 0 0 1rem 0; color: #856404;">No hay ganadores</h3>
            <p style="margin: 0; color: #856404; font-size: 1.1em;">
              <strong>Número sorteado:</strong> ${numeroSorteado}<br>
              <strong>Ganador principal buscado:</strong> ${numeroSorteado}<br>
              <strong>Ganador secundario buscado:</strong> ${numeroInvertido}
            </p>
            <div style="margin-top: 1rem; padding: 1rem; background: rgba(255, 193, 7, 0.2); border-radius: 8px;">
              <p style="margin: 0; color: #856404;">
                No se encontraron usuarios registrados con estos números
              </p>
            </div>
          </div>
        `;
      }

      resultadoBusqueda.innerHTML = resultadoHTML;
      
      }).catch(error => {
        console.error('Error al buscar registros:', error);
        resultadoBusqueda.innerHTML = `
          <div style="color: #dc3545; text-align: center; padding: 1rem;">
            <strong>❌ Error:</strong> No se pudo realizar la búsqueda. 
            <br><small>Verifica tu conexión a internet.</small>
          </div>
        `;
      });
    } else {
      resultadoBusqueda.innerHTML = `
        <div style="color: #dc3545; text-align: center; padding: 1rem;">
          <strong>❌ Error:</strong> No hay conexión con la base de datos.
        </div>
      `;
    }
  }
}

// Función para confirmar pago desde el resultado de búsqueda
function confirmarPagoDesdeResultado(registroId, nombrePersona) {
  console.log('Confirmando pago para:', nombrePersona, 'ID:', registroId);
  
  const confirmar = confirm(`🎉 CONFIRMAR PAGO\n\n¿Confirmas que ${nombrePersona} realizó el pago?\n\nEsto marcará el registro como confirmado.`);
  
  if (!confirmar) {
    return;
  }
  
  // Actualizar en Firebase
  if (typeof db !== 'undefined') {
    db.ref('registros/' + registroId).update({ estado: 'confirmed' })
      .then(() => {
        console.log('Pago confirmado exitosamente para:', nombrePersona);
        
        // Buscar el registro en la lista principal y actualizarlo
        const registroEnLista = document.querySelector(`[data-registro-id="${registroId}"]`);
        if (registroEnLista) {
          console.log('Actualizando registro en lista principal:', registroId);
          
          // Buscar y remover el botón "Confirmar Pago" del registro en la lista
          const confirmarBtnEnLista = registroEnLista.querySelector('.btn-verificar');
          if (confirmarBtnEnLista) {
            confirmarBtnEnLista.remove();
          }
          
          // Buscar y eliminar el temporizador ya que está confirmado
          const temporizadorEnLista = registroEnLista.querySelector('.temporizador');
          if (temporizadorEnLista) {
            temporizadorEnLista.remove();
          }
          
          // Actualizar números a estado confirmado en la interfaz
          db.ref('registros/' + registroId).once('value').then(snapshot => {
            const registro = snapshot.val();
            if (registro && Array.isArray(registro.numbers)) {
              registro.numbers.forEach(num => {
                const btn = document.querySelector(`button[data-number='${num}']`);
                if (btn) {
                  btn.className = 'number-btn unavailable';
                  btn.disabled = true;
                }
                numberStatus[num] = 'confirmed';
              });
            }
          });
          
          // Actualizar contadores
          const pendientesElement = document.getElementById('pendientesCount');
          const confirmadosElement = document.getElementById('confirmadosCount');
          if (pendientesElement) {
            const currentPendientes = parseInt(pendientesElement.textContent) || 0;
            pendientesElement.textContent = Math.max(0, currentPendientes - 1);
          }
          if (confirmadosElement) {
            const currentConfirmados = parseInt(confirmadosElement.textContent) || 0;
            confirmadosElement.textContent = currentConfirmados + 1;
          }
        }
        
        // Mostrar notificación de éxito
        mostrarNotificacion(`✅ ¡Pago confirmado!\n\nEl registro de ${nombrePersona} ha sido marcado como confirmado.`, 'success');
        
        // Volver a ejecutar la búsqueda para actualizar los resultados
        buscarNumeroEnRegistros();
      })
      .catch(error => {
        console.error('Error al confirmar pago:', error);
        mostrarNotificacion('❌ Error al confirmar el pago. Inténtalo de nuevo.', 'error');
      });
  } else {
    mostrarNotificacion('❌ Error: No hay conexión con la base de datos.', 'error');
  }
}

// Función para limpiar búsqueda
function limpiarBusquedaNumero() {
  busquedaNumeroInput.value = '';
  numeroBuscado = '';
  resultadoBusqueda.innerHTML = '<p style="color: #6c757d; text-align: center; margin: 0;">Ingresa un número de rifa (4 cifras) o teléfono para buscar</p>';
}

// Función para limpiar todos los registros
function limpiarTodosLosRegistros() {
  const confirmar = confirm('⚠️ ADVERTENCIA: Esto eliminará TODOS los registros de la base de datos.\n\n¿Estás completamente seguro de que deseas continuar?\n\nEsta acción NO SE PUEDE DESHACER.');
  
  if (!confirmar) {
    return;
  }
  
  // Segunda confirmación para estar seguros
  const confirmarSegundo = confirm('🚨 ÚLTIMA CONFIRMACIÓN:\n\nSe eliminarán TODOS los registros confirmados y pendientes.\nTodos los números volverán a estar disponibles.\n\n¿Proceder con la eliminación total?');
  
  if (!confirmarSegundo) {
    return;
  }
  
  console.log('Iniciando eliminación total de registros...');
  
  // Deshabilitar el botón mientras se procesa
  const limpiarBtn = document.getElementById('limpiarTodosBtn');
  if (limpiarBtn) {
    limpiarBtn.disabled = true;
    limpiarBtn.textContent = '🔄 Eliminando...';
    limpiarBtn.style.background = '#6c757d';
  }
  
  // Llamar a la función de Firebase
  if (typeof eliminarTodosLosRegistrosFirebase !== 'undefined') {
    eliminarTodosLosRegistrosFirebase()
      .then(() => {
        console.log('Todos los registros eliminados exitosamente');
        
        // Limpiar el estado local de números
        for (let i = 0; i <= 9999; i++) {
          numberStatus[i] = 'available';
          const btn = document.querySelector(`button[data-number='${i}']`);
          if (btn) {
            btn.className = 'number-btn available';
            btn.disabled = false;
          }
        }
        
        // Limpiar la lista visual de registros
        const registrosList = document.getElementById('registro-list');
        if (registrosList) {
          registrosList.innerHTML = '';
        }
        
        // Actualizar contadores
        const confirmadosElement = document.getElementById('confirmadosCount');
        const pendientesElement = document.getElementById('pendientesCount');
        if (confirmadosElement) confirmadosElement.textContent = '0';
        if (pendientesElement) pendientesElement.textContent = '0';
        
        // Restaurar el botón
        if (limpiarBtn) {
          limpiarBtn.disabled = false;
          limpiarBtn.textContent = '🗑️ Limpiar Registros';
          limpiarBtn.style.background = '#dc3545';
        }
        
        alert('✅ Todos los registros han sido eliminados exitosamente.\nTodos los números están ahora disponibles.');
      })
      .catch(error => {
        console.error('Error al eliminar registros:', error);
        
        // Restaurar el botón en caso de error
        if (limpiarBtn) {
          limpiarBtn.disabled = false;
          limpiarBtn.textContent = '🗑️ Limpiar Registros';
          limpiarBtn.style.background = '#dc3545';
        }
        
        alert('❌ Error al eliminar los registros. Por favor, inténtalo de nuevo.');
      });
  } else {
    console.error('La función eliminarTodosLosRegistrosFirebase no está disponible');
    
    // Restaurar el botón
    if (limpiarBtn) {
      limpiarBtn.disabled = false;
      limpiarBtn.textContent = '🗑️ Limpiar Registros';
      limpiarBtn.style.background = '#dc3545';
    }
    
    alert('❌ Error: No hay conexión con la base de datos.');
  }
}

// =============== FUNCIONES DE CONFIGURACIÓN DEL SORTEO ===============

// Mostrar/ocultar panel de configuración
function togglePanelConfiguracion() {
  const panel = document.getElementById('panelConfiguracion');
  if (panel) {
    if (panel.style.display === 'none') {
      panel.style.display = 'block';
      cargarConfiguracionActual();
    } else {
      panel.style.display = 'none';
    }
  }
}

// Cargar configuración actual en el panel
function cargarConfiguracionActual() {
  // Cargar desde Firebase primero
  if (typeof obtenerConfiguracionSorteo !== 'undefined') {
    obtenerConfiguracionSorteo((config) => {
      if (config && config.fechaSorteo) {
        // Actualizar variables globales
        FECHA_SORTEO = config.fechaSorteo;
        HORAS_ANTES_BLOQUEO = config.horasAntesBloqueo || 2;
      }
      
      // Actualizar campos del formulario
      if (FECHA_SORTEO) {
        const [fecha, hora] = FECHA_SORTEO.split(' ');
        const fechaInput = document.getElementById('fechaSorteoInput');
        const horaInput = document.getElementById('horaSorteoInput');
        
        if (fechaInput) fechaInput.value = fecha;
        if (horaInput) horaInput.value = hora.substring(0, 5); // Quitar los segundos
      }
      
      const horasAntesSelect = document.getElementById('horasAntesBloqueo');
      if (horasAntesSelect) {
        horasAntesSelect.value = HORAS_ANTES_BLOQUEO.toString();
      }
      
      actualizarEstadoRegistros();
    });
  } else {
    // Usar valores por defecto si no hay Firebase
    if (FECHA_SORTEO) {
      const [fecha, hora] = FECHA_SORTEO.split(' ');
      const fechaInput = document.getElementById('fechaSorteoInput');
      const horaInput = document.getElementById('horaSorteoInput');
      
      if (fechaInput) fechaInput.value = fecha;
      if (horaInput) horaInput.value = hora.substring(0, 5);
    }
    
    const horasAntesSelect = document.getElementById('horasAntesBloqueo');
    if (horasAntesSelect) {
      horasAntesSelect.value = HORAS_ANTES_BLOQUEO.toString();
    }
    
    actualizarEstadoRegistros();
  }
}

// Guardar nueva configuración
function guardarConfiguracionSorteo() {
  console.log('Iniciando guardarConfiguracionSorteo...');
  
  const fechaInput = document.getElementById('fechaSorteoInput');
  const horaInput = document.getElementById('horaSorteoInput');
  const horasAntesSelect = document.getElementById('horasAntesBloqueo');
  
  console.log('Elementos encontrados:', {
    fechaInput: !!fechaInput,
    horaInput: !!horaInput,
    horasAntesSelect: !!horasAntesSelect
  });
  
  if (!fechaInput || !horaInput || !horasAntesSelect) {
    alert('❌ Error: No se encontraron todos los campos de configuración');
    return;
  }
  
  const fecha = fechaInput.value;
  const hora = horaInput.value;
  const horasAntes = parseInt(horasAntesSelect.value);
  
  console.log('Valores obtenidos:', { fecha, hora, horasAntes });
  
  if (!fecha || !hora) {
    alert('❌ Por favor, completa todos los campos de fecha y hora');
    return;
  }
  
  const nuevaFechaSorteo = `${fecha} ${hora}:00`;
  
  // Confirmar cambios
  const confirmar = confirm(`🔧 CONFIGURAR SORTEO\n\nFecha del sorteo: ${fecha} a las ${hora}\nRegistros se cerrarán: ${horasAntes} hora${horasAntes !== 1 ? 's' : ''} antes\n\n¿Guardar esta configuración?`);
  
  if (!confirmar) {
    console.log('Usuario canceló la configuración');
    return;
  }
  
  // Guardar en Firebase
  const configuracion = {
    fechaSorteo: nuevaFechaSorteo,
    horasAntesBloqueo: horasAntes,
    fechaActualizacion: Date.now()
  };
  
  console.log('Guardando configuración:', configuracion);
  
  if (typeof guardarConfiguracionSorteoFirebase !== 'undefined') {
    guardarConfiguracionSorteoFirebase(configuracion)
      .then(() => {
        console.log('Configuración guardada exitosamente');
        alert('✅ Configuración guardada exitosamente');
        
        // Actualizar variables globales
        FECHA_SORTEO = nuevaFechaSorteo;
        HORAS_ANTES_BLOQUEO = horasAntes;
        
        console.log('Variables actualizadas:', { FECHA_SORTEO, HORAS_ANTES_BLOQUEO });
        
        // Recalcular fecha límite
        calcularFechaLimiteRegistros();
        
        // Verificar si ahora deben bloquearse los registros
        if (verificarBloqueoRegistros()) {
          mostrarMensajeBloqueo();
        }
        
        // Ocultar panel
        const panel = document.getElementById('panelConfiguracion');
        if (panel) panel.style.display = 'none';
        
        // Actualizar estado
        actualizarEstadoRegistros();
        
        // Reiniciar contador regresivo con nueva configuración
        iniciarContadorRegresivo();
      })
      .catch(error => {
        console.error('Error al guardar configuración:', error);
        alert('❌ Error al guardar la configuración: ' + error.message);
      });
  } else {
    console.error('La función guardarConfiguracionSorteoFirebase no está disponible');
    alert('❌ Error: No hay conexión con la base de datos');
  }
}

// Actualizar el estado mostrado en el panel
function actualizarEstadoRegistros() {
  const estadoElement = document.getElementById('estadoRegistros');
  if (!estadoElement) return;
  
  if (registrosBloquados) {
    estadoElement.textContent = '🔒 REGISTROS BLOQUEADOS';
    estadoElement.style.color = '#dc3545';
  } else if (fechaLimiteRegistros) {
    const tiempoRestante = fechaLimiteRegistros.getTime() - Date.now();
    if (tiempoRestante > 0) {
      const horas = Math.floor(tiempoRestante / (1000 * 60 * 60));
      const minutos = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));
      estadoElement.textContent = `✅ REGISTROS ABIERTOS (cierran en ${horas}h ${minutos}m)`;
      estadoElement.style.color = '#28a745';
    } else {
      estadoElement.textContent = '🔒 REGISTROS BLOQUEADOS';
      estadoElement.style.color = '#dc3545';
    }
  } else {
    estadoElement.textContent = '⚠️ Configuración pendiente';
    estadoElement.style.color = '#ffc107';
  }
}

// Los botones se crearán dentro del DOMContentLoaded

// Los event listeners se configurarán dentro del DOMContentLoaded

// Los event listeners se configurarán dentro del DOMContentLoaded

// Al cargar: leer registros de Firebase y renderizarlos
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM cargado, inicializando aplicación...');
  
  // Inicializar elementos del DOM
  grid = document.getElementById('numberGrid');
  selectedNumbersDisplay = document.getElementById('selectedNumbers');
  totalDisplay = document.getElementById('totalDisplay');
  form = document.getElementById('registrationForm');
  registrosList = document.getElementById('registro-list');
  
  // Verificar que los elementos existen
  if (!grid || !selectedNumbersDisplay || !totalDisplay || !form || !registrosList) {
    console.error('Error: No se encontraron algunos elementos del DOM');
    console.log('Elementos encontrados:', {
      grid: !!grid,
      selectedNumbersDisplay: !!selectedNumbersDisplay,
      totalDisplay: !!totalDisplay,
      form: !!form,
      registrosList: !!registrosList
    });
    return;
  }
  
  // Crear botones del 0000 al 9999
  console.log('Creando botones numéricos...');
  const numbersLoadingSpinner = document.getElementById('numbersLoadingSpinner');
  
  // Mostrar loading
  if (numbersLoadingSpinner) {
    numbersLoadingSpinner.style.display = 'block';
  }
  
  // Crear los 10,000 botones
  for (let i = 0; i <= 9999; i++) {
    numberStatus[i] = 'available';
    grid.appendChild(createButton(i));
  }
  
  // Ocultar loading y mostrar grid
  if (numbersLoadingSpinner) {
    numbersLoadingSpinner.style.display = 'none';
  }
  grid.style.display = 'grid';
  
  console.log('Botones creados exitosamente');
  
  // Configurar buscador de números
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearch');
  const searchBtn = document.getElementById('searchBtn');

  function buscarNumeros() {
    const query = searchInput.value.trim();
    const buttons = document.querySelectorAll('.number-btn');
    if (!query) {
      buttons.forEach(btn => {
        btn.style.display = 'inline-block';
      });
      return;
    }
    buttons.forEach(btn => {
      // Buscar por coincidencia exacta o parcial en el número
      const num = btn.textContent.replace(/^0+/, ''); // Elimina ceros a la izquierda
      btn.style.display = (btn.textContent.includes(query) || num.includes(query)) ? 'inline-block' : 'none';
    });
  }

  function limpiarBusqueda() {
    searchInput.value = '';
    document.querySelectorAll('.number-btn').forEach(btn => {
      btn.style.display = 'inline-block';
    });
  }

  if (searchInput && clearSearchBtn && searchBtn) {
    // Buscar mientras escribe
    searchInput.addEventListener('input', buscarNumeros);
    
    // Buscar al hacer Enter
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        buscarNumeros();
      }
    });

    // Botón buscar
    searchBtn.addEventListener('click', buscarNumeros);

    // Botón limpiar (X)
    clearSearchBtn.addEventListener('click', limpiarBusqueda);
  }
  
  // Configurar event listener del formulario
  const registrationForm = document.getElementById('registrationForm');
  if (registrationForm) {
    registrationForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // VERIFICAR BLOQUEO ANTES DE PROCESAR EL REGISTRO
      if (verificarBloqueoRegistros()) {
        mostrarNotificacionFormulario('🚫 Los registros están cerrados. La fecha límite del sorteo ha sido alcanzada.', 'error', 5000);
        return;
      }

      if (selectedNumbers.size === 0) {
        mostrarNotificacionFormulario('⚠️ Selecciona al menos un número para continuar', 'error', 3000);
        return;
      }

      const name = document.getElementById('name').value.trim();
      const phone = document.getElementById('phone').value.trim();
      
      if (!name || !phone) {
        mostrarNotificacionFormulario('📝 Por favor, completa todos los campos (nombre y teléfono)', 'error', 3000);
        return;
      }

      const numbers = Array.from(selectedNumbers);
      const timestamp = Date.now();
      const expiraEn = timestamp + timeoutMs;

      const registro = {
        name,
        phone,
        numbers,
        timestamp,
        expiraEn,
        estado: 'pending'
      };

      // Preparar datos para el registro
      const numerosTexto = numbers.map(n => n.toString().padStart(4, '0')).join(', ');
      const total = numbers.length * pricePerTicket;

      // Guardar en Firebase
      if (typeof guardarRegistroFirebase !== 'undefined') {
        guardarRegistroFirebase(registro);
        
        // Mostrar mensaje de éxito con notificación visual
        mostrarNotificacionFormulario(
          '', 
          'success'
        );
      } else {
        mostrarNotificacionFormulario('❌ Error: No se pudo conectar con la base de datos', 'error', 4000);
        return;
      }

      // Marcar números como pendientes
      numbers.forEach(num => {
        numberStatus[num] = 'pending';
        const btn = document.querySelector(`button[data-number='${num}']`);
        if (btn) {
          btn.className = 'number-btn pending';
          btn.disabled = true;
        }
      });

      selectedNumbers.clear();
      renderSelectedNumbers();
      updateTotal();
      registrationForm.reset();
    });
  }
  
  // Esperar a que Firebase esté completamente cargado
  function initializeApp() {
    if (typeof firebase === 'undefined' || typeof db === 'undefined') {
      console.error('Firebase no está cargado correctamente');
      const errorDiv = document.createElement('div');
      errorDiv.style.background = '#dc3545';
      errorDiv.style.color = 'white';
      errorDiv.style.padding = '1rem';
      errorDiv.style.textAlign = 'center';
      errorDiv.style.marginBottom = '1rem';
      errorDiv.textContent = 'Error: No se pudo cargar Firebase. Revisa tu configuración y conexión a internet.';
      document.body.insertBefore(errorDiv, document.body.firstChild);
      return;
    }

    // Verificar conexión a Firebase y mostrar mensaje si falla
    db.ref('.info/connected').on('value', function(snapshot) {
      if (snapshot.val() === false) {
        updateConnectionStatus('error', 'Sin conexión');
      } else {
        updateConnectionStatus('connected', 'Conectado');
      }
    });

    // Cargar registros y eventos
    cargarRegistrosYEventos();
    
    // Cargar configuración de fecha límite
    cargarConfiguracionDesdeFirebase();
  }

  // Inicializar elementos de búsqueda
  busquedaNumeroInput = document.getElementById('busquedaNumeroInput');
  busquedaNumeroBtn = document.getElementById('busquedaNumeroBtn');
  clearBusquedaBtn = document.getElementById('clearBusquedaBtn');
  resultadoBusqueda = document.getElementById('resultadoBusqueda');

  if (busquedaNumeroInput && busquedaNumeroBtn) {
    busquedaNumeroBtn.onclick = buscarNumeroEnRegistros;
    busquedaNumeroInput.onkeyup = function(e) {
      if (e.key === 'Enter') buscarNumeroEnRegistros();
    };
  }

  if (clearBusquedaBtn) {
    clearBusquedaBtn.onclick = limpiarBusquedaNumero;
  }

  // Configurar botones de administración
  const limpiarTodosBtn = document.getElementById('limpiarTodosBtn');
  if (limpiarTodosBtn) {
    limpiarTodosBtn.onclick = limpiarTodosLosRegistros;
  }

  const configurarSorteoBtn = document.getElementById('configurarSorteoBtn');
  if (configurarSorteoBtn) {
    configurarSorteoBtn.onclick = togglePanelConfiguracion;
  }

  const guardarConfigBtn = document.getElementById('guardarConfigBtn');
  if (guardarConfigBtn) {
    guardarConfigBtn.onclick = guardarConfiguracionSorteo;
  }

  const cancelarConfigBtn = document.getElementById('cancelarConfigBtn');
  if (cancelarConfigBtn) {
    cancelarConfigBtn.onclick = function() {
      const panel = document.getElementById('panelConfiguracion');
      if (panel) panel.style.display = 'none';
    };
  }

  function cargarRegistrosYEventos() {
    if (typeof escucharRegistrosRealtime === 'undefined') {
      console.error('La función escucharRegistrosRealtime no está definida');
      return;
    }

    escucharRegistrosRealtime(registros => {
      console.log('Registros recibidos desde Firebase:', registros.length);
      registrosGlobal = registros;
      
      // Si hay búsqueda activa, NO actualizar la lista visual
      if (busquedaNumeroInput && busquedaNumeroInput.value.trim()) {
        console.log('Búsqueda activa, solo actualizando estado de números');
      } else {
        // Actualizar lista visual de registros
        registrosList.innerHTML = '';
        registros.forEach(registro => renderRegistro(registro, ''));
      }
      
      // ACTUALIZAR ESTADO DE TODOS LOS NÚMEROS
      console.log('Actualizando estado de números...');
      
      // Primero, liberar todos los números
      for (let i = 0; i <= 9999; i++) {
        numberStatus[i] = 'available';
        const btn = document.querySelector(`button[data-number='${i}']`);
        if (btn) {
          btn.className = 'number-btn available';
          btn.disabled = false;
        }
      }

      // Luego, marcar números ocupados según registros
      let confirmados = 0;
      let pendientes = 0;

      if (Array.isArray(registros)) {
        registros.forEach(registro => {
          if (Array.isArray(registro.numbers)) {
            registro.numbers.forEach(num => {
              // Actualizar estado interno
              numberStatus[num] = registro.estado;
              
              // Actualizar botón visual
              const btn = document.querySelector(`button[data-number='${num}']`);
              if (btn) {
                if (registro.estado === 'confirmed') {
                  btn.className = 'number-btn unavailable';
                  btn.disabled = true;
                } else if (registro.estado === 'pending') {
                  btn.className = 'number-btn pending';
                  btn.disabled = true;
                }
              }
            });
          }

          // Contar registros por estado
          if (registro.estado === 'confirmed') confirmados++;
          else if (registro.estado === 'pending') pendientes++;
        });
      }

      console.log(`Estados actualizados: ${confirmados} confirmados, ${pendientes} pendientes`);

      // Actualizar contadores visuales
      const confirmadosElement = document.getElementById('confirmadosCount');
      const pendientesElement = document.getElementById('pendientesCount');
      if (confirmadosElement) confirmadosElement.textContent = confirmados;
      if (pendientesElement) pendientesElement.textContent = pendientes;
    });
    
    // Registro de prueba automático deshabilitado para evitar registros no deseados
    // La base de datos puede iniciar vacía sin problemas
  }

  // Llamar a la función de inicialización
  if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
    initializeApp();
  } else {
    // Esperar a que Firebase se cargue
    setTimeout(() => {
      if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
        initializeApp();
      } else {
        console.error('Firebase no se cargó después de esperar');
      }
    }, 2000);
  }
});
