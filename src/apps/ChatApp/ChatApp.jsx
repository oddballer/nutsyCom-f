import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from 'react95';

// Use environment variable for backend URL, fallback to localhost for development
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
// Ensure no trailing slash for proper URL construction
const BACKEND_URL = SOCKET_URL.endsWith('/') ? SOCKET_URL.slice(0, -1) : SOCKET_URL;
const ROOM_ID = 1; // General room

function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [authError, setAuthError] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { user, token, logout } = useAuth();

  useEffect(() => {
    if (!user || !token) {
      setConnectionStatus('Not authenticated');
      return;
    }

    // Connect to socket.io server
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });
    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      setConnectionStatus('Connected');
      // Authenticate the socket connection
      socket.emit('authenticate', token);
    });

    socket.on('authenticated', (data) => {
      setConnectionStatus('Authenticated');
      // Join room after authentication
      socket.emit('joinRoom', ROOM_ID);
    });

    socket.on('authError', (error) => {
      setAuthError(error.message);
      setConnectionStatus('Authentication failed');
    });

    socket.on('connect_error', (error) => {
      setConnectionStatus('Connection failed');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('Disconnected');
    });

    socket.on('roomJoined', (data) => {
      setConnectionStatus('In chat room');
    });

    // Fetch chat history
    const apiUrl = `${BACKEND_URL}/api/rooms/${ROOM_ID}/messages`;
    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setMessages(data);
      })
      .catch(err => {
        setConnectionStatus('API Error');
      });

    // Listen for new messages
    socket.on('chatMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    // Listen for chat errors
    socket.on('chatError', (error) => {
      setConnectionStatus(`Error: ${error.message}`);
    });

    // Listen for general errors
    socket.on('error', (error) => {
      setConnectionStatus(`Error: ${error.message}`);
    });

    // Listen for online users
    socket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, token]);

  useEffect(() => {
    // Scroll to bottom on new message
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    try {
      const msg = { roomId: ROOM_ID, content: input };
      socketRef.current.emit('chatMessage', msg);
      setInput('');
    } catch (error) {
      setConnectionStatus('Send Error');
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: 20,
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: 16, fontSize: '14px' }}>
          Please log in to access the chat.
        </div>
      </div>
    );
  }

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <b>Online Users</b>
          <Button size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        <div style={{ fontSize: '12px', color: 'gray', marginBottom: 8 }}>
          Status: {connectionStatus}
        </div>
        {authError && (
          <div style={{
            fontSize: '12px',
            color: '#d32f2f',
            marginBottom: 8,
            padding: 4,
            backgroundColor: '#ffebee',
            border: '1px solid #f44336'
          }}>
            {authError}
          </div>
        )}
        <div style={{ fontSize: '12px', color: 'blue', marginBottom: 8 }}>
          Logged in as: {user.display_name || user.username}
        </div>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          flex: 1,
          overflowY: 'auto'
        }}>
          {onlineUsers.map(uid => (
            <li key={uid} style={{
              color: uid === user.id ? 'blue' : 'black',
              fontWeight: uid === user.id ? 'bold' : 'normal',
              fontSize: '12px'
            }}>
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
              <b>{msg.display_name || msg.username || `User ${msg.user_id}`}:</b> {msg.content}
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
            disabled={!user || connectionStatus !== 'In chat room'}
          />
          <button
            type="submit"
            style={{
              minWidth: 60,
              flexShrink: 0
            }}
            disabled={!user || connectionStatus !== 'In chat room'}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatApp;