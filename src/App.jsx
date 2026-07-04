import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Nav from './components/Nav'
import RecordScreen from './screens/RecordScreen'
import CreateScreen from './screens/CreateScreen'
import JournalScreen from './screens/JournalScreen'
import MemoryScreen from './screens/MemoryScreen'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-[#0D0D0D]">
        <Nav />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Navigate to="/record" replace />} />
            <Route path="/record" element={<RecordScreen />} />
            <Route path="/create" element={<CreateScreen />} />
            <Route path="/journal" element={<JournalScreen />} />
            <Route path="/memories" element={<MemoryScreen />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
