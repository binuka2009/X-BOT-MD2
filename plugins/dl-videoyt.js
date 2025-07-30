const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

cmd({
    pattern: "videoyt",
    alias: ["ytv3", "vidyt"],
    react: "🎥",
    desc: "Download YouTube videos",
    category: "download",
    use: "<video name/URL> [quality: high/medium/low]",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a video name or YouTube URL\nExample: !video ohangla mix high");

        // Extract quality preference if provided
        const [query, qualityPref] = q.split(/\s+(high|medium|low)$/i);
        const searchQuery = query || q;
        const quality = qualityPref ? qualityPref.toLowerCase() : 'high';

        // Get YouTube URL
        let videoUrl = searchQuery;
        if (!searchQuery.match(/(youtube\.com|youtu\.be)/)) {
            const search = await yts(searchQuery);
            if (!search.videos.length) return reply("❌ No videos found");
            videoUrl = search.videos[0].url;
        }

        await reply(`⬇️ Downloading ${quality} quality video...`);

        // API request
        const apiUrl = `https://api.giftedtech.web.id/api/download/ytv?apikey=gifted_api_6hf50c4j&url=${encodeURIComponent(videoUrl)}`;
        const { data } = await axios.get(apiUrl, { timeout: 20000 });

        if (!data?.result?.download_url) {
            return reply("❌ Failed to get download link");
        }

        // Get file extension (default to mp4)
        const fileExt = data.result.download_url.split('.').pop().split(/[?#]/)[0] || 'mp4';
        
        // Send video file
        await conn.sendMessage(from, {
            video: { 
                url: data.result.download_url 
            },
            caption: `*${data.result.title}*\nQuality: ${data.result.quality} | Duration: ${data.result.duration}`,
            fileName: `${data.result.title.replace(/[^\w\s.-]/g, '')}.${fileExt}`,
            mimetype: `video/${fileExt === 'mp4' ? 'mp4' : 'x-matroska'}`,
            contextInfo: {
                externalAdReply: {
                    title: data.result.title,
                    body: `Quality: ${data.result.quality}`,
                    thumbnail: await axios.get(data.result.thumbnail, { 
                        responseType: 'arraybuffer' 
                    }).then(res => res.data).catch(() => null),
                    mediaType: 2,
                    mediaUrl: videoUrl
                }
            }
        }, { quoted: mek });

    } catch (error) {
        console.error("Video download error:", error);
        reply(`❌ Error: ${error.message}\nTry again or use a different video`);
    }
});
