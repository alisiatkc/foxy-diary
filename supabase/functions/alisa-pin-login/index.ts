
const allowedOrigin="https://alisiatkc.github.io";
const cors={"Access-Control-Allow-Origin":allowedOrigin,"Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="POST")return reply({message:"Метод не поддерживается"},405);
 const origin=req.headers.get("origin");if(origin&&origin!==allowedOrigin)return reply({message:"Недопустимый адрес сайта"},403);
 try{
  if(Number(req.headers.get("content-length")||0)>512)return reply({message:"Неверный запрос"},400);
  const body=await req.json();if(typeof body.pin!=="string"||!/^[0-9]{5}$/.test(body.pin))return reply({message:"Введи 5 цифр"},400);
  const url=Deno.env.get("SUPABASE_URL");
  let secret;try{secret=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default}catch(_){}
  secret=secret||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!secret)return reply({message:"Вход временно недоступен"},503);
  const headers={"apikey":secret,"Content-Type":"application/json",...(secret.startsWith("eyJ")?{Authorization:"Bearer "+secret}:{})};
  const check=await fetch(url+"/rest/v1/rpc/alisa_pin_attempt",{method:"POST",headers,body:JSON.stringify({p_pin:body.pin})});
  if(!check.ok){console.error("pin_attempt_failed",check.status);return reply({message:"Вход временно недоступен"},503);}
  const attempt=await check.json();
  if(!attempt.ok)return reply({message:attempt.limited?"Слишком много попыток. Попробуй через 15 минут.":"Неверный код",retry_after:attempt.retry_after||0},attempt.limited?429:401);
  const link=await fetch(url+"/auth/v1/admin/generate_link",{method:"POST",headers,body:JSON.stringify({type:"magiclink",email:attempt.email})});
  if(!link.ok){console.error("pin_link_failed",link.status);return reply({message:"Не удалось открыть дневник. Попробуй ещё раз."},503);}
  const generated=await link.json(),hash=generated.hashed_token||generated.properties?.hashed_token;
  if(!hash){console.error("pin_hash_missing");return reply({message:"Вход временно недоступен"},503);}
  const verify=await fetch(url+"/auth/v1/verify",{method:"POST",headers,body:JSON.stringify({type:"magiclink",token_hash:hash})});
  if(!verify.ok){console.error("pin_verify_failed",verify.status);return reply({message:"Не удалось открыть дневник. Попробуй ещё раз."},503);}
  const session=await verify.json();
  if(!session.access_token||!session.refresh_token)return reply({message:"Вход временно недоступен"},503);
  return reply({access_token:session.access_token,refresh_token:session.refresh_token,expires_in:session.expires_in});
 }catch(_){console.error("pin_login_failed");return reply({message:"Не удалось открыть дневник. Проверь интернет и повтори."},503)}
});
