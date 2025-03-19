import { authProc } from '@/common/trpc';
import { z } from 'zod';

export const getServers = authProc
    .input(z.object({
        includeRemote: z.boolean(),
    }))
    .query(async ({ input, ctx }) => {
        return (await ctx.prisma.playerInServer.findMany({
            where: { playerId: ctx.auth.id },
            select: {
                server: {
                    select: {
                        id: true,
                        name: true,
                        logoLink: true,
                        coverLink: true,
                        applyingPolicy: true,
                        ...(input.includeRemote ? {
                            javaRemote: { select: { address: true, port: true } },
                            bedrockRemote: { select: { address: true, port: true } },
                        } : {}),
                    },
                },
                playerIsOperator: true,
            },
        }));
    });

export const getUnreadCount = authProc
    .query(async ({ ctx }) => {
        const [
            submittedApplyUnreadCount,
            receivedApplyUnreadCount,
            submittedAccessUnreadCount,
        ] = await ctx.prisma.$transaction([
            ctx.prisma.applyingSession.count({
                where: {
                    playerId: ctx.auth.id,
                    state: { in: ['ACCEPTED_PENDING', 'REJECTED_UNREAD'] },
                },
            }),
            ctx.prisma.applyingSession.count({
                where: {
                    serverId: { in: ctx.auth.authorizedServers },
                    state: { in: ['REVIEWING'] },
                },
            }),
            ctx.prisma.accessApplyPayload.count({
                where: {
                    submittedBy: ctx.auth.id,
                    state: { in: ['ACCEPTED_PENDING', 'REJECTED_UNREAD'] },
                },
            }),
        ]);
        return {
            submittedApplyUnreadCount,
            receivedApplyUnreadCount,
            submittedAccessUnreadCount,
        };
    });

export const settleRejected = authProc
    .mutation(async ({ ctx }) => {
        const [updateApply, updateAccess] = await ctx.prisma.$transaction([
            ctx.prisma.applyingSession.updateMany({
                where: {
                    playerId: ctx.auth.id,
                    state: 'REJECTED_UNREAD',
                },
                data: { state: 'REJECTED_READ' },
            }),
            ctx.prisma.accessApplyPayload.updateMany({
                where: {
                    submittedBy: ctx.auth.id,
                    state: 'REJECTED_UNREAD',
                },
                data: { state: 'REJECTED_READ' },
            }),
        ]);
        return {
            applyReadCount: updateApply.count,
            accessReadCount: updateAccess.count,
        };
    });