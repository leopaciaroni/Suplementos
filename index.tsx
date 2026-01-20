
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("EVOLUTRA [System]: Iniciando secuencia de despliegue...");

const mountSystem = () => {
  const container = document.getElementById('root');
  if (container) {
    try {
      const root = createRoot(container);
      // No usamos StrictMode aquí para descartar interferencias en el ciclo de vida del montaje inicial en Chrome
      root.render(<App />);
      console.log("EVOLUTRA [System]: Núcleo operativo satisfactoriamente.");
    } catch (err) {
      console.error("EVOLUTRA [System]: Fallo crítico en la capa de renderizado:", err);
      // Esto activará el window.onerror definido en el HTML
      throw err;
    }
  } else {
    console.error("EVOLUTRA [System]: Contenedor raíz no encontrado.");
  }
};

// Ejecutar montaje cuando el DOM esté listo
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  mountSystem();
} else {
  window.addEventListener('DOMContentLoaded', mountSystem);
}
