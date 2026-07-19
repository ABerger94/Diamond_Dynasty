import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import RulebookPage from './pages/RulebookPage.tsx'
import PlayersPage from './pages/PlayersPage.tsx'
import CardsPage from './pages/CardsPage.tsx'
import RosterPage from './pages/RosterPage.tsx'
import PlayPage from './pages/PlayPage.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <RulebookPage /> },
      { path: 'players', element: <PlayersPage /> },
      { path: 'cards', element: <CardsPage /> },
      { path: 'roster', element: <RosterPage /> },
      { path: 'play', element: <PlayPage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
