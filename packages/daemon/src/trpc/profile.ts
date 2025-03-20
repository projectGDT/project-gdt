import { authProc } from '@/common/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const getProfiles = authProc
    .query(async ({ ctx }) => {
        return await ctx.prisma.profile.findMany({
            where: { playerId: ctx.auth.id },
            select: {
                uniqueIdProvider: true,
                uniqueId: true,
                cachedPlayerName: true,
            },
        });
    });

export const deleteProfile = authProc
    .input(z.object({
        uniqueIdProvider: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
        try {
            await ctx.prisma.profile.delete({
                where: {
                    playerId_uniqueIdProvider: {
                        playerId: ctx.auth.id,
                        uniqueIdProvider: input.uniqueIdProvider
                    }
                }
            });
        } catch {
            throw new TRPCError({
                code: 'NOT_FOUND'
            });
        }
    });