import {
  Alert,
  Box,
  Button,
  Collapse,
  Divider,
  LinearProgress,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Snackbar,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { dict } from '../../../../common/dict.tsx';
import ProfileDisplay from '../../../../common/components/ProfileDisplay.tsx';
import { trpc } from '../../../../common/trpc.ts';

function JavaMicrosoft() {
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrMsg] = useState('');

  const [submitDisabled, setSubmitDisabled] = useState(false);

  const [loading, setLoading] = useState(false);

  const [showStep1, setShowStep1] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [verificationUri, setVerificationUri] = useState('');

  const [completed, setCompleted] = useState(false);
  const [uuid, setUUID] = useState('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
  const [playerName, setPlayerName] = useState('');

  return (
    <Box display={'flex'} flexDirection={'column'} gap={2}>
      <Snackbar
        open={errorOpen}
        autoHideDuration={5000}
        onClose={() => {
          setErrorOpen(false);
        }}
        key={'ie'}
      >
        <Alert severity={'error'} variant={'filled'}>
          {errorMsg}
        </Alert>
      </Snackbar>

      <Box textAlign={'center'}>
        <Typography variant={'h5'}>{dict.settings.profile.bind.javaMicrosoft.title}</Typography>
      </Box>
      <Button
        variant={'contained'}
        disabled={submitDisabled}
        sx={{ alignSelf: 'center' }}
        onClick={() => {
          setSubmitDisabled(true); // disable itself
          setLoading(true);

          const session = trpc.user.profile.bind.javaMicrosoft.subscribe(
            {
              jwt: sessionStorage.getItem('jwt')!,
            },
            {
              onData(data) {
                if (data.state === 'DeviceCode') {
                  setUserCode(data.code);
                  setVerificationUri(data.verificationUri);
                  setShowStep1(true);
                } else if (data.state === 'Success') {
                  setLoading(false);
                  setUUID(data.uuid);
                  setPlayerName(data.playerName);
                  setCompleted(true);
                  session.unsubscribe();
                } else if (data.state === 'InternalError') {
                  setLoading(false);
                  setErrorOpen(true);
                  setErrMsg(dict.settings.profile.bind.javaMicrosoft.fail.internalError);
                } else if (data.state === 'Timeout') {
                  setLoading(false);
                  setErrorOpen(true);
                  setErrMsg(dict.settings.profile.bind.javaMicrosoft.fail.timeout);
                }
              },
            }
          );
        }}
      >
        {dict.settings.profile.bind.submit}
      </Button>

      <Collapse in={loading} sx={{ alignSelf: 'stretch' }}>
        <LinearProgress />
      </Collapse>

      <Collapse in={showStep1} sx={{ alignSelf: 'stretch' }}>
        <Paper elevation={2}>
          <List>
            <ListItem>
              <ListItemText primary={'Step 1 ' + dict.settings.profile.bind.javaMicrosoft.step1.title} />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary={
                  <Link
                    href={`${verificationUri}?otc=${userCode}`}
                    target={'_blank'}
                  >{`${verificationUri}?otc=${userCode}`}</Link>
                }
                secondary={dict.settings.profile.bind.javaMicrosoft.step1.hint}
              />
            </ListItem>
          </List>
        </Paper>
      </Collapse>

      <Collapse in={completed} sx={{ alignSelf: 'stretch' }}>
        <Box display={'flex'} flexDirection={'column'} gap={2}>
          <Paper elevation={2}>
            <List disablePadding={true}>
              <ListItem>
                <ListItemText primary={dict.settings.profile.bind.javaMicrosoft.complete} />
              </ListItem>
              <Divider />
              <ProfileDisplay uniqueIdProvider={-1} uniqueId={uuid} cachedPlayerName={playerName} />
            </List>
          </Paper>
          <Button sx={{ alignSelf: 'center' }} href={'.'}>
            {dict.settings.profile.bind.goBack}
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
}

export default JavaMicrosoft;
