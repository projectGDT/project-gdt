import { initTRPC, TRPCError } from '@trpc/server';
import { type AuthPayload } from '@/common/auth';
import { z } from 'zod';
import { AppConfig, CallbackMap } from '@/app';
import { PrismaClient } from '@prisma/client';
import { getLogger } from 'log4js';

export interface Context {
    ip: string;
    auth?: AuthPayload;
    prisma: PrismaClient;
    config: AppConfig;
    callbackMap: CallbackMap;
}

const trpcLogger = getLogger('trpc');

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
const baseProc = t.procedure;

export const publicProc = baseProc.use(async ({ ctx, next, path }) => {
    const begin = Date.now();
    const result = await next({ ctx });
    const end = Date.now();
    if (result.ok) {
        trpcLogger.info(
            `PublicProc[${path}] call from ${ctx.auth ? `id ${ctx.auth.id} (${ctx.ip})` : ctx.ip}: ok in ${end - begin}ms`
        );
    } else {
        trpcLogger.warn(
            `PublicProc[${path}] call from ${ctx.auth ? `id ${ctx.auth.id} (${ctx.ip})` : ctx.ip}: ${result.error.code} in ${end - begin}ms`
        );
    }
    return result;
});

export const authProc = baseProc.use(async ({ ctx, next, path }) => {
    if (!ctx.auth) {
        trpcLogger.warn(`Unauthorized AuthProc[${path}] call from ${ctx.ip}`);
        throw new TRPCError({
            code: 'UNAUTHORIZED',
        });
    }

    const begin = Date.now();
    const result = await next({ ctx: { auth: ctx.auth } });
    const end = Date.now();
    if (result.ok) {
        trpcLogger.info(`AuthProc[${path}] call from id ${ctx.auth.id} (${ctx.ip}): ok in ${end - begin}ms`);
    } else {
        trpcLogger.warn(
            `AuthProc[${path}] call from id ${ctx.auth.id} (${ctx.ip}): ${result.error.code} in ${end - begin}ms`
        );
    }
    return result;
});

export const serverManageProc = authProc.input(z.object({ serverId: z.number() })).use(({ ctx, next, input }) => {
    if (!ctx.auth.authorizedServers.includes(input.serverId)) {
        trpcLogger.warn(`Unauthorized ServerManageProc[${input.serverId}] call from id ${ctx.auth.id} (${ctx.ip})`);
        throw new TRPCError({
            code: 'FORBIDDEN',
        });
    }
    return next({ ctx });
});
