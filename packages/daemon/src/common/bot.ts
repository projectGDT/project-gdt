import * as fs from 'node:fs';
import {
    Bot, ctx,
    deserializeDeviceInfo, deserializeKeystore,
    DeviceInfo, fetchAppInfoFromSignUrl,
    Keystore,
    newDeviceInfo,
    newKeystore,
    serializeDeviceInfo, serializeKeystore, UrlSignProvider,
} from 'tanebi';

export async function createOnlineBot(signApiUrl: string) {
    let bot: Bot;

    if (!fs.existsSync('data/bot')) {
        fs.mkdirSync('data/bot');
    }

    const appInfo = await fetchAppInfoFromSignUrl(signApiUrl);
    const signProvider = UrlSignProvider(signApiUrl);

    let deviceInfo: DeviceInfo;
    if (!fs.existsSync('data/bot/deviceInfo.json')) {
        deviceInfo = newDeviceInfo();
        fs.writeFileSync('data/bot/deviceInfo.json', JSON.stringify(serializeDeviceInfo(deviceInfo)));
    } else {
        deviceInfo = deserializeDeviceInfo(JSON.parse(fs.readFileSync('data/bot/deviceInfo.json', 'utf-8')));
    }

    let keystore: Keystore;
    if (!fs.existsSync('data/bot/keystore.json')) {
        console.log('Credentials not found, performing QR code login...');
        keystore = newKeystore();
        bot = await Bot.create(appInfo, {}, deviceInfo, keystore, signProvider);
        await bot.qrCodeLogin((url, png) => {
            fs.writeFileSync('data/bot/qrcode.png', png);
            console.log('QR code image saved to data/bot/qrcode.png.');
            console.log('Or you can generate a QR code with the following URL:');
            console.log(url);
        });
        fs.writeFileSync('data/bot/keystore.json', JSON.stringify(serializeKeystore(bot[ctx].keystore)));
    } else {
        keystore = deserializeKeystore(JSON.parse(fs.readFileSync('data/bot/keystore.json', 'utf-8')));
        bot = await Bot.create(appInfo, {}, deviceInfo, keystore, signProvider);
        await bot.fastLogin();
    }
    return bot;
}