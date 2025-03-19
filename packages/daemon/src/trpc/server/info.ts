import { authProc, publicProc } from '@/common/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const getServerPublicInfo = publicProc
    .input(z.object({
        serverId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
        return await ctx.prisma.server.findUnique({
            where: { id: input.serverId },
            select: {
                id: true,
                name: true,
                logoLink: true,
                coverLink: true,
                introduction: true,
                owner: { select: { username: true } },
                _count: { select: { players: true } },
                applyingPolicy: true,
            },
        });
    });

export const getServerInnerInfo = authProc
    .input(z.object({
        serverId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
        const playerInServer = await ctx.prisma
            .playerInServer.findUnique({
                where: {
                    playerId_serverId: {
                        playerId: ctx.auth.id,
                        serverId: input.serverId,
                    }
                },
                select: {
                    server: {
                        select: {
                            javaRemote: true,
                            bedrockRemote: true,
                        }
                    },
                }
            });
        if (!playerInServer) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'You are not in this server',
            });
        }

        const server = playerInServer.server;
        const uniqueIdProviders: number[] = [];
        if (server.javaRemote) {
            uniqueIdProviders.push(server.javaRemote.uniqueIdProvider);
        }
        if (server.bedrockRemote) {
            uniqueIdProviders.push(-3); // Xbox Live
        }

        const players = (await ctx.prisma.playerInServer.findMany({
            where: { serverId: input.serverId },
            select: {
                player: {
                    select: {
                        profiles: true,
                    }
                },
                playerIsOperator: true,
            },
        }))
            .map(({ player, playerIsOperator }) => ({
                profiles: player.profiles.filter(p =>
                    uniqueIdProviders.includes(p.uniqueIdProvider)),
                playerIsOperator,
            }));

        return {
            javaRemote: server.javaRemote,
            bedrockRemote: server.bedrockRemote,
            players
        };
    });