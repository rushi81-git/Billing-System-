import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { Toaster } from 'react-hot-toast';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: '10px',
          background: '#1a1a2e',
          color: '#fff',
          fontSize: '14px',
        },
        success: { iconTheme: { primary: '#4ade80', secondary: '#1a1a2e' } },
        error: { iconTheme: { primary: '#f87171', secondary: '#1a1a2e' } },
      }}
    />
  </React.StrictMode>
);
