const numberEl=document.getElementById("number");
const pairBtn=document.getElementById("pair");
const statusEl=document.getElementById("status");
const codeBox=document.getElementById("codeBox");
const codeEl=document.getElementById("code");
const copyBtn=document.getElementById("copy");
const success=document.getElementById("success");

function setStatus(t){statusEl.textContent=t}
function normalize(v){return String(v).replace(/\D/g,"")}

pairBtn.addEventListener("click", async ()=>{
  const number=normalize(numberEl.value);
  if(number.length<8){setStatus("❌ Enter a valid international WhatsApp number.");return}
  pairBtn.disabled=true; codeBox.classList.add("hidden"); success.classList.add("hidden");
  setStatus("⏳ Requesting a real pairing code from WhatsApp...");
  try{
    const r=await fetch("/api/pair",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({number})});
    const data=await r.json();
    if(!data.ok) throw new Error(data.error||"Pairing request failed.");
    if(data.pairingCode){
      codeEl.textContent=data.pairingCode;
      codeBox.classList.remove("hidden");
      setStatus("📱 On WhatsApp: Settings → Linked devices → Link a device → Link with phone number instead.");
      poll(number);
    }else{
      setStatus("Connected or waiting for WhatsApp. Check the status below.");
      poll(number);
    }
  }catch(e){setStatus("❌ "+e.message)}
  finally{pairBtn.disabled=false}
});

copyBtn.addEventListener("click",async()=>{
  await navigator.clipboard.writeText(codeEl.textContent);
  copyBtn.textContent="Copied!";
  setTimeout(()=>copyBtn.textContent="Copy code",1200);
});

async function poll(number){
  for(let i=0;i<120;i++){
    await new Promise(r=>setTimeout(r,2000));
    try{
      const r=await fetch("/api/status/"+encodeURIComponent(number));
      const s=await r.json();
      if(s.status==="connected"){
        success.classList.remove("hidden");
        setStatus("✅ WhatsApp session connected.");
        codeBox.classList.add("hidden");
        return;
      }
      if(s.status==="error"){setStatus("❌ "+(s.lastError||"WhatsApp pairing failed."));return}
      if(s.pairingCode){codeEl.textContent=s.pairingCode;codeBox.classList.remove("hidden")}
      setStatus("⏳ Status: "+s.status);
    }catch{}
  }
}
