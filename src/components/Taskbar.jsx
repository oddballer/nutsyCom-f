import React, { useState, useEffect, useRef } from 'react';
import { AppBar, Toolbar, Button, MenuList, MenuListItem, Separator } from 'react95';
import { useAuth } from '../contexts/AuthContext';

function Taskbar({ windows, onWindowClick, onMinimize, onClose, onTaskbarButtonClick }) {
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const startMenuRef = useRef(null);

  // Close Start menu when clicking outside
  useEffect(() => {
    if (!startMenuOpen) return;
    function handleClick(e) {
      if (startMenuRef.current && !startMenuRef.current.contains(e.target)) {
        setStartMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [startMenuOpen]);

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = () => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const toggleStartMenu = () => {
    setStartMenuOpen(!startMenuOpen);
    setUserMenuOpen(false); // Close user menu if open
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
    setStartMenuOpen(false); // Close start menu if open
  };

  const handleWindowClick = (window) => {
    if (onTaskbarButtonClick) {
      onTaskbarButtonClick(window.id);
    } else {
      onWindowClick(window.id);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
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
          <div style={{ position: 'relative', display: 'inline-block' }} ref={startMenuRef}>
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
                <MenuListItem onClick={() => { onWindowClick('chat'); setStartMenuOpen(false); }}>
                  <img 
                    src="/world-4.png" 
                    alt="BigChat"
                    style={{ 
                      width: 16, 
                      height: 16,
                      objectFit: 'contain',
                      marginRight: 8
                    }}
                  />
                  BigChat
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
          {windows.filter(w => w.isOpen).map(window => (
            <Button
              key={window.id}
              onClick={() => handleWindowClick(window)}
              style={{ 
                minWidth: 120,
                height: 28,
                fontSize: '12px',
                backgroundColor: window.isMinimized ? '#94acce' : '#f7d6a8',
                color: window.isMinimized ? '#998271' : '#6e8099',
                fontStyle: window.isMinimized ? 'italic' : 'normal',
                opacity: window.isMinimized ? 0.7 : 1
              }}
            >
              {window.title}
            </Button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* User Info */}
          {user && (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Button
                onClick={toggleUserMenu}
                active={userMenuOpen}
                style={{ 
                  height: 28,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '0 8px'
                }}
              >
                <span role='img' aria-label='👤' style={{ fontSize: '14px' }}>
                  👤
                </span>
                {user.display_name || user.username}
              </Button>
              
              {/* User Menu */}
              {userMenuOpen && (
                <MenuList
                  style={{
                    position: 'absolute',
                    right: '0',
                    bottom: '100%',
                    width: 150,
                    zIndex: 999
                  }}
                  onClick={() => setUserMenuOpen(false)}
                >
                  <MenuListItem>
                    <span role='img' aria-label='👤' style={{ marginRight: 8 }}>
                      👤
                    </span>
                    Profile
                  </MenuListItem>
                  <Separator />
                  <MenuListItem onClick={handleLogout}>
                    <span role='img' aria-label='🚪' style={{ marginRight: 8 }}>
                      🚪
                    </span>
                    Logout
                  </MenuListItem>
                </MenuList>
              )}
            </div>
          )}
          
          {/* Time & Date */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.1 }}>
            <span style={{ fontSize: '12px', color: '#000000' }}>{formatTime()}</span>
            <span style={{ fontSize: '11px', color: '#333333' }}>{formatDate()}</span>
          </div>
        </div>
      </Toolbar>
    </AppBar>
  );
}

export default Taskbar; 