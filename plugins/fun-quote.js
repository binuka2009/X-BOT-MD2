const config = require('../config');
const { cmd, commands } = require('../command');
const axios = require("axios");

cmd({
  pattern: "quote",
  react: "💬",
  alias: ["randomquote", "inspire"],
  desc: "Get a random inspirational quote.",
  category: "utility",
  use: ".quote",
  filename: __filename,
}, async (conn, mek, msg, { from, args, reply, react }) => {
  try {
    // Add a reaction to indicate the bot is processing the request
   // await react("⏳"); // Hourglass emoji for processing

    // Fetch a random quote from the Forismatic API
    const response = await axios.get("http://api.forismatic.com/api/1.0/", {
      params: {
        method: "getQuote",
        format: "json",
        lang: "en",
      },
    });

    const { quoteText, quoteAuthor } = response.data;

    // Format the quote message with emojis and footer
    const quoteMessage = `
✨ *Quote*: ${quoteText}

👤 *Author*: ${quoteAuthor || "Unknown"}

─────────────────
> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅᴀᴠɪᴅx
    `;

    // Send the formatted message
    await reply(quoteMessage);

    // Add a success reaction
  //  await react("✅"); // Checkmark emoji for success
  } catch (error) {
    console.error("Error fetching quote:", error);

    // Add an error reaction
  //  await react("❌"); // Cross mark emoji for failure

    // Send an error message
    reply("❌ Unable to fetch a quote. Please try again later.");
  }
});
