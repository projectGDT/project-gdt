import { signJwt } from '@/common/auth';
import { verifyResponse } from '@/common/captcha';
import { zAsyncIterable } from '@/common/schema/async-iterator';
import { zChatId, zUsername } from '@/common/schema/register';
import { publicProc } from '@/common/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { randomInt } from 'node:crypto';

export const checkChatId = publicProc
    .input(zChatId)
    .output(z.object({ exists: z.boolean() }))
    .query(async ({ ctx, input }) => {
        const exists = await ctx.prisma.player.findUnique({
            where: { chatId: input },
        });
        if (exists) return { exists: true };
        return { exists: false };
    });

export const checkUsername = publicProc
    .input(zUsername)
    .output(z.object({ exists: z.boolean() }))
    .query(async ({ ctx, input }) => {
        const exists = await ctx.prisma.player.findUnique({
            where: { username: input },
        });
        if (exists) return { exists: true };
        return { exists: false };
    });

export const registerSubmit = publicProc
    .input(z.object({
        username: zUsername,
        chatId: zChatId,
        pwMd5: z.string(),
        invitationCode: z.string().optional(),
        turnstileResponse: z.string(),
    }))
    .output(zAsyncIterable({
        yield: z.union([
            z.object({
                step: z.literal('Verify'),
                verifyChatId: zChatId,
                verifyCode: z.string(),
            }),
            z.object({
                step: z.literal('Success'),
                id: z.number(),
                jwt: z.string(),
                navigateToProfile: z.array(z.number()),
            }),
        ])
    }))
    .subscription(async function* ({ ctx, input }) {
        const chatIdExists = await ctx.prisma.player.findUnique({
            where: { chatId: input.chatId },
        });
        if (chatIdExists) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Chat ID already exists',
            });
        }

        const usernameExists = await ctx.prisma.player.findUnique({
            where: { username: input.username },
        });
        if (usernameExists) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Username already exists',
            });
        }

        const verify = await verifyResponse(input.turnstileResponse);
        if (!verify) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Invalid captcha response',
            });
        }

        const serverUniqueIdProvider: number[] = [];
        if (input.invitationCode) {
            const code = await ctx.prisma.invitationCode.findUnique({
                where: { value: input.invitationCode },
                select: { serverId: true }
            });
            if (!code) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Invalid invitation code',
                });
            }
            const server = (await ctx.prisma.server.findUnique({
                where: { id: code.serverId },
                select: {
                    javaRemote: { select: { uniqueIdProvider: true } },
                    bedrockRemote: true,
                }
            }))!;
            
            if (server?.javaRemote) {
                serverUniqueIdProvider.push(server.javaRemote.uniqueIdProvider);
            }

            if (server?.bedrockRemote) {
                serverUniqueIdProvider.push(-3);
            }
        }

        const verifyChatId = '' + ctx.config.verifyChatId[randomInt(0, ctx.config.verifyChatId.length)];
        const verifyCode = randomInt(0, 1000000).toString().padStart(6, '0');
        const verifyKey = `Verify-${input.chatId}-${verifyChatId}`;
        yield {
            step: 'Verify',
            verifyChatId,
            verifyCode,
        };

        const verifyResult = await new Promise<boolean>((resolve) => {
            // race between the verification and the timeout
            ctx.callbackMap.set(verifyKey, {
                verifyCode,
                resolve: () => resolve(true),
            });
            setTimeout(() => {
                ctx.callbackMap.delete(verifyKey);
                resolve(false);
            }, 5 * 60 * 1000);
        });

        if (!verifyResult) {
            return;
        }

        const player = await ctx.prisma.player.create({
            data: {
                chatId: input.chatId,
                username: input.username,
                pwMD5: input.pwMd5,
            },
        });

        yield {
            step: 'Success',
            id: player.id,
            jwt: signJwt({
                id: player.id,
                isSiteAdmin: false,
                authorizedServers: [],
            }),
            navigateToProfile: serverUniqueIdProvider,
        };
        return;
    });