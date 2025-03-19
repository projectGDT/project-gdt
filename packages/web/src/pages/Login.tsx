import { Alert, Box, Button, Snackbar, Typography } from '@mui/material';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { inOrder, validator } from '../common/validator.ts';
import ValidatorTextField from '../common/components/ValidatorTextField.tsx';
import { dict } from '../common/dict.tsx';
import { setLoginResult, trpc } from '../common/trpc.ts';
import md5 from 'md5';

function Login() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const redirectTo = params.get('redirectTo') ?? '/';

  const [incorrectCredentialsOpen, setIncorrectCredentialsOpen] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileResponse, setTurnstileResponse] = useState('');

  const [usernameValid, setUsernameValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [turnstilePassed, setTurnstilePassed] = useState(false);

  // 防止重复点击
  const [notClicked, setNotClicked] = useState(true);

  if (sessionStorage.getItem('jwt')) {
    return (
      <Navigate to={redirectTo} />
    );
  }

  return (
    <Box display={'flex'} flexDirection={'column'} alignItems={'stretch'} flexGrow={1}>
      <Box display={'flex'} alignItems={'center'} flexGrow={1}>
        <Box flexGrow={1}>
          <Snackbar
            open={incorrectCredentialsOpen}
            autoHideDuration={5000}
            onClose={() => {
              setIncorrectCredentialsOpen(false);
              setNotClicked(true);
            }}
            key={'ic'}
          >
            <Alert severity={'error'} variant={'filled'}>
              {dict.login.fail.incorrectCredentials}
            </Alert>
          </Snackbar>
          <Box display={'flex'} flexDirection={'column'} alignItems={'center'} gap={2} textAlign={'center'}>
            <Typography variant={'h5'}>{dict.login.title}</Typography>
            <ValidatorTextField
              name={'username'}
              frequency={'onChange'}
              label={dict.login.username.title}
              validator={inOrder(validator((input) => input !== '', dict.login.username.error.invalid))}
              onValidationPass={setUsername}
              setValid={setUsernameValid}
              sx={{ width: 300 }}
            />
            <ValidatorTextField
              name={'password'}
              type={'password'}
              frequency={'onChange'}
              label={dict.login.password.title}
              validator={inOrder(validator((input) => input !== '', dict.login.password.error.invalid))}
              onValidationPass={setPassword}
              setValid={setPasswordValid}
              sx={{ width: 300 }}
            />
            <Turnstile
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              options={{ theme: 'light' }}
              onSuccess={(token) => {
                setTurnstileResponse(token);
                setTurnstilePassed(true);
              }}
              onError={() => setTurnstilePassed(false)}
              onExpire={() => setTurnstilePassed(false)}
            />

            <Box display={'flex'} gap={2}>
              <Button
                variant={'contained'}
                disabled={!(usernameValid && passwordValid && turnstilePassed && notClicked)}
                onClick={async () => {
                  setNotClicked(false);

                  const loginResult = await trpc.login.query({
                    username: username,
                    passwordMd5: md5(password),
                    turnstileResponse: turnstileResponse,
                  });

                  if (!loginResult) {
                    setIncorrectCredentialsOpen(true);
                    setNotClicked(true);
                    return;
                  }

                  setLoginResult(loginResult);
                  navigate(redirectTo);
                }}
              >
                {dict.login.submit}
              </Button>
              <Button href={'/register'}>{dict.register.title}</Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Login;
