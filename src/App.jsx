import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Nav from './components/Nav'
import RecordScreen from './screens/RecordScreen'
import CreateScreen from './screens/CreateScreen'
import JournalScreen from './screens/JournalScreen'
import MemoryScreen from './screens/MemoryScreen'
import ElderScreen from './screens/ElderScreen'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <main key={location.pathname} className="flex-1 flex flex-col page-enter">
      <Routes location={location}>
        <Route path="/" element={<Navigate to="/record" replace />} />
        <Route path="/record" element={<RecordScreen />} />
        <Route path="/create" element={<CreateScreen />} />
        <Route path="/journal" element={<JournalScreen />} />
        <Route path="/memories" element={<MemoryScreen />} />
        <Route path="/elder" element={<ElderScreen />} />
      </Routes>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-[#EEF2FA]">
        <Nav />
        <AnimatedRoutes />
      </div>
    </BrowserRouter>
  )
}
