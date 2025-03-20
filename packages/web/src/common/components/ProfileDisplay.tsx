import { type ProfileType } from '../../pages/panel/settings/Profile.tsx';
import { Avatar, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';

function ProfileDisplay({ uniqueIdProvider, uniqueId, cachedPlayerName }: ProfileType) {
  return (
    <ListItemButton>
      {uniqueIdProvider === -1 && (
        <ListItemAvatar>
          <Avatar variant={'square'} src={`https://minotar.net/helm/${uniqueId}`} />
        </ListItemAvatar>
      )}
      <ListItemText primary={cachedPlayerName} secondary={uniqueId} />
    </ListItemButton>
  );
}

export default ProfileDisplay;