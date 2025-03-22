import * as fs from 'node:fs';
import {
    Bot,
    deserializeDeviceInfo,
    deserializeKeystore,
    DeviceInfo,
    fetchAppInfoFromSignUrl,
    Keystore,
    newDeviceInfo,
    newKeystore,
    serializeDeviceInfo,
    serializeKeystore,
    UrlSignProvider,
} from 'tanebi';
import { getLogger } from 'log4js';

const botLogger = getLogger('bot');

function installLogger(bot: Bot) {
    bot.onDebug((module, message) => botLogger.debug(`[${module}] ${message}`));
    bot.onInfo((module, message) => botLogger.info(`[${module}] ${message}`));
    bot.onWarning((module, message, e) => botLogger.warn(`[${module}] ${message}`, e));
}

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
        botLogger.info('Credentials not found, performing QR code login...');
        keystore = newKeystore();
        bot = await Bot.create(appInfo, {}, deviceInfo, keystore, signProvider);
        bot.onKeystoreChange((keystore) => {
            fs.writeFileSync('data/bot/keystore.json', JSON.stringify(serializeKeystore(keystore)));
        });
        installLogger(bot);
        await bot.qrCodeLogin((url, png) => {
            fs.writeFileSync('data/bot/qrcode.png', png);
            botLogger.info('QR code image saved to data/bot/qrcode.png.');
            botLogger.info('Or you can generate a QR code with the following URL:');
            botLogger.info(url);
        });
    } else {
        keystore = deserializeKeystore(JSON.parse(fs.readFileSync('data/bot/keystore.json', 'utf-8')));
        bot = await Bot.create(appInfo, {}, deviceInfo, keystore, signProvider);
        bot.onKeystoreChange((keystore) => {
            fs.writeFileSync('data/bot/keystore.json', JSON.stringify(serializeKeystore(keystore)));
        });
        installLogger(bot);
        await bot.fastLogin();
    }
    return bot;
}
