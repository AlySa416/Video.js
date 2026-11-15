import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@videojs/react/video/scaffold-skin.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
