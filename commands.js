const os = require("os");
const {prefix, ownerNumber, botName, ownerName, ownerGroupLink, ownerChannelLink} = require("./config");
const store = require("./store");
const {askAI} = require("./ai");
const {menuText} = require("./menu");
const {commands} = require("./command-list.json");

const commandSet = new Set(commands);
const startedAt = Date.now();

function digits(v = "") { return String(v).replace(/\D/g, ""); }
function senderNumber(m) {
  return digits(m?.key?.participant || m?.key?.remoteJid || "");
}
function isOwner(m) {
  return senderNumber(m).endsWith(ownerNumber);
}
function argText(args) { return args.join(" ").trim(); }
function isGroup(m) { return String(m?.key?.remoteJid || "").endsWith("@g.us"); }
function reply(sock, m, text) {
  return sock.sendMessage(m.key.remoteJid, {text: String(text)}, {quoted: m});
}
function toggle(key, args) {
  const a = String(args[0] || "").toLowerCase();
  if (!["on","off","status"].includes(a)) return `${prefix}${key} on | off | status`;
  if (a === "status") return `⚙️ ${key}: ${store.get(key) ? "ON" : "OFF"}`;
  store.set(key, a === "on");
  return `✅ ${key}: ${a.toUpperCase()}`;
}

const funReplies = {
  joke: "😂 Why did the bot cross the network? To get to the other site!",
  fact: "💡 Fact: A WhatsApp bot is only as reliable as its connection and its error handling.",
  "8ball": "🎱 Ask again and trust your instincts.",
  compliment: "✨ You're doing great!",
  coinflip: "🪙 " + (Math.random() < 0.5 ? "Heads" : "Tails"),
  roast: "🔥 Friendly roast: your command list is bigger than some operating systems.",
  aura: "✨ Your aura is loading... ICEMAN approved."
};

async function execute(sock, m, command, args) {
  const c = command.toLowerCase();

  // Core informational commands.
  if (c === "menu" || c === "menu2" || c === "help") return reply(sock, m, menuText());
  if (c === "ping" || c === "ping2") return reply(sock, m, `🏓 PONG\n⏱️ ${Date.now() - startedAt}ms`);
  if (c === "alive") return reply(sock, m, `✅ ${botName} is alive.\nUptime: ${formatUptime(process.uptime())}`);
  if (c === "uptime") return reply(sock, m, `⏱️ ${formatUptime(process.uptime())}`);

  // Owner-only group/channel link commands.
  if (c === "owner") {
    const sub = String(args[0] || "").toLowerCase();
    if (["gc","group","channel"].includes(sub)) {
      if (!isOwner(m)) return reply(sock, m, "❌ Owner only.");
      if (sub === "channel") {
        return reply(sock, m, store.get("ownerChannelLink") || ownerChannelLink || "⚠️ No owner channel link configured.");
      }
      return reply(sock, m, store.get("ownerGroupLink") || ownerGroupLink || "⚠️ No owner group link configured.");
    }
    if (sub === "setgc" || sub === "setgroup") {
      if (!isOwner(m)) return reply(sock, m, "❌ Owner only.");
      const link = String(args.slice(1).join(" ")).trim();
      if (!/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+$/i.test(link)) {
        return reply(sock, m, `Usage: ${prefix}owner setgc <WhatsApp group invite link>`);
      }
      store.set("ownerGroupLink", link);
      return reply(sock, m, "✅ Owner group link saved.");
    }
    if (sub === "setchannel") {
      if (!isOwner(m)) return reply(sock, m, "❌ Owner only.");
      const link = String(args.slice(1).join(" ")).trim();
      if (!/^https:\/\/[^\s]+$/i.test(link)) {
        return reply(sock, m, `Usage: ${prefix}owner setchannel <channel link>`);
      }
      store.set("ownerChannelLink", link);
      return reply(sock, m, "✅ Owner channel link saved.");
    }
    return reply(sock, m, `👑 Owner: ${ownerName}\n📱 +${ownerNumber}`);
  }
  if (c === "bot") return reply(sock, m, `🤖 ${botName}\nPrefix: ${prefix}\nAI: Gemini + Local AI`);
  if (c === "repo") return reply(sock, m, "📦 ICEMAN BOT repository: configure your own GitHub URL in the README.");
  if (c === "settings") return reply(sock, m, isOwner(m) ? "```json\n" + JSON.stringify(store.all(), null, 2) + "\n```" : "❌ Owner only.");
  if (c === "prefix") return reply(sock, m, `Prefix: ${prefix}`);

  // AI.
  if (c === "ai" && ["on","off","status"].includes(String(args[0]||"").toLowerCase())) {
    return reply(sock, m, toggle("ai", args));
  }
  if (c === "ai" || c === "ask") {
    const q = argText(args);
    if (!q) return reply(sock, m, `Usage: ${prefix}${c} <question>`);
    if (!store.get("ai")) return reply(sock, m, "🤖 AI is OFF.");
    return reply(sock, m, "🤔 " + await askAI(q));
  }
  if (["dailyai","groupai","aisticker","gplinkauto","bot"].includes(c) && ["on","off","status"].includes(String(args[0]||"").toLowerCase())) {
    const key = c === "bot" ? "botProtect" : c;
    return reply(sock, m, toggle(key, args));
  }

  // Owner-only settings/admin actions.
  const ownerOnly = new Set([
    "block","unblock","blocklist","leave","ik","pair","pair64","count","countx",
    "mode","botname","ownername","ownernumber","description","stickername","delpath",
    "editpath","reactemojis","owneremojis","botdp","banlist","ban","unban","sudo",
    "delsudo","listsudo","botadmin","delbotadmin","botadmins","bot","vv"
  ]);
  if (ownerOnly.has(c) && !isOwner(m)) return reply(sock, m, "❌ Owner only.");

  if (c === "mode") {
    const v = String(args[0] || "").toLowerCase();
    if (v === "status") return reply(sock, m, `Mode: ${store.get("mode")}`);
    if (!["public","private"].includes(v)) return reply(sock, m, `${prefix}mode public | private | status`);
    store.set("mode", v); return reply(sock, m, `✅ Mode: ${v}`);
  }
  if (c === "botadmin") {
    const n = digits(args[0]); if (!n) return reply(sock,m,`${prefix}botadmin <number>`);
    const list = store.get("botAdmins") || []; if (!list.includes(n)) list.push(n); store.set("botAdmins", list);
    return reply(sock,m,`✅ Bot admin added: ${n}`);
  }
  if (c === "delbotadmin") {
    const n = digits(args[0]); const list=(store.get("botAdmins")||[]).filter(x=>x!==n); store.set("botAdmins",list);
    return reply(sock,m,`✅ Bot admin removed: ${n}`);
  }
  if (c === "botadmins") return reply(sock,m,`👮 Bot admins:\n${(store.get("botAdmins")||[]).map(x=>"+"+x).join("\n") || "None"}`);

  // Toggle settings.
  const toggleKeys = new Set([
    "welcome","goodbye","statusview","statuslike","autoread","autoreact","autotyping",
    "recording","online","anticall","antidelete","antispam","antilink","antiedit",
    "botProtect","gplinkauto","dailyai","groupai","aisticker"
  ]);
  if (toggleKeys.has(c)) {
    const key = c === "bot" ? "botProtect" : c;
    return reply(sock,m,toggle(key,args));
  }

  // Text setters.
  if (c === "setwelcome") {
    if (!isOwner(m)) return reply(sock,m,"❌ Owner only.");
    store.set("welcomeText", argText(args) || "👋 Welcome @user to the group!");
    return reply(sock,m,"✅ Welcome message updated.");
  }
  if (c === "setgoodbye") {
    if (!isOwner(m)) return reply(sock,m,"❌ Owner only.");
    store.set("goodbyeText", argText(args) || "👋 Goodbye @user!");
    return reply(sock,m,"✅ Goodbye message updated.");
  }

  // Safe utility implementations.
  if (c === "base64") return reply(sock,m,Buffer.from(argText(args),"utf8").toString("base64"));
  if (c === "unbase64") { try { return reply(sock,m,Buffer.from(argText(args),"base64").toString("utf8")); } catch { return reply(sock,m,"❌ Invalid Base64."); } }
  if (c === "urlencode") return reply(sock,m,encodeURIComponent(argText(args)));
  if (c === "urldecode") { try{return reply(sock,m,decodeURIComponent(argText(args)));}catch{return reply(sock,m,"❌ Invalid URL encoding.");} }
  if (c === "binary") return reply(sock,m,argText(args).split("").map(ch=>ch.charCodeAt(0).toString(2).padStart(8,"0")).join(" "));
  if (c === "dbinary") {
    try { return reply(sock,m,argText(args).split(/\s+/).map(x=>String.fromCharCode(parseInt(x,2))).join("")); }
    catch { return reply(sock,m,"❌ Invalid binary."); }
  }
  if (c === "time" || c === "timenow") return reply(sock,m,new Date().toString());
  if (c === "date") return reply(sock,m,new Date().toISOString().slice(0,10));
  if (c === "calculate") {
    const expr=argText(args);
    if (!/^[0-9+\-*/().%\s]+$/.test(expr)) return reply(sock,m,"❌ Only basic arithmetic is allowed.");
    try { const value=Function(`"use strict"; return (${expr})`)(); return reply(sock,m,String(value)); }
    catch { return reply(sock,m,"❌ Invalid calculation."); }
  }
  if (c === "id" || c === "getlid" || c === "cid") return reply(sock,m,`🆔 ${m.key.remoteJid}`);

  if (funReplies[c]) return reply(sock,m,funReplies[c]);

  // Group commands: use real Baileys group APIs where practical.
  if (isGroup(m)) {
    const jid = m.key.remoteJid;
    if (c === "groupinfo" || c === "ginfo") {
      const meta = await sock.groupMetadata(jid);
      return reply(sock,m,`👥 ${meta.subject}\nMembers: ${meta.participants.length}\nOwner: ${meta.owner || "Unknown"}`);
    }
    if (c === "link") {
      const code = await sock.groupInviteCode(jid);
      return reply(sock,m,`🔗 https://chat.whatsapp.com/${code}`);
    }
    if (c === "revoke") { await sock.groupRevokeInvite(jid); return reply(sock,m,"✅ Group invite link revoked."); }
    if (c === "tagall" || c === "hidetag") {
      const meta = await sock.groupMetadata(jid);
      const mentions = meta.participants.map(p=>p.id);
      const text = argText(args) || "📢 Everyone";
      return sock.sendMessage(jid,{text,mentions});
    }
    if (["add","kick","kick1","promote","demote"].includes(c)) {
      const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const target = mentioned[0] || (args[0] && `${digits(args[0])}@s.whatsapp.net`);
      if (!target || !digits(target)) return reply(sock,m,`Usage: ${prefix}${c} @user`);
      const action = c.startsWith("kick") ? "remove" : c;
      await sock.groupParticipantsUpdate(jid,[target],action);
      return reply(sock,m,`✅ ${c} completed.`);
    }
  }

  // Owner link access.
  if (c === "ownergroup" || (c === "owner" && ["gc","group","channel"].includes(String(args[0]||"").toLowerCase()))) {
    if (!isOwner(m)) return reply(sock,m,"❌ Owner only.");
    const sub=String(args[0]||"").toLowerCase();
    if (sub === "channel") return reply(sock,m,store.get("ownerChannelLink") || ownerChannelLink || "⚠️ No owner channel link configured.");
    return reply(sock,m,store.get("ownerGroupLink") || ownerGroupLink || "⚠️ No owner group link configured.");
  }

  // Registered-but-provider-dependent commands never crash the bot.
  if (commandSet.has("." + c) || commandSet.has(c)) {
    return reply(sock,m,`⚙️ ${prefix}${c} is registered in ICEMAN BOT, but this feature needs its specific media/search provider module. No external AI provider is used.`);
  }
  return reply(sock,m,`❌ Unknown command: ${prefix}${c}\nUse ${prefix}menu`);
}

function formatUptime(seconds) {
  const s=Math.floor(seconds), d=Math.floor(s/86400), h=Math.floor(s%86400/3600), m=Math.floor(s%3600/60), sec=s%60;
  return `${d}d ${h}h ${m}m ${sec}s`;
}

module.exports = {execute};
