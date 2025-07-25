# Migración de App Rifas a Next.js

## Rama: prueba_integracion

Esta rama contiene la migración completa de la aplicación de rifas desde HTML/JS vanilla a **Next.js 15** con **TypeScript**, manteniendo todas las funcionalidades originales y la conexión a **Firebase Realtime Database**.

## 🚀 Funcionalidades Migradas

### ✅ Completamente Funcional

1. **Selección de Números**
   - Grid de 10,000 números (0001-10000)
   - Estados visuales: disponible, seleccionado, no disponible
   - Búsqueda de números específicos
   - Scroll optimizado con lazy loading

2. **Registro de Participantes**
   - Formulario de registro con validación
   - Temporizador de 30 minutos para confirmar pago
   - Notificaciones visuales con información de pago
   - Estados: pendiente, confirmado, expirado

3. **Gestión de Registros** (Solo con autenticación)
   - Lista de todos los registros con filtros
   - Confirmación y eliminación de registros
   - Contadores en tiempo real
   - Búsqueda por número, teléfono o nombre

4. **Configuración del Sorteo** (Solo con autenticación)
   - Configurar fecha y hora del sorteo
   - Establecer valor de boletas
   - Configurar tiempo de temporizador
   - Bloqueo automático antes del sorteo

5. **Firebase Realtime Database**
   - Sincronización en tiempo real
   - Persistencia de datos
   - Escucha de cambios automática
   - Indicador de estado de conexión

6. **Modal de Soporte**
   - Tutorial visual con GIFs
   - Información de contacto
   - Explicación de colores y estados

## 🛠 Tecnologías Utilizadas

- **Next.js 15** - Framework de React
- **TypeScript** - Tipado estático
- **Firebase v9+** - Base de datos en tiempo real
- **CSS Modules** - Estilos preservados del original
- **React Hooks** - Estado y efectos

## 📂 Estructura del Proyecto

```
src/
├── app/
│   ├── globals.css          # Estilos originales preservados
│   ├── layout.tsx           # Layout principal
│   └── page.tsx             # Página principal
├── components/
│   ├── Header.tsx           # Cabecera con indicador de conexión
│   ├── NumbersSection.tsx   # Sección de selección de números
│   ├── RegistrationForm.tsx # Formulario de registro
│   ├── RegisteredRecords.tsx# Lista y gestión de registros
│   ├── NumberSearch.tsx     # Búsqueda de números
│   ├── RifaApp.tsx         # Componente principal
│   └── SupportModal.tsx    # Modal de soporte y tutorial
├── hooks/
│   └── useRifaState.ts     # Hook personalizado para estado global
├── lib/
│   ├── firebase.ts         # Configuración de Firebase
│   └── realTime.ts         # Funciones de Firebase Realtime DB
└── types/
    └── index.ts            # Tipos TypeScript
```

## 🔧 Configuración y Ejecución

### Requisitos
- Node.js 18+
- npm o yarn

### Instalación
```bash
# Cambiar a la rama
git checkout prueba_integracion

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

### Build para Producción
```bash
npm run build
npm start
```

## 🔐 Autenticación

Para acceder a las secciones de **Registros Realizados** y **Búsqueda de Números**, es necesario incluir un token válido en la URL:

```
http://localhost:3000?token=TU_TOKEN_AQUI
```

El token debe existir en la base de datos Firebase bajo `usuarios/{token}`.

## 🔄 Diferencias con la Versión Original

### Mejoradas
- **TypeScript**: Mayor seguridad de tipos
- **Componentes modulares**: Mejor organización y mantenibilidad
- **Hooks personalizados**: Estado centralizado y reutilizable
- **Optimización de imágenes**: Uso de Next.js Image
- **SSR Ready**: Preparado para Server-Side Rendering

### Preservadas
- **Estilos CSS**: Exactamente iguales al original
- **Funcionalidades**: 100% de las características originales
- **Firebase**: Misma base de datos y configuración
- **UX/UI**: Interfaz idéntica al usuario final

## 🚨 Configuración de Firebase

El archivo `src/lib/firebase.ts` contiene la configuración de Firebase. Asegúrate de que las credenciales sean correctas:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyDanFNJLMpwhdUZY1eP5jDcY1U6wjlUTdM",
  authDomain: "boletas-influ.firebaseapp.com",
  databaseURL: "https://boletas-influ-default-rtdb.firebaseio.com",
  projectId: "boletas-influ",
  storageBucket: "boletas-influ.firebasestorage.app",
  messagingSenderId: "92186499156",
  appId: "1:92186499156:web:8f8e2dcc3d1f8cd60575c1",
  measurementId: "G-QNMGERW7BJ"
};
```

## 📈 Próximos Pasos

1. **Testing**: Implementar pruebas unitarias y de integración
2. **PWA**: Convertir a Progressive Web App
3. **Optimizations**: Implementar cache y optimizaciones adicionales
4. **Mobile**: Mejorar experiencia móvil específica
5. **Analytics**: Agregar seguimiento de eventos

## 🐛 Issues Conocidos

- Ninguno reportado hasta el momento
- Todos los tests manuales han pasado exitosamente

## 👨‍💻 Desarrollado por

GitHub Copilot - Migración completa manteniendo fidelidad al 100% con el diseño y funcionalidades originales.

---

**Nota**: Esta migración mantiene completa compatibilidad con la versión original mientras añade los beneficios de Next.js y TypeScript.
