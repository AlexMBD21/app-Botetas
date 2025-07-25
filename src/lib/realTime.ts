import { ref, set, push, get, remove, onValue, off } from 'firebase/database';
import { db } from './firebase';
import { RegistroRifa, ConfiguracionSorteo } from '../types';

// ========== FUNCIONES DE FIREBASE ==========

// Guardar un registro en Firebase
export function guardarRegistroFirebase(registro: RegistroRifa) {
  const newRef = push(ref(db, 'registros'));
  registro.id = newRef.key;
  return set(newRef, registro);
}

// Obtener todos los registros de Firebase
export function obtenerRegistrosFirebase(callback: (registros: RegistroRifa[]) => void) {
  const registrosRef = ref(db, 'registros');
  get(registrosRef).then((snapshot) => {
    const data = snapshot.val() || {};
    const registros = Object.values(data) as RegistroRifa[];
    callback(registros);
  });
}

// Eliminar un registro de Firebase por id
export function eliminarRegistroFirebase(id: string) {
  return remove(ref(db, `registros/${id}`));
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
  const registrosRef = ref(db, 'registros');
  onValue(registrosRef, (snapshot) => {
    const data = snapshot.val() || {};
    const registros = Object.values(data) as RegistroRifa[];
    callback(registros);
  });
  
  // Retornar función para cancelar la escucha
  return () => off(registrosRef);
}

// Cargar registros al iniciar
export function cargarRegistrosAlIniciar(callback: (registros: RegistroRifa[]) => void) {
  const registrosRef = ref(db, 'registros');
  get(registrosRef).then((snapshot) => {
    const data = snapshot.val() || {};
    const registros = Object.values(data) as RegistroRifa[];
    callback(registros);
  });
}

// Verificar usuario en Firebase (para autenticación de acceso a registros)
export function verificarUsuario(token: string, callback: (existe: boolean) => void) {
  const usuarioRef = ref(db, `usuarios/${token}`);
  get(usuarioRef).then((snapshot) => {
    callback(snapshot.exists());
  });
}
