import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

// Use environment variable for backend URL, fallback to localhost for development
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
// Ensure no trailing slash for proper URL construction
const BACKEND_URL = SOCKET_URL.endsWith('/') ? SOCKET_URL.slice(0, -1) : SOCKET_URL;
const ROOM_ID = 1; // Example room, adjust as needed
const USER_ID = Math.floor(Math.random() * 1000000); // Temporary user id for demo

// Debug logging
console.log('Environment:', import.meta.env.MODE);
console.log('Backend URL:', BACKEND_URL);
console.log('VITE_BACKEND_URL env var:', import.meta.env.VITE_BACKEND_URL);

function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    console.log('Attempting to connect to:', SOCKET_URL);
    
    // Connect to socket.io server
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });
    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to backend');
      setConnectionStatus('Connected');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionStatus('Connection failed');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from backend');
      setConnectionStatus('Disconnected');
    });

    // Join room
    socket.emit('joinRoom', ROOM_ID);
    socket.emit('userOnline', USER_ID);

    // Fetch chat history - use the cleaned backend URL for API calls
    const apiUrl = `${BACKEND_URL}/api/rooms/${ROOM_ID}/messages`;
    console.log('Attempting to fetch from:', apiUrl);
    
    fetch(apiUrl)
      .then(res => {
        console.log('API response status:', res.status);
        console.log('API response headers:', res.headers);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Fetched messages:', data);
        setMessages(data);
      })
      .catch(err => {
        console.error('Failed to fetch messages:', err);
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
          url: apiUrl
        });
        setConnectionStatus('API Error');
      });

    // Listen for new messages
    socket.on('chatMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    // Listen for chat errors
    socket.on('chatError', (error) => {
      console.error('Chat error from server:', error);
      setConnectionStatus(`Error: ${error.message}`);
    });

    // Listen for online users
    socket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom on new message
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    try {
      const msg = { roomId: ROOM_ID, userId: USER_ID, content: input };
      console.log('Sending message:', msg);
      socketRef.current.emit('chatMessage', msg);
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      setConnectionStatus('Send Error');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flex: 1,
      overflow: 'hidden',
      width: '100%',
      height: '100%'
    }}>
      {/* Online users sidebar */}
      <div style={{ 
        width: 140, 
        minWidth: 140,
        background: '#f0f0f0', 
        borderRight: '1px solid #ccc', 
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0
      }}>
        <b>Online Users</b>
        <div style={{ fontSize: '12px', color: 'gray', marginBottom: 8 }}>
          Status: {connectionStatus}
        </div>
        <ul style={{ 
          listStyle: 'none', 
          padding: 0, 
          margin: 0, 
          flex: 1,
          overflowY: 'auto'
        }}>
          {onlineUsers.map(uid => (
            <li key={uid} style={{ color: uid === USER_ID ? 'blue' : 'black', fontWeight: uid === USER_ID ? 'bold' : 'normal' }}>
              User {uid}
            </li>
          ))}
        </ul>
      </div>
      {/* Chat area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
        minHeight: 0
      }}>
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          background: '#fff', 
          padding: 8, 
          border: '1px solid #ccc',
          minHeight: 0,
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              marginBottom: 4,
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}>
              <b>{msg.username || `User ${msg.user_id || msg.userId}`}:</b> {msg.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} style={{ 
          display: 'flex', 
          gap: 8,
          flexShrink: 0,
          minHeight: 40,
          marginTop: 8
        }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ 
              flex: 1,
              minWidth: 0
            }}
            placeholder="Type a message..."
          />
          <button type="submit" style={{ 
            minWidth: 60,
            flexShrink: 0
          }}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatApp;