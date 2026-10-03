# ICEMAN BOT 👑

Full ICEMAN BOT project with:
- Real WhatsApp pairing-code login through Baileys
- Browser pairing website
- Full command registry supplied by the owner
- Gemini + Local AI only
- Persistent settings
- Owner/bot-admin controls
- Safe error handling so registered commands do not crash the process
- GitHub-ready `.env.example` and `.gitignore`

## Requirements

- Node.js 20+
- A WhatsApp account that can be linked
- Gemini API key only if you want Gemini
- Optional Local AI HTTP endpoint

## Install

```bash
npm install
cp .env.example .env
```

Edit `.env` on your server. **Do not upload `.env` to GitHub.**

Start:

```bash
npm start
```

Open:

```text
http://YOUR-SERVER:3000
```

## Real pairing flow

1. Enter a WhatsApp number using international digits.
2. The server creates a Baileys session.
3. The server requests a real WhatsApp pairing code.
4. Enter the code in WhatsApp:
   Settings → Linked devices → Link a device → Link with phone number instead.
5. The server detects `connection: open`.
6. The server sends:
   `✅ ICEMAN BOT synced successfully!`

Session credentials are stored under `sessions/` and are ignored by Git.

## AI

Supported:
- Gemini
- Local AI

Not supported:
- Ollama
- OpenAI
- Other AI APIs

`LOCAL_AI_URL` is expected to accept a JSON POST such as:

```json
{"prompt":"Hello"}
```

and return either JSON with `response`, `text`, or `output`, or plain text.

## Owner

Set:

```env
OWNER_NUMBER=233545274761
```

Owner-only commands include the owner/settings/admin controls.

For owner group/channel links, use the persisted settings or environment values. The owner-only command forms are:

```text
.owner gc
.owner group
.owner channel
.owner setgc https://chat.whatsapp.com/...
.owner setchannel https://...
```

## Command completeness

`src/command-list.json` contains every command name supplied in the final command list, including the EXTRA KAYA COMMANDS section. Duplicate command names are preserved in their original category listings and deduplicated only in the internal command registry.

## Provider-dependent commands

The project does **not** delete any supplied command. Commands requiring image, video, social-download, anime, search, sticker-generation, or enhancement providers are registered safely and return a clear configuration message until their specific provider module is connected.

This avoids fake results and prevents missing-provider crashes.

## Security

Never commit:
- `.env`
- `sessions/`
- Gemini keys
- WhatsApp auth credentials

Use your hosting provider's Environment Variables/Secrets for production.

## Deployment

Any Node.js host that supports long-running WebSocket connections can run the bot. Make sure the host allows outbound HTTPS/WebSocket traffic and persistent filesystem storage for `sessions/`.

For ephemeral hosts, session persistence can be lost after restart; use persistent disk or a supported persistent storage design.

## Important

The pairing website is a real backend flow. It does not generate fake codes in JavaScript. Pairing codes come from the WhatsApp/Baileys session.
