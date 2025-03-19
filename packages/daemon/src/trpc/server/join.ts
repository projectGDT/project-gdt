import { authProc } from '@/common/trpc';
import { z } from 'zod';
import { ApplyForm, validateAnswer, zGeneralAnswer } from '@/common/schema/form';
import { TRPCError } from '@trpc/server';

export const getLatestForm = authProc
    .input(z.object({
        serverId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
        const form = await ctx.prisma.serverForm.findFirst({
            where: { serverId: input.serverId, isLatest: true },
        });
        if (!form) {
            throw new TRPCError({
                code: 'NOT_FOUND',
            });
        }
        return {
            uuid: form.uuid,
            body: form.body as ApplyForm,
        };
    });

export const submitApply = authProc
    .input(z.object({
        serverId: z.number(),
        formId: z.string().uuid(),
        payload: zGeneralAnswer,
    }))
    .mutation(async ({ ctx, input }) => {
        const form = await ctx.prisma.serverForm.findUnique({
            where: { uuid: input.formId },
        });
        if (!form || form.serverId !== input.serverId) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Invalid form id',
            });
        }
        if (!form.isLatest) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Form is outdated',
            });
        }
        if (!validateAnswer((form.body as ApplyForm).questions, input.payload)) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Invalid answer',
            });
        }
        await ctx.prisma.applyingSession.create({
            data: {
                playerId: ctx.auth.id,
                serverId: input.serverId,
                formId: input.formId,
                payload: input.payload,
            },
        });
    });

export const joinByInvitationCode = authProc
    .input(z.object({
        code: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }): Promise<'Success' | 'Invalid' | 'ExpiredOrUsedUp' | 'NotBinded' | 'AlreadyJoined'> => {
        return await ctx.prisma.$transaction(async (c) => {
            const code = await c.invitationCode.findUnique({
                where: { value: input.code },
            });

            if (!code) {
                return 'Invalid';
            }

            if (
                Date.now() > code.issuedAt.getMilliseconds() + code.lifetime
                || code.reusableTimes === 0
            ) {
                await c.invitationCode.delete({
                    where: { value: input.code },
                });
                return 'ExpiredOrUsedUp';
            }

            const playerProfileTypes = (await c.player.findUniqueOrThrow({
                where: { id: ctx.auth.id },
                select: { profiles: { select: { uniqueIdProvider: true } } }
            })).profiles.map(p => p.uniqueIdProvider);
            const serverProfileTypes = await c.server.findUniqueOrThrow({
                where: { id: code.serverId },
                select: {
                    javaRemote: { select: { uniqueIdProvider: true } },
                    bedrockRemote: true,
                }
            });
            const javaProvider = serverProfileTypes.javaRemote?.uniqueIdProvider;
            const bedrockProvider = serverProfileTypes.bedrockRemote ? -3 : undefined;
            if (
                (javaProvider && !playerProfileTypes.includes(javaProvider))
                && (bedrockProvider && !playerProfileTypes.includes(bedrockProvider))
            ) {
                return 'NotBinded';
            }

            if (code.reusableTimes > 0) {
                await c.invitationCode.update({
                    where: { value: input.code },
                    data: {
                        reusableTimes: code.reusableTimes - 1,
                    },
                });
            }

            const playerExists = await c.playerInServer.findUnique({
                where: {
                    playerId_serverId: {
                        playerId: ctx.auth.id,
                        serverId: code.serverId,
                    },
                },
            });
            if (playerExists) {
                return 'AlreadyJoined';
            }

            await c.playerInServer.create({
                data: {
                    playerId: ctx.auth.id,
                    serverId: code.serverId,
                    playerIsOperator: false,
                },
            });
            return 'Success';
        });
    });