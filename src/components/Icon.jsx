import React from 'react';
import * as Icons from '@react95/icons';

function DesktopIcon({ iconName, label, isImage, onDoubleClick }) {
  if (isImage) {
    // Display custom image from public folder
    return (
      <div style={{ display: 'inline-block', margin: 16, textAlign: 'center', cursor: 'pointer' }} onDoubleClick={onDoubleClick}>
        <img 
          src={`/${iconName}`} 
          alt={label}
          style={{ 
            width: 32, 
            height: 32,
            objectFit: 'contain'
          }}
        />
        <div>{label}</div>
      </div>
    );
  } else {
    // Display React95 icon
    const IconComponent = Icons[iconName] || Icons.Folder;
    return (
      <div style={{ display: 'inline-block', margin: 16, textAlign: 'center', cursor: 'pointer' }} onDoubleClick={onDoubleClick}>
        <IconComponent variant="32x32_4" />
        <div>{label}</div>
      </div>
    );
  }
}

export default DesktopIcon; 