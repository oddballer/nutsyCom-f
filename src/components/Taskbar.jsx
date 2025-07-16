import React from 'react';
import { Button } from 'react95';

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
    <div style={{ 
      position: 'fixed', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      zIndex: 1000,
      height: 36,
      backgroundColor: '#c0c0c0',
      borderTop: '2px solid #ffffff',
      borderLeft: '2px solid #ffffff',
      borderRight: '2px solid #808080',
      borderBottom: '2px solid #808080'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        padding: '0 4px'
      }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {/* Start Button */}
          <Button
            style={{ 
              height: 28,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '0 8px',
              backgroundColor: '#c0c0c0',
              border: '2px outset #c0c0c0'
            }}
          >
            <img 
              src="/walnut.png" 
              alt="Start"
              style={{ 
                width: 18, 
                height: 18,
                objectFit: 'contain'
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Start</span>
          </Button>
          
          {/* Window Buttons */}
          {openWindows.map(window => (
            <Button
              key={window.id}
              onClick={() => onWindowClick(window.id)}
              style={{ 
                minWidth: 120,
                height: 28,
                fontSize: '12px'
              }}
            >
              {window.title}
            </Button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '12px', color: '#000000' }}>
            {formatTime()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Taskbar; 