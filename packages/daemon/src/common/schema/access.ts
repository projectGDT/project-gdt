import { z } from 'zod';
import { zMcServerAddress, zMcServerPort, zMcVersion } from '@/common/schema/minecraft';
import { zApplyForm } from '@/common/schema/form';

export const zApplyAccess = z.object({
    basic: z.object({
        name: z.string().min(3).max(30),
        logoLink: z.string().url(),
        coverLink: z.string().url(),
        introduction: z.string().min(10).max(3000),
    }),
    remote: z.object({
        java: z.object({
            address: zMcServerAddress,
            port: zMcServerPort,
            coreVersion: zMcVersion,
            compatibleVersions: z.array(zMcVersion),
            auth: z.enum([
                'Microsoft',
                'LittleSkin',
                'Offline',
            ]),
        }).optional(),
        bedrock: z.object({
            address: zMcServerAddress,
            port: zMcServerPort,
            coreVersion: zMcVersion,
            compatibleVersions: z.array(zMcVersion),
        }).optional(),
    }),
    access: z.union([
        z.object({
            policy: z.literal('Open'),
        }),
        z.object({
            policy: z.literal('ByForm'),
            form: zApplyForm,
        }),
    ]),
});
export type ApplyAccess = z.infer<typeof zApplyAccess>;