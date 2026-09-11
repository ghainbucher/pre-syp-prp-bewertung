import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import './styles.css';

const wurzel = document.getElementById('app');
if (!wurzel) throw new Error('Element #app fehlt in index.html');

createRoot(wurzel).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
