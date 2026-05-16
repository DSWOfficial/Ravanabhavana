import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { BlockProvider } from './context/BlockContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BlockProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </BlockProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
