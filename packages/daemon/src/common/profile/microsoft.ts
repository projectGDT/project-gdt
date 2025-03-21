// The code in this file is from PrismarineJS/prismarine-auth,
// which is licensed under the MIT license.
//
// Copyright (c) 2020 PrismarineJS
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import * as crypto from 'node:crypto';
import { SmartBuffer } from 'smart-buffer';
import { exportJWK, JWK } from 'jose';
import { z } from 'zod';

const Endpoints = {
    PCXSTSRelyingParty: 'rp://api.minecraftservices.com/',
    BedrockXSTSRelyingParty: 'https://multiplayer.minecraft.net/',
    XboxAuthRelyingParty: 'http://auth.xboxlive.com/',
    XboxRelyingParty: 'http://xboxlive.com',
    BedrockAuth: 'https://multiplayer.minecraft.net/authentication',
    XboxDeviceAuth: 'https://device.auth.xboxlive.com/device/authenticate',
    XboxTitleAuth: 'https://title.auth.xboxlive.com/title/authenticate',
    XboxUserAuth: 'https://user.auth.xboxlive.com/user/authenticate',
    SisuAuthorize: 'https://sisu.xboxlive.com/authorize',
    XstsAuthorize: 'https://xsts.auth.xboxlive.com/xsts/authorize',
    MinecraftServicesLogWithXbox: 'https://api.minecraftservices.com/authentication/login_with_xbox',
    MinecraftServicesCertificate: 'https://api.minecraftservices.com/player/certificates',
    MinecraftServicesEntitlement: 'https://api.minecraftservices.com/entitlements/mcstore',
    MinecraftServicesProfile: 'https://api.minecraftservices.com/minecraft/profile',
    MinecraftServicesReport: 'https://api.minecraftservices.com/player/report',
    LiveDeviceCodeRequest: 'https://login.live.com/oauth20_connect.srf',
    LiveTokenRequest: 'https://login.live.com/oauth20_token.srf',
};

const minecraftJavaTitle = '00000000402b5328';
const scope = 'service::user.auth.xboxlive.com::MBI_SSL';

export class MicrosoftAuthSession {
    keyPair: crypto.KeyPairKeyObjectResult;
    jwk?: (JWK & { alg: string; use: string; });
    readonly alivePeriod: number;
    pending: boolean = true;
    cookies: string[] = [];

    private constructor(alivePeriodInSecond?: number) {
        this.keyPair = crypto.generateKeyPairSync('ec', {
            namedCurve: 'P-256',
        });
        this.alivePeriod = alivePeriodInSecond ? (
            alivePeriodInSecond > 900 ? 900 : alivePeriodInSecond
        ) * 1000 : 180 * 1000;
    }

    stopPending() {
        this.pending = false;
    }

    static async create(alivePeriodInSecond?: number) {
        const session = new MicrosoftAuthSession(alivePeriodInSecond);
        session.jwk = await exportJWK(session.keyPair.publicKey).then(jwk => ({
            ...jwk,
            alg: 'ES256',
            use: 'sig',
        }));
        return session;
    }

    async doDeviceCodeAuth() {
        return await fetch(Endpoints.LiveDeviceCodeRequest, {
            method: 'POST',
            body: new URLSearchParams({
                scope: scope,
                client_id: minecraftJavaTitle,
                response_type: 'device_code',
            }).toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            credentials: 'include',
        }).then(res => {
            if (res.headers.get('set-cookie')) {
                const cookie = res.headers.get('set-cookie');
                if (cookie) {
                    const [kv] = cookie.split(';');
                    this.cookies.push(kv);
                }
            }
            return res.json();
        });
    }

    async awaitAccessToken(deviceCode: string, interval: number) {
        const expireTime = Date.now() + this.alivePeriod;
        while (Date.now() < expireTime && this.pending) {
            await new Promise(resolve => setTimeout(resolve, interval * 1000)); // delay {interval} seconds
            const nullOrToken: string | null = await fetch(Endpoints.LiveTokenRequest + '?client_id=' + minecraftJavaTitle, {
                method: 'POST',
                body: new URLSearchParams({
                    client_id: minecraftJavaTitle,
                    device_code: deviceCode,
                    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
                }).toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': this.cookies.join('; '),
                },
            }).then(res => res.json()).then(body => {
                if (body.error) {
                    if (body.error === 'authorization_pending') {
                        return null;
                    } else {
                        throw new Error(body.error);
                    }
                } else {
                    return body.access_token as string;
                }
            });
            if (nullOrToken) return nullOrToken;
        }
        return null;
    }

    async getDeviceToken() {
        const body = JSON.stringify({
            Properties: {
                AuthMethod: 'ProofOfPossession',
                Id: `{${crypto.randomUUID()}}`,
                DeviceType: 'Win32',
                SerialNumber: `{${crypto.randomUUID()}}`,
                Version: '0.0.0',
                ProofKey: this.jwk,
            },
            RelyingParty: 'http://auth.xboxlive.com',
            TokenType: 'JWT',
        });

        return z.string().parse(await fetch(Endpoints.XboxDeviceAuth, {
            method: 'POST',
            headers: {
                'Cache-Control': 'no-store, must-revalidate, no-cache',
                'Signature': this.sign(Endpoints.XboxDeviceAuth, '', body).toString('base64'),
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-xbl-contract-version': '1',
            },
            body,
        }).then(res => res.json()).then(body => body.Token));
    }

    async doSisuAuth(accessToken: string, deviceToken: string) {
        const body = JSON.stringify({
            AccessToken: `t=${accessToken}`,
            AppId: minecraftJavaTitle,
            DeviceToken: deviceToken,
            Sandbox: 'RETAIL',
            UseModernGamertag: false,
            SiteName: 'user.auth.xboxlive.com',
            RelyingParty: Endpoints.PCXSTSRelyingParty,
            ProofKey: this.jwk,
        });

        return await fetch(Endpoints.SisuAuthorize, {
            method: 'POST',
            headers: {
                'Signature': this.sign(Endpoints.SisuAuthorize, '', body).toString('base64'),
            },
            body,
        }).then(res => res.json()).then(body => body.AuthorizationToken);
    }

    async getMinecraftAccessToken(xstsToken: string, userHash: string) {
        return await fetch(Endpoints.MinecraftServicesLogWithXbox, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'MinecraftLauncher/2.2.10675',
            },
            body: JSON.stringify({
                identityToken: `XBL3.0 x=${userHash};${xstsToken}`,
            }),
        }).then(res => res.json()).then(body => body.access_token);
    }

    async getProfile(minecraftAccessToken: string) {
        return await fetch(Endpoints.MinecraftServicesProfile, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${minecraftAccessToken}`,
                'Accept': 'application/json',
            },
        }).then(res => res.json());
    }

    sign(url: string, authorizationToken: string, payload: string) {
        // Their backend servers use Windows epoch timestamps, account for that.
        // The server is very picky, bad precision or wrong epoch may fail the request.
        const windowsTimestamp = (BigInt((Date.now() / 1000) | 0) + BigInt(11644473600)) * BigInt(10000000);
        // Only the /uri?and-query-string
        const pathAndQuery = new URL(url).pathname;

        // Allocate the buffer for signature, TS, path, tokens and payload and NUL termination
        const allocSize = /* sig */ 5 + /* ts */ 9 + /* POST */ 5 + pathAndQuery.length + 1 + authorizationToken.length + 1 + payload.length + 1;
        const buf = SmartBuffer.fromSize(allocSize);
        buf.writeInt32BE(1); // Policy Version
        buf.writeUInt8(0);
        buf.writeBigUInt64BE(windowsTimestamp);
        buf.writeUInt8(0); // null term
        buf.writeStringNT('POST');
        buf.writeStringNT(pathAndQuery);
        buf.writeStringNT(authorizationToken);
        buf.writeStringNT(payload);

        // Get the signature from the payload
        const signature = crypto.sign('SHA256', buf.toBuffer(), {
            key: this.keyPair.privateKey,
            dsaEncoding: 'ieee-p1363',
        });

        const header = SmartBuffer.fromSize(signature.length + 12);
        header.writeInt32BE(1); // Policy Version
        header.writeBigUInt64BE(windowsTimestamp);
        header.writeBuffer(signature); // Add signature at end of header

        return header.toBuffer();
    }
}
