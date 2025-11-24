import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Debug() {
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState({});
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    // Collect debug information
    const info = {
      user: localStorage.getItem('user'),
      clientId: localStorage.getItem('clientId'),
      chatDisabled: localStorage.getItem('chatDisabled'),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    setDebugInfo(info);
  }, []);

  const testBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/health/');
      const data = await response.json();
      setTestResults(prev => ({
        ...prev,
        backend: { success: true, data }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        backend: { success: false, error: error.message }
      }));
    }
  };

  const testChatAPI = async () => {
    try {
      const clientId = localStorage.getItem('clientId') || 'test-client';
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': clientId
        },
        body: JSON.stringify({ message: 'Test message' })
      });
      const data = await response.json();
      setTestResults(prev => ({
        ...prev,
        chat: { success: true, data }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        chat: { success: false, error: error.message }
      }));
    }
  };

  const clearStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  const enableChat = () => {
    localStorage.removeItem('chatDisabled');
    window.location.reload();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🐛 Debug Information</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
            Go to Dashboard
          </button>
          <button onClick={() => navigate('/chat')} style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
            Go to Chat
          </button>
          <button onClick={enableChat} style={{ padding: '10px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px' }}>
            Enable Chat
          </button>
          <button onClick={clearStorage} style={{ padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
            Clear Storage
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Debug Information</h2>
        <pre style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Connection Tests</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button onClick={testBackendConnection} style={{ padding: '10px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px' }}>
            Test Backend
          </button>
          <button onClick={testChatAPI} style={{ padding: '10px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px' }}>
            Test Chat API
          </button>
        </div>
        
        {Object.keys(testResults).length > 0 && (
          <pre style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(testResults, null, 2)}
          </pre>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Instructions</h2>
        <ol>
          <li>Check if you're logged in (user should not be null)</li>
          <li>Make sure chatDisabled is not 'true'</li>
          <li>Test backend connection</li>
          <li>Test chat API</li>
          <li>If all tests pass, try clicking "Go to Chat"</li>
        </ol>
      </div>
    </div>
  );
}

export default Debug;

