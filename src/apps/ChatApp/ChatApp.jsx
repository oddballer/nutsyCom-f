import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:4000';
const ROOM_ID = 1; // Example room, adjust as needed
const USER_ID = Math.floor(Math.random() * 1000000); // Temporary user id for demo

function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Connect to socket.io server
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    // Join room
    socket.emit('joinRoom', ROOM_ID);
    socket.emit('userOnline', USER_ID);

    // Fetch chat history
    fetch(`${SOCKET_URL.replace('4000', '5173')}/api/rooms/${ROOM_ID}/messages`)
      .then(res => res.json())
      .then(data => setMessages(data));

    // Listen for new messages
    socket.on('chatMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
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
    const msg = { roomId: ROOM_ID, userId: USER_ID, content: input };
    socketRef.current.emit('chatMessage', msg);
    setInput('');
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Online users sidebar */}
      <div style={{ width: 140, background: '#f0f0f0', borderRight: '1px solid #ccc', padding: 8 }}>
        <b>Online Users</b>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {onlineUsers.map(uid => (
            <li key={uid} style={{ color: uid === USER_ID ? 'blue' : 'black', fontWeight: uid === USER_ID ? 'bold' : 'normal' }}>
              User {uid}
            </li>
          ))}
        </ul>
      </div>
      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 8, background: '#fff', padding: 8, border: '1px solid #ccc' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ marginBottom: 4 }}>
              <b>{msg.username || `User ${msg.user_id || msg.userId}`}:</b> {msg.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ flex: 1 }}
            placeholder="Type a message..."
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default ChatApp;