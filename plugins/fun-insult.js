const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "insult",
  desc: "Get an insult I've .",
  category: "fun",
  react: "💀",
  filename: __filename
}, async (conn, m, store, { from, reply }) => {
  try {
    const response = await axios.get("https://insult.mattbas.org/api/insult");
    const content = response.data;

    const message = `> ${content}`;
    reply(message);
  } catch (error) {
    console.error("Error fetching insult:", error);
    reply("please check the logs!");
  }
});
