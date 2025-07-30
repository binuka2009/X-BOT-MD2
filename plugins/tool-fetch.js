const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

cmd({
    pattern: "fetch",
    alias: ["api"],
    desc: "Fetch data from any URL (JSON, files, etc)",
    category: "tools",
    react: "🌐",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const q = args.join(" ").trim();
        if (!q) return reply('❌ Please provide a URL.');
        if (!/^https?:\/\//.test(q)) return reply('❌ URL must start with http:// or https://');

        const res = await axios.get(q, { responseType: 'arraybuffer' });
        const contentType = res.headers['content-type'];
        const buffer = Buffer.from(res.data);
        
        const options = { quoted: mek };
        const fileName = `fetched.${contentType.split('/')[1] || 'bin'}`;

        // Handle JSON response
        if (contentType.includes('application/json')) {
            const json = JSON.parse(buffer.toString());
            return conn.sendMessage(from, {
                text: `📦 *Fetched JSON*:\n\`\`\`${JSON.stringify(json, null, 2).slice(0, 2048)}\`\`\``
            }, options);
        }

        // Handle file responses (images, videos, etc.)
        let messageContent = {};
        if (contentType.includes('image')) {
            messageContent.image = buffer;
        } else if (contentType.includes('video')) {
            messageContent.video = buffer;
        } else if (contentType.includes('audio')) {
            messageContent.audio = buffer;
        } else {
            // For unknown or generic files
            const filePath = path.join(__dirname, '..', 'temp', fileName);
            await fs.outputFile(filePath, buffer);
            messageContent.document = fs.readFileSync(filePath);
            messageContent.mimetype = contentType;
            messageContent.fileName = fileName;
        }

        await conn.sendMessage(from, messageContent, options);

    } catch (e) {
        console.error("Fetch Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
