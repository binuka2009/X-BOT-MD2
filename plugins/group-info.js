const config = require('../config')
const { cmd } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep } = require('../lib/functions')

   
cmd({
    pattern: "ginfo",
    react: "🥏",
    alias: ["groupinfo"],
    desc: "Get group information.",
    category: "group",
    use: '.ginfo',
    filename: __filename
},
async (conn, mek, m, {
    from, quoted, isCmd, isGroup, sender, isBotAdmins,
    isAdmins, isDev, reply, groupMetadata, participants
}) => {
    try {
        // Requirements
        if (!isGroup) return reply(`This command only works in group chats.`);
        if (!isAdmins && !isDev) return reply(`Only *Group Admins*  can use this.`);
        if (!isBotAdmins) return reply(`I need *admin* rights to fetch group details.`);

        const fallbackPpUrls = [
            'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
            'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
        ];
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(from, 'image');
        } catch {
            ppUrl = fallbackPpUrls[Math.floor(Math.random() * fallbackPpUrls.length)];
        }

        const metadata = await conn.groupMetadata(from);
        const groupAdmins = participants.filter(p => p.admin);
        const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n');
        const owner = metadata.owner || groupAdmins[0]?.id || "unknown";

        const gdata = `*「 Group Information 」*\n
*Group Name* : ${metadata.subject}
*Group ID* : ${metadata.id}
*Participants* : ${metadata.size}
*Group Creator* : @${owner.split('@')[0]}
*Description* : ${metadata.desc?.toString() || 'No description'}\n
*Admins (${groupAdmins.length})*:\n${listAdmin}`

        await conn.sendMessage(from, {
            image: { url: ppUrl },
            caption: gdata,
            mentions: groupAdmins.map(v => v.id).concat([owner])
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ An error occurred:\n\n${e}`);
    }
});

cmd({
  pattern: "getgcpp",
  category: "group",
  desc: "Send the profile picture of the group",
  filename: __filename
}, async (conn, m, msg, { isGroup, reply }) => {
  try {
    if (!isGroup) return reply("❌ this command only working in group.");

    const groupJid = m.chat;

    let ppUrl;
    try {
      // Try to fetch high resolution photo first
      ppUrl = await conn.profilePictureUrl(groupJid, "image");
    } catch (e) {
      // Fallback to low res if high res fails
      try {
        ppUrl = await conn.profilePictureUrl(groupJid);
      } catch (err) {
        return reply("❌ can't find group picture or not set.");
      }
    }

    await conn.sendMessage(m.chat, { image: { url: ppUrl }, caption: "🖼️ Profile picture of group" }, { quoted: m });

  } catch (err) {
    console.error("getgcpp Error:", err);
    reply(`❌ error :\n${err.message}`);
  }
});

cmd({
  pattern: "getallgc",
  category: "group",
  desc: "Get all group invite links with their names and participant count",
  filename: __filename
}, async (conn, mek, m, { reply }) => {
  try {
    let allGroups = await conn.groupFetchAllParticipating();
    let groupIds = Object.keys(allGroups);

    if (groupIds.length === 0) {
      return reply("❌ No groups found.");
    }

    let resultText = `📋 *List of Groups and Invite Links*\n\n`;

    for (let groupId of groupIds) {
      try {
        let metadata = allGroups[groupId];
        let name = metadata.subject || "Unnamed";
        let participantsCount = metadata.participants.length;

        // Try to get group invite code
        let inviteCode = await conn.groupInviteCode(groupId);
        let inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

        resultText += `📌 *${name}*\n👥 Members: ${participantsCount}\n🔗 Link: ${inviteLink}\n\n`;
      } catch (err) {
        console.log(`⚠️ Failed to fetch invite for group ${groupId}:`, err);
        resultText += `📌 *${allGroups[groupId].subject || "Unnamed"}*\n❌ Failed to fetch link\n\n`;
      }
    }

    reply(resultText);
  } catch (err) {
    console.error("getallgc Error:", err);
    reply(`❌ Error occurred:\n${err.message}`);
  }
});     
