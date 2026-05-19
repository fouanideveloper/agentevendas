// In-memory dedup cache (resets on cold start, but prevents rapid duplicate calls)
const processed = {};

var TL = {
  "prima-ps5": "PrimÃ¡ria PS5",
  "prima-ps4": "PrimÃ¡ria PS4",
  "secun-ps5": "SecundÃ¡ria PS5",
  "secun-ps4": "SecundÃ¡ria PS4"
};

var ALT = "ATENÃÃO - NÃO CRIAR O USUÃRIO COMO CONVIDADO ! - APERTE EM INICIAR SESSÃO MANUALMENTE";

var TP5 = [
  "ParabÃ©ns! VocÃª adquiriu a sua licenÃ§a PRIMÃRIA que te dÃ¡ direito a usar esta conta em 1 VÃDEO GAME!",
  "",
  "TERMOS DE GARANTIA E ORIENTAÃÃES",
  "",
  "1 - Os dados da conta devem permanecer inalterados (login, senha, ID ou qualquer outra coisa).",
  "2 - NÃ£o Ã© permitido RETIRAR verificaÃ§Ã£o de duas etapas da conta.",
  "3 - O cliente que desobedecer aos itens 1 e 2, irÃ¡ perder a conta sem direito de devoluÃ§Ã£o.",
  "4 - A conta nÃ£o deve ser compartilhada, sob pena de perda de garantia e acesso.",
  "5 - Em caso de versÃ£o errada, jogos errados ou coisa do tipo, nos avise em atÃ© 7 dias, em respeito ao prazo legal.",
  "6 - UsuÃ¡rio primÃ¡rio nÃ£o pode ficar acessando a conta criada, evitar ao mÃ¡ximo entrar nela, e sempre jogar nos demais usuÃ¡rios presentes no PS5.",
  "7 - Se a conta enviada for doada, trocada ou vendida, a garantia se encerra e nÃ£o daremos mais suporte.",
  "8 - Se excluir a conta do game, ele nÃ£o abre. Portanto, enquanto quiser jogar, precisa deixar a conta no seu PS5.",
  "9 - Damos garantia a perda de login e senha pelo prazo de 1 ano.",
  "10 - Em caso de formataÃ§Ã£o do seu PS5, pedimos que grave um vÃ­deo excluindo nossa conta antes, para caso querer outro acesso, esse mesmo seja gratuito.",
  "11 - Em caso de troca de console, pedimos que grave um vÃ­deo excluindo nossa conta antes.",
  "12 - O acesso Ã© vitalicio, se a conta permanecer no seu console original de primeira compra.",
  "13 - Quaisquer problemas, basta comunicar a este whatsapp 45999417922."
].join("\n");

var TP4 = TP5.replace(/PS5/g, "PS4");
var TS5 = TP5.replace("PRIMÃRIA", "SECUNDÃRIA").replace("UsuÃ¡rio primÃ¡rio", "UsuÃ¡rio secundÃ¡rio");
var TS4 = TP4.replace("PRIMÃRIA", "SECUNDÃRIA").replace("UsuÃ¡rio primÃ¡rio", "UsuÃ¡rio secundÃ¡rio");

var TUTS = {
  "prima-ps5": { text: TP5, link: "https://www.youtube.com/watch?v=ZnrUUgHKYKA" },
  "prima-ps4": { text: TP4, link: "https://youtu.be/xvr3oBFi9l0" },
  "secun-ps5": { text: TS5, link: "https://www.youtube.com/watch?v=ZnrUUgHKYKA" },
  "secun-ps4": { text: TS4, link: "https://www.youtube.com/watch?v=pTt1vyr0tLw&t=54s" }
};

function getTK(cons, lic) {
  var c = (cons || "").toLowerCase();
  var l = (lic || "").toLowerCase();
  var ps5 = c.includes("ps5") || c.includes("playstation 5");
  var ps4 = c.includes("ps4") || c.includes("playstation 4");
  var prim = l.includes("prim");
  var sec = l.includes("secun");
  if (prim && ps5) return "prima-ps5";
  if (prim && ps4) return "prima-ps4";
  if (sec && ps5) return "secun-ps5";
  if (sec && ps4) return "secun-ps4";
  return prim ? "prima-ps5" : "secun-ps5";
}

function pCons(name) {
  var n = (name || "").toUpperCase();
  if ((n.includes("PS5") && n.includes("PS4")) || n.includes("PS4/PS5")) return "PS5";
  if (n.includes("PS5")) return "PS5";
  if (n.includes("PS4")) return "PS4";
  return "PS5";
}

function pConsMeta(order) {
  var meta = order.meta_data || [];
  for (var i = 0; i < meta.length; i++) {
    var k = (meta[i].key || "").toLowerCase();
    if (k === "_billing_console_" || k === "billing_console_" || k === "billing_console" || k === "_billing_console" || k.includes("console")) {
      var v = (meta[i].value || "").toString().toLowerCase();
      if (v.includes("ps5") || v.includes("playstation 5")) return "PS5";
      if (v.includes("ps4") || v.includes("playstation 4")) return "PS4";
    }
  }
  return "";
}

function pLic(name) {
  return (name || "").toLowerCase().includes("secund") ? "SecundÃ¡ria" : "PrimÃ¡ria";
}

function pGame(name) {
  return (name || "").split("-")[0].trim();
}

function nl2br(s) {
  return (s || "").split("\n").join("<br>");
}

async function getToken() {
  var r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token"
    })
  });
  return (await r.json()).access_token;
}

async function sendDraft(tok, to, subj, html) {
  var subjB64 = Buffer.from(subj, "utf8").toString("base64");
  var htmlB64 = Buffer.from(html, "utf8").toString("base64");
  var mime = [
    "From: me",
    "To: " + to,
    "Subject: =?UTF-8?B?" + subjB64 + "?=",
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    htmlB64
  ].join("\r\n");
  var raw = Buffer.from(mime, "utf8").toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  var r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
    method: "POST",
    headers: { "Authorization": "Bearer " + tok, "Content-Type": "application/json" },
    body: JSON.stringify({ message: { raw: raw } })
  });
  return r.json();
}

async function makeDraft(tok, item, order, cn, num, sn, wpp, cm) {
  var cons = cm || pCons(item.name) || "PS5";
  var lm = (item.meta_data || []).find(function(m) {
    return m.key === "LicenÃ§as" || m.key === "pa_licencas" || (m.key || "").toLowerCase().includes("licen");
  });
  var licRaw = lm ? (lm.display_value || lm.value || "") : "";
  var lic;
  if (licRaw) {
    var licL = licRaw.toLowerCase();
    if (licL.includes("secund")) lic = "SecundÃ¡ria";
    else if (licL.includes("prim")) lic = "PrimÃ¡ria";
    else lic = licRaw;
  } else {
    lic = pLic(item.name);
  }
  var tk = getTK(cons, lic);
  var tut = TUTS[tk] || TUTS["prima-ps5"];
  var gn = pGame(item.name);
  var subj = "Pedido #" + num + " " + gn + " - " + cons + " - DIGITAL - " + lic;

  var cr = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01", "x-api-key": process.env.ANTHROPIC_API_KEY },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 300,
      system: "Agente da loja " + sn + ". Escreva: [S]saudaÃ§Ã£o 1 linha[/S][E]encerramento 1 linha[/E]",
      messages: [{ role: "user", content: cn + " | #" + num + " | " + gn + " | " + cons + " | " + lic }]
    })
  });
  var ct = ((await cr.json()).content || []).map(function(c) { return c.text || ""; }).join("");
  var sm = ct.match(/\[S\]([\s\S]*?)\[\/S\]/);
  var em = ct.match(/\[E\]([\s\S]*?)\[\/E\]/);
  var sau = sm ? sm[1].trim() : "OlÃ¡, " + cn + "!";
  var enc = em ? em[1].trim() : "Qualquer dÃºvida estamos Ã  disposiÃ§Ã£o!";
  var wl = wpp ? "WhatsApp: " + wpp + "<br>" : "";
  var arow = '<p style="color:red;font-weight:bold;margin:6px 0">' + ALT + '</p>';
  arow = arow + arow + arow;
  var tlink = tut.link
    ? '<p><strong>VÃDEO DE TUTORIAL (' + TL[tk] + '): </strong><a href="' + tut.link + '">' + tut.link + '</a></p>'
    : "";
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#222">'
    + '<p>' + sau + '</p>'
    + '<table style="border:1px solid #ccc;border-collapse:collapse;margin:14px 0">'
    + '<tr style="background:#f5f5f5"><td colspan="2" style="padding:8px 12px;font-weight:bold;border:1px solid #ccc">DADOS DE CRIAÃÃO DA CONTA</td></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #ccc;font-weight:bold">Email</td><td style="padding:8px 12px;border:1px solid #ccc;background:#fff8e1;min-width:180px"></td></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #ccc;font-weight:bold">Senha</td><td style="padding:8px 12px;border:1px solid #ccc;background:#fff8e1"></td></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #ccc;font-weight:bold">CÃ³digo</td><td style="padding:8px 12px;border:1px solid #ccc;background:#fff8e1"></td></tr>'
    + '</table>'
    + arow + tlink
    + '<p>' + nl2br(tut.text) + '</p>'
    + '<p>' + enc + '</p>'
    + '<hr><p style="color:#666;font-size:12px">Equipe ' + sn + '<br>' + wl + 'Pedido: #' + num + '</p>'
    + '</body></html>';

  var d = await sendDraft(tok, order.billing.email, subj, html);
  return { draftId: d.id, game: gn, tutorial: TL[tk] };
}

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST,OPTIONS" }, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  try {
    var body = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
    var order = JSON.parse(body);
    if (!["processing", "completed"].includes(order.status)) return { statusCode: 200, body: JSON.stringify({ skipped: true }) };

    var num = order.number || order.id;
    const key = "order-" + num;
    const now = Date.now();
    if (processed[key] && (now - processed[key]) < 86400000) {
      return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ skipped: true, reason: "already processed", order: num }) };
    }

    var cn = ((order.billing.first_name || "") + " " + (order.billing.last_name || "")).trim();
    var sn = process.env.STORE_NAME || "Express Games Digitais";
    var wpp = process.env.STORE_WPP || "";
    var cm = pConsMeta(order);
    var tok = await getToken();
    var drafts = [];
    for (var i = 0; i < order.line_items.length; i++) {
      var res = await makeDraft(tok, order.line_items[i], order, cn, num, sn, wpp, cm);
      drafts.push(res);
    }

    processed[key] = Date.now();
    return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, drafts: drafts, count: drafts.length }) };
  } catch(e) {
    return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: e.message }) };
  }
};
