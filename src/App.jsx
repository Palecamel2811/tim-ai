import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Nav from './components/Nav'
import HomeScreen    from './screens/HomeScreen'
import RecordScreen  from './screens/RecordScreen'
import CreateScreen  from './screens/CreateScreen'
import JournalScreen from './screens/JournalScreen'
import MemoryScreen  from './screens/MemoryScreen'
import ElderScreen   from './screens/ElderScreen'
import JamScreen     from './screens/JamScreen'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <main key={location.pathname} className="flex-1 flex flex-col page-enter overflow-y-auto">
      <Routes location={location}>
        <Route path="/"         element={<Navigate to="/home" replace />} />
        <Route path="/home"     element={<HomeScreen />} />
        <Route path="/record"   element={<RecordScreen />} />
        <Route path="/create"   element={<CreateScreen />} />
        <Route path="/journal"  element={<JournalScreen />} />
        <Route path="/memories" element={<MemoryScreen />} />
        <Route path="/elder"    element={<ElderScreen />} />
        <Route path="/jam"      element={<JamScreen />} />
      </Routes>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen bg-[#0A0E1A] overflow-hidden">
        <AnimatedRoutes />
        <Nav />
      </div>
    </BrowserRouter>
  )
}
