import React from 'react';
import { Rnd } from 'react-rnd';
import { Window, WindowHeader, WindowContent, Button } from 'react95';

function WindowApp({
  id,
  title,
  children,
  position,
  size,
  zIndex,
  onClick,
  onClose,
  onMinimize,
  onDragStop,
  onResizeStop,
  isMinimized,
}) {
  return (
    <Rnd
      default={{ x: position.x, y: position.y, width: size.width, height: size.height }}
      position={{ x: position.x, y: position.y }}
      size={{ width: size.width, height: size.height }}
      style={{ zIndex, position: 'absolute', display: isMinimized ? 'none' : undefined }}
      onDragStop={(e, d) => onDragStop(d.x, d.y)}
      onResizeStop={(e, direction, ref, delta, pos) =>
        onResizeStop(ref.offsetWidth, ref.offsetHeight, pos.x, pos.y)
      }
      onMouseDown={onClick}
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
      minWidth={200}
      minHeight={150}
      dragHandleClassName="window-header"
      resizeHandleStyles={{
        top: { cursor: 'n-resize' },
        right: { cursor: 'e-resize' },
        bottom: { cursor: 's-resize' },
        left: { cursor: 'w-resize' },
        topRight: { cursor: 'ne-resize' },
        bottomRight: { cursor: 'se-resize' },
        bottomLeft: { cursor: 'sw-resize' },
        topLeft: { cursor: 'nw-resize' },
      }}
    >
      <Window style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <WindowHeader className="window-header" style={{ display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
          <span>{title}</span>
          <div>
            <Button size="sm" onClick={onMinimize}>_</Button>
            <Button size="sm" onClick={onClose}>X</Button>
          </div>
        </WindowHeader>
        <WindowContent style={{ 
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '8px',
          minHeight: 0
        }}>
          {children}
        </WindowContent>
      </Window>
    </Rnd>
  );
}

export default WindowApp; 