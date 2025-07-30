const config = require('../config');
const { cmd, commands } = require('../command');
const { formatBytes, getLocalBuffer, runtime } = require('../lib/functions2');
const { platform, totalmem, freemem } = require('os');
const { join } = require('path');

cmd({
    pattern: "menu2",
    desc: "Show all commands",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, pushname, reply }) => {
    try {
        let botName = config.BOT_NAME ? config.BOT_NAME.split(';')[1] || 'X-BOT-MD' : 'X-BOT-MD';

        let menuText = `┌───〔 ${botName} 〕───┐
│ User: ${pushname}
│ Mode: ${config.MODE}
│ Uptime: ${runtime(process.uptime())}
│ Platform: ${platform()}
│ Plugins: ${commands.length}
│ Memory: ${formatBytes(totalmem() - freemem())}
└──────────────────┘\n`;

        const categorized = {};

        commands.forEach(cmd => {
            if (!cmd.pattern || cmd.dontAddCommandList) return;
            const commandName = cmd.pattern.toString().replace(/[^a-zA-Z0-9]/g, "");
            const category = cmd.category?.toLowerCase() || 'misc';

            if (!categorized[category]) categorized[category] = [];
            categorized[category].push(commandName);
        });

        Object.keys(categorized).forEach(category => {
            menuText += `\n┌──〔 ${category.toUpperCase()} 〕──┐\n`;
            categorized[category].forEach(cmd => {
                menuText += `│ ◦ ${cmd}\n`;
            });
            menuText += `└──────────────┘\n`;
        });

        await conn.sendMessage(
            from,
            {
                image: { url: `https://i.postimg.cc/rFV2pJW5/IMG-20250603-WA0017.jpg` },
                caption: menuText},
                
            { quoted: mek }
        );
    } catch (error) {
        console.error(error);
        reply('❌ An error occurred while generating the menu.');
    }
});
