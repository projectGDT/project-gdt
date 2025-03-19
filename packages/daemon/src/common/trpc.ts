import { initTRPC, TRPCError } from '@trpc/server';
import { type AuthPayload } from '@/common/auth';
import { z } from 'zod';
import { AppConfig, CallbackMap } from '@/app';
import { PrismaClient } from '@prisma/client';

export interface Context {
    auth?: AuthPayload;
    prisma: PrismaClient;
    config: AppConfig;
    callbackMap: CallbackMap;
}

const t = initTRPC.context<Context>().create({
    sse: {
        maxDurationMs: 5 * 60 * 1_000, // 5 minutes
        ping: {
            enabled: true,
            intervalMs: 3_000,
        },
        client: {
            reconnectAfterInactivityMs: 5_000,
        },
    },
});

export const router = t.router;

export const publicProc = t.procedure;

export const authProc = publicProc
    .use(({ ctx, next }) => {
        if (!ctx.auth) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
            });
        }
        return next({ ctx: { auth: ctx.auth } });
    });

export const serverManageProc = authProc
    .input(z.object({ serverId: z.number() }))
    .use(({ ctx, next, input }) => {
        if (!ctx.auth.authorizedServers.includes(input.serverId)) {
            throw new TRPCError({
                code: 'FORBIDDEN',
            });
        }
        return next({ ctx });
    });