import React from 'react';
import { styleReset } from 'react95';
import { createGlobalStyle, ThemeProvider } from 'styled-components';
import original from 'react95/dist/themes/original';
import { Icon } from '@react95/core';

const GlobalStyles = createGlobalStyle`
  ${styleReset}
  body {
    background: teal;
  }
`;

function Desktop({ onChatIconClick, children }) {
  return (
    <ThemeProvider theme={original}>
      <GlobalStyles />
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 40, top: 40 }}>
          <Icon name="mail" onClick={onChatIconClick} />
          <span>Chat</span>
        </div>
        {children}
      </div>
    </ThemeProvider>
  );
}

export default Desktop;