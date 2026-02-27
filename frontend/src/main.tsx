import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import '@/i18n'
import { i18nReady } from '@/i18n'

i18nReady.finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
