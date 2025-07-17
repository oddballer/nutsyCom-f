import React from 'react';
import { ThemeProvider } from 'styled-components';
import original from 'react95/dist/themes/original';
import { styleReset } from 'react95';
import { createGlobalStyle } from 'styled-components';
import DesktopIcon from './Icon';
import Taskbar from './Taskbar';

const GlobalStyles = createGlobalStyle`
  ${styleReset}
  body {
    background: teal;
  }
`;

const icons = [
  { 
    id: 'chat', 
    iconName: 'user_world-1.png', 
    label: 'Chat',
    isImage: true // Flag to indicate this is an image file
  },
  // Add more icons here
];

function Desktop({ windows, onIconDoubleClick, onWindowClick, onMinimize, children }) {
  const openWindows = windows.filter(w => w.isOpen && !w.isMinimized);

  return (
    <ThemeProvider theme={original}>
      <GlobalStyles />
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 40, top: 40, display: 'flex', flexDirection: 'column', gap: 32 }}>
          {icons.map(icon => (
            <DesktopIcon
              key={icon.id}
              iconName={icon.iconName}
              label={icon.label}
              isImage={icon.isImage}
              onDoubleClick={() => onIconDoubleClick(icon.id)}
            />
          ))}
        </div>
        {children}
        <Taskbar 
          windows={windows}
          onWindowClick={onWindowClick}
          onMinimize={onMinimize}
        />
      </div>
    </ThemeProvider>
  );
}

export default Desktop; 