import { useEffect, useState } from 'react';
import { Badge, Button, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { dict } from '../dict.tsx';
import { AccountCircleOutlined, Logout, MailOutline } from '@mui/icons-material';
import { clearLoginResult, trpc } from '../trpc.ts';
import { useNavigate } from 'react-router-dom';

function AccountMenu() {
  const navigate = useNavigate();
  const jwt = sessionStorage.getItem('jwt');

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const open = Boolean(anchorEl);

  useEffect(() => {
    if (jwt) {
      trpc.user.settleRejected.mutate().then(() => {
        trpc.user.getUnreadCount.query().then((result) => {
          setUnreadCount(
            result.submittedApplyUnreadCount + result.submittedAccessUnreadCount + result.receivedApplyUnreadCount
          );
        });
      });
    } else {
      setUnreadCount(0);
    }
  }, [jwt, refreshFlag]);

  return !jwt ? (
    <Button size={'large'} variant={'text'} color={'inherit'} href={'/login'}>
      {dict.login.title}
    </Button>
  ) : (
    <div>
      <IconButton
        size={'large'}
        aria-controls={'menu-appbar'}
        aria-haspopup={true}
        color={'inherit'}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          setAnchorEl(event.currentTarget);
        }}
      >
        <Badge badgeContent={unreadCount} color={'secondary'} overlap={'circular'}>
          <AccountCircleOutlined />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id={'account-menu'}
        open={open}
        onClose={() => {
          setAnchorEl(null);
        }}
        onClick={() => {
          setAnchorEl(null);
        }}
      >
        <MenuItem href={'/message'} onClick={() => setRefreshFlag((prev) => prev + 1)}>
          <ListItemIcon>
            <MailOutline fontSize={'small'} />
          </ListItemIcon>
          <ListItemText>
            {dict.messages.unread} ({unreadCount})
          </ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            clearLoginResult();
            navigate(`/login?${new URLSearchParams({ redirectTo: window.location.pathname }).toString()}`);
          }}
        >
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          {dict.logout.title}
        </MenuItem>
      </Menu>
    </div>
  );
}

export default AccountMenu;
