import { Alert, Box, Button, Collapse, LinearProgress, Paper, Snackbar, Typography } from '@mui/material';
import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { dict } from '../../../../common/dict';
import { trpc } from '../../../../common/trpc.ts';
import ProfileDisplay from '../../../../common/components/ProfileDisplay.tsx';

function Xbox() {
  const [params] = useSearchParams();
  const code = params.get('code');

  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrMsg] = useState('');

  const [submitDisabled, setSubmitDisabled] = useState(false);

  const [loading, setLoading] = useState(false);

  const [showComplete, setShowComplete] = useState(false);
  const [xuid, setXuid] = useState('');
  const [xboxGamerTag, setXboxGamerTag] = useState('');

  if (!code) {
    return <Navigate to={'/panel/settings/profile'} />;
  }

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
        <Typography variant={'h5'}>{dict.settings.profile.bind.xbox.title}</Typography>
      </Box>
      <Button
        variant={'contained'}
        disabled={submitDisabled}
        sx={{ alignSelf: 'center' }}
        onClick={async () => {
          setSubmitDisabled(true); // disable itself
          setLoading(true);
          const bindResult = await trpc.user.profile.bind.xbox.mutate({ code });
          setLoading(false);
          if (bindResult.result === 'InternalError') {
            setErrMsg(dict.settings.profile.bind.xbox.fail.internalError);
            setErrorOpen(true);
          } else {
            setXuid(bindResult.xuid);
            setXboxGamerTag(bindResult.xboxGamerTag);
            setShowComplete(true);
          }
        }}
      >
        {dict.settings.profile.bind.submit}
      </Button>

      <Collapse in={loading} sx={{ alignSelf: 'stretch' }}>
        <LinearProgress />
      </Collapse>

      <Collapse in={showComplete} sx={{ alignSelf: 'stretch' }}>
        <Box display={'flex'} flexDirection={'column'} gap={2}>
          <Paper elevation={2} sx={{ padding: 1.5 }}>
            <Typography variant={'h6'}>{dict.settings.profile.bind.xbox.complete}</Typography>
            <ProfileDisplay uniqueIdProvider={-3} uniqueId={xuid} cachedPlayerName={xboxGamerTag} />
          </Paper>
          <Button sx={{ alignSelf: 'center' }} href={'.'}>
            {dict.settings.profile.bind.goBack}
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
}

export default Xbox;
