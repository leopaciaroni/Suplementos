
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("EVOLUTRA [Nucleus]: Iniciando secuencia de montaje...");

const mount = () => {
  const container = document.getElementById('root');
  if (container) {
    try {
      const root = createRoot(container);
      root.render(<App />);
      console.log("EVOLUTRA [Nucleus]: Renderizado exitoso.");
    } catch (err) {
      console.error("EVOLUTRA [Nucleus]: Error durante el renderizado inicial:", err);
    }
  } else {
    console.error("EVOLUTRA [Nucleus]: No se encontró el contenedor #root.");
  }
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  mount();
} else {
  window.addEventListener('DOMContentLoaded', mount);
}
