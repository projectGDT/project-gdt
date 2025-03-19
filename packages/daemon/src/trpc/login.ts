import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProc } from '@/common/trpc';
import { verifyResponse } from '@/common/captcha';
import { signJwt } from '@/common/auth';

export const login = publicProc
    .input(z.object({
        username: z.string(),
        passwordMd5: z.string().base64(),
        turnstileResponse: z.string(),
    }))
    .query(async ({ ctx, input }) => {
        const verify = await verifyResponse(input.turnstileResponse);
        if (!verify) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Invalid captcha response',
            });
        }

        const user = await ctx.prisma.player.findUnique({
            where: (input.username.match(/^[1-9][0-9]{4,9}$/) ?
                { chatId: input.username, pwMD5: input.passwordMd5 } :
                { username: input.username, pwMD5: input.passwordMd5 }),
            include: { ownedServers: { select: { id: true } }, involvedServers: true },
        });
        if (!user) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'Username or password is incorrect',
            });
        }

        return {
            id: user.id,
            username: user.username,
            jwt: signJwt({
                id: user.id,
                isSiteAdmin: user.isSiteAdmin,
                authorizedServers: distinct([
                    ...user.ownedServers.map(s => s.id),
                    ...user.involvedServers
                        .filter(s => s.playerIsOperator)
                        .map(s => s.serverId),
                ]),
            }),
        };
    });

function distinct<T>(input: T[]): T[] {
    return [...new Set(input)];
}