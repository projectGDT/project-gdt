import { z } from 'zod';

export const zChatId = z.string().regex(/^[1-9][0-9]{4,9}$/);
export const zUsername = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{2,15}$/);
export const zPassword = z.string().regex(/^(?=.*[a-zA-Z])(?=.*\d).{8,20}$/);