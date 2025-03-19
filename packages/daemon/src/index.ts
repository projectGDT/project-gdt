import 'dotenv/config';
import express from 'express';
import { appRouter } from '@/trpc';
import { App } from '@/app';
import { PrismaClient } from '@prisma/client';
import { createOnlineBot } from '@/common/bot';
import * as fs from 'node:fs';
import { z } from 'zod';

export type TrpcAppRouter = typeof appRouter;

const zEnv = z.object({
    PORT: z.string().default('14590'),
    WEB_URL: z.string().default('http://localhost:5173'),
    BOT_SIGN_API_URL: z.string(),
    VERIFY_CHAT_ID: z.string(),
});

async function main() {
    if (!fs.existsSync('data')) {
        fs.mkdirSync('data');
    }

    const expressApp = express();
    const prisma = new PrismaClient();

    const env = zEnv.parse(process.env);

    const app = new App(
        expressApp,
        prisma,
        await createOnlineBot(env.BOT_SIGN_API_URL),
        {
            port: parseInt(env.PORT),
            webUrl: env.WEB_URL,
            verifyChatId: env.VERIFY_CHAT_ID.split(',').map(Number),
        }
    );

    await app.start();
}

main();