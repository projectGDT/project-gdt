import { createTRPCClient, httpBatchLink, splitLink, unstable_httpSubscriptionLink } from '@trpc/client';
import type { TrpcAppRouter } from 'gdt-daemon';

export const trpc = createTRPCClient<TrpcAppRouter>({
  links: [
    splitLink({
      condition: (op) => op.type === 'subscription',
      false: httpBatchLink({
        url: import.meta.env.VITE_TRPC_API_URL,
      }),
      true: unstable_httpSubscriptionLink({
        url: import.meta.env.VITE_TRPC_API_URL,
      }),
    }),
  ],
});
