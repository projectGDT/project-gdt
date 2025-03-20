import { Express } from 'express';
import { Bot } from 'tanebi';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from '@/trpc';
import { createAuthContext } from '@/common/auth';
import { PrismaClient } from '@prisma/client';
import log4js from 'log4js';
import * as http from 'node:http';
import { promisify } from 'node:util';

log4js.configure({
    appenders: {
        console: { type: 'console' },
    },
    categories: {
        default: {
            appenders: ['console'],
            level: 'info'
        },
    }
});

const appLogger = log4js.getLogger('app');

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
    readonly httpServer: http.Server;
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

        this.httpServer = http.createServer(expressApp);

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
            appLogger.info(`Verify request from ${request.requestUin} to ${group.uin}`);
            if (!request.comment.trim().endsWith(callback.verifyCode)) {
                return;
            }
            callback.resolve();
        });
    }

    async start() {
        this.httpServer.listen(this.config.port, () => {
            appLogger.info(`Listening on port ${this.config.port}`);
        });
    }

    async stop() {
        appLogger.info('Stopping the app');
        this.httpServer.closeAllConnections();
        await promisify(this.httpServer.close.bind(this.httpServer))();
        await this.prisma.$disconnect();
        await this.bot.dispose();
    }
}