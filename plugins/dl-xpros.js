const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const Config = require('../config');

cmd(
    {
        pattern: 'playx',
        alias: ['ytmp3', 'ytaudio','yta'],
        desc: 'Download YouTube songs',
        category: 'media',
        use: '<song name or YouTube URL>',
        filename: __filename,
    },
    async (conn, mek, m, { quoted, args, q, reply, from }) => {
        try {
            if (!q) return reply(`*Please provide a song name or YouTube URL*\nExample: ${config.PREFIX}playx Alan Walker Lily\nOr: ${config.PREFIX}playx https://youtu.be/ox4tmEV6-QU`);

            // Send processing reaction
            await conn.sendMessage(mek.chat, { react: { text: "⏳", key: mek.key } });

            let videoUrl = q;
            
            // If it's not a URL, search YouTube
            if (!q.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/)) {
                const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
                const searchResponse = await axios.get(searchUrl);
                
                // Extract first video ID from search results (simplified approach)
                const videoIdMatch = searchResponse.data.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
                if (!videoIdMatch) return reply('*No results found for your search*');
                
                videoUrl = `https://youtube.com/watch?v=${videoIdMatch[1]}`;
            }

            // Call Dracula API
            const apiUrl = `https://draculazyx-xyzdrac.hf.space/api/Ytmp3?url=${encodeURIComponent(videoUrl)}`;
            const response = await axios.get(apiUrl);
            
            if (response.data.STATUS !== 200 || !response.data.song?.download_link) {
                return reply('*Failed to download the song*');
            }

            const songData = response.data.song;
            const downloadUrl = songData.download_link;

            // Download the audio file
            const audioResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
            const audioBuffer = Buffer.from(audioResponse.data, 'binary');

            // Send the audio file
            await conn.sendMessage(mek.chat, { 
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${songData.title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: songData.title,
                        body: 'ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅᴀᴠɪᴅx',
                        thumbnail: await getThumbnailBuffer(videoUrl),
                        mediaType: 2,
                        mediaUrl: videoUrl,
                        sourceUrl: videoUrl
                    }
                }
            }, { quoted: mek });

            // Send success reaction
            await conn.sendMessage(mek.chat, { react: { text: "✅", key: mek.key } });

        } catch (error) {
            console.error('Error in ytsong command:', error);
            await conn.sendMessage(mek.chat, { react: { text: "❌", key: mek.key } });
            reply('*Error downloading song. Please try again later.*');
        }
    }
);

// Helper function to get YouTube thumbnail
async function getThumbnailBuffer(videoUrl) {
    try {
        const videoId = videoUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)[1];
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        const response = await axios.get(thumbnailUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch {
        return null; // Return null if thumbnail can't be fetched
    }
}

// VIDEO



cmd(
    {
        pattern: 'videox',
        alias: ['ytmp4x', 'ytvidx'],
        desc: 'Download YouTube videos',
        category: 'media',
        use: '<video name or YouTube URL>',
        filename: __filename,
    },
    async (conn, mek, m, { quoted, args, q, reply, from }) => {
        try {
            if (!q) return reply(`*Please provide a video name or YouTube URL*\nExample: ${config.PREFIX}videox Alan Walker Lily\nOr: ${config.PREFIX}videox https://youtu.be/ox4tmEV6-QU`);

            // Send processing reaction
            await conn.sendMessage(mek.chat, { react: { text: "⏳", key: mek.key } });

            let videoUrl = q;
            
            // If it's not a URL, search YouTube
            if (!q.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/)) {
                const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
                const searchResponse = await axios.get(searchUrl);
                
                // Extract first video ID from search results
                const videoIdMatch = searchResponse.data.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
                if (!videoIdMatch) return reply('*No results found for your search*');
                
                videoUrl = `https://youtube.com/watch?v=${videoIdMatch[1]}`;
            }

            // Call Dracula API for video
            const apiUrl = `https://draculazyx-xyzdrac.hf.space/api/Ytmp4?url=${encodeURIComponent(videoUrl)}`;
            const response = await axios.get(apiUrl);
            
            if (response.data.STATUS !== 200 || !response.data.video?.download_link) {
                return reply('*Failed to download the video*');
            }

            const videoData = response.data.video;
            const downloadUrl = videoData.download_link;

            // Download the video file
            const videoResponse = await axios.get(downloadUrl, { 
                responseType: 'arraybuffer',
                headers: {
                    'Referer': 'https://draculazyx-xyzdrac.hf.space',
                    'Origin': 'https://draculazyx-xyzdrac.hf.space'
                }
            });
            const videoBuffer = Buffer.from(videoResponse.data, 'binary');

            // Get thumbnail
            const thumbnailBuffer = await getThumbnailBuffer(videoUrl);

            // Send the video file
            await conn.sendMessage(mek.chat, { 
                video: videoBuffer,
                caption: `🎬 *${videoData.title}*\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅᴀᴠɪᴅx`,
                thumbnail: thumbnailBuffer,
                fileName: `${videoData.title}.mp4`,
                mimetype: 'video/mp4',
                contextInfo: {
                    externalAdReply: {
                        title: videoData.title,
                        body: 'Video by XBOT MD',
                        thumbnail: thumbnailBuffer,
                        mediaType: 2,
                        mediaUrl: videoUrl,
                        sourceUrl: videoUrl
                    }
                }
            }, { quoted: mek });

            // Send success reaction
            await conn.sendMessage(mek.chat, { react: { text: "✅", key: mek.key } });

        } catch (error) {
            console.error('Error in ytvideo command:', error);
            await conn.sendMessage(mek.chat, { react: { text: "❌", key: mek.key } });
            reply('*Error downloading video. Please try again later.*');
        }
    }
);

// Helper function to get YouTube thumbnail
async function getThumbnailBuffer(videoUrl) {
    try {
        const videoId = videoUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)[1];
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        const response = await axios.get(thumbnailUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch {
        // Fallback to default thumbnail if maxres isn't available
        try {
            const videoId = videoUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)[1];
            const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            const response = await axios.get(thumbnailUrl, { responseType: 'arraybuffer' });
            return Buffer.from(response.data, 'binary');
        } catch {
            return null;
        }
    }
}

cmd(
    {
        pattern: 'ytdocx',
        alias: ['ytmp3x', 'mp3x'],
        desc: 'Download YouTube songs as document',
        category: 'media',
        react: '📂',
        use: '<song name or YouTube URL>',
        filename: __filename,
    },
    async (conn, mek, m, { quoted, args, q, reply, from }) => {
        try {
            if (!q) return reply(`*Please provide a song name or YouTube URL*\nExample: ${config.PREFIX}ytdocx Alan Walker Lily\nOr: ${config.PREFIX}utdocx https://youtu.be/ox4tmEV6-QU`);

            // Send processing reaction
            await conn.sendMessage(mek.chat, { react: { text: "⏳", key: mek.key } });

            let videoUrl = q;
            
            // If it's not a URL, search YouTube
            if (!q.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/)) {
                const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
                const searchResponse = await axios.get(searchUrl);
                
                // Extract first video ID from search results
                const videoIdMatch = searchResponse.data.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
                if (!videoIdMatch) return reply('*No results found for your search*');
                
                videoUrl = `https://youtube.com/watch?v=${videoIdMatch[1]}`;
            }

            // Call API for audio
            const apiUrl = `https://draculazyx-xyzdrac.hf.space/api/Ytmp3?url=${encodeURIComponent(videoUrl)}`;
            const response = await axios.get(apiUrl);
            
            if (response.data.STATUS !== 200 || !response.data.song?.download_link) {
                return reply('*Failed to download the song*');
            }

            const songData = response.data.song;
            const downloadUrl = songData.download_link;

            // Download the audio file
            const audioResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
            const audioBuffer = Buffer.from(audioResponse.data, 'binary');

            // Get thumbnail
            const thumbnailBuffer = await ytUtils.getThumbnailBuffer(videoUrl);

            // Send as document
            await conn.sendMessage(mek.chat, { 
                document: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${songData.title}.mp3`,
                caption: `🎵 *${songData.title}*\n\n⬇️ Downloaded as document\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅᴀᴠɪᴅx`,
                thumbnail: thumbnailBuffer,
                contextInfo: {
                    externalAdReply: {
                        title: songData.title,
                        body: 'Downloaded by XBOT MD',
                        thumbnail: thumbnailBuffer,
                        mediaType: 2,
                        mediaUrl: videoUrl,
                        sourceUrl: videoUrl
                    }
                }
            }, { quoted: mek });

            // Send success reaction
            await conn.sendMessage(mek.chat, { react: { text: "✅", key: mek.key } });

        } catch (error) {
            console.error('Error in docplay command:', error);
            await conn.sendMessage(mek.chat, { react: { text: "❌", key: mek.key } });
            reply('*Error downloading song. Please try again later.*');
        }
    }
);
