import React from 'react';
import { ThemeProvider, StyleSheetManager } from 'styled-components';
import original from 'react95/dist/themes/original';
import { styleReset } from 'react95';
import { createGlobalStyle } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';
import DesktopIcon from './Icon';

const GlobalStyles = createGlobalStyle`
  ${styleReset}
  body {
    background: teal;
  }
`;

const icons = [
  { id: 'chat', iconName: 'Mail', label: 'Chat' },
  // Add more icons here
];

function Desktop({ windows, onIconDoubleClick, children }) {
  return (
    <StyleSheetManager shouldForwardProp={isPropValid}>
      <ThemeProvider theme={original}>
        <GlobalStyles />
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 40, top: 40, display: 'flex', flexDirection: 'column', gap: 32 }}>
            {icons.map(icon => (
              <DesktopIcon
                key={icon.id}
                iconName={icon.iconName}
                label={icon.label}
                onDoubleClick={() => onIconDoubleClick(icon.id)}
              />
            ))}
          </div>
          {children}
        </div>
      </ThemeProvider>
    </StyleSheetManager>
  );
}

export default Desktop; 