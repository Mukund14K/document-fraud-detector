import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Results from './pages/Results'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/results/:id" element={<Results />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  )
}

export default App