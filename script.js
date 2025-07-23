// Selección de elementos clave del DOM
const grid = document.getElementById('numberGrid');
const selectedNumbers = new Set();
const selectedNumbersDisplay = document.getElementById('selectedNumbers');
const totalDisplay = document.getElementById('totalDisplay');
const form = document.getElementById('registrationForm');
const registrosList = document.getElementById('registro-list');

// Configuración
const pricePerTicket = 4000;
const timeoutMs = 30 * 60 * 1000; // 30 minutos
const numberStatus = {}; // Estado por número

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

// Crear temporizador visual
function crearTemporizadorVisual(timestampLimite, onExpire, contenedor) {
  const temporizador = document.createElement('span');
  temporizador.className = 'temporizador';
  contenedor.appendChild(temporizador);

  const interval = setInterval(() => {
    const ahora = Date.now();
    const restante = timestampLimite - ahora;
    
    if (restante <= 0) {
      clearInterval(interval);
      temporizador.textContent = '⏰ Expirado';
      if (typeof onExpire === 'function') onExpire();
      return;
    }
    
    const h = String(Math.floor(restante / 3600000)).padStart(2, '0');
    const m = String(Math.floor((restante % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((restante % 60000) / 1000)).padStart(2, '0');
    temporizador.textContent = `⏳ ${h}:${m}:${s}`;
  }, 1000);

  return { temporizador, interval };
}

// Función para renderizar registro
function renderRegistro(registro, highlightNum = '') {
  if (!registro || !registro.name) return;

  console.log('Renderizando registro:', {
    name: registro.name,
    estado: registro.estado,
    expiraEn: registro.expiraEn,
    tiempoRestante: registro.expiraEn ? registro.expiraEn - Date.now() : 'N/A'
  });

  const { name, phone, numbers, timestamp, expiraEn, estado } = registro;

  const item = document.createElement('div');
  item.className = 'registro-item';
  item.dataset.timestamp = timestamp;
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

  // Botón eliminar en la esquina superior derecha (icono 'X' en rojo)
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
    if (!confirmar) return;
    
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
    
    if (registro.id && typeof eliminarRegistroFirebase !== 'undefined') {
      eliminarRegistroFirebase(registro.id);
    }
    if (item.parentNode) item.parentNode.removeChild(item);
  });
  item.appendChild(eliminarBtnTop);

  // Botón confirmar pago y temporizador para registros pendientes
  let temporizadorControl = null; // Declarar la variable aquí para que esté disponible
  
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
      if (registro.id && typeof db !== 'undefined') {
        db.ref('registros/' + registro.id).update({ estado: 'confirmed' });
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
      
      // Agregar botón eliminar después de confirmar
      const eliminarBtn = document.createElement('button');
      eliminarBtn.textContent = '🗑️ Eliminar Registro';
      eliminarBtn.className = 'btn-verificar';
      eliminarBtn.style.backgroundColor = '#dc3545';
      eliminarBtn.style.color = 'white';
      eliminarBtn.style.margin = '5px';
      eliminarBtn.style.padding = '8px 16px';
      eliminarBtn.style.border = 'none';
      eliminarBtn.style.borderRadius = '4px';
      eliminarBtn.style.cursor = 'pointer';
      
      eliminarBtn.addEventListener('click', () => {
        const confirmar = confirm("¿Estás seguro de eliminar este registro? Esta acción liberará los números.");
        if (!confirmar) return;
        
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
        
        if (item.parentNode) {
          item.parentNode.removeChild(item);
        }
        if (registro.id && typeof eliminarRegistroFirebase !== 'undefined') {
          eliminarRegistroFirebase(registro.id);
        }
      });
      item.appendChild(eliminarBtn);
    });
    
    item.appendChild(confirmarBtn);
    
    // Crear temporizador para registros pendientes (solo si tiene expiraEn)
    if (expiraEn && expiraEn > Date.now()) {
      console.log('Creando temporizador para:', name, 'Expira en:', new Date(expiraEn));
      temporizadorControl = crearTemporizadorVisual(expiraEn, () => {
        console.log('Temporizador expirado para registro:', name);
        let expirado = false;
        if (Array.isArray(numbers)) {
          numbers.forEach(num => {
            if (numberStatus[num] === 'pending') {
              numberStatus[num] = 'available';
              const btn = document.querySelector(`button[data-number='${num}']`);
              if (btn) {
                btn.className = 'number-btn available';
                btn.disabled = false;
              }
              expirado = true;
            }
          });
        }
        
        if (expirado && item.parentNode) {
          item.parentNode.removeChild(item);
        }
        if (registro.id && typeof eliminarRegistroFirebase !== 'undefined') {
          eliminarRegistroFirebase(registro.id);
        }
      }, item);
    }
  }

  registrosList.appendChild(item);
}

// Función de búsqueda de números
function buscarNumeroEnRegistros() {
  const query = busquedaNumeroInput.value.trim();
  numeroBuscado = '';
  
  // Limpiar resultado anterior
  resultadoBusqueda.innerHTML = '';

  if (!query) {
    resultadoBusqueda.innerHTML = '<p style="color: #6c757d; text-align: center; margin: 0;">Ingresa un número para comenzar la búsqueda</p>';
    return;
  }

  if (query.length !== 4 || isNaN(query)) {
    resultadoBusqueda.innerHTML = '<div style="color: #dc3545; text-align: center; padding: 1rem;"><strong>⚠️ Error:</strong> Debes ingresar exactamente 4 cifras</div>';
    return;
  }

  numeroBuscado = query;
  
  // Extraer partes del número para búsquedas parciales
  const primerosDos = query.substring(0, 2);
  const ultimosDos = query.substring(2, 4);
  
  // Mostrar mensaje de búsqueda
  resultadoBusqueda.innerHTML = '<div style="text-align: center; color: #007bff;"><span style="font-size: 1.5em;">🔍</span> Buscando número ' + query + ' y coincidencias parciales...</div>';
  
  // Buscar directamente en Firebase
  if (typeof db !== 'undefined') {
    db.ref('registros').orderByChild('estado').equalTo('confirmed').once('value', snapshot => {
      const data = snapshot.val() || {};
      const registros = Object.values(data);
      
      // Buscar coincidencias exactas y parciales
      let coincidenciaExacta = null;
      let registrosPrimerosDos = new Map(); // Agrupar por usuario
      let registrosUltimosDos = new Map();  // Agrupar por usuario
      
      registros.forEach(registro => {
        if (!Array.isArray(registro.numbers)) return;
        
        let numerosCoincidentesPrimeros = [];
        let numerosCoincidentesUltimos = [];
        let tieneCoincidenciaExacta = false;
        
        registro.numbers.forEach(num => {
          let numStr = String(num).replace(/\s+/g, '').padStart(4, '0');
          
          // Coincidencia exacta
          if (numStr === query) {
            coincidenciaExacta = { registro, numeroEncontrado: numStr };
            tieneCoincidenciaExacta = true;
          }
          // Coincidencia con primeros 2 dígitos (solo si no es exacta)
          else if (numStr.substring(0, 2) === primerosDos) {
            numerosCoincidentesPrimeros.push(numStr);
          }
          // Coincidencia con últimos 2 dígitos (solo si no es exacta)
          else if (numStr.substring(2, 4) === ultimosDos) {
            numerosCoincidentesUltimos.push(numStr);
          }
        });
        
        // Solo agregar a mapas si no tiene coincidencia exacta
        if (!tieneCoincidenciaExacta) {
          if (numerosCoincidentesPrimeros.length > 0) {
            const userId = `${registro.name}_${registro.phone}`;
            registrosPrimerosDos.set(userId, {
              registro: registro,
              numerosCoincidentes: numerosCoincidentesPrimeros
            });
          }
          
          if (numerosCoincidentesUltimos.length > 0) {
            const userId = `${registro.name}_${registro.phone}`;
            registrosUltimosDos.set(userId, {
              registro: registro,
              numerosCoincidentes: numerosCoincidentesUltimos
            });
          }
        }
      });

      // Mostrar resultados
      let resultadoHTML = '';

      // 1. Coincidencia exacta
      if (coincidenciaExacta) {
        const { registro, numeroEncontrado } = coincidenciaExacta;
        const { name, phone, numbers, timestamp } = registro;
        const numerosHTML = numbers.map(n => {
          let numStr = typeof n === 'number' ? n.toString().padStart(4, '0') : String(n).padStart(4, '0');
          if (numStr === query) {
            return `<span style="background:#dc3545;color:white;padding:4px 8px;border-radius:6px;font-weight:bold;font-size:1.1em;">${numStr}</span>`;
          }
          return `<span style="background:#f8f9fa;padding:2px 6px;border-radius:4px;border:1px solid #dee2e6;">${numStr}</span>`;
        }).join(' ');

        const fechaRegistro = new Date(timestamp).toLocaleString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        resultadoHTML += `
          <div style="border: 2px solid #dc3545; border-radius: 8px; padding: 1.5rem; background: #fff5f5; margin-bottom: 1rem;">
            <div style="text-align: center; margin-bottom: 1rem;">
              <div style="font-size: 2.5em; color: #dc3545; margin-bottom: 0.5rem;">�</div>
              <h3 style="margin: 0; color: #dc3545;">Número Pagado - Protegido</h3>
              <p style="margin: 0.5rem 0 0 0; color: #721c24;">Este número ya ha sido pagado y confirmado</p>
            </div>
            
            <div style="background: white; padding: 1rem; border-radius: 6px; border: 1px solid #f5c6cb;">
              <div class="grid-info" style="display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1rem; align-items: center;">
                <strong style="color: #495057;">👤 Propietario:</strong>
                <span style="font-size: 1.1em; color: #212529;">${name}</span>
                
                <strong style="color: #495057;">📞 Teléfono:</strong>
                <span style="color: #212529;">${phone}</span>
                
                <strong style="color: #495057;">🎟️ Números:</strong>
                <div>${numerosHTML}</div>
                
                <strong style="color: #495057;">💰 Total:</strong>
                <span style="color: #28a745; font-weight: bold;">$${numbers.length * pricePerTicket}</span>
                
                <strong style="color: #495057;">📅 Fecha:</strong>
                <span style="color: #6c757d; font-size: 0.9em;">${fechaRegistro}</span>
                
                <strong style="color: #495057;">🔒 Estado:</strong>
                <span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.9em;">PAGADO</span>
              </div>
            </div>
          </div>
        `;
      } else {
        // Número exacto disponible
        resultadoHTML += `
          <div style="text-align: center; padding: 1.5rem; color: #6c757d; background: #d4edda; border: 2px solid #28a745; border-radius: 8px; margin-bottom: 1rem;">
            <div style="font-size: 3em; margin-bottom: 1rem;">🎯</div>
            <h3 style="margin: 0 0 0.5rem 0; color: #28a745;">¡Número Exacto Disponible!</h3>
            <p style="margin: 0; font-size: 1.1em; color: #155724;">El número <strong style="background: #28a745; color: white; padding: 4px 8px; border-radius: 4px;">${query}</strong> está disponible para ser seleccionado.</p>
          </div>
        `;
      }

      // 2. Coincidencias con primeros 2 dígitos
      if (registrosPrimerosDos.size > 0) {
        const registrosArray = Array.from(registrosPrimerosDos.values());
        resultadoHTML += `
          <div style="border: 1px solid #ffc107; border-radius: 8px; padding: 1rem; background: #fff8e1; margin-bottom: 1rem;">
            <h4 style="margin: 0 0 1rem 0; color: #856404; display: flex; align-items: center;">
              <span style="margin-right: 0.5rem;">🔸</span>
              Registros con primeros 2 dígitos (${primerosDos}**) - ${registrosArray.length} persona(s) encontrada(s):
            </h4>
        `;
        
        registrosArray.slice(0, 5).forEach(({ registro, numerosCoincidentes }) => {
          const fechaRegistro = new Date(registro.timestamp).toLocaleString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          // Crear números con resaltado - mostrar TODOS los números
          const numerosHTMLCompleto = registro.numbers.map(n => {
            let numStr = typeof n === 'number' ? n.toString().padStart(4, '0') : String(n).padStart(4, '0');
            if (numerosCoincidentes.includes(numStr)) {
              return `<span style="background:#ffc107;color:#212529;padding:3px 6px;border-radius:4px;font-weight:bold;">${numStr}</span>`;
            }
            return `<span style="background:#f8f9fa;padding:2px 6px;border-radius:4px;border:1px solid #dee2e6;">${numStr}</span>`;
          }).join(' ');

          resultadoHTML += `
            <div style="background: white; padding: 1rem; margin-bottom: 0.75rem; border-radius: 6px; border-left: 4px solid #ffc107; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div class="grid-info" style="display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1rem; align-items: center;">
                <strong style="color: #495057;">👤 Propietario:</strong>
                <span style="font-size: 1.1em; color: #212529;">${registro.name}</span>
                
                <strong style="color: #495057;">📞 Teléfono:</strong>
                <span style="color: #212529;">${registro.phone}</span>
                
                <strong style="color: #495057;">🎟️ Números:</strong>
                <div style="margin: 0.25rem 0;">${numerosHTMLCompleto}</div>
                
                <strong style="color: #495057;">💰 Total:</strong>
                <span style="color: #28a745; font-weight: bold;">$${registro.numbers.length * pricePerTicket}</span>
                
                <strong style="color: #495057;">📅 Fecha:</strong>
                <span style="color: #6c757d; font-size: 0.9em;">${fechaRegistro}</span>
                
                <strong style="color: #495057;">🔒 Estado:</strong>
                <span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.9em;">PAGADO</span>
                
                <strong style="color: #495057;">🎯 Coincidencias:</strong>
                <span style="color: #856404; font-weight: bold;">${numerosCoincidentes.length} número(s) con patrón ${primerosDos}**</span>
              </div>
            </div>
          `;
        });
        
        if (registrosArray.length > 5) {
          resultadoHTML += `<p style="color: #856404; font-size: 0.9em; margin: 0.5rem 0 0 0; text-align: center; font-style: italic;">... y ${registrosArray.length - 5} personas más con este patrón</p>`;
        }
        
        resultadoHTML += `</div>`;
      }

      // 3. Coincidencias con últimos 2 dígitos
      if (registrosUltimosDos.size > 0) {
        const registrosArray = Array.from(registrosUltimosDos.values());
        resultadoHTML += `
          <div style="border: 1px solid #17a2b8; border-radius: 8px; padding: 1rem; background: #e7f7ff; margin-bottom: 1rem;">
            <h4 style="margin: 0 0 1rem 0; color: #0c5460; display: flex; align-items: center;">
              <span style="margin-right: 0.5rem;">🔹</span>
              Registros con últimos 2 dígitos (**${ultimosDos}) - ${registrosArray.length} persona(s) encontrada(s):
            </h4>
        `;
        
        registrosArray.slice(0, 5).forEach(({ registro, numerosCoincidentes }) => {
          const fechaRegistro = new Date(registro.timestamp).toLocaleString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          // Crear números con resaltado - mostrar TODOS los números
          const numerosHTMLCompleto = registro.numbers.map(n => {
            let numStr = typeof n === 'number' ? n.toString().padStart(4, '0') : String(n).padStart(4, '0');
            if (numerosCoincidentes.includes(numStr)) {
              return `<span style="background:#17a2b8;color:white;padding:3px 6px;border-radius:4px;font-weight:bold;">${numStr}</span>`;
            }
            return `<span style="background:#f8f9fa;padding:2px 6px;border-radius:4px;border:1px solid #dee2e6;">${numStr}</span>`;
          }).join(' ');

          resultadoHTML += `
            <div style="background: white; padding: 1rem; margin-bottom: 0.75rem; border-radius: 6px; border-left: 4px solid #17a2b8; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div class="grid-info" style="display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1rem; align-items: center;">
                <strong style="color: #495057;">👤 Propietario:</strong>
                <span style="font-size: 1.1em; color: #212529;">${registro.name}</span>
                
                <strong style="color: #495057;">📞 Teléfono:</strong>
                <span style="color: #212529;">${registro.phone}</span>
                
                <strong style="color: #495057;">🎟️ Números:</strong>
                <div style="margin: 0.25rem 0;">${numerosHTMLCompleto}</div>
                
                <strong style="color: #495057;">💰 Total:</strong>
                <span style="color: #28a745; font-weight: bold;">$${registro.numbers.length * pricePerTicket}</span>
                
                <strong style="color: #495057;">📅 Fecha:</strong>
                <span style="color: #6c757d; font-size: 0.9em;">${fechaRegistro}</span>
                
                <strong style="color: #495057;">🔒 Estado:</strong>
                <span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.9em;">PAGADO</span>
                
                <strong style="color: #495057;">🎯 Coincidencias:</strong>
                <span style="color: #0c5460; font-weight: bold;">${numerosCoincidentes.length} número(s) con patrón **${ultimosDos}</span>
              </div>
            </div>
          `;
        });
        
        if (registrosArray.length > 5) {
          resultadoHTML += `<p style="color: #0c5460; font-size: 0.9em; margin: 0.5rem 0 0 0; text-align: center; font-style: italic;">... y ${registrosArray.length - 5} personas más con este patrón</p>`;
        }
        
        resultadoHTML += `</div>`;
      }

      // Si no hay coincidencias parciales, mostrar mensaje
      if (!coincidenciaExacta && registrosPrimerosDos.size === 0 && registrosUltimosDos.size === 0) {
        resultadoHTML += `
          <div style="text-align: center; padding: 1.5rem; background: #d4edda; border: 2px solid #28a745; border-radius: 8px;">
            <div style="font-size: 3em; margin-bottom: 1rem;">🎯</div>
            <h3 style="margin: 0 0 0.5rem 0; color: #28a745;">¡Número Completamente Disponible!</h3>
            <p style="margin: 0; font-size: 1.1em; color: #155724;">
              No se encontraron coincidencias exactas ni parciales para <strong style="background: #28a745; color: white; padding: 4px 8px; border-radius: 4px;">${query}</strong>
            </p>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.9em; color: #155724;">Este número y sus patrones están completamente disponibles.</p>
          </div>
        `;
      }

      resultadoBusqueda.innerHTML = resultadoHTML;

    }).catch(error => {
      console.error('Error buscando número:', error);
      resultadoBusqueda.innerHTML = `
        <div style="color: #dc3545; text-align: center; padding: 1rem; background: #fff5f5; border: 1px solid #f5c6cb; border-radius: 5px;">
          <strong>❌ Error:</strong> No se pudo realizar la búsqueda. Intenta nuevamente.
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

// Función para limpiar búsqueda
function limpiarBusquedaNumero() {
  busquedaNumeroInput.value = '';
  numeroBuscado = '';
  resultadoBusqueda.innerHTML = '<p style="color: #6c757d; text-align: center; margin: 0;">Ingresa un número para comenzar la búsqueda</p>';
}

// Función para cargar registros y eventos
function cargarRegistrosYEventos() {
  console.log('Iniciando cargarRegistrosYEventos...');
  
  if (typeof escucharRegistrosRealtime === 'undefined') {
    console.error('La función escucharRegistrosRealtime no está definida');
    return;
  }

  console.log('Configurando escucha en tiempo real...');
  escucharRegistrosRealtime(registros => {
    console.log('Registros recibidos:', registros.length);
    registrosGlobal = registros;
    
    // Mostrar indicador de que la app está funcionando
    const existingIndicator = document.getElementById('connectionStatus');
    if (!existingIndicator) {
      const statusDiv = document.createElement('div');
      statusDiv.id = 'connectionStatus';
      statusDiv.style.background = '#28a745';
      statusDiv.style.color = 'white';
      statusDiv.style.padding = '0.5rem';
      statusDiv.style.textAlign = 'center';
      statusDiv.style.fontSize = '0.9rem';
      statusDiv.textContent = `✓ Conectado - ${registros.length} registro(s) encontrado(s)`;
      document.body.insertBefore(statusDiv, document.body.firstChild);
      
      // Ocultar después de 3 segundos
      setTimeout(() => {
        if (statusDiv.parentNode) {
          statusDiv.remove();
        }
      }, 3000);
    }
    
    // Limpiar estado de botones
    Object.keys(numberStatus).forEach(num => {
      numberStatus[num] = 'available';
      const btn = document.querySelector(`button[data-number='${num}']`);
      if (btn) {
        btn.className = 'number-btn available';
        btn.disabled = false;
      }
    });

    let confirmados = 0;
    let pendientes = 0;

    registros.forEach(registro => {
      if (Array.isArray(registro.numbers)) {
        registro.numbers.forEach(num => {
          numberStatus[num] = registro.estado;
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

      if (registro.estado === 'confirmed') confirmados++;
      else if (registro.estado === 'pending') pendientes++;
    });

    // Actualizar contadores
    const confirmadosElement = document.getElementById('confirmadosCount');
    const pendientesElement = document.getElementById('pendientesCount');
    if (confirmadosElement) confirmadosElement.textContent = confirmados;
    if (pendientesElement) pendientesElement.textContent = pendientes;

    // Mostrar todos los registros (sin filtro de búsqueda)
    registrosList.innerHTML = '';
    registros.forEach(registro => renderRegistro(registro, ''));
  });

  // Registro de prueba automático para verificar despliegue
  setTimeout(() => {
    if (typeof db !== 'undefined') {
      db.ref('registros').once('value', snapshot => {
        if (!snapshot.exists()) {
          if (typeof guardarRegistroFirebase !== 'undefined') {
            guardarRegistroFirebase({
              name: 'Prueba',
              phone: '123456789',
              numbers: [1, 2, 3],
              timestamp: Date.now(),
              expiraEn: Date.now() + 3600000,
              estado: 'pending'
            });
          }
        }
      });
    }
  }, 1000);
}

// Función de inicialización
function initializeApp() {
  console.log('Iniciando initializeApp...');
  
  if (typeof firebase === 'undefined' || typeof db === 'undefined') {
    console.error('Firebase no está cargado correctamente');
    updateConnectionStatus('disconnected', 'Desconectado');
    return;
  }

  console.log('Firebase verificado correctamente');
  updateConnectionStatus('connecting', 'Conectando...');

  // Verificar conexión a Firebase
  db.ref('.info/connected').on('value', function(snapshot) {
    if (snapshot.val() === false) {
      console.log('Sin conexión a Firebase');
      updateConnectionStatus('disconnected', 'Desconectado');
    } else {
      console.log('Conectado a Firebase correctamente');
      updateConnectionStatus('connected', 'Conectado');
    }
  });

  console.log('Cargando registros y eventos...');
  // Cargar registros y eventos
  cargarRegistrosYEventos();
}

// Registro del formulario
form.addEventListener('submit', (e) => {
  e.preventDefault();

  if (selectedNumbers.size === 0) return alert('Selecciona al menos un número');

  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
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

  if (typeof guardarRegistroFirebase !== 'undefined') {
    console.log('Guardando registro:', registro);
    guardarRegistroFirebase(registro);
  } else {
    console.error('La función guardarRegistroFirebase no está definida');
  }

  // Marcar números como pendientes
  numbers.forEach(num => {
    numberStatus[num] = 'pending';
    const btn = document.querySelector(`button[data-number='${num}']`);
    if (btn) btn.className = 'number-btn selected';
  });

  selectedNumbers.clear();
  renderSelectedNumbers();
  updateTotal();
  form.reset();
});

// Crear botones del 0000 al 9999
console.log('Creando botones numéricos...');
for (let i = 0; i <= 9999; i++) {
  numberStatus[i] = 'available';
  grid.appendChild(createButton(i));
}
console.log('✓ 10,000 botones numéricos creados');

// Buscador de números
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');

if (searchInput && clearSearchBtn) {
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const buttons = grid.querySelectorAll('.number-btn');
    
    buttons.forEach(btn => {
      const number = btn.textContent;
      if (number.includes(query)) {
        btn.style.display = 'block';
      } else {
        btn.style.display = 'none';
      }
    });
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    const buttons = grid.querySelectorAll('.number-btn');
    buttons.forEach(btn => btn.style.display = 'block');
  });
}

// Al cargar: inicializar la aplicación
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM cargado, iniciando aplicación...');
  
  // Inicializar elementos de búsqueda
  busquedaNumeroInput = document.getElementById('busquedaNumeroInput');
  busquedaNumeroBtn = document.getElementById('busquedaNumeroBtn');
  clearBusquedaBtn = document.getElementById('clearBusquedaBtn');
  resultadoBusqueda = document.getElementById('resultadoBusqueda');

  console.log('Elementos encontrados:', {
    grid: !!grid,
    form: !!form,
    registrosList: !!registrosList,
    busquedaNumeroInput: !!busquedaNumeroInput,
    busquedaNumeroBtn: !!busquedaNumeroBtn,
    resultadoBusqueda: !!resultadoBusqueda
  });

  // Configurar eventos de búsqueda
  if (busquedaNumeroBtn && busquedaNumeroInput) {
    busquedaNumeroBtn.onclick = buscarNumeroEnRegistros;
    busquedaNumeroInput.onkeyup = function(e) {
      if (e.key === 'Enter') buscarNumeroEnRegistros();
    };
    
    // Validar solo números en el input y mostrar/ocultar botón limpiar
    busquedaNumeroInput.oninput = function(e) {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      
      // Mostrar/ocultar botón de limpiar
      if (clearBusquedaBtn) {
        clearBusquedaBtn.style.display = e.target.value.length > 0 ? 'flex' : 'none';
      }
      
      // Limpiar automáticamente si el campo está vacío
      if (e.target.value.length === 0) {
        limpiarBusquedaNumero();
      }
    };
  }

  // Configurar botón de limpiar pequeño
  if (clearBusquedaBtn) {
    clearBusquedaBtn.onclick = function() {
      limpiarBusquedaNumero();
      clearBusquedaBtn.style.display = 'none';
    };
  }

  // Inicializar el indicador de conexión
  updateConnectionStatus('connecting', 'Conectando...');

  // Verificar si Firebase está disponible
  console.log('Estado de Firebase:', {
    firebase: typeof firebase,
    db: typeof db,
    firebaseApp: typeof firebase !== 'undefined' ? !!firebase.app : false
  });

  // Llamar a la función de inicialización
  if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
    console.log('Firebase disponible, iniciando aplicación...');
    initializeApp();
  } else {
    console.log('Firebase no disponible, esperando...');
    // Esperar a que Firebase se cargue
    setTimeout(() => {
      console.log('Verificando Firebase después de esperar...');
      if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
        console.log('Firebase cargado correctamente');
        initializeApp();
      } else {
        console.error('Firebase no se cargó después de esperar');
        updateConnectionStatus('disconnected', 'Error de carga');
      }
    }, 3000);
  }
});
