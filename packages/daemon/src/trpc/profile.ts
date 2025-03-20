import { authProc } from '@/common/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getXboxIdentity } from '@/common/profile/xbox';

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

export const bindXboxProfile = authProc
    .input(z.object({ code: z.string() }))
    .output(z.union([
        z.object({
            result: z.literal('Success'),
            xuid: z.string(),
            xboxGamerTag: z.string(),
        }),
        z.object({
            result: z.literal('InternalError'),
        })
    ]))
    .mutation(async ({ ctx, input }) => {
        try {
            const identity = await getXboxIdentity(input.code, ctx.config);
            await ctx.prisma.profile.create({
                data: {
                    playerId: ctx.auth.id,
                    uniqueIdProvider: -3,
                    uniqueId: identity.xuid,
                    cachedPlayerName: identity.xboxGamerTag,
                }
            });
            return {
                result: 'Success',
                xuid: identity.xuid,
                xboxGamerTag: identity.xboxGamerTag,
            };
        } catch {
            return { result: 'InternalError' };
        }
    });