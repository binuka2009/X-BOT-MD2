const axios = require('axios');
const { cmd } = require('../command');

// NASA APOD Command
cmd({
  pattern: 'nasa',
  alias: ['apod'],
  react: '🛰️',
  desc: 'Fetch NASA\'s Astronomy Picture of the Day',
  category: 'tools',
  filename: __filename
}, async (conn, mek, msg, { from, reply }) => {
  try {
    const { data } = await axios.get('https://api.nexoracle.com/details/nasa?apikey=e276311658d835109c');
    
    if (!data.result || data.status !== 200) {
      return reply('❌ Failed to fetch NASA data');
    }

    const { date, explanation, title, url } = data.result;
    const imageRes = await axios.get(url, { responseType: 'arraybuffer' });
    
    await conn.sendMessage(from, {
      image: Buffer.from(imageRes.data),
      caption: `*🚀 NASA Astronomy Picture of the Day*\n\n` +
               `*📛 Title:* ${title}\n` +
               `*📅 Date:* ${date}\n\n` +
               `*📝 Explanation:*\n${explanation}\n\n` +
               `_ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅᴀᴠɪᴅx_`
    }, { quoted: mek });

  } catch (error) {
    console.error('NASA Error:', error);
    reply('❌ Failed to process NASA request');
  }
});

// IP Lookup Command
cmd({
  pattern: 'ip',
  alias: ['iplookup'],
  react: '🌐',
  desc: 'Lookup IP address information',
  category: 'stalk',
  use: '.ip <ip-address>',
  filename: __filename
}, async (conn, mek, msg, { from, reply, args }) => {
  try {
    if (!args[0]) return reply('❌ Provide IP address');
    
    const { data } = await axios.get(`https://api.nexoracle.com/stalking/ip?apikey=e276311658d835109c&q=${args[0]}`);
    
    if (!data.result || data.status !== 200) {
      return reply('❌ Invalid IP or API error');
    }

    const { ip, country, city, isp, org, lat, lon, timezone, mobile, proxy } = data.result;
    
    await reply(
      `*🌐 IP Address Information*\n\n` +
      `*🔢 IP:* ${ip}\n` +
      `*📍 Location:* ${city}, ${country}\n` +
      `*📡 ISP:* ${isp}\n` +
      `*🏢 Organization:* ${org}\n` +
      `*🌍 Coordinates:* ${lat}, ${lon}\n` +
      `*⏰ Timezone:* ${timezone}\n` +
      `*📱 Mobile:* ${mobile ? 'Yes' : 'No'}\n` +
      `*🛡️ Proxy:* ${proxy ? 'Yes' : 'No'}\n\n` +
      `_ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅᴀᴠɪᴅx_`
    );

  } catch (error) {
    console.error('IP Error:', error);
    reply('❌ Failed to lookup IP address');
  }
});
