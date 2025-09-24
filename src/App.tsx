import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import Cases from './pages/Cases'
import CaseDetails from './pages/CaseDetails'
import Clients from './pages/Clients'
import Documents from './pages/Documents'
import AIChat from './pages/AIChat'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="cases" element={<Cases />} />
          <Route path="cases/:id" element={<CaseDetails />} />
          <Route path="clients" element={<Clients />} />
          <Route path="documents" element={<Documents />} />
          <Route path="ai-chat" element={<AIChat />} />
          <Route path="calendar" element={<div className="p-6">Календарь в разработке</div>} />
          <Route path="settings" element={<div className="p-6">Настройки в разработке</div>} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App