import { Navigate, useLocation } from 'react-router-dom'

/**
 * RequireAuth Component - Route protection component
 * Checks if user is logged in, redirects to login page if not authenticated
 * @param {React.ReactNode} children - Child components that need protection
 */
function RequireAuth({ children }) {
  const location = useLocation()
  
  // Get user information from local storage
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  let isAuthed = false
  
  try {
    // Try to parse the stored user data
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      isAuthed = Boolean(userData && (userData.id || userData.email))
    }
  } catch (error) {
    console.error('Error parsing user data:', error)
    // Clear invalid data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
    }
  }

  // If user is not logged in, redirect to login page
  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // User is logged in, render child components
  return children
}

export default RequireAuth



