import { Outlet } from 'react-router-dom'
import NavBar from './components/NavBar'

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <NavBar />
      {/* Extra bottom padding on mobile clears the fixed bottom tab bar (NavBar.tsx) so it never
          covers the last bit of page content. */}
      <main className="mx-auto max-w-6xl px-4 pt-6 pb-20 sm:pb-6">
        <Outlet />
      </main>
    </div>
  )
}

export default App
