import React, { useState } from 'react';
import Desktop from './components/Desktop';
import WindowApp from './components/WindowApp';
import ChatApp from './apps/ChatApp/ChatApp';
import LoginWindow from './components/LoginWindow';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const initialWindows = [
  {
    id: 'chat',
    title: 'Chat',
    isOpen: false,
    isMinimized: false,
    position: { x: 100, y: 100 },
    size: { width: 600, height: 400 },
    zIndex: 1,
    content: <ChatApp />,
  },
  // Add more apps here
];

function AppContent() {
  const [windows, setWindows] = useState(initialWindows);
  const [zCounter, setZCounter] = useState(2);
  const [showLogin, setShowLogin] = useState(false);
  const { user, loading } = useAuth();

  const openWindow = (id) => {
    setWindows(ws => ws.map(w =>
      w.id === id
        ? { ...w, isOpen: true, isMinimized: false, zIndex: zCounter }
        : w
    ));
    setZCounter(z => z + 1);
  };

  const closeWindow = (id) => {
    setWindows(ws => ws.map(w =>
      w.id === id ? { ...w, isOpen: false } : w
    ));
  };

  const minimizeWindow = (id) => {
    setWindows(ws => ws.map(w =>
      w.id === id ? { ...w, isMinimized: true } : w
    ));
  };

  const focusWindow = (id) => {
    setWindows(ws => ws.map(w =>
      w.id === id 
        ? { ...w, zIndex: zCounter, isMinimized: false } // Restore if minimized
        : w
    ));
    setZCounter(z => z + 1);
  };

  const moveResizeWindow = (id, position, size) => {
    setWindows(ws => ws.map(w =>
      w.id === id ? { ...w, position, size } : w
    ));
  };

  const handleLoginClose = () => {
    setShowLogin(false);
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#008080'
      }}>
        <div style={{
          background: '#c0c0c0',
          border: '2px outset #c0c0c0',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  // Show login window if not authenticated
  if (!user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#008080'
      }}>
        <LoginWindow onClose={handleLoginClose} />
      </div>
    );
  }

  return (
    <Desktop
      windows={windows}
      onIconDoubleClick={openWindow}
      onWindowClick={focusWindow}
      onMinimize={minimizeWindow}
    >
      {windows.filter(w => w.isOpen).map(w => (
        <WindowApp
          key={w.id}
          id={w.id}
          title={w.title}
          position={w.position}
          size={w.size}
          zIndex={w.zIndex}
          isMinimized={w.isMinimized}
          onClick={() => focusWindow(w.id)}
          onClose={() => closeWindow(w.id)}
          onMinimize={() => minimizeWindow(w.id)}
          onDragStop={(x, y) => moveResizeWindow(w.id, { x, y }, w.size)}
          onResizeStop={(width, height, x, y) => moveResizeWindow(w.id, { x, y }, { width, height })}
        >
          {w.content}
        </WindowApp>
      ))}
    </Desktop>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;