import { useConfirm } from 'material-ui-confirm';
import { useEffect, useState } from 'react';
import { trpc } from '../../../common/trpc.ts';
import {
  Box,
  Button,
  Divider,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Paper,
  Skeleton,
  Typography,
} from '@mui/material';
import { dict } from '../../../common/dict.tsx';
import { DeleteOutlineOutlined } from '@mui/icons-material';
import ProfileDisplay from '../../../common/components/ProfileDisplay.tsx';

export interface ProfileType {
  uniqueIdProvider: number;
  uniqueId: string;
  cachedPlayerName: string;
}

function Profile() {
  const confirm = useConfirm();

  const [loading, setLoading] = useState(true);
  const [javaMsProfile, setJavaMsProfile] = useState<ProfileType>();
  const [xboxProfile, setXboxProfile] = useState<ProfileType>();
  const [offlineProfiles, setOfflineProfiles] = useState<ProfileType[]>([]);

  const [userModifyFlag, setUserModifyFlag] = useState(0);

  useEffect(() => {
    trpc.user.profile.get.query().then((profiles) => {
      setJavaMsProfile(profiles.find((p) => p.uniqueIdProvider === -1));
      setXboxProfile(profiles.find((p) => p.uniqueIdProvider === -3));
      setOfflineProfiles(profiles.filter((p) => p.uniqueIdProvider > 0));
      setLoading(false);
    });
    return () => {
      setJavaMsProfile(undefined);
      setXboxProfile(undefined);
    };
  }, [userModifyFlag]);

  return (
    <Box display={'flex'} flexDirection={'column'} gap={2}>
      <Box textAlign={'center'}>
        <Typography variant={'h5'}>{dict.settings.profile.title}</Typography>
      </Box>
      <Paper>
        <List disablePadding={true}>
          {loading ? (
            <>
              <Skeleton width={'100%'} height={100} />
              <Skeleton width={'100%'} height={100} />
              <Skeleton width={'100%'} height={100} />
            </>
          ) : (
            <>
              <ListSubheader>{dict.settings.profile.javaMicrosoft.title}</ListSubheader>
              {javaMsProfile ? (
                <ListItem
                  disablePadding
                  key={javaMsProfile.uniqueIdProvider}
                  secondaryAction={
                    <IconButton
                      onClick={async () => {
                        const result = await confirm({
                          description: dict.settings.profile.onDelete,
                        });
                        if (result.confirmed) {
                          setLoading(true);
                          await trpc.user.profile.delete.mutate({ uniqueIdProvider: javaMsProfile.uniqueIdProvider });
                          setUserModifyFlag((prev) => prev + 1);
                        }
                      }}
                    >
                      <DeleteOutlineOutlined />
                    </IconButton>
                  }
                >
                  <ProfileDisplay {...javaMsProfile} />
                </ListItem>
              ) : (
                <ListItem
                  secondaryAction={<Button href={'profile/java-microsoft'}>{dict.settings.profile.doBind}</Button>}
                >
                  <ListItemText secondary={dict.settings.profile.javaMicrosoft.fallback} />
                </ListItem>
              )}

              <Divider />

              <ListSubheader>{dict.settings.profile.xbox.title}</ListSubheader>
              {xboxProfile ? (
                <ListItem
                  disablePadding
                  key={xboxProfile.uniqueIdProvider}
                  secondaryAction={
                    <IconButton
                      onClick={async () => {
                        const result = await confirm({
                          description: dict.settings.profile.onDelete,
                        });
                        if (result.confirmed) {
                          setLoading(true);
                          await trpc.user.profile.delete.mutate({ uniqueIdProvider: xboxProfile.uniqueIdProvider });
                          setUserModifyFlag((prev) => prev + 1);
                        }
                      }}
                    >
                      <DeleteOutlineOutlined />
                    </IconButton>
                  }
                >
                  <ProfileDisplay {...xboxProfile} />
                </ListItem>
              ) : (
                <ListItem
                  disablePadding
                  secondaryAction={
                    <Button
                      onClick={() =>
                        confirm({
                          description: dict.settings.profile.xbox.onClick,
                          confirmationButtonProps: {
                            href:
                              'https://login.live.com/oauth20_authorize.srf?' +
                              new URLSearchParams({
                                client_id: import.meta.env.VITE_XBOX_OAUTH_CLIENT_ID,
                                redirect_uri: `${window.location.origin}/panel/settings/profile/xbox`,
                                response_type: 'code',
                                scope: 'XboxLive.signin',
                              }),
                          },
                        })
                      }
                    >
                      {dict.settings.profile.doBind}
                    </Button>
                  }
                >
                  <ListItemButton>
                    <ListItemText secondary={dict.settings.profile.xbox.fallback} />
                  </ListItemButton>
                </ListItem>
              )}

              <Divider />

              <ListSubheader>{dict.settings.profile.offline.title}</ListSubheader>
              <ListItem>
                <ListItemText secondary={dict.settings.profile.offline.fallback} />
              </ListItem>
              {offlineProfiles.map((profile) => (
                <ListItem disablePadding key={profile.uniqueIdProvider}>
                  <ListItemButton href={`/server/${profile.uniqueIdProvider}`}>
                    <ListItemText
                      primary={`${profile.uniqueId}`}
                      secondary={dict.settings.profile.offline.secondary(profile.uniqueIdProvider)}
                    />
                  </ListItemButton>
                </ListItem>
              ))}

              <Divider />

              <ListItem>
                <ListItemText>
                  <Typography variant={'caption'}>
                    Minecraft Head API provided by <Link href={'https://minotar.net/'}>minotar.net</Link>
                  </Typography>
                </ListItemText>
              </ListItem>
            </>
          )}
        </List>
      </Paper>
    </Box>
  );
}

export default Profile;