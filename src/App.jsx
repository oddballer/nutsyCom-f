import React, { useState } from 'react';
import Desktop from './components/Desktop';
import WindowApp from './components/WindowApp';
import ChatApp from './apps/ChatApp/ChatApp';

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

function App() {
  const [windows, setWindows] = useState(initialWindows);
  const [zCounter, setZCounter] = useState(2);

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
      w.id === id ? { ...w, zIndex: zCounter } : w
    ));
    setZCounter(z => z + 1);
  };

  const moveResizeWindow = (id, position, size) => {
    setWindows(ws => ws.map(w =>
      w.id === id ? { ...w, position, size } : w
    ));
  };

  return (
    <Desktop
      windows={windows}
      onIconDoubleClick={openWindow}
      onWindowClick={focusWindow}
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

export default App;