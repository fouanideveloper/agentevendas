const TUT_LABELS = {"prima-ps5":"Primária PS5","prima-ps4":"Primária PS4","secun-ps5":"Secundária PS5","secun-ps4":"Secundária PS4"};

function getTutKey(cons,lic){
  var c=(cons||"").toLowerCase(),l=(lic||"").toLowerCase();
  var ps5=c.includes("ps5")||c.includes("playstation 5");
  var ps4=c.includes("ps4")||c.includes("playstation 4");
  var prim=l.includes("prim");
  var sec=l.includes("secun")||l.includes("secondary");
  if(prim&&ps5)return"prima-ps5";
  if(prim&&ps4)return"prima-ps4";
  if(sec&&ps5)return"secun-ps5";
  if(sec&&ps4)return"secun-ps4";
  return prim?"prima-ps5":"secun-ps5";
}

function parseConsole(name){
  var n=(name||"").toUpperCase();
  if((n.includes("PS5")&&n.includes("PS4"))||n.includes("PS4/PS5"))return"PS5";
  if(n.includes("PS5"))return"PS5";
  if(n.includes("PS4"))return"PS4";
  return"PS5";
}

function parseConsoleMeta(order){
  var meta=order.meta_data||[];
  var f=meta.find(function(m){var k=(m.key||"").toLowerCase();return k==="billing_console"||k==="console"||k.includes("console");});
  if(!f)return"";
  var v=(f.value||"").toLowerCase();
  if(v.includes("ps5")||v.includes("playstation 5"))return"PS5";
  if(v.includes("ps4")||v.includes("playstation 4"))return"PS4";
  return f.value;
}

function parseLicense(name){
  var n=(name||"").toLowerCase();
  if(n.includes("secund"))return"Secundária";
  return"Primária";
}

function gameNameFrom(name){return(name||"").split("-")[0].trim();}

async function getGmailToken(){
  var r=await fetch("https://oauth2.googleapis.com/token",{
    method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET,refresh_token:process.env.GOOGLE_REFRESH_TOKEN,grant_type:"refresh_token"})
  });
  var d=await r.json();
  return d.access_token;
}

async function createDraft(token,to,subject,body){
  var email=["To: "+to,"Subject: =?utf-8?B?"+Buffer.from(subject).toString("base64")+"?=","MIME-Version: 1.0","Content-Type: text/plain; charset=utf-8","Content-Transfer-Encoding: base64","",Buffer.from(body).toString("base64")].join("\r\n");
  var raw=Buffer.from(email).toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  var r=await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts",{
    method:"POST",
    headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},
    body:JSON.stringify({message:{raw:raw}})
  });
  return r.json();
}

exports.handler=async function(event){
  if(event.httpMethod==="OPTIONS")return{statusCode:200,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"POST, OPTIONS"},body:""};
  if(event.httpMethod!=="POST")return{statusCode:405,body:"Method Not Allowed"};
  try{
    var body=event.isBase64Encoded?Buffer.from(event.body,"base64").toString("utf8"):event.body;
    var order=JSON.parse(body);
    if(!["processing","completed"].includes(order.status))return{statusCode:200,body:JSON.stringify({skipped:true})};
    var item=order.line_items[0];
    var clientName=((order.billing.first_name||"")+" "+(order.billing.last_name||"")).trim();
    var clientEmail=order.billing.email;
    var orderNum=order.number||order.id;
    var cons=parseConsole(item.name)||parseConsoleMeta(order)||"PS5";
    var licMeta=(item.meta_data||[]).find(function(m){return m.key==="Licenças"||(m.key||"").toLowerCase().includes("licen");});
    var lic=licMeta?licMeta.value:parseLicense(item.name);
    var tutKey=getTutKey(cons,lic);
    var tutLabel=TUT_LABELS[tutKey];
    var gameName=gameNameFrom(item.name);
    var subject="Pedido #"+orderNum+" "+gameName+" - "+cons+" - DIGITAL - "+lic;
    var envKey=tutKey.replace(/-/g,"_").toUpperCase();
    var tutText=process.env["TUT_TEXT_"+envKey]||"";
    var tutAlert=process.env["TUT_ALERT_"+envKey]||"";
    var tutLink=process.env["TUT_LINK_"+envKey]||"";
    var storeName=process.env.STORE_NAME||"Express Games Digitais";
    var storeWpp=process.env.STORE_WPP||"";
    var cr=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"Content-Type":"application/json","anthropic-version":"2023-06-01","x-api-key":process.env.ANTHROPIC_API_KEY},
      body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,system:"Você é agente de fulfillment da loja "+storeName+". Escreva APENAS: 1. Saudação calorosa de 1-2 linhas 2. Encerramento de 2-3 linhas confirmando licença "+lic+". Formato: [SAUDACAO]texto[/SAUDACAO][ENCERRAMENTO]texto[/ENCERRAMENTO]",messages:[{role:"user",content:"Cliente: "+clientName+" | Pedido: #"+orderNum+" | Jogo: "+gameName+" | Console: "+cons+" | Licença: "+lic}]})
    });
    var cd=await cr.json();
    var ct=(cd.content||[]).map(function(c){return c.text||"";}).join("");
    var sm=ct.match(/\[SAUDACAO\]([\s\S]*?)\[\/SAUDACAO\]/);
    var em=ct.match(/\[ENCERRAMENTO\]([\s\S]*?)\[\/ENCERRAMENTO\]/);
    var saudacao=sm?sm[1].trim():"Olá, "+clientName+"! Seu pedido foi confirmado.";
    var enc=em?em[1].trim():"Qualquer dúvida estamos à disposição!";
    var alertLine=tutAlert?"⚠️ "+tutAlert+"\n⚠️ "+tutAlert+"\n⚠️ "+tutAlert+"\n\n":"";
    var linkLine=tutLink?"VÍDEO TUTORIAL ("+tutLabel+"): "+tutLink+"\n\n":"";
    var textLine=tutText?"INSTRUÇÕES DE ATIVAÇÃO:\n"+tutText+"\n\n":"";
    var wppLine=storeWpp?"WhatsApp: "+storeWpp+"\n":"";
    var emailBody=saudacao+"\n\n--- DADOS DE ACESSO --- (preencha antes de enviar)\nEmail: [ PREENCHER ]\nSenha: [ PREENCHER ]\nCódigo: [ PREENCHER ]\n\n"+alertLine+linkLine+textLine+enc+"\n\nEquipe "+storeName+"\n"+wppLine+"Pedido: #"+orderNum;
    var at=await getGmailToken();
    var draft=await createDraft(at,clientEmail,subject,emailBody);
    return{statusCode:200,headers:{"Access-Control-Allow-Origin":"*"},body:JSON.stringify({success:true,draftId:draft.id,order:orderNum})};
  }catch(e){
    return{statusCode:500,headers:{"Access-Control-Allow-Origin":"*"},body:JSON.stringify({error:e.message})};
  }
};