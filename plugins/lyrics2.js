const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "sing",
    alias: ["lyric2", "lyrics2"],
    react: "🎤",
    desc: "Search for song lyrics",
    category: "search",
    use: "<song title>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a song title (e.g., !lyrics Runaway by Aurora)");

        await reply("🔍 Searching for lyrics...");

        const apiUrl = `https://api.giftedtech.web.id/api/search/lyrics?apikey=gifted_api_6hf50c4j&query=${encodeURIComponent(q)}`;
        
        const { data } = await axios.get(apiUrl, {
            timeout: 8000 // 8 second timeout
        });

        if (!data?.success || !data.result?.lyrics) {
            return reply("❌ No lyrics found for this song");
        }

        // Format the response
        const lyricsText = 
            `🎵 *${data.result.title}* 🎵\n` +
            `👩‍🎤 Artist: ${data.result.artist}\n\n` +
            `${data.result.lyrics}\n\n` +
            `> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅᴀᴠɪᴅx`;

        // Split long lyrics into multiple messages if needed
        if (lyricsText.length > 1000) {
            const parts = [];
            for (let i = 0; i < lyricsText.length; i += 1000) {
                parts.push(lyricsText.substring(i, i + 1000));
            }
            for (const part of parts) {
                await conn.sendMessage(from, { text: part }, { quoted: mek });
            }
        } else {
            await conn.sendMessage(from, { 
                text: lyricsText,
                contextInfo: {
                    externalAdReply: {
                        title: data.result.title,
                        body: `Lyrics by ${data.result.artist.split('‣')[0].trim()}`,
                        thumbnail: await axios.get('https://files.catbox.moe/yv8zy4.jpg', {
                            responseType: 'arraybuffer'
                        }).then(res => res.data).catch(() => null),
                        mediaType: 2
                    }
                }
            }, { quoted: mek });
        }

    } catch (error) {
        console.error("Lyrics search error:", error);
        reply(`❌ Error searching lyrics: ${error.message}`);
    }
});
