// Configuración clásica para Firebase CDN
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

// Inicializa Firebase usando el objeto global
firebase.initializeApp(firebaseConfig);
const db = firebase.database();