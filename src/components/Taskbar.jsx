import React from 'react';
import { AppBar, Toolbar, ToolbarButton, Text } from 'react95';

function Taskbar({ openWindows, onWindowClick, onMinimize, onClose }) {
  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <AppBar style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
      <Toolbar style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {openWindows.map(window => (
            <ToolbarButton
              key={window.id}
              onClick={() => onWindowClick(window.id)}
              style={{ 
                minWidth: 120,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span>{window.title}</span>
            </ToolbarButton>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: '12px' }}>
            {formatTime()}
          </Text>
        </div>
      </Toolbar>
    </AppBar>
  );
}

export default Taskbar; 