import { authProc, publicProc } from '@/common/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getXboxIdentity } from '@/common/profile/xbox';
import { MicrosoftAuthSession } from '@/common/profile/microsoft';
import { zAsyncIterable } from '@/common/schema/async-iterator';
import { verifyJwt } from '@/common/auth';

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

export const bindJavaMicrosoftProfile = publicProc
    .input(z.object({
        jwt: z.string(),
    }))
    .output(zAsyncIterable({
        yield: z.union([
            z.object({
                state: z.literal('DeviceCode'),
                code: z.string(),
                verificationUri: z.string(),
            }),
            z.object({
                state: z.literal('Success'),
                uuid: z.string(),
                playerName: z.string(),
            }),
            z.object({
                state: z.literal('InternalError'),
            }),
            z.object({
                state: z.literal('Timeout'),
            })
        ]),
    }))
    .subscription(async function* ({ ctx, input }) {
        const jwtPayload = await verifyJwt(input.jwt);
        if (!jwtPayload) {
            throw new TRPCError({
                code: 'UNAUTHORIZED'
            });
        }

        const session = await MicrosoftAuthSession.create();
        try {
            const deviceCodeInit = await session.doDeviceCodeAuth();
            yield {
                state: 'DeviceCode',
                code: deviceCodeInit.user_code as string,
                verificationUri: deviceCodeInit.verification_uri as string,
            } ;
            const msaToken = await session.awaitAccessToken(deviceCodeInit.device_code, 5);
            if (!msaToken) {
                yield { state: 'Timeout' } ;
                return;
            }
            const deviceToken = await session.getDeviceToken();
            const xstsTokenResp = await session.doSisuAuth(msaToken, deviceToken);
            const mcaToken = await session.getMinecraftAccessToken(xstsTokenResp.Token, xstsTokenResp.DisplayClaims.xui[0].uhs);
            const profile = await session.getProfile(mcaToken);
            const prismaProfile = await ctx.prisma.profile.create({
                data: {
                    playerId: jwtPayload.id,
                    uniqueIdProvider: -1,
                    uniqueId: `${profile.id.slice(0, 8)}-${profile.id.slice(8, 12)}-${profile.id.slice(12, 16)}-${profile.id.slice(16, 20)}-${profile.id.slice(20)}`,
                    cachedPlayerName: profile.name,
                }
            });
            yield {
                state: 'Success',
                uuid: prismaProfile.uniqueId,
                playerName: prismaProfile.cachedPlayerName,
            } ;
        } catch {
            yield { state: 'InternalError' } ;
        }
        return;
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