// In-memory dedup cache
const processed = {};

const GAS_URL = "https://script.google.com/macros/s/AKfycbz1-CiuNiv14S2A4hgJufbD6Q6gKpLS50mYkSjGSG3AervH1betX3lqJcJWXs-pIG9pwQ/exec";

var TL = {
  "prima-ps5": "PrimÃ¡ria PS5",
  "prima-ps4": "PrimÃ¡ria PS4",
  "secun-ps5": "SecundÃ¡ria PS5",
  "secun-ps4": "SecundÃ¡ria PS4"
};

function getTK(cons, lic) {
  var c = (cons || "").toLowerCase();
  var l = (lic || "").toLowerCase();
  var ps5 = c.includes("ps5") || c.includes("playstation 5");
  var ps4 = c.includes("ps4") || c.includes("playstation 4");
  var prim = l.includes("prim");
  var sec = l.includes("secund");
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

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST,OPTIONS" }, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  try {
    var body = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
    var order = JSON.parse(body);
    if (order.status !== "processing") return { statusCode: 200, body: JSON.stringify({ skipped: true }) };

    var num = order.number || order.id;
    const key = "order-" + num;
    const now = Date.now();
    if (processed[key] && (now - processed[key]) < 86400000) {
      return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ skipped: true, reason: "already processed", order: num }) };
    }

    // Forward to Google Apps Script which handles Gmail directly
    var r = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
      redirect: "follow"
    });

    var result = await r.json();

    if (result.success) {
      processed[key] = Date.now();
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(result)
    };
  } catch(e) {
    return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: e.message }) };
  }
};
