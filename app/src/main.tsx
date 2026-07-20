import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import RulebookPage from './pages/RulebookPage.tsx'
import PlayersPage from './pages/PlayersPage.tsx'
import CardsPage from './pages/CardsPage.tsx'
import RosterPage from './pages/RosterPage.tsx'
import ScorecardPage from './pages/ScorecardPage.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <RulebookPage /> },
      { path: 'players', element: <PlayersPage /> },
      { path: 'cards', element: <CardsPage /> },
      { path: 'roster', element: <RosterPage /> },
      { path: 'scorecard', element: <ScorecardPage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

// Registering a (no-op) service worker is part of Chrome/Android's install criteria for the
// "Add to Home Screen" prompt — see public/sw.js for why it does nothing beyond that.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Installability is a nice-to-have, not a hard requirement — a failed registration (e.g.
      // an unsupported browser context) shouldn't be treated as an app error.
    })
  })
}
