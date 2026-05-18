var TL={"prima-ps5":"PrimÃ¡ria PS5","prima-ps4":"PrimÃ¡ria PS4","secun-ps5":"SecundÃ¡ria PS5","secun-ps4":"SecundÃ¡ria PS4"};
var ALT="ATENÃÃO - NÃO CRIAR O USUÃRIO COMO CONVIDADO ! - APERTE EM INICIAR SESSÃO MANUALMENTE";
var T_P5="ParabÃ©ns! VocÃª adquiriu a sua licenÃ§a PRIMÃRIA que te dÃ¡ direito a usar esta conta em 1 VÃDEO GAME!\n\nTERMOS DE GARANTIA E ORIENTAÃÃES\n\n1 - Os dados da conta devem permanecer inalterados (login, senha, ID ou qualquer outra coisa).\n2 - NÃ£o Ã© permitido RETIRAR verificaÃ§Ã£o de duas etapas da conta.\n3 - O cliente que desobedecer aos itens 1 e 2, irÃ¡ perder a conta sem direito de devoluÃ§Ã£o.\n4 - A conta nÃ£o deve ser compartilhada, sob pena de perda de garantia e acesso.\n5 - Em caso de versÃ£o errada, jogos errados ou coisa do tipo, nos avise em atÃ© 7 dias, em respeito ao prazo legal.\n6 - UsuÃ¡rio primÃ¡rio nÃ£o pode ficar acessando a conta criada, evitar ao mÃ¡ximo entrar nela, e sempre jogar nos demais usuÃ¡rios presentes no PS5.\n7 - Se a conta enviada for doada, trocada ou vendida, a garantia se encerra e nÃ£o daremos mais suporte.\n8 - Se excluir a conta do game, ele nÃ£o abre. Portanto, enquanto quiser jogar, precisa deixar a conta no seu PS5.\n9 - Damos garantia a perda de login e senha pelo prazo de 1 ano.\n10 - Em caso de formataÃ§Ã£o do seu PS5, pedimos que grave um vÃ­deo excluindo nossa conta antes, para caso querer outro acesso, esse mesmo seja gratuito.\n11 - Em caso de troca de console, pedimos que grave um vÃ­deo excluindo nossa conta antes.\n12 - O acesso Ã© vitalicio, se a conta permanecer no seu console original de primeira compra.\n13 - Quaisquer problemas, basta comunicar a este whatsapp 45999417922.";
var T_P4=T_P5.replace(/PS5/g,"PS4");
var T_S5=T_P5.replace("PRIMÃRIA","SECUNDÃRIA").replace("UsuÃ¡rio primÃ¡rio","UsuÃ¡rio secundÃ¡rio");
var T_S4=T_P4.replace("PRIMÃRIA","SECUNDÃRIA").replace("UsuÃ¡rio primÃ¡rio","UsuÃ¡rio secundÃ¡rio");
var TUTS={
  "prima-ps5":{text:T_P5,link:"https://www.youtube.com/watch?v=ZnrUUgHKYKA"},
  "prima-ps4":{text:T_P4,link:"https://youtu.be/xvr3oBFi9l0"},
  "secun-ps5":{text:T_S5,link:"https://www.youtube.com/watch?v=ZnrUUgHKYKA"},
  "secun-ps4":{text:T_S4,link:"https://www.youtube.com/watch?v=pTt1vyr0tLw&t=54s"}
};
function getTK(cons,lic){var c=(cons||"").toLowerCase(),l=(lic||"").toLowerCase();var ps5=c.indexOf("ps5")>=0||c.indexOf("playstation 5")>=0;var ps4=c.indexOf("ps4")>=0||c.indexOf("playstation 4")>=0;var prim=l.indexOf("prim")>=0;var sec=l.indexOf("secun")>=0;if(prim&&ps5)return"prima-ps5";if(prim&&ps4)return"prima-ps4";if(sec&&ps5)return"secun-ps5";if(sec&&ps4)return"secun-ps4";return prim?"prima-ps5":"secun-ps5";}
function parseCons(name){var n=(name||"").toUpperCase();if((n.indexOf("PS5")>=0&&n.indexOf("PS4")>=0)||n.indexOf("PS4/PS5")>=0)return"PS5";if(n.indexOf("PS5")>=0)return"PS5";if(n.indexOf("PS4")>=0)return"PS4";return"PS5";}
function parseConsMeta(o){var m=o.meta_data||[];for(var i=0;i<m.length;i++){var k=(m[i].key||"").toLowerCase();if(k==="billing_console"||k==="console"||k.indexOf("console")>=0){var v=(m[i].value||"").toLowerCase();if(v.indexOf("ps5")>=0||v.indexOf("playstation 5")>=0)return"PS5";if(v.indexOf("ps4")>=0||v.indexOf("playstation 4")>=0)return"PS4";return m[i].value;}}return"";}
function parseLic(name){var n=(name||"").toLowerCase();return n.indexOf("secund")>=0?"SecundÃ¡ria":"PrimÃ¡ria";}
function gameN(name){return(name||"").split("-")[0].trim();}
function br(s){return(s||"").replace(/\n/g,"<br>");}
async function getGmailToken(){
  var r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET,refresh_token:process.env.GOOGLE_REFRESH_TOKEN,grant_type:"refresh_token"})});
  var d=await r.json();return d.access_token;
}
async function createDraft(token,to,subject,htmlBody){
  var msg=["To: "+to,"Subject: =?utf-8?B?"+Buffer.from(subject).toString("base64")+"?=","MIME-Version: 1.0","Content-Type: text/html; charset=utf-8","Content-Transfer-Encoding: base64","",Buffer.from(htmlBody).toString("base64")].join("\r\n");
  var raw=Buffer.from(msg).toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  var r=await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts",{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({message:{raw:raw}})});
  return r.json();
}
async function buildAndSendDraft(gmailToken,item,order,cn,num,sn,wpp,consMeta){
  var cons=parseCons(item.name)||consMeta||"PS5";
  var lm=(item.meta_data||[]).find(function(m){return m.key==="LicenÃ§as"||(m.key||"").toLowerCase().indexOf("licen")>=0;});
  var lic=lm?lm.value:parseLic(item.name);
  var tk=getTK(cons,lic);
  var tut=TUTS[tk]||TUTS["prima-ps5"];
  var gn=gameN(item.name);
  var subj="Pedido #"+num+" "+gn+" - "+cons+" - DIGITAL - "+lic;
  var cr=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","anthropic-version":"2023-06-01","x-api-key":process.env.ANTHROPIC_API_KEY},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,system:"VocÃª Ã© agente da loja "+sn+". Escreva: 1. SaudaÃ§Ã£o calorosa de 1-2 linhas. 2. Encerramento de 2 linhas. Formato: [S]texto[/S][E]texto[/E]",messages:[{role:"user",content:"Cliente: "+cn+" | Pedido: #"+num+" | Jogo: "+gn+" | Console: "+cons+" | LicenÃ§a: "+lic}]})});
  var cd=await cr.json();
  var ct=(cd.content||[]).map(function(c){return c.text||"";}).join("");
  var sm=ct.match(/\[S\]([\s\S]*?)\[\/S\]/);
  var em2=ct.match(/\[E\]([\s\S]*?)\[\/E\]/);
  var sau=sm?sm[1].trim():"OlÃ¡, "+cn+"! Seu pedido foi confirmado.";
  var enc=em2?em2[1].trim():"Qualquer dÃºvida estamos Ã  disposiÃ§Ã£o!";
  var alertRow="<p style=\"color:red;font-weight:bold;margin:8px 0\">"+ALT+"</p><p style=\"color:red;font-weight:bold;margin:8px 0\">"+ALT+"</p><p style=\"color:red;font-weight:bold;margin:8px 0\">"+ALT+"</p>";
  var tutLink=tut.link?"<p><strong>VÃDEO DE TUTORIAL ("+TL[tk]+"): </strong><a href=\""+tut.link+"\">"+tut.link+"</a></p>":"";
  var wppLine=wpp?"WhatsApp: "+wpp+"<br>":"";
  var html=
    "<!DOCTYPE html><html><body style=\"font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#222\">"+
    "<p>"+sau+"</p>"+
    "<table style=\"border:1px solid #ccc;border-collapse:collapse;margin:16px 0\">"+
    "<tr style=\"background:#f5f5f5\"><td colspan=\"2\" style=\"padding:8px 12px;font-weight:bold;border:1px solid #ccc\">DADOS DE CRIAÃÃO DA CONTA</td></tr>"+
    "<tr><td style=\"padding:8px 12px;border:1px solid #ccc;font-weight:bold\">Email</td><td style=\"padding:8px 12px;border:1px solid #ccc;background:#fff8e1;font-family:monospace\"></td></tr>"+
    "<tr><td style=\"padding:8px 12px;border:1px solid #ccc;font-weight:bold\">Senha</td><td style=\"padding:8px 12px;border:1px solid #ccc;background:#fff8e1;font-family:monospace\"></td></tr>"+
    "<tr><td style=\"padding:8px 12px;border:1px solid #ccc;font-weight:bold\">CÃ³digo</td><td style=\"padding:8px 12px;border:1px solid #ccc;background:#fff8e1;font-family:monospace\"></td></tr>"+
    "</table>"+
    alertRow+tutLink+"<p>"+br(tut.text)+"</p><p>"+enc+"</p>"+
    "<hr style=\"margin:16px 0\">"+
    "<p style=\"color:#666;font-size:12px\">Equipe "+sn+"<br>"+wppLine+"Pedido: #"+num+"</p>"+
    "</body></html>";
  var draft=await createDraft(gmailToken,order.billing.email,subj,html);
  return{draftId:draft.id,game:gn,tutorial:TL[tk]};
}
exports.handler=async function(event){
  if(event.httpMethod==="OPTIONS")return{statusCode:200,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"POST, OPTIONS"},body:""};
  if(event.httpMethod!=="POST")return{statusCode:405,body:"Method Not Allowed"};
  try{
    var body=event.isBase64Encoded?Buffer.from(event.body,"base64").toString("utf8"):event.body;
    var order=JSON.parse(body);
    if(!["processing","completed"].includes(order.status))return{statusCode:200,body:JSON.stringify({skipped:true,status:order.status})};
    var cn=((order.billing.first_name||"")+" "+(order.billing.last_name||"")).trim();
    var num=order.number||order.id;
    var sn=process.env.STORE_NAME||"Express Games Digitais";
    var wpp=process.env.STORE_WPP||"";
    var consMeta=parseConsMeta(order);
    var gmailToken=await getGmailToken();
    var drafts=[];
    for(var i=0;i<order.line_items.length;i++){
      var result=await buildAndSendDraft(gmailToken,order.line_items[i],order,cn,num,sn,wpp,consMeta);
      drafts.push(result);
    }
    return{statusCode:200,headers:{"Access-Control-Allow-Origin":"*"},body:JSON.stringify({success:true,drafts:drafts,order:num,client:cn,count:drafts.length})};
  }catch(e){
    return{statusCode:500,headers:{"Access-Control-Allow-Origin":"*"},body:JSON.stringify({error:e.message})};
  }
};