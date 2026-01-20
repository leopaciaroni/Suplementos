
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("EVOLUTRA: Mount sequence initiated.");

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error("Critical Error: 'root' element not found in DOM.");
}
