const {prefix, botName, ownerName} = require("./config");
const {categories} = require("./command-list.json");

function menuText() {
  const out = [
    `╔══════════════════════════════════════╗`,
    `║        ${botName} 👑 COMMANDS        ║`,
    `╚══════════════════════════════════════╝`,
    ``,
    `PREFIX: ${prefix}`,
    `BOT NAME: ${botName}`,
    `OWNER: ${ownerName}`,
    `AI: Gemini + Local AI`,
    ``
  ];
  for (const [name, commands] of Object.entries(categories)) {
    out.push(`━━━━━━━━━━━━━━━━━━━━`);
    out.push(`📂 ${name}`);
    out.push(`━━━━━━━━━━━━━━━━━━━━`);
    out.push(...commands.map(c => `${prefix}${c.replace(/^\\./, "")}`));
    out.push("");
  }
  out.push("🔐 AI PROVIDERS");
  out.push("Gemini AI");
  out.push("Local AI");
  out.push("NO OLLAMA");
  out.push("NO OPENAI");
  out.push("NO OTHER AI API");
  return out.join("\n");
}

module.exports = {menuText};
