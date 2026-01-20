
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("EVOLUTRA [System]: Booting engine...");

const init = () => {
  const container = document.getElementById('root');
  if (container) {
    console.log("EVOLUTRA [System]: DOM Container located. Mounting React...");
    const root = createRoot(container);
    root.render(<App />);
  } else {
    console.error("EVOLUTRA [System]: CRITICAL ERROR - Mount point #root not found.");
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
