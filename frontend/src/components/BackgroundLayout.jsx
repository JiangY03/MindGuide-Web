import React from 'react'

/**
 * BackgroundLayout - Shared background layout component
 * Provides full-screen gradient background, animated decorative elements and frosted glass content container
 * @param {React.ReactNode} children - Child component content
 * @param {string} title - Page title
 * @param {string} subtitle - Page subtitle (optional)
 */
function BackgroundLayout({ children, title, subtitle }) {
  return (
    // Main container: full-screen fixed positioning with gradient background
    <div style={{
      position: 'fixed',        // Fixed positioning, covers entire viewport
      top: 0,
      left: 0,
      width: '100vw',          // Viewport width
      height: '100vh',         // Viewport height
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Blue-purple gradient background
      display: 'flex',
      flexDirection: 'column', // Vertical layout
      overflow: 'hidden',      // Hide overflow content
      zIndex: 1
    }}>
      {/* CSS animation definitions */}
      <style>{`
        /* Float animation: up and down movement effect */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        /* Pulse animation: opacity change effect */
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        /* Spin animation: 360-degree rotation effect */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Background decorative elements: four semi-transparent circles for visual depth */}
      {/* Top-left floating circle */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        animation: 'float 6s ease-in-out infinite'
      }} />
      {/* Top-right pulsing circle */}
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '15%',
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.15)',
        animation: 'pulse 4s ease-in-out infinite'
      }} />
      {/* Bottom-left reverse floating circle */}
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '20%',
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.08)',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />
      {/* Bottom-right pulsing circle */}
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.05)',
        animation: 'pulse 6s ease-in-out infinite'
      }} />

      {/* Header area: displays page title and subtitle */}
      {title && (
        <div style={{
          padding: title === 'Assessment Results' ? '40px 40px 20px 40px' : '20px 40px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
          marginBottom: title === 'Assessment Results' ? '20px' : '0'
        }}>
          {/* Main title */}
          <h1 style={{ 
            margin: 0, 
            fontSize: 32, 
            fontWeight: 700, 
            color: '#000000',
            marginBottom: 8
          }}>
            {title}
          </h1>
          {/* Subtitle (optional) */}
          {subtitle && (
            <p style={{ 
              margin: 0, 
              color: '#333333', 
              fontSize: 16,
              fontWeight: 400
            }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Main content area: centers page content */}
      <div style={{
        flex: 1,                    // Takes remaining space
        display: 'flex',
        alignItems: 'center',       // Vertical centering
        justifyContent: 'center',   // Horizontal centering
        padding: '20px',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Content container: frosted glass effect, adjusts width based on page type */}
        <div style={{
          // Login/register pages use fit-content to wrap only text, other pages use larger width
          width: title === 'Create Account' || title === 'Welcome Back' ? 'fit-content' : '100%',
          maxWidth: title === 'Create Account' || title === 'Welcome Back' ? 'fit-content' : 
                   title === 'Assessment Results' ? '700px' : '900px',
          background: 'rgba(255, 255, 255, 0.98)',  // Semi-transparent white background
          backdropFilter: 'blur(10px)',             // Frosted glass blur effect
          borderRadius: 16,                         // Rounded corners
          padding: title === 'Assessment Results' ? 20 : 24,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)', // Shadow effect
          border: '1px solid rgba(255, 255, 255, 0.2)',
          maxHeight: '85vh',                        // Maximum height limit
          overflow: 'auto',                         // Show scrollbar when content overflows
          color: '#000000'                          // Text color
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default BackgroundLayout
