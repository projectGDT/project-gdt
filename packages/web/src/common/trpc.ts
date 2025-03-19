import { createTRPCClient, httpBatchLink, splitLink, unstable_httpSubscriptionLink } from '@trpc/client';
import type { TrpcAppRouter } from 'gdt-daemon';

export interface LoginResult {
  id: number;
  username: string;
  jwt: string;
}

export function setLoginResult(result: LoginResult) {
  sessionStorage.setItem('id', '' + result.id);
  sessionStorage.setItem('username', result.username);
  sessionStorage.setItem('jwt', result.jwt);
}

export function clearLoginResult() {
  sessionStorage.removeItem('id');
  sessionStorage.removeItem('username');
  sessionStorage.removeItem('jwt');
}

export const trpc = createTRPCClient<TrpcAppRouter>({
  links: [
    splitLink({
      condition: (op) => op.type === 'subscription',
      false: httpBatchLink({
        url: import.meta.env.VITE_TRPC_API_URL,
        headers() {
          const jwt = sessionStorage.getItem('jwt');
          return jwt ? { Authorization: `Bearer ${jwt}` } : {};
        },
      }),
      true: unstable_httpSubscriptionLink({
        url: import.meta.env.VITE_TRPC_API_URL,
      }),
    }),
  ],
});
