const fs = require("fs");
const { cmd, commands } = require('../command');
const config = require('../config');
const axios = require('axios');
const prefix = config.PREFIX;
const AdmZip = require("adm-zip");
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, sleep, fetchJson } = require('../lib/functions2');
const { writeFileSync } = require('fs');
const path = require('path');
const { getAnti, setAnti } = require('../data/antidel');


cmd({
  pattern: "vv",
  react: '⚠️',
  desc: "Owner Only - retrieve quoted message back to user",
  category: "owner",
  filename: __filename
}, async (client, message, match, { from, isCreator }) => {
  try {
    if (!isCreator) {
      return await client.sendMessage(from, {
        text: "*📛 This is an owner command.*"
      }, { quoted: message });
    }

    if (!match.quoted) {
      return await client.sendMessage(from, {
        text: "*🍁 Please reply to a view once message!*"
      }, { quoted: message });
    }

    // بررسی اینکه واقعاً viewOnce هست
    if (!match.quoted.viewOnce) {
      return await client.sendMessage(from, {
        text: "This isn't a view once message *Dummy*!"
      }, { quoted: message });
    }

    const buffer = await match.quoted.download();
    const mtype = match.quoted.mtype;
    const options = { quoted: message };

    let messageContent = {};
    switch (mtype) {
      case "imageMessage":
        messageContent = {
          image: buffer,
          caption: match.quoted.text || '',
          mimetype: match.quoted.mimetype || "image/jpeg"
        };
        break;
      case "videoMessage":
        messageContent = {
          video: buffer,
          caption: match.quoted.text || '',
          mimetype: match.quoted.mimetype || "video/mp4"
        };
        break;
      case "audioMessage":
        messageContent = {
          audio: buffer,
          mimetype: "audio/mp4",
          ptt: match.quoted.ptt || false
        };
        break;
      default:
        return await client.sendMessage(from, {
          text: "❌ Only image, video, and audio messages are supported"
        }, { quoted: message });
    }

    await client.sendMessage(from, messageContent, options);
  } catch (error) {
    console.error("vv Error:", error);
    await client.sendMessage(from, {
      text: "❌ Error fetching vv message:\n" + error.message
    }, { quoted: message });
  }
});

cmd({
    pattern: "tovv",
    desc: "Convert media to a view once message.",
    category: "utility",
    filename: __filename
}, async (conn, mek, m, { quoted, reply }) => {
    try {
        // Ensure the command is used in reply to a media message.
        if (!m.quoted) return reply("Please reply to a media message!");

        // Extract the media from the quoted message.
        const qmessage = m.message.extendedTextMessage.contextInfo.quotedMessage;
        const mediaMessage = qmessage.imageMessage ||
                             qmessage.videoMessage ||
                             qmessage.audioMessage;
        if (!mediaMessage) {
            return reply("No media found in replied message!");
        }

        try {
            // Retrieve the media buffer and caption.
            const buff = await m.quoted.getbuff;
            const cap = mediaMessage.caption || '';

            // Send the media back with the "viewOnce" flag set to true.
            if (mediaMessage.mimetype.startsWith('image')) {
                await conn.sendMessage(m.chat, {
                    image: buff,
                    caption: cap,
                    viewOnce: true
                });
            } else if (mediaMessage.mimetype.startsWith('video')) {
                await conn.sendMessage(m.chat, {
                    video: buff,
                    caption: cap,
                    viewOnce: true
                });
            } else if (mediaMessage.mimetype.startsWith('audio')) {
                await conn.sendMessage(m.chat, {
                    audio: buff,
                    ptt: mediaMessage.ptt || false,
                    viewOnce: true
                });
            } else {
                return reply("Unsupported media type.");
            }
        } catch (error) {
            console.error(error);
            reply(`${error}`);
        }
    } catch (e) {
        console.error(e);
        reply(`${e}`);
    }
});
