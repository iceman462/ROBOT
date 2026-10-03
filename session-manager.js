const fs = require("fs");
const path = require("path");
const pino = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const {execute} = require("./commands");
const {prefix, botName} = require("./config");

const sessions = new Map();
const baseDir = path.join(process.cwd(), "sessions");

function cleanNumber(v="") { return String(v).replace(/\D/g, ""); }
function sessionDir(id) { return path.join(baseDir, cleanNumber(id)); }

function publicState(s) {
  return {
    id: s.id,
    number: s.number,
    status: s.status,
    connected: s.status === "connected",
    pairingCode: s.pairingCode || null,
    lastError: s.lastError || null,
    createdAt: s.createdAt
  };
}

async function createSession(number) {
  number = cleanNumber(number);
  if (!number || number.length < 8) throw new Error("Enter a valid international WhatsApp number, digits only.");

  const id = number;
  if (sessions.has(id)) {
    const old = sessions.get(id);
    if (old.status === "connected" || old.status === "connecting" || old.status === "pairing") return publicState(old);
  }

  fs.mkdirSync(sessionDir(id), {recursive:true});
  const {state, saveCreds} = await useMultiFileAuthState(sessionDir(id));
  const s = {
    id, number, status: state.creds.registered ? "connecting" : "pairing",
    pairingCode: null, lastError: null, createdAt: new Date().toISOString(), sock: null
  };
  sessions.set(id,s);

  const sock = makeWASocket({
    auth: state,
    logger: pino({level:"silent"}),
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    syncFullHistory: false,
    browser: [botName, "Chrome", "1.0.0"]
  });
  s.sock = sock;

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({connection, lastDisconnect}) => {
    if (connection === "open") {
      s.status = "connected";
      s.pairingCode = null;
      s.lastError = null;
      try {
        await sock.sendMessage(`${number}@s.whatsapp.net`, {
          text: "✅ ICEMAN BOT synced successfully!\n\nYour WhatsApp session is now connected."
        });
      } catch {}
    } else if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        s.status = "logged_out";
        try { fs.rmSync(sessionDir(id), {recursive:true, force:true}); } catch {}
        sessions.delete(id);
      } else {
        s.status = "disconnected";
      }
    }
  });

  sock.ev.on("messages.upsert", async ({messages}) => {
    for (const m of messages || []) {
      if (!m.message || m.key.fromMe) continue;
      const text = m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption ||
        m.message.videoMessage?.caption || "";
      if (!text.startsWith(prefix)) continue;
      const parts = text.slice(prefix.length).trim().split(/\s+/);
      const command = parts.shift()?.toLowerCase();
      if (!command) continue;
      try { await execute(sock,m,command,parts); }
      catch (err) {
        console.error("Command error:", err);
        try { await sock.sendMessage(m.key.remoteJid,{text:"❌ Command error. Check the server logs."},{quoted:m}); } catch {}
      }
    }
  });

  // Pairing codes are real codes requested from WhatsApp via Baileys.
  if (!state.creds.registered) {
    s.status = "pairing";
    let lastErr;
    for (let i=0; i<5; i++) {
      try {
        await new Promise(r=>setTimeout(r, 1200));
        const code = await sock.requestPairingCode(number);
        s.pairingCode = code;
        break;
      } catch (e) {
        lastErr = e;
        await new Promise(r=>setTimeout(r, 1500));
      }
    }
    if (!s.pairingCode) {
      s.status = "error";
      s.lastError = lastErr?.message || "WhatsApp did not return a pairing code.";
    }
  }
  return publicState(s);
}

function getSession(id) {
  return sessions.get(cleanNumber(id));
}

function listSessions() {
  return [...sessions.values()].map(publicState);
}

async function closeAll() {
  for (const s of sessions.values()) {
    try { s.sock?.end?.(new Error("Server shutdown")); } catch {}
  }
}

module.exports = {createSession,getSession,listSessions,closeAll};
