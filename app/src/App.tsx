import { Outlet } from 'react-router-dom'
import NavBar from './components/NavBar'

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

export default App
