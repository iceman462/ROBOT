require("dotenv").config();

function normalizeNumber(value = "") {
  return String(value).replace(/[^\d]/g, "");
}

module.exports = {
  ownerNumber: normalizeNumber(process.env.OWNER_NUMBER || "233545274761"),
  prefix: process.env.PREFIX || ".",
  botName: process.env.BOT_NAME || "ICEMAN BOT",
  ownerName: process.env.OWNER_NAME || "ICEMAN",
  port: Number(process.env.PORT || 3000),
  geminiKey: process.env.GEMINI_API_KEY || "",
  localAiUrl: process.env.LOCAL_AI_URL || "",
  ownerGroupLink: process.env.OWNER_GROUP_LINK || "",
  ownerChannelLink: process.env.OWNER_CHANNEL_LINK || "",
  publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`
};
