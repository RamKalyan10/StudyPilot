/**
 * @file main.jsx
 * @description React 18 Application Bootstrap Entry Point.
 * Mounts the top-level <App /> component into the DOM root with StrictMode enabled.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Failed to locate root DOM element to mount React application.');
}
