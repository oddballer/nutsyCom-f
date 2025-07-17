import React, { useState } from 'react';
import { AppBar, Toolbar, Button, MenuList, MenuListItem, Separator } from 'react95';

function Taskbar({ openWindows, onWindowClick, onMinimize, onClose }) {
  const [startMenuOpen, setStartMenuOpen] = useState(false);

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const toggleStartMenu = () => {
    setStartMenuOpen(!startMenuOpen);
  };

  const handleWindowClick = (window) => {
    // If window is minimized, restore it; otherwise just focus it
    onWindowClick(window.id);
  };

  return (
    <AppBar style={{ 
      position: 'fixed', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      top: 'auto',
      zIndex: 1000,
      height: 36
    }}>
      <Toolbar style={{ 
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        padding: '0 4px'
      }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {/* Start Button */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Button
              onClick={toggleStartMenu}
              active={startMenuOpen}
              style={{ 
                height: 28,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '0 8px'
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
              Start
            </Button>
            
            {/* Start Menu */}
            {startMenuOpen && (
              <MenuList
                style={{
                  position: 'absolute',
                  left: '0',
                  bottom: '100%',
                  width: 200,
                  zIndex: 999
                }}
                onClick={() => setStartMenuOpen(false)}
              >
                <MenuListItem>
                  <img 
                    src="/user_world-1.png" 
                    alt="Chat"
                    style={{ 
                      width: 16, 
                      height: 16,
                      objectFit: 'contain',
                      marginRight: 8
                    }}
                  />
                  Chat
                </MenuListItem>
                <Separator />
                <MenuListItem>
                  <span role='img' aria-label='🔙' style={{ marginRight: 8 }}>
                    🔙
                  </span>
                  Shut Down...
                </MenuListItem>
              </MenuList>
            )}
          </div>
          
          {/* Window Buttons */}
          {openWindows.map(window => (
            <Button
              key={window.id}
              onClick={() => handleWindowClick(window)}
              style={{ 
                minWidth: 120,
                height: 28,
                fontSize: '12px',
                backgroundColor: window.isMinimized ? '#808080' : '#c0c0c0',
                color: window.isMinimized ? '#ffffff' : '#000000'
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
      </Toolbar>
    </AppBar>
  );
}

export default Taskbar; 