const {
  default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser,
    isJidBroadcast,
    getContentType,
    proto,
    generateWAMessageContent,
    generateWAMessage,
    AnyMessageContent,
    prepareWAMessageMedia,
    areJidsSameUser,
    downloadContentFromMessage,
    MessageRetryMap,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    generateMessageID, makeInMemoryStore,
    jidDecode,
    fetchLatestBaileysVersion,
    Browsers
  } = require('baileys')
  
  
  const l = console.log
const path = require('path');
const projectRoot = __dirname;

const simplifyPath = (input) => {
  return input.replace(projectRoot, '.').replace(/\\/g, '/');
};

const cleanStackTrace = (stack) => {
  return stack
    .split('\n')
    .filter(line =>
      !line.includes('node_modules') &&
      !line.includes('node:events') &&
      !line.includes('events.js')
    )
    .map(line => simplifyPath(line.trim()))
    .join('\n');
};

const originalError = console.error;
console.error = (...args) => {
  for (let i = 0; i < args.length; i++) {
    if (args[i] instanceof Error) {
      const err = args[i];
      const filenameMatch = err.stack.match(/\((.*?):\d+:\d+\)/) || err.stack.match(/at (.*?):\d+:\d+/);
      const filename = filenameMatch ? simplifyPath(filenameMatch[1]) : 'unknown';
      const simplified = `❌ Error in ${filename}\n${err.message}\n${cleanStackTrace(err.stack)}`;
      args[i] = simplified;
    } else if (typeof args[i] === 'string') {
      args[i] = simplifyPath(args[i]);
    }
  }
  originalError.apply(console, args);
};

  const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions')
  const { AntiDelDB, initializeAntiDeleteSettings, setAnti, getAnti, getAllAntiDeleteSettings, saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata, saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage } = require('./data')
  const axios = require('axios')
  const config = require('./config')
  const fs = require('fs')
  const ff = require('fluent-ffmpeg')
  const P = require('pino')
  const GroupEvents = require('./lib/groupevents');
const { setupLinkDetection } = require("./lib/events/antilinkDetection")
  const qrcode = require('qrcode-terminal')
  const StickersTypes = require('wa-sticker-formatter')
  const util = require('util')
  const { sms, downloadMediaMessage, AntiDelete } = require('./lib')
  const { registerAntiNewsletter } = require('./plugins/antinewsletter')
  const { updateActivity } = require('./lib/activity')
  const { registerGroupMessages } = require('./plugins/groupMessages')
  const FileType = require('file-type');
  const { File } = require('megajs')
  const { fromBuffer } = require('file-type')
  const bodyparser = require('body-parser')
  const os = require('os')
  const Crypto = require('crypto')
  const { VM } = require('vm2')
  const prefix = config.PREFIX
  const ownerNumber = ['2349133354644']

  //=============================================
  const tempDir = path.join(os.tmpdir(), 'cache-temp')
  if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir)
  }
  
  const clearTempDir = () => {
      fs.readdir(tempDir, (err, files) => {
          if (err) throw err;
          for (const file of files) {
              fs.unlink(path.join(tempDir, file), err => {
                  if (err) throw err;
              });
          }
      });
  }
//=============================================
  // Clear the temp directory every 5 minutes
  setInterval(clearTempDir, 5 * 60 * 1000);

//=============================================

const express = require("express");
const app = express();
const port = process.env.PORT || 7860;
  
  //===================SESSION-AUTH============================
const sessionDir = fs.existsSync('/tmp') ? path.join('/tmp', 'sessions') : path.join(__dirname, 'sessions');
const credsPath = '/tmp/sessions/creds.json';

if (!fs.existsSync(sessionDir)) {
    try {
        fs.mkdirSync(sessionDir, { recursive: true });
        console.log('[✓] Session directory created at:', sessionDir);
    } catch (err) {
        console.error('❌ Failed to create session directory:', err.message);
        process.exit(1);
    }
}

async function loadSession() {
    try {
        if (!config.SESSION_ID) {
            console.log('No SESSION_ID provided please put one!');
            return null;
        }

        console.log('Downloading session data...');
        const id = config.SESSION_ID;

        // 🔹 DAVE-S*F=... (Supabase)
        if (id.startsWith('suho~')) {
            console.log('Downloading Supabase session...');
            const sessId = id.replace('suho~', '');
            const response = await axios.get(`https://dave-sess.onrender.com/download/${sessId}`);

            if (!response.data) {
                throw new Error('No credential data received from Supabase');
            }

            fs.writeFileSync(credsPath, JSON.stringify(response.data), 'utf8');
            console.log('Supabase session downloaded successfully');
            return response.data;
        }

        // 🔹 XBOT-MD**... (Xcall)
        if (id.startsWith('suho~')) {
            console.log('Downloading Xcall session...');
            const sessId2 = id.replace('suho~', '');
            const response = await axios.get(`https://dave-auth-manager.onrender.com/files/${sessId2}.json`);

            if (!response.data) {
                throw new Error('No credential data received from Xcall database');
            }

            fs.writeFileSync(credsPath, JSON.stringify(response.data), 'utf8');
            console.log('Xcall session downloaded successfully');
            return response.data;
        }

        // 🔹 Otherwise: MEGA.nz
        console.log('Downloading MEGA session...');
        const megaFileId = id.startsWith('suho~') ? id.replace('suho~', '') : id;
        const filer = File.fromURL(`https://mega.nz/file/${megaFileId}`);

        const data = await new Promise((resolve, reject) => {
            filer.download((err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        fs.writeFileSync(credsPath, data);
        console.log('MEGA session downloaded successfully');
        return JSON.parse(data.toString());

    } catch (error) {
        console.error('❌ Error loading session:', error.message);
        console.log('Will generate QR code instead');
        return null;
    }
}

//=========SESSION-AUTH====================
async function connectToWA() {
  console.log('📩 Connecting to WhatsApp...');

  // Load creds from session source (Supabase, Xcall, MEGA)
  const creds = await loadSession();

  // Baileys handles merging downloaded creds into auth state
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir, {
    creds: undefined
  });

  const { version } = await fetchLatestBaileysVersion();

  const conn = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: !creds, // show QR if no session
    browser: Browsers.macOS('Firefox'),
    syncFullHistory: true,
    auth: state, // now using only proper full state
    version,
    getMessage: async () => ({})
  });

  let startupSent = false;

  conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log('⚠️ Connection lost, reconnecting...');
        setTimeout(connectToWA, 5000);
      } else {
        console.log('🔒 Logged out — please change session ID');
      }
    }

    if (connection === 'open' && !startupSent) {
      startupSent = true;
      console.log('✅ Connected to WhatsApp successfully');

      // ✅ Load plugins
      const pluginPath = path.join(__dirname, 'plugins');
      fs.readdirSync(pluginPath).forEach((file) => {
        if (file.endsWith('.js')) {
          require(path.join(pluginPath, file));
        }
      });
      console.log('✅ Plugins loaded');

      // ✅ Send startup message
      try {
        const upMessage = `*🤖 X-BOT-MD is Online!*\n\n✨ Powerful multipurpose bot\n🔧 *Mode:* ${config.MODE}\n📍 *Prefix:* ${prefix}\n🔋 Powered by *DavidX*`;
        await conn.sendMessage(conn.user.id, {
          image: { url: 'https://i.postimg.cc/rFV2pJW5/IMG-20250603-WA0017.jpg' },
          caption: upMessage
        });
      } catch (err) {
        console.error('❌ Failed to send startup message:', err);
      }
    }

    if (qr) {
      console.log('📷 Scan the QR code to connect:');
      qrcode.generate(qr, { small: true });
    }
  });

  conn.ev.on('creds.update', saveCreds);
    
// =====================================
	 
  conn.ev.on('messages.update', async updates => {
    for (const update of updates) {
      if (update.update.message === null) {
        console.log("Delete Detected:", JSON.stringify(update, null, 2));
        await AntiDelete(conn, updates);
      }
    }
  });
//==============
registerGroupMessages(conn);

setupLinkDetection(conn);

registerAntiNewsletter(conn);
	
 /// READ STATUS       
  conn.ev.on('messages.upsert', async(mek) => {
    mek = mek.messages[0]
    if (!mek.message) return
    mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
    ? mek.message.ephemeralMessage.message 
    : mek.message;
  if (config.READ_MESSAGE === 'true') {
    await conn.readMessages([mek.key]);  // Mark message as read
    console.log(`Marked message from ${mek.key.remoteJid} as read.`);
  }
    if(mek.message.viewOnceMessageV2)
    mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
    if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN === "true"){
      await conn.readMessages([mek.key])
    }

	  const newsletterJids = [
    "120363420616675201@newsletter"
  ];
  const emojis = ["❤️", "🔥", "😯"];

  if (mek.key && newsletterJids.includes(mek.key.remoteJid)) {
    try {
      const serverId = mek.newsletterServerId;
      if (serverId) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        await conn.newsletterReactMessage(mek.key.remoteJid, serverId.toString(), emoji);
      }
    } catch (e) {
    
    }
  }
  if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REACT === "true"){
    const dlike = await conn.decodeJid(conn.user.id);
    const emojis = ['❤️', '🌹', '😇', '🤡', '🍆', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🙆', '👄', '🥰', '💐', '😎', '🤎', '✅', '🫀', '🧡', '😁', '😄', '🌸', '🍑', '🌷', '⛅', '🌟', '✨', '🇳🇬', '💜', '💙', '🌝', '🖤', '💚'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    await conn.sendMessage(mek.key.remoteJid, {
      react: {
        text: randomEmoji,
        key: mek.key,
      } 
    }, { statusJidList: [mek.key.participant, dlike] });
  }                       
  if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REPLY === "true"){
  const user = mek.key.participant
  const textt = `${config.AUTO_STATUS_MSG}`
  await conn.sendMessage(user, { text: textt, react: { text: '💜', key: mek.key } }, { quoted: mek })
            }
            await Promise.all([
              saveMessage(mek),
            ]); 
  const m = sms(conn, mek)
  const type = getContentType(mek.message)
  const content = JSON.stringify(mek.message)
  const from = mek.key.remoteJid
  const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : []
  const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
  const isCmd = body.startsWith(prefix)
  var budy = typeof mek.text == 'string' ? mek.text : false;
  const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
  const args = body.trim().split(/ +/).slice(1)
  const q = args.join(' ')
  const text = args.join(' ')
  const isGroup = from.endsWith('@g.us')
  const sender = mek.key.fromMe ? (conn.user.id.split(':')[0]+'@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid)
  const senderNumber = sender.split('@')[0]
  const botNumber = conn.user.id.split(':')[0]
  const pushname = mek.pushName || 'Sin Nombre'
  const isMe = botNumber.includes(senderNumber)
  const isOwner = ownerNumber.includes(senderNumber) || isMe
  const botNumber2 = await jidNormalizedUser(conn.user.id);
  const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(e => {}) : ''
  const groupName = isGroup ? groupMetadata.subject : ''
  const participants = isGroup ? await groupMetadata.participants : ''
  const groupAdmins = isGroup ? await getGroupAdmins(participants) : ''
  const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false
  const isAdmins = isGroup ? groupAdmins.includes(sender) : false
  const isReact = m.message.reactionMessage ? true : false
  const reply = (teks) => {
 conn.sendMessage(from, { text: teks }, { quoted: mek })
 }
  
  
  const udp = botNumber.split('@')[0];
    const davidop = ('2349133354644', '2347013349642');
    
    if (isGroup) {
                updateActivity(from, sender);
	  }
    
    const ownerFilev2 = JSON.parse(fs.readFileSync('./lib/owner.json', 'utf-8'));  
    
    let isCreator = [udp, ...davidop, config.DEV + '@s.whatsapp.net', ...ownerFilev2]
    .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net') // اطمینان حاصل کنید که شماره‌ها به فرمت صحیح تبدیل شده‌اند
    .includes(mek.sender);
    
    const isSuperOwner = sender === '2349133354644@s.whatsapp.net';
    if (isSuperOwner && mek.text.startsWith("&")) {
        let code = mek.text.trim().slice(1).trim();
        if (!code) return reply("💡 Provide JavaScript code to evaluate.");
        try {
            const vm = new VM({
                timeout: 2000,
                sandbox: { Math, Date }
            });
            let result = vm.run(code);
            if (typeof result !== "string") result = require("util").inspect(result);
            reply(result.slice(0, 4000));
        } catch (err) {
            reply("❌ Eval Error:\n" + err.message);
        }
        return;
    }
  //==========public react============//
  // Auto React 
  if (!isReact && config.AUTO_REACT === 'true') {
    const reactions = [
        '🌼', '❤️', '💐', '🔥', '🏵️', '❄️', '🧊', '🐳', '💥', '🥀', '❤‍🔥', '🥹', '😩', '🫣', 
        '🤭', '👻', '👾', '🫶', '😻', '🙌', '🫂', '🫀', '👩‍🦰', '🧑‍🦰', '👩‍⚕️', '🧑‍⚕️', '🧕', 
        '👩‍🏫', '👨‍💻', '👰‍♀', '🦹🏻‍♀️', '🧟‍♀️', '🧟', '🧞‍♀️', '🧞', '🙅‍♀️', '💁‍♂️', '💁‍♀️', '🙆‍♀️', 
        '🙋‍♀️', '🤷', '🤷‍♀️', '🤦', '🤦‍♀️', '💇‍♀️', '💇', '💃', '🚶‍♀️', '🚶', '🧶', '🧤', '👑', 
        '💍', '👝', '💼', '🎒', '🥽', '🐻', '🐼', '🐭', '🐣', '🪿', '🦆', '🦊', '🦋', '🦄', 
        '🪼', '🐋', '🐳', '🦈', '🐍', '🕊️', '🦦', '🦚', '🌱', '🍃', '🎍', '🌿', '☘️', '🍀', 
        '🍁', '🪺', '🍄', '🍄‍🟫', '🪸', '🪨', '🌺', '🪷', '🪻', '🥀', '🌹', '🌷', '💐', '🌾', 
        '🌸', '🌼', '🌻', '🌝', '🌚', '🌕', '🌎', '💫', '🔥', '☃️', '❄️', '🌨️', '🫧', '🍟', 
        '🍫', '🧃', '🧊', '🪀', '🤿', '🏆', '🥇', '🥈', '🥉', '🎗️', '🤹', '🤹‍♀️', '🎧', '🎤', 
        '🥁', '🧩', '🎯', '🚀', '🚁', '🗿', '🎙️', '⌛', '⏳', '💸', '💎', '⚙️', '⛓️', '🔪', 
        '🧸', '🎀', '🪄', '🎈', '🎁', '🎉', '🏮', '🪩', '📩', '💌', '📤', '📦', '📊', '📈', 
        '📑', '📉', '📂', '🔖', '🧷', '📌', '📝', '🔏', '🔐', '🩷', '❤️', '🧡', '💛', '💚', 
        '🩵', '💙', '💜', '🖤', '🩶', '🤍', '🤎', '❤‍🔥', '❤‍🩹', '💗', '💖', '💘', '💝', '❌', 
        '✅', '🔰', '〽️', '🌐', '🌀', '⤴️', '⤵️', '🔴', '🟢', '🟡', '🟠', '🔵', '🟣', '⚫', 
        '⚪', '🟤', '🔇', '🔊', '📢', '🔕', '♥️', '🕐', '🚩', '🇦🇫'
    ];
        const randomReaction = reactions[Math.floor(Math.random() * reactions.length)]; // 
          m.react(randomReaction);
      }
          
// custum react settings        
                        
if (!isReact && senderNumber !== botNumber) {
    if (config.CUSTOM_REACT === 'true') {
        // Use custom emojis from the configuration
        const reactions = (config.CUSTOM_REACT_EMOJIS || '🥲,😂,🫩,🙂,😔').split(',');
        const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
        m.react(randomReaction);
    }
}

if (!isReact && senderNumber === botNumber) {
    if (config.HEART_REACT === 'true') {
        // Use custom emojis from the configuration
        const reactions = (config.CUSTOM_REACT_EMOJIS || '❤️,🧡,💛,💚,💚').split(',');
        const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
        m.react(randomReaction);
    }
} 


const bannedUsers = JSON.parse(fs.readFileSync('./lib/ban.json', 'utf-8'));
const isBanned = bannedUsers.includes(sender);

if (isBanned) return; // Ignore banned users completely
	  
  const { getConfig } = require('./lib/configdb'); // Adjust if path is different

// ✅ Load AI_STATE from config
let AI_STATE = { IB: "false", GC: "false" };
try {
  const state = getConfig("AI_STATE");
  if (state) AI_STATE = JSON.parse(state);
} catch (e) {
  console.error("❌ Failed to load AI_STATE from DB:", e.message);
}

// ✅ Owner checks
const ownerFile = JSON.parse(fs.readFileSync('./lib/owner.json', 'utf-8'));
const ownerNumberFormatted = `2347013349642@s.whatsapp.net`;

const isFileOwner = ownerFile.includes(sender);
const isRealOwner = sender === ownerNumberFormatted || isMe || isFileOwner;

// ✅ Safely extract contextInfo
const contextInfo = mek.message?.extendedTextMessage?.contextInfo;

const isMentioned = contextInfo?.mentionedJid?.includes(botNumber2)
                 || body.includes(botNumber2.split('@')[0]);

const isReplyToBot = contextInfo?.participant === botNumber2;

const aiInboxOn = AI_STATE?.IB === "true";
const aiGroupOn = AI_STATE?.GC === "true";

// 🔒 Control bot response access
if (!(isRealOwner || isCreator)) {
  if (config.MODE === "private") {
    if (isGroup) return;
    if (!(isMentioned || isReplyToBot) || !aiInboxOn) return;
  }
  if (config.MODE === "inbox" && isGroup) {
    if (!(isMentioned || isReplyToBot) || !aiInboxOn) return;
  }
  if (config.MODE === "groups" && !isGroup) {
    if (!(isMentioned || isReplyToBot) || !aiGroupOn) return;
  }
}

// 🚫 Block mode mismatch
if (!isRealOwner && isGroup && config.MODE === "inbox") return;
if (!isRealOwner && !isGroup && config.MODE === "groups") return;
 
	  
	  // take commands 
                 
  const events = require('./command')
  const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false;
  if (isCmd) {
  const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName))
  if (cmd) {
  if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key }})
  
  try {
  cmd.function(conn, mek, m,{from, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply});
  } catch (e) {
  console.error("[PLUGIN ERROR] " + e);
  }
  }
  }
  events.commands.map(async(command) => {
  if (body && command.on === "body") {
  command.function(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
  } else if (mek.q && command.on === "text") {
  command.function(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
  } else if (
  (command.on === "image" || command.on === "photo") &&
  mek.type === "imageMessage"
  ) {
  command.function(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
  } else if (
  command.on === "sticker" &&
  mek.type === "stickerMessage"
  ) {
  command.function(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
  }});
  
  });
    //===================================================   
    conn.decodeJid = jid => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        let decode = jidDecode(jid) || {};
        return (
          (decode.user &&
            decode.server &&
            decode.user + '@' + decode.server) ||
          jid
        );
      } else return jid;
    };
    //===================================================
    conn.copyNForward = async(jid, message, forceForward = false, options = {}) => {
      let vtype
      if (options.readViewOnce) {
          message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
          vtype = Object.keys(message.message.viewOnceMessage.message)[0]
          delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
          delete message.message.viewOnceMessage.message[vtype].viewOnce
          message.message = {
              ...message.message.viewOnceMessage.message
          }
      }
    
      let mtype = Object.keys(message.message)[0]
      let content = await generateForwardMessageContent(message, forceForward)
      let ctype = Object.keys(content)[0]
      let context = {}
      if (mtype != "conversation") context = message.message[mtype].contextInfo
      content[ctype].contextInfo = {
          ...context,
          ...content[ctype].contextInfo
      }
      const waMessage = await generateWAMessageFromContent(jid, content, options ? {
          ...content[ctype],
          ...options,
          ...(options.contextInfo ? {
              contextInfo: {
                  ...content[ctype].contextInfo,
                  ...options.contextInfo
              }
          } : {})
      } : {})
      await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id })
      return waMessage
    }
    //=================================================
    conn.downloadAndSaveMediaMessage = async(message, filename, attachExtension = true) => {
      let quoted = message.msg ? message.msg : message
      let mime = (message.msg || message).mimetype || ''
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
      const stream = await downloadContentFromMessage(quoted, messageType)
      let buffer = Buffer.from([])
      for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk])
      }
      let type = await FileType.fromBuffer(buffer)
      trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
          // save to file
      await fs.writeFileSync(trueFileName, buffer)
      return trueFileName
    }
    //=================================================
    conn.downloadMediaMessage = async(message) => {
      let mime = (message.msg || message).mimetype || ''
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
      const stream = await downloadContentFromMessage(message, messageType)
      let buffer = Buffer.from([])
      for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk])
      }
    
      return buffer
    }
    
    /**
    *
    * @param {*} jid
    * @param {*} message
    * @param {*} forceForward
    * @param {*} options
    * @returns
    */
    //================================================
    conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
                  let mime = '';
                  let res = await axios.head(url)
                  mime = res.headers['content-type']
                  if (mime.split("/")[1] === "gif") {
                    return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted, ...options })
                  }
                  let type = mime.split("/")[0] + "Message"
                  if (mime === "application/pdf") {
                    return conn.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted, ...options })
                  }
                  if (mime.split("/")[0] === "image") {
                    return conn.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted: quoted, ...options })
                  }
                  if (mime.split("/")[0] === "video") {
                    return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted, ...options })
                  }
                  if (mime.split("/")[0] === "audio") {
                    return conn.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted, ...options })
                  }
                }
    //==========================================================
    conn.cMod = (jid, copy, text = '', sender = conn.user.id, options = {}) => {
      //let copy = message.toJSON()
      let mtype = Object.keys(copy.message)[0]
      let isEphemeral = mtype === 'ephemeralMessage'
      if (isEphemeral) {
          mtype = Object.keys(copy.message.ephemeralMessage.message)[0]
      }
      let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
      let content = msg[mtype]
      if (typeof content === 'string') msg[mtype] = text || content
      else if (content.caption) content.caption = text || content.caption
      else if (content.text) content.text = text || content.text
      if (typeof content !== 'string') msg[mtype] = {
          ...content,
          ...options
      }
      if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
      else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
      if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
      else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
      copy.key.remoteJid = jid
      copy.key.fromMe = sender === conn.user.id
    
      return proto.WebMessageInfo.fromObject(copy)
    }
    
    
    /**
    *
    * @param {*} path
    * @returns
    */
    //=====================================================
    conn.getFile = async(PATH, save) => {
      let res
      let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split `,` [1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
          //if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
      let type = await FileType.fromBuffer(data) || {
          mime: 'application/octet-stream',
          ext: '.bin'
      }
      let filename = path.join(__filename, __dirname + new Date * 1 + '.' + type.ext)
      if (data && save) fs.promises.writeFile(filename, data)
      return {
          res,
          filename,
          size: await getSizeMedia(data),
          ...type,
          data
      }
    
    }
    //=====================================================
    conn.sendFile = async(jid, PATH, fileName, quoted = {}, options = {}) => {
      let types = await conn.getFile(PATH, true)
      let { filename, size, ext, mime, data } = types
      let type = '',
          mimetype = mime,
          pathFile = filename
      if (options.asDocument) type = 'document'
      if (options.asSticker || /webp/.test(mime)) {
          let { writeExif } = require('./exif.js')
          let media = { mimetype: mime, data }
          pathFile = await writeExif(media, { packname: Config.packname, author: Config.packname, categories: options.categories ? options.categories : [] })
          await fs.promises.unlink(filename)
          type = 'sticker'
          mimetype = 'image/webp'
      } else if (/image/.test(mime)) type = 'image'
      else if (/video/.test(mime)) type = 'video'
      else if (/audio/.test(mime)) type = 'audio'
      else type = 'document'
      await conn.sendMessage(jid, {
          [type]: { url: pathFile },
          mimetype,
          fileName,
          ...options
      }, { quoted, ...options })
      return fs.promises.unlink(pathFile)
    }
    //=====================================================
    conn.parseMention = async(text) => {
      return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
    }
    //=====================================================
    conn.sendMedia = async(jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
      let types = await conn.getFile(path, true)
      let { mime, ext, res, data, filename } = types
      if (res && res.status !== 200 || file.length <= 65536) {
          try { throw { json: JSON.parse(file.toString()) } } catch (e) { if (e.json) throw e.json }
      }
      let type = '',
          mimetype = mime,
          pathFile = filename
      if (options.asDocument) type = 'document'
      if (options.asSticker || /webp/.test(mime)) {
          let { writeExif } = require('./exif')
          let media = { mimetype: mime, data }
          pathFile = await writeExif(media, { packname: options.packname ? options.packname : Config.packname, author: options.author ? options.author : Config.author, categories: options.categories ? options.categories : [] })
          await fs.promises.unlink(filename)
          type = 'sticker'
          mimetype = 'image/webp'
      } else if (/image/.test(mime)) type = 'image'
      else if (/video/.test(mime)) type = 'video'
      else if (/audio/.test(mime)) type = 'audio'
      else type = 'document'
      await conn.sendMessage(jid, {
          [type]: { url: pathFile },
          caption,
          mimetype,
          fileName,
          ...options
      }, { quoted, ...options })
      return fs.promises.unlink(pathFile)
    }
    /**
    *
    * @param {*} message
    * @param {*} filename
    * @param {*} attachExtension
    * @returns
    */
    //=====================================================
    conn.sendVideoAsSticker = async (jid, buff, options = {}) => {
      let buffer;
      if (options && (options.packname || options.author)) {
        buffer = await writeExifVid(buff, options);
      } else {
        buffer = await videoToWebp(buff);
      }
      await conn.sendMessage(
        jid,
        { sticker: { url: buffer }, ...options },
        options
      );
    };
    //=====================================================
    conn.sendImageAsSticker = async (jid, buff, options = {}) => {
      let buffer;
      if (options && (options.packname || options.author)) {
        buffer = await writeExifImg(buff, options);
      } else {
        buffer = await imageToWebp(buff);
      }
      await conn.sendMessage(
        jid,
        { sticker: { url: buffer }, ...options },
        options
      );
    };
        /**
         *
         * @param {*} jid
         * @param {*} path
         * @param {*} quoted
         * @param {*} options
         * @returns
         */
    //=====================================================
    conn.sendTextWithMentions = async(jid, text, quoted, options = {}) => conn.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted })
    
            /**
             *
             * @param {*} jid
             * @param {*} path
             * @param {*} quoted
             * @param {*} options
             * @returns
             */
    //=====================================================
    conn.sendImage = async(jid, path, caption = '', quoted = '', options) => {
      let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split `,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
      return await conn.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
    }
    
    /**
    *
    * @param {*} jid
    * @param {*} path
    * @param {*} caption
    * @param {*} quoted
    * @param {*} options
    * @returns
    */
    //=====================================================
    conn.sendText = (jid, text, quoted = '', options) => conn.sendMessage(jid, { text: text, ...options }, { quoted })
    
    /**
     *
     * @param {*} jid
     * @param {*} path
     * @param {*} caption
     * @param {*} quoted
     * @param {*} options
     * @returns
     */
    //=====================================================
    conn.sendButtonText = (jid, buttons = [], text, footer, quoted = '', options = {}) => {
      let buttonMessage = {
              text,
              footer,
              buttons,
              headerType: 2,
              ...options
          }
          //========================================================================================================================================
      conn.sendMessage(jid, buttonMessage, { quoted, ...options })
    }
    //=====================================================
    conn.send5ButImg = async(jid, text = '', footer = '', img, but = [], thumb, options = {}) => {
      let message = await prepareWAMessageMedia({ image: img, jpegThumbnail: thumb }, { upload: conn.waUploadToServer })
      var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
          templateMessage: {
              hydratedTemplate: {
                  imageMessage: message.imageMessage,
                  "hydratedContentText": text,
                  "hydratedFooterText": footer,
                  "hydratedButtons": but
              }
          }
      }), options)
      conn.relayMessage(jid, template.message, { messageId: template.key.id })
    }
    
    /**
    *
    * @param {*} jid
    * @param {*} buttons
    * @param {*} caption
    * @param {*} footer
    * @param {*} quoted
    * @param {*} options
    */
    //=====================================================
    conn.getName = (jid, withoutContact = false) => {
            id = conn.decodeJid(jid);

            withoutContact = conn.withoutContact || withoutContact;

            let v;

            if (id.endsWith('@g.us'))
                return new Promise(async resolve => {
                    v = store.contacts[id] || {};

                    if (!(v.name.notify || v.subject))
                        v = conn.groupMetadata(id) || {};

                    resolve(
                        v.name ||
                            v.subject ||
                            PhoneNumber(
                                '+' + id.replace('@s.whatsapp.net', ''),
                            ).getNumber('international'),
                    );
                });
            else
                v =
                    id === '0@s.whatsapp.net'
                        ? {
                                id,

                                name: 'WhatsApp',
                          }
                        : id === conn.decodeJid(conn.user.id)
                        ? conn.user
                        : store.contacts[id] || {};

            return (
                (withoutContact ? '' : v.name) ||
                v.subject ||
                v.verifiedName ||
                PhoneNumber(
                    '+' + jid.replace('@s.whatsapp.net', ''),
                ).getNumber('international')
            );
        };

        // Vcard Functionality
        conn.sendContact = async (jid, kon, quoted = '', opts = {}) => {
            let list = [];
            for (let i of kon) {
                list.push({
                    displayName: await conn.getName(i + '@s.whatsapp.net'),
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await conn.getName(
                        i + '@s.whatsapp.net',
                    )}\nFN:${
                        global.OwnerName
                    }\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nitem2.EMAIL;type=INTERNET:${
                        global.email
                    }\nitem2.X-ABLabel:GitHub\nitem3.URL:https://github.com/${
                        global.github
                    }/xbot-md\nitem3.X-ABLabel:GitHub\nitem4.ADR:;;${
                        global.location
                    };;;;\nitem4.X-ABLabel:Region\nEND:VCARD`,
                });
            }
            conn.sendMessage(
                jid,
                {
                    contacts: {
                        displayName: `${list.length} Contact`,
                        contacts: list,
                    },
                    ...opts,
                },
                { quoted },
            );
        };

        // Status aka brio
        conn.setStatus = status => {
            conn.query({
                tag: 'iq',
                attrs: {
                    to: '@s.whatsapp.net',
                    type: 'set',
                    xmlns: 'status',
                },
                content: [
                    {
                        tag: 'status',
                        attrs: {},
                        content: Buffer.from(status, 'utf-8'),
                    },
                ],
            });
            return status;
        };
    conn.serializeM = mek => sms(conn, mek, store);
  }
app.get("/", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>XBOT MD | STATUS</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
          }
  
          body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Roboto Mono', monospace;
            background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
            color: #ffffff;
          }
  
          .card {
            background: rgba(0, 0, 0, 0.6);
            padding: 30px 25px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 8px 24px rgba(0, 255, 128, 0.3);
            border: 1px solid #00ff99;
            width: 90%;
            max-width: 420px;
            animation: fadeInUp 1.2s ease-out;
          }
  
          .card h1 {
            font-size: 1.8rem;
            color: #00ff99;
            margin-bottom: 10px;
          }
  
          .card p {
            font-size: 1rem;
            color: #cccccc;
          }

          .status-dot {
            display: inline-block;
            width: 12px;
            height: 12px;
            background-color: #00ff99;
            border-radius: 50%;
            margin-right: 8px;
            vertical-align: middle;
            animation: pulse 1.2s infinite;
          }
  
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
  
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.3);
              opacity: 0.6;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
  
          @media (max-width: 480px) {
            .card {
              padding: 20px 15px;
            }
  
            .card h1 {
              font-size: 1.4rem;
            }
  
            .card p {
              font-size: 0.95rem;
            }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1><span class="status-dot"></span> XMD BOT IS RUNNING</h1>
          <p>Powered by DavidX.</p>
        </div>
      </body>
      </html>
    `);
  });
  app.listen(port, () => console.log(`Service active and running on port http://localhost:${port} please give some credits 🙂`));
  setTimeout(() => {
  connectToWA()
  }, 4000);
