import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { InstitutionProvider } from './contexts/InstitutionContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="Sistema SPTF - Recuperação de Sessão">
      <InstitutionProvider>
        <App />
      </InstitutionProvider>
    </ErrorBoundary>
  </StrictMode>,
);


