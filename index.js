const express = require("express");
const path = require("path");
const {port} = require("./config");
const {createSession,listSessions} = require("./session-manager");

const app = express();
app.disable("x-powered-by");
app.use(express.json({limit:"32kb"}));
app.use(express.static(path.join(process.cwd(),"public")));

app.get("/api/health", (req,res)=>res.json({ok:true,name:"ICEMAN BOT"}));

app.post("/api/pair", async (req,res)=>{
  try {
    const number = String(req.body?.number || "");
    const result = await createSession(number);
    res.json({ok:true,...result});
  } catch (e) {
    res.status(400).json({ok:false,error:e.message});
  }
});

app.get("/api/status/:number", (req,res)=>{
  const s = require("./session-manager").getSession(req.params.number);
  if (!s) return res.json({ok:true,status:"not_found"});
  res.json({ok:true,...s});
});

app.get("/api/sessions", (req,res)=>{
  // Deliberately returns only non-secret session state.
  res.json({ok:true,sessions:listSessions().map(s=>({...s,pairingCode:null}))});
});

app.get("*",(req,res)=>{
  res.sendFile(path.join(process.cwd(),"public","index.html"));
});

app.listen(port,()=>console.log(`🌐 ICEMAN BOT pairing website: http://localhost:${port}`));
