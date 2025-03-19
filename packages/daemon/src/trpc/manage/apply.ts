import { serverManageProc } from '@/common/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { ApplyForm } from '@/common/schema/form';

const pageSize = 50;

export const fetchReceivedApply = serverManageProc
    .input(z.object({ page: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
        return await ctx.prisma.applyingSession.findMany({
            where: { serverId: input.serverId },
            orderBy: { createdAt: 'desc' },
            skip: (input.page - 1) * pageSize,
            take: pageSize,
        });
    });

export const getFormByUuid = serverManageProc
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
        const form = await ctx.prisma.serverForm.findUnique({
            where: { uuid: input.formId, serverId: input.serverId },
        });
        if (!form) {
            throw new TRPCError({
                code: 'NOT_FOUND',
            });
        }

        return form.body as ApplyForm;
    });