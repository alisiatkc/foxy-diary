
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const canonical = x => Array.isArray(x) ? x.map(canonical) : x && typeof x === "object" ? Object.fromEntries(Object.keys(x).sort().map(k => [k, canonical(x[k])])) : x;

function setup() {
 const server = { row:null, history:null, writes:0, beforeSave:null };
 function client(user = "user-a") {
  const mem = new Map(), nav = { onLine:true }, timers = [];
  const nodes = new Map([["app",{innerHTML:""}],["syncBadge",{textContent:""}],["cloudStatus",{textContent:""}]]);
  const storage = { getItem:k=>mem.get(k)||null, setItem:(k,v)=>mem.set(k,v), removeItem:k=>mem.delete(k) };
  const fetcher = async(url,opts={})=>{
   const route=url.split(".supabase.co")[1]; let data,status=200;
   if(route==="/auth/v1/user") data={id:user,email_confirmed_at:"2026-11-14"};
   else if(route==="/rest/v1/rpc/foxy_claim_history") data=server.history;
   else if(route.startsWith("/rest/v1/foxy_diaries?")) data=server.row?[server.row]:[];
   else if(route==="/rest/v1/rpc/foxy_save_diary") {
    const body=JSON.parse(opts.body);
    if(server.beforeSave){const hook=server.beforeSave;server.beforeSave=null;hook();}
    if(body.p_revision!==(server.row?.revision||0)){status=409;data={message:"FOXY_REVISION_CONFLICT"}}
    else {server.writes++;server.row=canonical({payload:body.p_payload,revision:(server.row?.revision||0)+1});data=server.row}
   } else throw Error("Unexpected request "+route);
   return {ok:status<400,status,text:async()=>JSON.stringify(canonical(data))};
  };
  const api = new Function("localStorage","sessionStorage","document","window","navigator","fetch","setTimeout","clearTimeout","alert","confirm","prompt",
   source+";return {connectCloud,syncCloud,mergeDiary,sameValue,go,editSet,editSession,openSession,newSession,deleteSession,initial,save,snapshot:()=>JSON.parse(JSON.stringify(db)),status:()=>({syncMessage,syncConflict,syncReady})};")(
   storage,storage,{getElementById:id=>nodes.get(id)||null,addEventListener:()=>{},activeElement:null},{addEventListener:()=>{},location:{hash:"",pathname:"/",search:""},history:{replaceState:()=>{}}},nav,fetcher,
   fn=>{timers.push(fn);return timers.length},()=>{},()=>{},()=>true,()=>null);
  storage.setItem("foxy-cloud-session-v2",JSON.stringify({access_token:"test-only",expires_at:Date.now()+999999}));
  return {api,mem,nav,nodes,timers};
 }
 const a=client();
 const template=a.api.initial().programs[0];
 server.history={
  sessions:Array.from({length:5},(_,i)=>({id:"old-"+i,date:"2026-11-"+String(i+1).padStart(2,"0"),programId:template.id,programName:template.name,finished:true,exercises:structuredClone(template.exercises)})),
  measurements:Array.from({length:16},(_,i)=>({id:"measure-"+i,date:"2026-11-01",type:"weight",value:String(60+i)}))
 };
 return {server,client,a};
}
test("private history imports once and hydrates another device",async()=>{
 const {a,client}=setup();await a.api.connectCloud();
 assert.equal(a.api.snapshot().sessions.length,5);assert.equal(a.api.snapshot().measurements.length,16);
 await a.api.connectCloud();assert.equal(a.api.snapshot().sessions.length,5);
 const b=client();await b.api.connectCloud();assert.equal(b.api.snapshot().sessions.length,5);
});
test("independent device changes merge; same-record conflicts do not overwrite",async()=>{
 const {a,client,server}=setup();await a.api.connectCloud();const b=client();await b.api.connectCloud();
 a.api.openSession("old-0");a.api.editSet(0,0,"weight","77");await a.api.syncCloud();
 b.api.openSession("old-1");b.api.editSet(0,0,"weight","88");await b.api.syncCloud();
 assert.equal(server.row.payload.sessions.find(x=>x.id==="old-0").exercises[0].sets[0].weight,"77");
 await a.api.syncCloud();a.api.openSession("old-0");a.api.editSet(0,0,"weight","99");await a.api.syncCloud();
 b.api.openSession("old-0");b.api.editSet(0,0,"weight","111");const writes=server.writes;await b.api.syncCloud();
 assert.equal(b.api.status().syncConflict,true);assert.equal(server.writes,writes);
 await b.api.syncCloud("local");assert.equal(server.row.payload.sessions.find(x=>x.id==="old-0").exercises[0].sets[0].weight,"111");
});
test("offline changes persist and deleted imports remain deleted after login",async()=>{
 const {a,server}=setup();await a.api.connectCloud();a.api.openSession("old-0");a.nav.onLine=false;
 a.api.editSet(0,0,"weight","3×2");await a.api.syncCloud();
 assert.equal(JSON.parse(a.mem.get("foxy-diary-v03")).sessions[0].exercises[0].sets[0].weight,"3×2");
 a.nav.onLine=true;await a.api.syncCloud();a.api.deleteSession("old-1");await a.api.syncCloud();await a.api.connectCloud();
 assert.equal(a.api.snapshot().sessions.some(x=>x.id==="old-1"),false);
 assert.equal(server.row.payload.sessions.length,4);
});
test("JSONB object-key order is not treated as an edit",()=>{
 const {a}=setup();const base=a.api.initial(),sorted=canonical(base);
 assert.equal(a.api.sameValue(base,sorted),true);
 assert.deepEqual(a.api.mergeDiary(base,base,sorted).programs,sorted.programs);
});
test("edits made while a request is in flight survive its response",async()=>{
 const {a,server}=setup();await a.api.connectCloud();a.api.openSession("old-0");a.api.editSet(0,0,"weight","10");
 server.beforeSave=()=>a.api.editSet(0,0,"weight","20");await a.api.syncCloud();
 assert.equal(a.api.snapshot().sessions[0].exercises[0].sets[0].weight,"20");
 await a.api.syncCloud();assert.equal(server.row.payload.sessions[0].exercises[0].sets[0].weight,"20");
});
test("stale revisions are rejected and a different account cannot upload the local diary",async()=>{
 const {a,server}=setup();await a.api.connectCloud();
 server.beforeSave=()=>server.row.revision++;const writes=server.writes;await a.api.syncCloud();
 assert.equal(server.writes,writes);assert.equal(a.api.status().syncConflict,true);
 a.mem.set("foxy-diary-owner-v1","someone-else");
 await assert.rejects(a.api.connectCloud(),/другой учётной записи/);
});

test("recovery callback removes tokens from URL and opens password form",()=>{
 const mem=new Map(),root={innerHTML:""},status={textContent:""};
 const storage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v),removeItem:k=>mem.delete(k)};
 const win={location:{hash:"#access_token=fake-test&refresh_token=fake-refresh&type=recovery",pathname:"/foxy-diary/index.html",search:""},history:{replaceState:()=>{win.location.hash=""}},addEventListener:()=>{}};
 new Function("localStorage","sessionStorage","document","window","navigator","fetch","setTimeout","clearTimeout",source)(storage,storage,{getElementById:id=>id==="app"?root:status,addEventListener:()=>{}},win,{onLine:false},()=>{throw Error("Recovery must not sync before password change")},()=>1,()=>{});
 assert.equal(win.location.hash,"");assert.equal(storage.getItem("foxy-recovery-mode"),"1");assert.ok(root.innerHTML.includes('id="newPassword"'));
});
