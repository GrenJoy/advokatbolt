import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import { Suspense, lazy } from 'react'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Cases = lazy(() => import('./pages/Cases'))
const CaseDetails = lazy(() => import('./pages/CaseDetails'))
const Clients = lazy(() => import('./pages/Clients'))
const Documents = lazy(() => import('./pages/Documents'))
const AIChat = lazy(() => import('./pages/AIChat'))

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="p-6">Загрузка...</div>}>
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
      </Suspense>
    </Router>
  )
}

export default App