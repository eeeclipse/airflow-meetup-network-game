import { createTheme } from '@mui/material/styles';
import type { CSSProperties } from 'react';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    monospace: CSSProperties;
  }
  interface TypographyVariantsOptions {
    monospace?: CSSProperties;
  }
}

export const airflowTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#017CEE' },
    background: {
      default: '#0B1118',
      paper: '#121A23',
    },
  },
  typography: {
    fontFamily: 'Pretendard, system-ui, -apple-system, sans-serif',
    monospace: {
      fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
    },
  },
});
