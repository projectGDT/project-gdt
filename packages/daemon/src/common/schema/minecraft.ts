import { z } from 'zod';

export const zMcServerAddress = z.union([
    z.string().regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/),
    z.string().ip(),
]);

export const zMcServerPort = z.number().int().min(1).max(65535);

export const zMcVersion = z.string().regex(/^1\.[0-9]+(?:\.[0-9]+)?$/);
