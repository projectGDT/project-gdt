import { Box, List, ListItemButton, ListItemText, Paper, Typography } from '@mui/material';
import { dict } from '../../common/dict.tsx';
import { Outlet } from 'react-router-dom';

function SettingsLayout() {
  return (
    <Box display={'flex'} flexDirection={'column'} alignItems={'stretch'} paddingX={'20%'} flexGrow={1}>
      <Box display={'flex'} alignItems={'center'} flexGrow={1}>
        <Box flexGrow={1}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

function Settings() {
  return (
    <Box display={'flex'} flexDirection={'column'} gap={2}>
      <Box textAlign={'center'}>
        <Typography variant={'h5'}>{dict.settings.title}</Typography>
      </Box>
      <Paper>
        <List>
          <ListItemButton href={'/panel/settings/profile'}>
            <ListItemText
              primary={dict.settings.profile.title}
              secondary={dict.settings.profile.secondary}
            />
          </ListItemButton>
        </List>
      </Paper>
    </Box>
  );
}

export { SettingsLayout, Settings };