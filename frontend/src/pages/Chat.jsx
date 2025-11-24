import React, { useState, useEffect, useRef } from 'react';
import { sendMessage, getChatHistory } from '../api/chat';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const response = await getChatHistory();
      if (response.ok) {
        const history = response.data || [];
        const formattedMessages = history.flatMap(chat => [
          { id: `${chat.at}-user`, type: 'user', content: chat.message, timestamp: chat.at },
          { id: `${chat.at}-ai`, type: 'ai', content: chat.response, timestamp: chat.at }
        ]);
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now() + '-user',
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessage(inputMessage.trim());
      
      if (response.ok) {
        const aiMessage = {
          id: Date.now() + '-ai',
          type: 'ai',
          content: response.data.response,
          timestamp: new Date().toISOString(),
          messageType: response.data.type || 'support'
        };
        
        setMessages(prev => [...prev, aiMessage]);
      } else {
        setError(response.data.message || 'Failed to send message');
        // Remove the user message if sending failed
        setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Network error. Please try again.');
      // Remove the user message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Mental Health Support Chat</h2>
        <p>I'm here to listen and support you. Feel free to share what's on your mind.</p>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <p>👋 Hello! I'm your mental health support assistant.</p>
            <p>I'm here to listen, provide emotional support, and help you with coping strategies.</p>
            <p>What would you like to talk about today?</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-content">
                <div className="message-text">{message.content}</div>
                <div className="message-time">{formatTime(message.timestamp)}</div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="message ai">
            <div className="message-content">
              <div className="message-text typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <div className="input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message here..."
            disabled={isLoading}
            className="chat-input"
          />
          <button 
            type="submit" 
            disabled={!inputMessage.trim() || isLoading}
            className="send-button"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </form>

      <style>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 800px;
          margin: 0 auto;
          background: #f8f9fa;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .chat-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          text-align: center;
        }

        .chat-header h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
        }

        .chat-header p {
          margin: 0;
          opacity: 0.9;
          font-size: 14px;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .welcome-message {
          text-align: center;
          color: #666;
          padding: 40px 20px;
        }

        .welcome-message p {
          margin: 8px 0;
          font-size: 16px;
        }

        .message {
          display: flex;
          margin-bottom: 16px;
        }

        .message.user {
          justify-content: flex-end;
        }

        .message.ai {
          justify-content: flex-start;
        }

        .message-content {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: 18px;
          position: relative;
        }

        .message.user .message-content {
          background: #007bff;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message.ai .message-content {
          background: white;
          color: #333;
          border: 1px solid #e1e5e9;
          border-bottom-left-radius: 4px;
        }

        .message-text {
          margin-bottom: 4px;
          line-height: 1.4;
          word-wrap: break-word;
        }

        .message-time {
          font-size: 11px;
          opacity: 0.7;
          text-align: right;
        }

        .message.ai .message-time {
          text-align: left;
        }

        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #999;
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes typing {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 12px 20px;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
          margin: 0 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .error-message button {
          background: none;
          border: none;
          color: #721c24;
          cursor: pointer;
          font-weight: bold;
        }

        .chat-input-form {
          padding: 20px;
          background: white;
          border-top: 1px solid #e1e5e9;
        }

        .input-container {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .chat-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #ddd;
          border-radius: 24px;
          font-size: 16px;
          outline: none;
          transition: border-color 0.2s;
        }

        .chat-input:focus {
          border-color: #007bff;
        }

        .chat-input:disabled {
          background: #f8f9fa;
          cursor: not-allowed;
        }

        .send-button {
          padding: 12px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.2s;
          min-width: 48px;
          height: 48px;
        }

        .send-button:hover:not(:disabled) {
          background: #0056b3;
        }

        .send-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .chat-container {
            height: 100vh;
            border-radius: 0;
          }
          
          .message-content {
            max-width: 85%;
          }
        }
      `}</style>
    </div>
  );
}

export default Chat;



