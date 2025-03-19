import { authProc } from '@/common/trpc';
import { zApplyAccess } from '@/common/schema/access';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const submitAccessApply = authProc
    .input(zApplyAccess)
    .mutation(async ({ input, ctx }) => {
        if (!input.remote.java && !input.remote.bedrock) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'At least one remote should be provided',
            });
        }
        await ctx.prisma.accessApplyPayload.create({
            data: {
                submittedBy: ctx.auth.id,
                payload: input,
            },
        });
    });

export const fetchAccessApply = authProc
    .input(z.object({
        filter: z.enum([
            'ReviewingOnly',
            'ReviewedUnreadOnly',
        ]),
    }))
    .query(async ({ ctx, input }) => {
        return await ctx.prisma.accessApplyPayload.findMany({
            where: {
                submittedBy: ctx.auth.id,
                state: input.filter ? (
                    input.filter === 'ReviewingOnly' ? 'REVIEWING' :
                        { in: ['ACCEPTED_PENDING', 'REJECTED_UNREAD'] }
                ) : undefined,
            },
        });
    });