import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider.jsx'
import AuthScreen from './auth/AuthScreen.jsx'
import AppLayout from './components/AppLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Placeholder from './pages/Placeholder.jsx'
import Vendors from './pages/Vendors.jsx'
import Venues from './pages/Venues.jsx'
import Guests from './pages/Guests.jsx'
import Budget from './pages/Budget.jsx'
import Planning from './pages/Planning.jsx'

export default function App() {
  const { session, loading } = useAuth()

  if (loading) return <div className="boot">Loading…</div>
  if (!session) return <AuthScreen />

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="planning" element={<Planning />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="venues" element={<Venues />} />
        <Route path="decisions" element={<Placeholder title="Decisions" />} />
        <Route path="budget" element={<Budget />} />
        <Route path="guests" element={<Guests />} />
        <Route path="ideas" element={<Placeholder title="Ideas & Items" />} />
        <Route path="events" element={<Placeholder title="Events" />} />
        <Route path="documents" element={<Placeholder title="Documents" />} />
        <Route path="communications" element={<Placeholder title="Communications" />} />
        <Route path="settings" element={<Placeholder title="Settings" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
