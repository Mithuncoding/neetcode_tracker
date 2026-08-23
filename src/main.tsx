import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import '@fontsource-variable/manrope'
import '@fontsource-variable/jetbrains-mono'
import './index.css'
import RootApp from './RootApp.tsx'
import { TrackerProvider } from './context/TrackerContext.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ErrorBoundary>
        <TrackerProvider>
          <RootApp />
        </TrackerProvider>
      </ErrorBoundary>
    </HashRouter>
  </StrictMode>,
)
