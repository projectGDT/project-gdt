import { Express } from 'express';
import { Bot } from 'tanebi';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from '@/trpc';
import { createAuthContext } from '@/common/auth';
import { PrismaClient } from '@prisma/client';
import log4js from 'log4js';

log4js.configure({
    appenders: {
        trpc: { type: 'console' },
    },
    categories: {
        default: { appenders: ['trpc'], level: 'info' },
    }
});

export interface AppConfig {
    port: number;
    webUrl: string;
    verifyChatId: number[];
    xboxOAuthClientId: string;
}

export type CallbackMap = Map<string, {
    verifyCode: string;
    resolve: () => void;
}>;

export class App {
    readonly callbackMap: CallbackMap = new Map();

    constructor(
        readonly expressApp: Express,
        readonly prisma: PrismaClient,
        readonly bot: Bot,
        readonly config: AppConfig,
    ) {
        expressApp.use(cors({
            origin: config.webUrl,
        }));

        expressApp.use('/api/trpc', createExpressMiddleware({
            router: appRouter,
            createContext: async ({ req }) => {
                return {
                    ip: req.headers['x-forwarded-for'] as string || req.ip || 'unknown',
                    ...(await createAuthContext(req.headers.authorization)),
                    prisma: prisma,
                    config: config,
                    callbackMap: this.callbackMap,
                };
            },
        }));

        this.setUpBot();
    }

    setUpBot() {
        this.bot.onGroupJoinRequest((group, request) => {
            if (!this.config.verifyChatId.includes(group.uin)) {
                return;
            }
            const callback = this.callbackMap.get(
                `Verify-${request.requestUin}-${group.uin}`);
            if (!callback) {
                return;
            }
            if (!request.comment.trim().endsWith(callback.verifyCode)) {
                return;
            }
            callback.resolve();
        });
    }

    async start() {
        this.expressApp.listen(this.config.port, () => {
            console.log(`Listening on port ${this.config.port}`);
        });
    }
}