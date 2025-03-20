import { live, xbl } from '@xboxreplay/xboxlive-auth';
import { AppConfig } from '@/app';

const scope = 'XboxLive.signin';

export async function getXboxIdentity(code: string, config: AppConfig) {
    const accessToken = (
        await live.exchangeCodeForAccessToken(
            code,
            config.xboxOAuthClientId,
            scope,
            config.webUrl + '/panel/settings/profile/xbox'
        )
    ).access_token;
    const userToken = (await xbl.exchangeRpsTicketForUserToken(accessToken, 'd')).Token;
    const displayClaims = (await xbl.exchangeTokenForXSTSToken(userToken)).DisplayClaims;
    return {
        xuid: displayClaims.xui[0].xid!,
        xboxGamerTag: displayClaims.xui[0].gtg!,
    };
}
