import {
  Alert,
  Box,
  Button,
  Paper,
  Snackbar,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import { Turnstile } from '@marsidev/react-turnstile';
import { dict } from '../common/dict.tsx';
import { useState } from 'react';
import { useImmer } from 'use-immer';
import ValidatorTextField from '../common/components/ValidatorTextField';
import { inOrder, validator } from '../common/validator';
import { setLoginResult, trpc } from '../common/trpc';
import md5 from 'md5';

const chatIdRegex = /^[1-9][0-9]{4,9}$/;
const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,15}$/;
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,20}$/;
const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;

function Register() {
  const [activeStep, setActiveStep] = useState(0);

  // Snackbar for error message
  const [errMsg, setErrMsg] = useState('');
  const [errOpen, setErrOpen] = useState(false);

  const [chatId, setChatId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [turnstileResponse, setTurnstileResponse] = useState('');

  // Until all fields are valid, the submit button is disabled
  const [chatIdValid, setChatIdValid] = useState(false);
  const [usernameValid, setUsernameValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  // Invitation code is optional, so initially it is valid
  const [invitationCodeValid, setInvitationCodeValid] = useState(true);
  const [turnstilePassed, setTurnstilePassed] = useState(false);

  const [verifyChatId, setVerifyChatId] = useState('000000000');
  const [verifyCode, setVerifyCode] = useState('RESERVED');

  const [navigateToProfile, setNavigateToProfile] = useImmer<number[]>([]);

  // To prevent multiple clicks
  const [notClicked, setNotClicked] = useState(true);

  const steps = [
    <Box key={'submit'} display={'flex'} flexDirection={'column'} gap={2}>
      <Box display={'flex'} gap={2}>
        <ValidatorTextField
          name={'chatId'}
          label={dict.register.submit.chatId.title}
          validator={inOrder(
            validator((input) => chatIdRegex.test(input), dict.register.submit.chatId.error.invalid),
            validator(
              async (input) => !(await trpc.register.checkChatId.query(input)).exists,
              dict.register.submit.chatId.error.alreadyExists
            )
          )}
          onValidationPass={setChatId}
          setValid={setChatIdValid}
          sx={{ width: 0.5 }}
        />
        <ValidatorTextField
          name={'username'}
          label={dict.register.submit.username.title}
          validator={inOrder(
            validator((input) => usernameRegex.test(input), dict.register.submit.username.error.invalid),
            validator(
              async (input) => !(await trpc.register.checkUsername.query(input)).exists,
              dict.register.submit.username.error.alreadyExists
            )
          )}
          onValidationPass={setUsername}
          setValid={setUsernameValid}
          sx={{ width: 0.5 }}
        />
      </Box>
      <ValidatorTextField
        name={'password'}
        type={'password'}
        label={dict.register.submit.password.title}
        validator={inOrder(
          validator((input) => passwordRegex.test(input), dict.register.submit.password.error.invalid)
        )}
        onValidationPass={setPassword}
        setValid={setPasswordValid}
      />
      <Box display={'flex'} gap={2}>
        <ValidatorTextField
          name={'invitationCode'}
          label={dict.register.submit.invitationCode.title}
          validator={inOrder({
            validator: (input) => input === '' || uuidRegex.test(input),
            hint: dict.register.submit.invitationCode.error.invalid,
          })}
          onValidationPass={setInvitationCode}
          setValid={setInvitationCodeValid}
          sx={{ flexGrow: 1 }}
        />
        <Turnstile
          siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
          options={{ theme: 'light', size: 'normal' }}
          onSuccess={(token) => {
            setTurnstileResponse(token);
            setTurnstilePassed(true);
          }}
          onError={() => setTurnstilePassed(false)}
          onExpire={() => setTurnstilePassed(false)}
        />
      </Box>
      <Button
        variant={'contained'}
        size={'large'}
        disabled={
          !(chatIdValid && usernameValid && passwordValid && invitationCodeValid && turnstilePassed && notClicked)
        }
        onClick={() => {
          setNotClicked(false);
          const session = trpc.register.submit.subscribe(
            {
              username: username,
              chatId: chatId,
              pwMd5: md5(password),
              invitationCode: invitationCode,
              turnstileResponse: turnstileResponse,
            },
            {
              onData(value) {
                if (value.step === 'Verify') {
                  setVerifyChatId(value.verifyChatId);
                  setVerifyCode(value.verifyCode);
                  setActiveStep(1);
                } else if (value.step === 'Success') {
                  session.unsubscribe();
                  setLoginResult({
                    id: value.id,
                    username,
                    jwt: value.jwt,
                  });
                  setNavigateToProfile(value.navigateToProfile);
                  setActiveStep(2);
                }
              },
              onError(err) {
                setErrMsg(err.message);
                setErrOpen(true);
                setNotClicked(true);
              },
              onStopped() {
                setErrMsg(dict.register.submit.fail.timeout);
                setErrOpen(true);
              },
            }
          );
        }}
      >
        <b>{dict.register.submit.confirm}</b>
      </Button>
    </Box>,
    <Box key={'verify'} display={'flex'} flexDirection={'column'} gap={2}>
      <Typography>{dict.register.verify.content(verifyChatId)}</Typography>
      <Typography variant={'h4'} sx={{ alignSelf: 'center' }}>
        <b>
          <code>{verifyCode}</code>
        </b>
      </Typography>
    </Box>,
    <Box key={'success'} display={'flex'} flexDirection={'column'} gap={2}>
      <Typography>{dict.register.success.welcome}</Typography>
      {navigateToProfile.length === 0 ? (
        <>
          <Typography>{dict.register.success.redirect.general.text}</Typography>
          <Button variant={'contained'} size={'large'}>
            {dict.register.success.redirect.general.button}
          </Button>
        </>
      ) : (
        <>
          <Typography>{dict.register.success.redirect.withCode.general}</Typography>
          {navigateToProfile.map((provider) =>
            provider > 0 ? (
              <Button key={provider} variant={'contained'} size={'large'}>
                {dict.register.success.redirect.withCode.offline}
              </Button>
            ) : provider === -1 ? (
              <Button key={provider} variant={'contained'} size={'large'}>
                {dict.register.success.redirect.withCode.javaMicrosoft}
              </Button>
            ) : provider === -2 ? (
              <Button key={provider} variant={'contained'} size={'large'}>
                {dict.register.success.redirect.withCode.javaLittleSkin}
              </Button>
            ) : (
              <Button key={provider} variant={'contained'} size={'large'}>
                {dict.register.success.redirect.withCode.xbox}
              </Button>
            )
          )}
        </>
      )}
    </Box>,
  ];

  return (
    <Box display={'flex'} flexDirection={'column'} alignItems={'stretch'} paddingX={'25%'} flexGrow={1}>
      <Box display={'flex'} alignItems={'center'} flexGrow={1}>
        <Box display={'flex'} flexDirection={'column'} gap={2} flexGrow={1}>
          <Box textAlign={'center'} padding={2}>
            <Typography variant={'h5'}>{dict.register.title}</Typography>
          </Box>
          <Paper sx={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 3, flexGrow: 1 }}>
            <Snackbar open={errOpen} autoHideDuration={5000} onClose={() => setErrOpen(false)}>
              <Alert severity={'error'} variant={'filled'}>
                {errMsg}
              </Alert>
            </Snackbar>
            <Stepper activeStep={activeStep} orientation={'vertical'}>
              <Step key={'submit'}>
                <StepLabel>{dict.register.submit.label}</StepLabel>
                <StepContent>{steps[0]}</StepContent>
              </Step>
              <Step key={'verify'}>
                <StepLabel>{dict.register.verify.label}</StepLabel>
                <StepContent>{steps[1]}</StepContent>
              </Step>
              <Step key={'success'}>
                <StepLabel>{dict.register.success.label}</StepLabel>
                <StepContent>{steps[2]}</StepContent>
              </Step>
            </Stepper>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

export default Register;
