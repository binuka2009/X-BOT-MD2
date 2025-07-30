// I WILL FIND YOU 🫵
// MR FRANK


const axios = require("axios");
const { cmd } = require("../command");

cmd(
    {
        pattern: "txtdetect",
        alias: ["aidetect", "textdetect"],
        desc: "Detect if a text is AI-generated or human-written.",
        category: "AI",
        use: "<text>\nExample: .txtdetect Hello",
        filename: __filename,
        react: "🤖"
    },
    async (conn, mek, m, { args, reply, from }) => {
        try {
            const query = args.join(" "); // Combine the query parts

            if (!query) {
                return reply("Please provide a text to analyze.\nExample: `.txtdetect Hello`");
            }

            // Call the AI Text Detector API
            const apiUrl = `https://bk9.fun/tools/txtdetect?q=${encodeURIComponent(query)}`;
            const response = await axios.get(apiUrl);

            // Log the API response for debugging
            console.log("API Response:", response.data);

            // Check if the API response is valid
            if (!response.data || !response.data.status || !response.data.BK9 || !response.data.BK9.success) {
                return reply("❌ Unable to analyze the text. Please try again later.");
            }

            // Extract the detection results
            const detectionData = response.data.BK9.data;

            // Format the results with emojis
            const resultText = `
🤖 *AI Text Detection Results:* 🤖

📝 *Input Text:* ${detectionData.input_text || "N/A"}

🔍 *Detection Summary:*
   - 🧑 *Human Probability:* ${detectionData.isHuman || 0}%
   - 🤖 *AI Probability:* ${100 - (detectionData.isHuman || 0)}%
   - 📊 *Fake Percentage:* ${detectionData.fakePercentage || 0}%
   - 🌐 *Detected Language:* ${detectionData.detected_language || "Unknown"}

📋 *Feedback:* ${detectionData.feedback || "N/A"}

📌 *Additional Feedback:* ${detectionData.additional_feedback || "N/A"}

🔎 *Special Sentences Detected:*
${detectionData.specialSentences?.map((sentence, index) => `   - ${sentence}`).join("\n") || "   - None"}

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅᴀᴠɪᴅx
            `;

            // Send the formatted results
            await reply(resultText);

        } catch (error) {
            console.error("Error in txtdetect command:", error);
            reply("❌ An error occurred while processing your request. Please try again later.");
        }
    }
);
