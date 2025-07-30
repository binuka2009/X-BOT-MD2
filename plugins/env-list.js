const fs = require('fs');
const path = require('path');
const config = require('../config');
const { cmd } = require('../command');

function updateEnvVariable(key, value) {
    const envPath = path.join(__dirname, "../.env");
    let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const regex = new RegExp(`^${key}=.*`, "m");

    if (regex.test(env)) {
        env = env.replace(regex, `${key}=${value}`);
    } else {
        env += `\n${key}=${value}`;
    }

    fs.writeFileSync(envPath, env);

    // ری‌لود کردن dotenv و config
    require('dotenv').config({ path: envPath });

    // پاک‌سازی کش config
    delete require.cache[require.resolve('../config')];
    Object.assign(config, require('../config'));  // ری‌لود
}

function isEnabled(value) {
    return value && value.toString().toLowerCase() === "true";
}

cmd({
    pattern: "env",
    alias: ["config", "settings"],
    desc: "Bot config control panel via reply menu (ENV based)",
    category: "system",
    react: "⚙️",
    filename: __filename
}, 
async (conn, mek, m, { from, reply, isCreator }) => {
    if (!isCreator) return reply("Command reserved for owner and my Creator alone");

    const menu = `
*1. Auto Features*
╰ 1.1 - AUTO_REPLY (${isEnabled(config.AUTO_REPLY) ? "✅" : "❌"})
╰ 1.2 - AUTO_REACT (${isEnabled(config.AUTO_REACT) ? "✅" : "❌"})
╰ 1.3 - AUTO_STICKER (${isEnabled(config.AUTO_STICKER) ? "✅" : "❌"})
╰ 1.4 - AUTO_VOICE (${isEnabled(config.AUTO_VOICE) ? "✅" : "❌"})

*2. Security*
╰ 2.1 - ANTI_LINK (${isEnabled(config.ANTI_LINK) ? "✅" : "❌"})
╰ 2.2 - ANTI_BAD (${isEnabled(config.ANTI_BAD) ? "✅" : "❌"})
╰ 2.3 - DELETE_LINKS (${isEnabled(config.DELETE_LINKS) ? "✅" : "❌"})

*3. Status System*
╰ 3.1 - AUTO_STATUS_SEEN (${isEnabled(config.AUTO_STATUS_SEEN) ? "✅" : "❌"})
╰ 3.2 - AUTO_STATUS_REPLY (${isEnabled(config.AUTO_STATUS_REPLY) ? "✅" : "❌"})
╰ 3.3 - AUTO_STATUS_REACT (${isEnabled(config.AUTO_STATUS_REACT) ? "✅" : "❌"})

*4. Core*
╰ 4.1 - ALWAYS_ONLINE (${isEnabled(config.ALWAYS_ONLINE) ? "✅" : "❌"})
╰ 4.2 - READ_MESSAGE (${isEnabled(config.READ_MESSAGE) ? "✅" : "❌"})
╰ 4.3 - READ_CMD (${isEnabled(config.READ_CMD) ? "✅" : "❌"})
╰ 4.4 - PUBLIC_MODE (${isEnabled(config.PUBLIC_MODE) ? "✅" : "❌"})

*5. Typing/Recording*
╰ 5.1 - AUTO_TYPING (${isEnabled(config.AUTO_TYPING) ? "✅" : "❌"})
╰ 5.2 - AUTO_RECORDING (${isEnabled(config.AUTO_RECORDING) ? "✅" : "❌"})

_Reply with: 1.1, 2.2, etc to toggle ON/OFF_
`;

    const sent = await conn.sendMessage(from, {
    caption: menu,
    image: { url: "https://files.catbox.moe/06cgye.jpg" }  // عکس تستی
}, { quoted: mek });

    const messageID = sent.key.id;

    const toggleSetting = (key) => {
        const current = isEnabled(config[key]);
        updateEnvVariable(key, current ? "false" : "true");
        return `✅ *${key}* is now set to: *${!current ? "ON" : "OFF"}*`;
    };

    const handler = async (msgData) => {
        const msg = msgData.messages[0];
        const quotedId = msg?.message?.extendedTextMessage?.contextInfo?.stanzaId;

        if (quotedId !== messageID) return;

        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

        const map = {
            "1.1": "AUTO_REPLY", "1.2": "AUTO_REACT", "1.3": "AUTO_STICKER", "1.4": "AUTO_VOICE",
            "2.1": "ANTI_LINK", "2.2": "ANTI_BAD", "2.3": "DELETE_LINKS",
            "3.1": "AUTO_STATUS_SEEN", "3.2": "AUTO_STATUS_REPLY", "3.3": "AUTO_STATUS_REACT",
            "4.1": "ALWAYS_ONLINE", "4.2": "READ_MESSAGE", "4.3": "READ_CMD", "4.4": "PUBLIC_MODE",
            "5.1": "AUTO_TYPING", "5.2": "AUTO_RECORDING"
        };

        const key = map[text];

        if (!key) return conn.sendMessage(from, { text: "Reply with an available number." }, { quoted: msg });

        const res = toggleSetting(key);
        await conn.sendMessage(from, { text: res }, { quoted: msg });
        conn.ev.off("messages.upsert", handler);
    };

    conn.ev.on("messages.upsert", handler);
    setTimeout(() => conn.ev.off("messages.upsert", handler), 60_000);
});
