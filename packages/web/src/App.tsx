import {
  AppBar,
  Avatar,
  Box,
  createTheme,
  CssBaseline,
  darken,
  GlobalStyles,
  ThemeProvider,
  Toolbar,
  Typography,
} from '@mui/material';
import { ConfirmProvider } from 'material-ui-confirm';
import { Outlet } from 'react-router-dom';
import { dict } from './common/dict.tsx';

const gdtTheme = createTheme({
  typography: {
    fontFamily: ['"Inter"', '"Noto Sans SC Variable"', 'sans-serif'].join(','),
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#2a9849',
    },
    secondary: {
      light: '#ee9611',
      main: '#ac01b1',
    },
    background: {
      default: '#f9f9f9',
    },
    text: {
      primary: 'rgba(0,0,0,0.825)',
    },
  },
});

function App() {
  return <ThemeProvider theme={gdtTheme}>
    <ConfirmProvider
      defaultOptions={{
        title: dict.common.confirm,
        confirmationText: dict.common.ok,
        cancellationText: dict.common.cancel,
      }}
    >
      <CssBaseline />
      <GlobalStyles
        styles={{
          code: {
            fontFamily: '"JetBrains Mono Variable", "Noto Sans SC Variable", monospace, sans-serif',
            backgroundColor: darken(gdtTheme.palette.background.default, 0.07),
            borderRadius: '0.25rem',
            padding: '0.25rem 0.5rem',
            margin: '0 0.25rem',
          },
          pre: {
            backgroundColor: darken(gdtTheme.palette.background.default, 0.07),
            borderRadius: '0.25rem',
            padding: '0.25rem 0.5rem',
          },
          'pre > code': {
            borderRadius: '0',
            padding: '0',
          },
          blockquote: {
            margin: 0,
            backgroundColor: darken(gdtTheme.palette.background.default, 0.07),
            padding: '0.25rem 0.5rem',
          },
        }}
      />

      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar disableGutters sx={{ paddingX: 2 }}>
          <Avatar src="/logo.svg" sx={{ width: 40, height: 40 }} variant={'square'} />
          <Typography variant={'h6'} sx={{ paddingX: 1, flexGrow: 1 }}>
            <b>projectGDT</b>
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        display={'flex'}
        flexDirection={'column'}
        alignItems={'stretch'}
        height={'100vh'}
        sx={{ backgroundColor: 'background.default' }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </ConfirmProvider>
  </ThemeProvider>;
}

export default App;
