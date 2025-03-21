import * as process from 'node:process';
import * as crypto from 'node:crypto';
import 'dotenv/config';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { Context } from '@/common/trpc';

const zAuthPayload = z.object({
    id: z.number(),
    isSiteAdmin: z.boolean(),
    authorizedServers: z.array(z.number()),
});

export type AuthPayload = z.infer<typeof zAuthPayload>;

const jwtSecret =
    process.env.NODE_ENV === 'dev' ? Buffer.from([
        154, 221, 117, 5, 120, 168, 196, 115, 3, 149, 177, 182, 35, 77, 200, 126,
        57, 243, 75, 223, 34, 40, 235, 31, 196, 133, 251, 227, 83, 217, 129, 106,
        35, 53, 168, 255, 204, 170, 73, 74, 121, 125, 33, 246, 194, 230, 173, 67,
        94, 8, 184, 148, 8, 145, 142, 40, 89, 211, 97, 251, 119, 228, 165, 101,
        152, 181, 54, 208, 207, 80, 82, 48, 164, 146, 70, 255, 90, 130, 183, 222,
        21, 67, 17, 116, 237, 218, 70, 190, 185, 4, 35, 57, 40, 161, 180, 104,
        30, 235, 90, 81, 103, 230, 193, 50, 119, 24, 87, 136, 214, 9, 138, 49,
        104, 133, 10, 20, 80, 126, 135, 48, 72, 187, 156, 238, 74, 191, 44, 173,
        225, 27, 139, 153, 128, 130, 108, 159, 16, 249, 158, 83, 208, 67, 10, 147,
        198, 91, 255, 191, 203, 160, 70, 232, 210, 171, 237, 125, 141, 245, 118, 174,
        226, 34, 83, 222, 195, 212, 57, 33, 81, 48, 134, 152, 20, 243, 66, 2,
        136, 15, 254, 169, 46, 157, 206, 140, 192, 191, 185, 170, 155, 133, 0, 195,
        88, 37, 14, 46, 182, 147, 107, 143, 41, 33, 186, 117, 90, 197, 1, 117,
        42, 74, 1, 216, 216, 116, 103, 235, 15, 164, 153, 13, 228, 123, 0, 236,
        124, 126, 175, 191, 219, 68, 79, 18, 100, 141, 97, 172, 149, 131, 164, 91,
        12, 124, 169, 54, 199, 177, 24, 161, 136, 214, 215, 183, 243, 194, 125, 222,
    ]) : crypto.randomBytes(256);

export function signJwt(payload: AuthPayload) {
    return jwt.sign(payload, jwtSecret, { algorithm: 'HS256', expiresIn: '12h' });
}

export async function verifyJwt(token: string) {
    return new Promise<AuthPayload | undefined>((resolve) => {
        jwt.verify(token, jwtSecret, (err, decoded) => {
            if (err) {
                resolve(undefined);
            } else {
                const safe = zAuthPayload.safeParse(decoded);
                if (safe.success) {
                    resolve(safe.data);
                } else {
                    resolve(undefined);
                }
            }
        });
    });
}

export async function createAuthContext(authorization: string | undefined): Promise<Context['auth']> {
    if (!authorization || !authorization.startsWith('Bearer ')) {
        return undefined;
    }
    return await verifyJwt(authorization.slice(7));
}