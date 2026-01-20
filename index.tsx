
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const bootSystem = () => {
  console.log("EVOLUTRA [System]: Iniciando secuencia de montaje...");
  const container = document.getElementById('root');

  if (container) {
    try {
      const root = createRoot(container);
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      console.log("EVOLUTRA [System]: Protocolo de renderizado activado exitosamente.");
    } catch (err) {
      console.error("EVOLUTRA [System]: Fallo crítico durante el montaje de la interfaz:", err);
    }
  } else {
    console.error("EVOLUTRA [System]: Error fatal - Contenedor principal #root no localizado en el DOM.");
  }
};

// Asegurar que el DOM esté completamente listo y los recursos del importmap vinculados
if (document.readyState === 'loading') {
  window.addEventListener('load', bootSystem);
} else {
  bootSystem();
}
