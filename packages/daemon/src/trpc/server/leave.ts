import { authProc } from '@/common/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const leaveServer = authProc
    .input(z.object({
        serverId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
        const playerInServer = await ctx.prisma.playerInServer.findUnique({
            where: {
                playerId_serverId: {
                    playerId: ctx.auth.id,
                    serverId: input.serverId,
                },
            },
            select: { server: { select: { ownerId: true } } }
        });

        if (!playerInServer) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'You are not in this server, or the server does not exist',
            });
        }

        if (playerInServer.server.ownerId === ctx.auth.id) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Owner cannot leave the server; disband it instead',
            });
        }

        await ctx.prisma.playerInServer.delete({
            where: {
                playerId_serverId: {
                    playerId: ctx.auth.id,
                    serverId: input.serverId,
                },
            },
        });
    });