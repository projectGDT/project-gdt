import {
  Box,
  Breadcrumbs,
  Divider,
  Drawer,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  DashboardCustomizeOutlined,
  DnsOutlined,
  HandymanOutlined,
  HomeOutlined,
  LinkOutlined,
  ManageAccountsOutlined,
} from '@mui/icons-material';
import { dict } from '../common/dict.tsx';
import { Fragment } from 'react';
import { Outlet } from 'react-router-dom';

interface Navigation {
  href: string;
  icon: typeof HomeOutlined;
  display: string;
  additional: string[];
}

const navigation: Navigation[] = [
  {
    href: '/panel/portal',
    icon: HomeOutlined,
    display: dict.portal.title,
    additional: [],
  },
  {
    href: '/panel/list',
    icon: DashboardCustomizeOutlined,
    display: dict.list.title,
    additional: ['/panel/server'],
  },
  {
    href: '/panel/manage',
    icon: DnsOutlined,
    display: dict.manage.title,
    additional: [],
  },
  {
    href: '/panel/access',
    icon: LinkOutlined,
    display: dict.access.title,
    additional: [],
  },
  {
    href: '/panel/settings',
    icon: ManageAccountsOutlined,
    display: dict.settings.title,
    additional: [],
  },
  {
    href: '/panel/tools',
    icon: HandymanOutlined,
    display: dict.tools.title,
    additional: [],
  },
];

const breadcrumbsMapping = (() => {
  const map = new Map<string, string>();

  map.set('access', dict.access.title);
  map.set('steps', dict.access.steps);
  map.set('list', dict.list.title);
  map.set('manage', dict.manage.title);
  map.set('server', dict.server.title);
  map.set('settings', dict.settings.title);
  map.set('profile', dict.settings.profile.title);
  map.set('java-microsoft', dict.settings.profile.javaMicrosoft.title);
  map.set('xbox', dict.settings.profile.xbox.title);

  return map;
})();

function NavigationButton({ href, icon: Icon, display, additional }: Navigation) {
  const pathName = window.location.pathname;
  const selected = pathName.startsWith(href) || additional.includes(pathName);

  return (
    <ListItemButton href={href} selected={selected} sx={{ borderRadius: 1 }}>
      <ListItemIcon>
        <Icon color={selected ? 'primary' : 'inherit'} />
      </ListItemIcon>
      <ListItemText primary={display} slotProps={{ primary: { color: selected ? 'primary' : 'inherit' } }} />
    </ListItemButton>
  );
}

function Panel() {
  const pathName = window.location.pathname;
  const breadcrumbRaw = pathName.split('/');
  breadcrumbRaw.splice(0, 2);

  return (
    <Box display={'flex'} flexGrow={1}>
      <Drawer
        variant="permanent"
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              width: '20%',
              flexGrow: 0,
            },
          },
        }}
        sx={{ width: '20%' }}
      >
        <Toolbar />
        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          <List sx={{ flexGrow: 1 }}>
            {navigation.map((entry, index) => (
              <Fragment key={index}>
                <ListItem sx={{ paddingY: 0.5, paddingX: 1 }}>
                  <NavigationButton {...entry} />
                </ListItem>
              </Fragment>
            ))}
          </List>
          <Divider />
        </Box>
      </Drawer>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          alignItems: 'stretch',
          padding: 2,
        }}
      >
        <Breadcrumbs sx={{ paddingBottom: 2 }}>
          {breadcrumbRaw.map((entry, index) =>
            index === breadcrumbRaw.length - 1 ? (
              <Typography color={'primary'} key={index}>
                {breadcrumbsMapping.get(entry) ?? entry}
              </Typography>
            ) : (
              <Link key={index} color={'inherit'} href={`/panel/${breadcrumbRaw.slice(0, index + 1).join('/')}`}>
                {breadcrumbsMapping.get(entry) ?? entry}
              </Link>
            )
          )}
        </Breadcrumbs>
        <Outlet />
      </Box>
    </Box>
  );
}

export default Panel;
