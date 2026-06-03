import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'
import './i18n.js'
import { ThemeProvider } from './context/ThemeContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#3e3c3a',
              border: '1px solid #e2e0dc',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'DM Sans, sans-serif',
            },
          }}
        />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
)
