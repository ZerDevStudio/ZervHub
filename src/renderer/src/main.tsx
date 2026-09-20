import './lib/tauriBridge'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { I18nProvider } from './lib/i18n'
import { LicenseProvider } from './lib/LicenseContext'
import { ToastProvider } from './lib/ToastContext'
import { WorkspaceModeProvider } from './context/WorkspaceModeContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nProvider defaultLocale="tr">
        <LicenseProvider>
          <ToastProvider>
            <HashRouter>
              <WorkspaceModeProvider>
                <App />
              </WorkspaceModeProvider>
            </HashRouter>
          </ToastProvider>
        </LicenseProvider>
      </I18nProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
