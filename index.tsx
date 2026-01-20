
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const mount = () => {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<App />);
  }
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  mount();
} else {
  window.addEventListener('DOMContentLoaded', mount);
}
