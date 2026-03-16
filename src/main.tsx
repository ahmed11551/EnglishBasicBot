import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initTelegramWebApp } from './telegram'
import './index.css'
import App from './App.tsx'

function Main() {
  useEffect(() => {
    initTelegramWebApp()
  }, [])

  return <App />
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')
createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <Main />
    </ErrorBoundary>
  </StrictMode>,
)
