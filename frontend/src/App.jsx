import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

// Component imports
import RequireAuth from './components/RequireAuth'  // Route protection component
import Login from './pages/Login'                   // Login page
import Consent from './pages/Consent'               // Consent page
import Dashboard from './pages/Dashboard'           // Dashboard page
import Assessment from './pages/Assessment'         // Assessment page
import Mood from './pages/Mood'                     // Mood check-in page
import Tools from './pages/Tools'                   // Self-help tools page
import Chat from './pages/Chat'                     // Chat page
import Survey from './pages/Survey'                 // Survey page
import Result from './pages/Result'                 // Results page
import Report from './pages/Report'                 // Personal report page
import Debug from './pages/Debug'                   // Debug page

/**
 * App Component - Main application entry point
 * Defines all routes and page components
 */
function App() {
  return (
    <Routes>
      {/* Root path redirects to login page */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Public pages - no authentication required */}
      <Route path="/login" element={<Login />} />      {/* Login/registration page */}
      <Route path="/consent" element={<Consent />} />  {/* User consent page */}
      <Route path="/debug" element={<Debug />} />      {/* Debug page */}

      {/* Protected pages - require user authentication */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />

      <Route
        path="/assessment"
        element={
          <RequireAuth>
            <Assessment />
          </RequireAuth>
        }
      />

      <Route
        path="/mood"
        element={
          <RequireAuth>
            <Mood />
          </RequireAuth>
        }
      />

      <Route
        path="/tools"
        element={
          <RequireAuth>
            <Tools />
          </RequireAuth>
        }
      />

      <Route
        path="/chat"
        element={
          <RequireAuth>
            <Chat />
          </RequireAuth>
        }
      />

      <Route
        path="/survey"
        element={
          <RequireAuth>
            <Survey />
          </RequireAuth>
        }
      />

      <Route
        path="/result"
        element={
          <RequireAuth>
            <Result />
          </RequireAuth>
        }
      />

      <Route
        path="/report"
        element={
          <RequireAuth>
            <Report />
          </RequireAuth>
        }
      />

      {/* 404 page - redirect to login page */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
