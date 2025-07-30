const fetch = require("node-fetch");
const { cmd } = require("../command");

cmd({
  pattern: "hentaivid",
  alias: ["🍆", "htvid"],
  desc: "Srap for hentai videos using a api.",
  react: '✅',
  category: 'hentai',
  filename: __filename
}, async (conn, m, store, {
  from,
  args,
  reply
}) => {

  try {
    reply(`Sraping for hentai vid*`);
    
    const response = await fetch(`https://manul-official-api.vercel.app/scrape-hentai?apikey=Manul-Official`);
    const data = await response.json();

    if (!data || !data.data || data.data.length === 0) {
      await store.react('❌');
      return reply(" Scrap error, no hantai for now 🥲");
    }

    // Get up to 7 random results
    const results = data.data.slice(0, 2).sort(() => Math.random() - 0.5);

    for (const video of results) {
      const message = `🍆 *As requested*:\n\n`
        + `*• Title*: ${video.title}`
        ;

      if (video.video_1) {
        await conn.sendMessage(from, {
          video: { url: video.video_1 },
          caption: message
        }, { quoted: m });
      } else {
        reply(`❌ Failed to retrieve video for *"${video.title}"*.`);
      }
    }

    await store.react('✅');
  } catch (error) {
    console.error("Error in Hentaivid command:", error);
    await store.react('❌');
    reply("❌ An error occurred while Scraping hentai. Please try again later.");
  }
});
