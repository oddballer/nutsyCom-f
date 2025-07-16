import React from 'react';
import * as Icons from '@react95/icons';

function DesktopIcon({ iconName, label, onDoubleClick }) {
  const IconComponent = Icons[iconName] || Icons.Folder;
  return (
    <div style={{ display: 'inline-block', margin: 16, textAlign: 'center', cursor: 'pointer' }} onDoubleClick={onDoubleClick}>
      <IconComponent variant="32x32_4" />
      <div>{label}</div>
    </div>
  );
}

export default DesktopIcon; 