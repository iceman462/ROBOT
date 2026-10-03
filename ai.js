const {geminiKey, localAiUrl} = require("./config");

async function askGemini(prompt) {
  if (!geminiKey) return "Gemini is not configured. Add GEMINI_API_KEY on the server.";
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + encodeURIComponent(geminiKey);
  const response = await fetch(url, {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify({contents: [{parts: [{text: String(prompt)}]}]})
  });
  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") ||
    "Gemini returned no text.";
}

async function askLocal(prompt) {
  if (!localAiUrl) return "Local AI is not configured. Set LOCAL_AI_URL on the server.";
  const response = await fetch(localAiUrl, {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify({prompt: String(prompt)})
  });
  if (!response.ok) throw new Error(`Local AI HTTP ${response.status}`);
  const type = response.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    const data = await response.json();
    return data.response || data.text || data.output || JSON.stringify(data);
  }
  return await response.text();
}

async function askAI(prompt) {
  try {
    if (localAiUrl) return await askLocal(prompt);
    return await askGemini(prompt);
  } catch (err) {
    if (localAiUrl && geminiKey) {
      try { return await askGemini(prompt); } catch {}
    }
    return `AI error: ${err.message}`;
  }
}

module.exports = {askAI, askGemini, askLocal};
