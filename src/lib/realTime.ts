import { ref, set, push, get, remove, onValue, off } from 'firebase/database';
import { db } from './firebase';
import { RegistroRifa, ConfiguracionSorteo } from '../types';

// ========== FUNCIONES DE FIREBASE ==========

// Guardar un registro en Firebase
export function guardarRegistroFirebase(registro: RegistroRifa) {
  console.log('Guardando registro en Firebase:', registro);
  const newRef = push(ref(db, 'registros'));
  registro.id = newRef.key;
  return set(newRef, registro).then(() => {
    console.log('Registro guardado exitosamente:', registro.id);
    return registro;
  }).catch((error) => {
    console.error('Error al guardar registro:', error);
    throw error;
  });
}

// Obtener todos los registros de Firebase
export function obtenerRegistrosFirebase(callback: (registros: RegistroRifa[]) => void) {
  console.log('Obteniendo registros de Firebase...');
  const registrosRef = ref(db, 'registros');
  get(registrosRef).then((snapshot) => {
    const data = snapshot.val() || {};
    const registros = Object.values(data) as RegistroRifa[];
    console.log('Registros obtenidos:', registros.length);
    callback(registros);
  }).catch((error) => {
    console.error('Error al obtener registros:', error);
    callback([]);
  });
}

// Eliminar un registro de Firebase por id
export function eliminarRegistroFirebase(id: string) {
  return remove(ref(db, `registros/${id}`));
}

// Actualizar estado de un registro específico
export function actualizarEstadoRegistro(id: string, status: 'pending' | 'verified') {
  return set(ref(db, `registros/${id}/status`), status);
}

// Eliminar todos los registros de Firebase
export function eliminarTodosLosRegistrosFirebase() {
  return remove(ref(db, 'registros'));
}

// Guardar configuración de sorteo en Firebase
export function guardarConfiguracionSorteoFirebase(config: ConfiguracionSorteo) {
  return set(ref(db, 'configuracion'), config);
}

// Obtener configuración de sorteo desde Firebase
export function obtenerConfiguracionSorteo(callback: (config: ConfiguracionSorteo | null) => void) {
  const configRef = ref(db, 'configuracion');
  get(configRef).then((snapshot) => {
    const config = snapshot.val();
    callback(config);
  });
}

// Bloquear registros en Firebase (para sincronización entre clientes)
export function establecerBloqueoRegistros(bloqueado: boolean) {
  return set(ref(db, 'configuracion/registrosBloqueados'), bloqueado);
}

// Escuchar cambios en el estado de bloqueo
export function escucharBloqueoRegistros(callback: (bloqueado: boolean) => void) {
  const bloqueoRef = ref(db, 'configuracion/registrosBloqueados');
  onValue(bloqueoRef, (snapshot) => {
    const bloqueado = snapshot.val();
    callback(bloqueado);
  });
  
  // Retornar función para cancelar la escucha
  return () => off(bloqueoRef);
}

// Escuchar registros en tiempo real
export function escucharRegistrosRealtime(callback: (registros: RegistroRifa[]) => void) {
  console.log('Configurando escucha de registros en tiempo real...');
  const registrosRef = ref(db, 'registros');
  
  const unsubscribe = onValue(registrosRef, (snapshot) => {
    const data = snapshot.val() || {};
    const registros = Object.values(data) as RegistroRifa[];
    console.log('Registros actualizados en tiempo real:', registros.length);
    callback(registros);
  }, (error) => {
    console.error('Error en la escucha de registros:', error);
  });
  
  // Retornar función para cancelar la escucha
  return () => {
    console.log('Cancelando escucha de registros...');
    unsubscribe();
  };
}

// Cargar registros al iniciar
export function cargarRegistrosAlIniciar(callback: (registros: RegistroRifa[]) => void) {
  console.log('Cargando registros al iniciar...');
  const registrosRef = ref(db, 'registros');
  get(registrosRef).then((snapshot) => {
    const data = snapshot.val() || {};
    const registros = Object.values(data) as RegistroRifa[];
    console.log('Registros cargados al iniciar:', registros.length);
    callback(registros);
  }).catch((error) => {
    console.error('Error al cargar registros al iniciar:', error);
    callback([]);
  });
}

// Verificar usuario en Firebase (para autenticación de acceso a registros)
export function verificarUsuario(token: string, callback: (existe: boolean) => void) {
  const usuarioRef = ref(db, `usuarios/${token}`);
  get(usuarioRef).then((snapshot) => {
    callback(snapshot.exists());
  });
}
