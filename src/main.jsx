import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MenuList, MenuListItem, Separator, styleReset } from 'react95';
import { createGlobalStyle, ThemeProvider } from 'styled-components';
import App from './App.jsx'

import original from 'react95/dist/themes/original';
import rose from 'react95/dist/themes/rose';
import ms_sans_serif from 'react95/dist/fonts/ms_sans_serif.woff2';
import ms_sans_serif_bold from 'react95/dist/fonts/ms_sans_serif_bold.woff2';

const GlobalStyles = createGlobalStyle`
  ${styleReset}
  @font-face {
    font-family: 'ms_sans_serif';
    src: url('${ms_sans_serif}') format('woff2');
    font-weight: 400;
    font-style: normal
  }
  @font-face {
    font-family: 'ms_sans_serif';
    src: url('${ms_sans_serif_bold}') format('woff2');
    font-weight: bold;
    font-style: normal
  }
  body, input, select, textarea {
    font-family: 'ms_sans_serif';
  }
  body {
    background: #73a08d;
  }
`;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalStyles />
    <ThemeProvider theme={rose}>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
