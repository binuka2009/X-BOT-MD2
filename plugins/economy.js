const { cmd } = require("../command");

const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://bluekenny619:JqtCoC4pnRMu6dNK@cluster0.tqepbsr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Removed useNewUrlParser and useUnifiedTopology options
const client = new MongoClient(uri);

let db;

async function connectDB() {
  try {
    if (!db) {
      await client.connect();
      db = client.db("platinumDB");
    }
    return db;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

const newsletterInfo = {
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: '120363348038810906@newsletter',
    newsletterName: '*x-ʙᴏᴛ-ᴍᴅ*',
    serverMessageId: 143
  },
  externalAdReply: {
    showAdAttribution: true,
    title: "☞ᴅᴀᴠɪᴅx☜⁠ ",
    body: "Click to View Channel",
    mediaType: 1,
    renderLargerThumbnail: true,
    thumbnailUrl: "https://files.catbox.moe/06cgye.jpg",
    mediaUrl: "https://whatsapp.com/channel/0029VarIiQL5a24AU5ZCVV0G"
  }
};

// Fetch user record or create one
async function getUser(collection, user) {
  let record = await collection.findOne({ user });
  if (!record) {
    record = { user, balance: 500, lastDaily: 0, inventory: [] };
    await collection.insertOne(record);
  }
  return record;
}
async function getOrCreateAccount(group, user) {
  const _db = await connectDB();
  const coll = _db.collection("economy");
  let account = await coll.findOne({ group, user });

  if (!account) {
    account = {
      group,
      user,
      balance: 0,
      lastDaily: 0,
    };
    await coll.insertOne(account);
  }

  return account;
}
// Inventory system
cmd({
  pattern: "inventory",
  desc: "View your inventory.",
  category: "economy",
  react: "🎁",
  filename: __filename,
}, async (conn, mek, m) => {
  const _db = await connectDB();
  const econ = _db.collection("economy");
  const user = m.sender;
  const data = await getUser(econ, user);
  const inventoryList = data.inventory.length > 0 ? data.inventory.join("\n") : "Your inventory is empty.";
  return conn.sendMessage(m.chat, {
    text: `🛍️ *Your Inventory:*\n\n${inventoryList}`
  }, { quoted: m });
});

// Balance command
cmd({
  pattern: "balance",
  desc: "Check your wallet balance.",
  category: "economy",
  react: "💰",
  filename: __filename,
}, async (conn, mek, m) => {
  const _db = await connectDB();
  const econ = _db.collection("economy");
  const user = m.sender;
  const data = await getUser(econ, user);
  return conn.sendMessage(m.chat, {
    text: `👛 *@${user.split("@")[0]}'s Wallet*\n\n💰 Balance: *₦${data.balance}*`,
    mentions: [user],
  }, { quoted: m });
});

// Transfer command
cmd({
  pattern: "transfer",
  desc: "Transfer money to another user.",
  category: "economy",
  react: "💸",
  filename: __filename,
}, async (conn, mek, m, { args, reply }) => {
  const _db = await connectDB();
  const econ = _db.collection("economy");
  const sender = m.sender;
  const mentioned = m.mentionedJid?.[0];
  if (!mentioned) {
    return conn.sendMessage(m.chat, {
      text: "👀 *Tag someone to transfer money to!*",
    }, { quoted: m });
  }
  const amount = parseInt(args[1]);
  if (isNaN(amount) || amount <= 0) {
    return conn.sendMessage(m.chat, {
      text: "💡 Use: `transfer @user 100`"
    }, { quoted: m });
  }
  const fromUser = await getUser(econ, sender);
  if (fromUser.balance < amount) {
    return conn.sendMessage(m.chat, {
      text: "🚫 You're too broke to do that, try hustling more."
    }, { quoted: m });
  }
  const toUser = await getUser(econ, mentioned);
  await econ.updateOne({ user: sender }, { $inc: { balance: -amount } });
  await econ.updateOne({ user: mentioned }, { $inc: { balance: amount } });
  return conn.sendMessage(m.chat, {
    text: `💸 @${sender.split("@")[0]} sent ₦${amount} to @${mentioned.split("@")[0]}!`,
    mentions: [sender, mentioned]
  }, { quoted: m });
});

// Shop
cmd({
  pattern: "shop",
  desc: "View shop items.",
  category: "economy",
  react: "🛍️",
  filename: __filename,
}, async (conn, mek, m) => {
  const shopText = `
🛍️ Welcome to the Platinum Shop!
1. 🎁 Lucky Box - ₦500

2. 🧃 Energy Drink - ₦200

3. 🎟️ Gamble Ticket - ₦1000

More coming soon!
`;
  return conn.sendMessage(m.chat, {
    text: shopText
  }, { quoted: m });
});

cmd({
  pattern: "gamble",
  desc: "Gamble your coins (win or lose) with a multiplier on win.",
  category: "economy",
  react: "🎲",
  filename: __filename,
}, async (conn, mek, m, { args }) => {
  const _db = await connectDB();
  const econ = _db.collection("economy");
  const user = m.sender;
  const amount = parseInt(args[1]);
  if (!amount || amount <= 0) {
    return conn.sendMessage(m.chat, {
      text: "🎰 Use: `gamble 100` to try your luck.",
    }, { quoted: m });
  }
  const data = await getUser(econ, user);
  if (data.balance < amount) {
    return conn.sendMessage(m.chat, {
      text: "💀 You're too broke to gamble that much.",
    }, { quoted: m });
  }
  // Determine win or loss (50% chance)
  const win = Math.random() < 0.5;
  let result, message;
  if (win) {
    // Generate a random multiplier between 1.5 and 3.0 for winnings
    const minMultiplier = 1.5;
    const maxMultiplier = 300.0;
    const multiplier = Math.random() * (maxMultiplier - minMultiplier) + minMultiplier;
    // Calculate reward: multiply the bet by the multiplier (always greater than the bet)
    result = Math.floor(amount * multiplier);
    message = `🎉 You won ₦${result}! (Multiplier: ${multiplier.toFixed(2)}x)`;
  } else {
    // Loss: subtract the bet amount
    result = -amount;
    message = `😢 You lost ₦${amount}. Better luck next time.`;
  }
  // Update the user's economy balance
  await econ.updateOne({ user }, { $inc: { balance: result } });
  return conn.sendMessage(m.chat, {
    text: message,
  }, { quoted: m });
});

// Admin Tools: Set Balance
cmd({
  pattern: "setbal",
  desc: "Set the balance of a user.",
  category: "economy",
  react: "⚙️",
  filename: __filename,
}, async (conn, mek, m, { args }) => {
  const _db = await connectDB();
  const econ = _db.collection("economy");
  const user = m.mentionedJid?.[0];
  const balance = parseInt(args[1]);
  if (!user || isNaN(balance)) {
    return conn.sendMessage(m.chat, {
      text: "💡 Use: `setbal @user 10000`",
    }, { quoted: m });
  }
  await econ.updateOne({ user }, { $set: { balance } });
  return conn.sendMessage(m.chat, {
    text: `⚙️ Set the balance of @${user.split("@")[0]} to ₦${balance}.`,
    mentions: [user],
  }, { quoted: m });
});

// Admin Tools: Add Balance
cmd({
  pattern: "addbal",
  desc: "Add balance to a user.",
  category: "economy",
  react: "⚙️",
  filename: __filename,
}, async (conn, mek, m, { args }) => {
  const _db = await connectDB();
  const econ = _db.collection("economy");
  const user = m.mentionedJid?.[0];
  const amount = parseInt(args[1]);
  if (!user || isNaN(amount)) {
    return conn.sendMessage(m.chat, {
      text: "💡 Use: `addbal @user 1000`",
    }, { quoted: m });
  }
  await econ.updateOne({ user }, { $inc: { balance: amount } });
  return conn.sendMessage(m.chat, {
    text: `⚙️ Added ₦${amount} to @${user.split("@")[0]}'s balance.`,
    mentions: [user],
  }, { quoted: m });
});

// Admin Tools: Reset Balance
cmd({
  pattern: "resetbal",
  desc: "Reset a user's balance to the default value.",
  category: "economy",
  react: "⚙️",
  filename: __filename,
}, async (conn, mek, m, { args }) => {
  const _db = await connectDB();
  const econ = _db.collection("economy");
  const user = m.mentionedJid?.[0];
  if (!user) {
    return conn.sendMessage(m.chat, {
      text: "💡 Use: `resetbal @user`",
    }, { quoted: m });
  }
  await econ.updateOne({ user }, { $set: { balance: 500 } });
  return conn.sendMessage(m.chat, {
    text: `⚙️ Reset @${user.split("@")[0]}'s balance to ₦500.`,
    mentions: [user],
  }, { quoted: m });
});

cmd(
  {
    pattern: "daily",
    desc: "Claim your daily reward.",
    category: "economy",
    react: "🎁",
    filename: __filename,
  },
  async (conn, mek, m, { from, reply }) => {
    try {
      const account = await getOrCreateAccount(m.chat, m.sender);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000; // 24 hours

      if (now - account.lastDaily < oneDay) {
        const remaining = oneDay - (now - account.lastDaily);
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        return reply(`⏰ You have already claimed your daily reward.\nTry again in ${hours}h ${minutes}m.`);
      }

      const reward = Math.floor(Math.random() * 101) + 50; // 50-150 coins
      const _db = await connectDB();
      const coll = _db.collection("economy");

      await coll.updateOne(
        { group: m.chat, user: m.sender },
        { $inc: { balance: reward }, $set: { lastDaily: now } }
      );

      return reply(`🎉 Daily reward claimed!\nYou earned *${reward} coins*.\nYour new balance is updated.`);
    } catch (error) {
      console.error(error);
      return reply("❌ An error occurred while processing your daily reward.");
    }
  }
);

// Work command to earn coins
cmd({
  pattern: "work",
  desc: "Work to earn some coins.",
  category: "economy",
  react: "💼",
  filename: __filename,
}, async (conn, mek, m) => {
  const _db = await connectDB();
  const econ = _db.collection("economy");
  const user = m.sender;
  const data = await getUser(econ, user);
  // Check cooldown (work once per 24 hours)
  const lastWorked = data.lastDaily;
  const now = Date.now();
  const timeLeft = (lastWorked + 24 * 60 * 60 * 1000) - now;
  if (timeLeft > 0) {
    const timeString = new Date(timeLeft).toISOString().substr(11, 8); // hh:mm:ss format
    return conn.sendMessage(m.chat, {
      text: `⏳ You have already worked today! Please wait ${timeString} before working again.`,
    }, { quoted: m });
  }
  // Random work types and their earnings
  const workOptions = [
    { job: "Office Job", earnings: [100, 200] },
    { job: "Cleaning Job", earnings: [50, 150] },
    { job: "Tech Support", earnings: [200, 300] },
  ];
  const chosenJob = workOptions[Math.floor(Math.random() * workOptions.length)];
  const earned = chosenJob.earnings[Math.floor(Math.random() * chosenJob.earnings.length)];
  await econ.updateOne({ user }, { $set: { lastDaily: now }, $inc: { balance: earned } });
  return conn.sendMessage(m.chat, {
    text: `💼 You worked as a ${chosenJob.job} and earned ₦${earned}.`,
  }, { quoted: m });
});
