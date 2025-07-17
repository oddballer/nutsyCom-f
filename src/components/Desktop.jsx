import React from 'react';
import DesktopIcon from './Icon';
import Taskbar from './Taskbar';

const icons = [
  { 
    id: 'chat', 
    iconName: 'user_world-1.png', 
    label: 'Chat',
    isImage: true // Flag to indicate this is an image file
  },
  {
    id: 'olive',
    iconName: 'paint_file.png',
    label: 'Olive',
    isImage: true
  },
  // Add more icons here
];

function Desktop({ windows, onIconDoubleClick, onWindowClick, onMinimize, onTaskbarButtonClick, children }) {
  const openWindows = windows.filter(w => w.isOpen && !w.isMinimized);

  return (
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* ASCII Art Background */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: 'calc(100vh - 36px)', // Subtract taskbar height
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <pre
            style={{
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: 18,
              textAlign: 'center',
              userSelect: 'none',
              cursor: 'default',
              margin: 0,
              whiteSpace: 'pre',
            }}
            aria-hidden="true"
          >
{`
      ___           ___                       ___                 
     /__/\\         /__/\\          ___        /  /\\          ___   
     \\  \\:\\        \\  \\:\\        /  /\\      /  /:/_        /__/|  
      \\  \\:\\        \\  \\:\\      /  /:/     /  /:/ /\\      |  |:|  
  _____\\__\\:\\   ___  \\  \\:\\    /  /:/     /  /:/ /::\\     |  |:|  
 /__/::::::::\\ /__/\\  \\__\\:\\  /  /::\\    /__/:/ /:/\\:\\  __|__|:|  
 \\  \\:\\~~\\~~\\/ \\  \\:\\ /  /:/ /__/:/\\:\\   \\  \\:\\/:/~/:/ /__/::::\\  
  \\  \\:\\  ~~~   \\  \\:\\  /:/  \\__\\/  \\:\\   \\  \\::/ /:/     ~\\~~\\:\\ 
   \\  \\:\\        \\  \\:\\/:/        \\  \\:\\   \\__\\/ /:/        \\  \\:\\
    \\  \\:\\        \\  \\::/          \\__\\/     /__/:/          \\__\\/
     \\__\\/         \\__\\/                     \\__\\/                
`}
          </pre>
        </div>
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
          onTaskbarButtonClick={onTaskbarButtonClick}
        />
      </div>
  );
}

export default Desktop; 