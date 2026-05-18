exports.handler=async function(event){
  if(event.httpMethod==="OPTIONS")return{statusCode:200,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type, x-api-key","Access-Control-Allow-Methods":"POST, OPTIONS"},body:""};
  if(event.httpMethod!=="POST")return{statusCode:405,body:"Method Not Allowed"};
  try{
    var apiKey=event.headers["x-api-key"]||event.headers["X-Api-Key"];
    if(!apiKey)return{statusCode:400,body:JSON.stringify({error:"Missing API key"})};
    var body=event.isBase64Encoded?Buffer.from(event.body,"base64").toString("utf8"):event.body;
    if(!body)return{statusCode:400,body:JSON.stringify({error:"Missing body"})};
    var r=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"Content-Type":"application/json","anthropic-version":"2023-06-01","x-api-key":apiKey},
      body:body
    });
    var data=await r.text();
    return{statusCode:r.status,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"},body:data};
  }catch(e){
    return{statusCode:500,headers:{"Access-Control-Allow-Origin":"*"},body:JSON.stringify({error:e.message})};
  }
};