import { live, xbl } from '@xboxreplay/xboxlive-auth';

const clientId = '9e474b67-edcd-4d23-b2fc-6dc8db5e08f7'; // projectGDT
const scope = 'XboxLive.signin';
const redirectUri = 'http://localhost:3000/post-login/settings/profile/xbox';

export async function getXboxIdentity(code: string) {
    const accessToken = (await live.exchangeCodeForAccessToken(code, clientId, scope, redirectUri)).access_token;
    const userToken = (await xbl.exchangeRpsTicketForUserToken(accessToken)).Token;
    const displayClaims = (await xbl.exchangeTokenForXSTSToken(userToken)).DisplayClaims;
    return {
        xuid: displayClaims.xui[0].xid!,
        xboxGamerTag: displayClaims.xui[0].gtg!
    };
}