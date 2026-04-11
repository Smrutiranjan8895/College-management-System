import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { Toaster } from 'react-hot-toast';
import App from './App';
import awsExports from './aws-exports';
import './App.css';

Amplify.configure(awsExports);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1E293B',
            color: '#F8FAFC',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#F8FAFC',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#F8FAFC',
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
