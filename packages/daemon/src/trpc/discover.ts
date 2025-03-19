import { authProc } from '@/common/trpc';
import { z } from 'zod';

export const listNotJoined = authProc
    .query(async ({ ctx }) => {
        return (await ctx.prisma.server.findMany({
            where: { players: { none: { playerId: ctx.auth.id } } },
            select: { id: true },
        })).map(s => s.id);
    });

export const batchQueryBrief = authProc
    .input(z.object({
        id: z.array(z.number()).min(1).max(10),
    }))
    .query(async ({ input, ctx }) => {
        return (await ctx.prisma.server.findMany({
            where: { id: { in: input.id } },
            select: {
                id: true,
                name: true,
                logoLink: true,
                coverLink: true,
                applyingPolicy: true,
                javaRemote: { select: { address: true, port: true } },
                bedrockRemote: { select: { address: true, port: true } },
            },
        }));
    });