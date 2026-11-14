
"use strict";
const STORE="foxy-diary-v03";
const FUL2=[
["1.1","Жим ногами (45 градусов)",[[10,20],[40,20],[60,10]]],
["1.2","Жим лёжа (гантели, наклонная скамья)",[["3×2",20],["5×2",20],["7×2",15]]],
["2.1","Подъёмы туловища с поворотом",[["",21],["",13],["",15]]],
["2.2","Отведение спинка вперед",[[29,20],[43,20],[57,18]]],
["3.1","Тяга к животу (трос)",[[11,18],[18,20]]],
["3.2","Мост",[["",15],[10,15]]],
["4.1","Отведение бедра (тренажёр, сидя)",[[23,20],[36,20]]],
["4.2","Сгибание рук (гантели, стоя)",[["4×2",15],["4×2",15]]]
];
const FUL1=[
["1.1","Разгибание спины",[["",15],["",17],["",20]]],
["1.2","Скручивания (тренажёр)",[[23,14],[27,10],[32,12]]],
["2.1","Разгибание ног",[[18,20],[27,20],[36,15]]],
["2.2","Сгибание ног сидя",[[18,20],[27,20],[32,7]]],
["3.1","Тяга вниз к груди широким хватом",[[18,20],[25,17],["27,3",12]]],
["3.2","Жим для груди (тренажёр, вверх)",[["3,4",15],["3,4",15],["3,4",11]]],
["4.1","Отведение бедра, спинка вперёд",[[29,20],[36,20],[43,13]]],
["4.2","Приведение бедра (тренажёр, сидя)",[[14,20],[18,20],[23,13]]]
];
const tmpl=(id,name,list)=>({id,name,exercises:list.map(([num,name,sets])=>({id:id+"-"+num,num,name,sets:sets.map(([weight,reps])=>({weight:String(weight),reps:String(reps)})),hint:""}))});
const initial=()=>({version:3,programs:[tmpl("ful1","Фул 1",FUL1),tmpl("ful2","Фул 2",FUL2)],schedule:{},sessions:[],measurements:[]});
let db;try{db=JSON.parse(localStorage.getItem(STORE))||initial()}catch(_){db=initial()}if(!Array.isArray(db.programs)||!Array.isArray(db.sessions)||!Array.isArray(db.measurements)||typeof db.schedule!=="object")db=initial();
let page="calendar",day=localDate(new Date()),sessionId=null,shift=0,reportProgramId="ful1",reportIds=null;
const $=id=>document.getElementById(id);
const uid=()=>String(Date.now())+"-"+Math.random().toString(36).slice(2,9);
const esc=x=>String(x==null?"":x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const save=()=>{localStorage.setItem(STORE,JSON.stringify(db));queueCloudSync();};
const fmt=d=>new Date(d+"T12:00:00").toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"});
function localDate(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function addDays(date,n){const d=new Date(date+"T12:00:00");d.setDate(d.getDate()+n);return localDate(d)}
function program(id){return db.programs.find(p=>p.id===id)}
function ses(id){return db.sessions.find(s=>s.id===id)}
function previous(s,eid){return db.sessions.filter(x=>x.finished&&x.programId===s.programId&&x.id!==s.id&&x.date<s.date).sort((a,b)=>b.date.localeCompare(a.date))[0]?.exercises.find(e=>e.id===eid)}
function layout(title,subtitle,content){$("app").innerHTML='<div class="shell"><aside class="side"><div class="brand"><span class="brand-mark"><img src="icon.svg" alt="" width="32" height="32"></span><span>ALISA<small>Training journal</small></span></div><div class="nav">'+navButtons()+'</div><div class="note">Работает без интернета. Резервные копии доступны в разделе «Данные».</div></aside><main class="main"><header class="app-header"><div class="eyebrow">ALISA / Личный дневник</div><h1>'+esc(title)+'</h1><p class="lead">'+esc(subtitle)+'</p></header><p id="syncBadge" class="sync-status" role="status">'+esc(syncLabel())+'</p>'+content+'</main></div><nav class="bottom">'+navButtons()+'</nav>'}
const paths={
"calendar-days":'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
"dumbbell":'<path d="m6.5 6.5 11 11m-14-7 7-7m3 17 7-7M3 8l5-5m8 18 5-5M5 10l5-5m4 14 5-5"/>',
"chart-no-axes-column-increasing":'<rect width="4" height="8" x="3" y="13" rx="1"/><rect width="4" height="12" x="10" y="9" rx="1"/><rect width="4" height="18" x="17" y="3" rx="1"/>',
"heart-pulse":'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/><path d="M3.4 12h4l2-3 3 6 2-3h6.1"/>',
"file-chart-column":'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 17v-3M12 17v-5M16 17v-2"/>',
"settings-2":'<path d="M20 7h-9M14 17H4"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
"check":'<path d="m5 12 4 4L19 6"/>',
"arrow-left":'<path d="m12 19-7-7 7-7M5 12h14"/>',
"trash-2":'<path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6"/>',
"plus":'<path d="M12 5v14M5 12h14"/>'
};
function lucide(name,size){return '<svg class="lucide-icon" aria-hidden="true" width="'+(size||20)+'" height="'+(size||20)+'" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">'+(paths[name]||paths["dumbbell"])+'</svg>'}
function navButtons(){return [["calendar","Календарь","calendar-days"],["programs","Программы","dumbbell"],["history","История","chart-no-axes-column-increasing"],["reports","Отчёты","file-chart-column"],["metrics","Показатели","heart-pulse"],["data","Данные","settings-2"]].map(([id,name,ico])=>'<button class="'+(page===id?"on":"")+'" onclick="go(\''+id+'\')" aria-label="'+name+'">'+lucide(ico)+'<span class="nav-label-full">'+name+'</span><span class="nav-label-mobile">'+({programs:"Планы",metrics:"Замеры"}[id]||name)+'</span></button>').join("")}
function go(p){page=p;sessionId=null;render()}
function render(){if(page==="calendar")return calendar();if(page==="programs")return programs();if(page==="workout")return workout();if(page==="history")return history();if(page==="reports")return reports();if(page==="metrics")return metrics();if(page==="data")return dataPage();}
function calendar(){
 const start=addDays(localDate(new Date()),shift*14);let days="";
 for(let i=0;i<14;i++){const d=addDays(start,i),p=program(db.schedule[d]);const done=db.sessions.some(s=>s.date===d&&s.finished);days+='<button class="day '+(day===d?"active":"")+'" onclick="chooseDay(\''+d+'\')"><small>'+new Date(d+"T12:00:00").toLocaleDateString("ru-RU",{weekday:"short"})+'</small><b>'+d.slice(-2)+'</b><span>'+(done?"✓ ":"")+esc(p?.name||"")+'</span></button>';}
 const today=db.sessions.filter(s=>s.date===day),draft=today.find(s=>!s.finished&&s.programId===(program(db.schedule[day])||db.programs[0])?.id);
 layout("Календарь","Две недели тренировок и твои планы",'<div class="row between"><button onclick="shift--;render()">← Раньше</button><button onclick="shift=0;day=localDate(new Date());render()">Сегодня</button><button onclick="shift++;render()">Позже →</button></div><div class="card"><div class="daybar">'+days+'</div></div><div class="card"><h2>'+fmt(day)+'</h2><label>Назначить программу<select onchange="setDayPlan(this.value)"><option value="">Без плана</option>'+db.programs.map(p=>'<option value="'+esc(p.id)+'" '+(db.schedule[day]===p.id?"selected":"")+'>'+esc(p.name)+'</option>').join("")+'</select></label><div class="action"><button class="small" onclick="planTwoWeeks()">Расставить Фул 1 / Фул 2 на 2 недели</button></div><hr class="sep"/><h3>Тренировки этого дня</h3>'+(today.length?today.map(s=>'<div class="row between"><span>'+esc(s.programName)+(s.finished?" · завершена":" · черновик")+'</span><button class="small" onclick="openSession(\''+s.id+'\')">Открыть</button></div>').join(""):'<p class="muted">Пока нет записей</p>')+'<div class="action"><button class="primary" onclick="newSession()">'+lucide(draft?"dumbbell":"plus")+' '+(draft?"Продолжить тренировку":"Начать тренировку")+'</button></div></div>');
}
function chooseDay(d){day=d;render()}
function setDayPlan(id){if(id)db.schedule[day]=id;else delete db.schedule[day];save();render()}
function planTwoWeeks(){const a=db.programs[0],b=db.programs[1];if(!a||!b)return alert("Сначала добавь две программы");if(!confirm("Пример: назначить Фул 1 по понедельникам, Фул 2 по четвергам на показанные 2 недели? Твои существующие планы в эти дни будут заменены."))return;const start=addDays(localDate(new Date()),shift*14);for(let i=0;i<14;i++){const d=addDays(start,i),dow=new Date(d+"T12:00:00").getDay();if(dow===1)db.schedule[d]=a.id;if(dow===4)db.schedule[d]=b.id}save();render()}
function newSession(){const p=program(db.schedule[day])||db.programs[0];if(!p)return alert("Добавь программу");const draft=db.sessions.find(s=>s.date===day&&s.programId===p.id&&!s.finished);if(draft){openSession(draft.id);return}if(!p.exercises.length)return alert("Сначала добавь упражнения в программу");const s={id:uid(),date:day,programId:p.id,programName:p.name,finished:false,comment:"",rpe:"",duration:"",heartRate:"",heartMax:"",activeCalories:"",totalCalories:"",exercises:p.exercises.map(e=>({id:e.id,num:e.num,name:e.name,hint:e.hint||"",comment:"",rpe:"",sets:e.sets.map(x=>({weight:x.weight,reps:x.reps,done:false}))}))};db.sessions.push(s);save();sessionId=s.id;page="workout";render()}
function openSession(id){sessionId=id;page="workout";render()}
function workout(){
 const s=ses(sessionId);if(!s){go("calendar");return}
 const total=s.exercises.reduce((n,e)=>n+e.sets.length,0),done=s.exercises.reduce((n,e)=>n+e.sets.filter(x=>x.done).length,0);
 let body='<div class="row between"><div><span class="tag">'+fmt(s.date)+'</span><h2>'+esc(s.programName)+'</h2></div><button onclick="go(\'calendar\')">'+lucide("arrow-left")+' Календарь</button></div><div class="workout-summary"><strong id="workoutProgress" aria-live="polite">'+done+' из '+total+' подходов выполнено</strong><span>Изменения сохраняются автоматически</span></div><p class="note">В блоке «Было» показана предыдущая завершённая тренировка этой программы. Поля «Сегодня» можно изменять — сохраняются автоматически.</p>';
 s.exercises.forEach((e,ei)=>{const old=previous(s,e.id);body+='<div class="card workout-exercise"><div class="row between"><div><div class="exercise-title">'+esc(e.num)+" "+esc(e.name)+'</div>'+(old?'<small>Сравнение с прошлой тренировкой</small>':'<small>Первое выполнение в дневнике</small>')+'</div><button class="small" onclick="addSet('+ei+')">'+lucide("plus")+' Подход</button></div>'+(e.hint?'<p class="muted">'+esc(e.hint)+'</p>':'')+'<div class="set sethead"><div>№</div><div>Было</div><div>Вес, кг</div><div>Повт.</div><div>✓</div><div>×</div></div>';e.sets.forEach((set,si)=>{const prev=old?.sets?.[si];body+='<div class="set"><span>'+(si+1)+'</span><span class="prev">'+(prev?esc(prev.weight||"—")+' × '+esc(prev.reps||"—"):'—')+'</span><label class="set-weight"><span>Вес, кг</span><input aria-label="Вес" value="'+esc(set.weight)+'" oninput="editSet('+ei+','+si+',\'weight\',this.value)" placeholder="—"></label><label class="set-reps"><span>Повторы</span><input aria-label="Повторы" inputmode="numeric" value="'+esc(set.reps)+'" oninput="editSet('+ei+','+si+',\'reps\',this.value)" placeholder="—"></label><label class="set-done"><span class="sr-only">Подход выполнен</span><input type="checkbox" '+(set.done?"checked":"")+' onchange="editSet('+ei+','+si+',\'done\',this.checked)"></label><button class="small" aria-label="Удалить подход" '+(e.sets.length===1?'disabled ':'')+'onclick="removeSet('+ei+','+si+')">'+lucide("trash-2")+'</button></div>'});body+='<div class="fields"><label class="field">Сложность RPE<select onchange="editExercise('+ei+',\'rpe\',this.value)">'+options(["","1","2","3","4","5","6","7","8","9","10"],e.rpe)+'</select></label><label style="flex:1;min-width:150px">Комментарий<input value="'+esc(e.comment)+'" oninput="editExercise('+ei+',\'comment\',this.value)" placeholder="Как ощущения?"></label></div></div>'});
 body+='<div class="card"><h3>Итоги занятия</h3><div class="fields">'+[['duration','Длительность, мин'],['heartRate','Средний пульс'],['heartMax','Макс. пульс'],['activeCalories','Активные ккал'],['totalCalories','Всего ккал']].map(([k,t])=>'<label class="field">'+t+'<input value="'+esc(s[k])+'" inputmode="decimal" oninput="editSession(\''+k+'\',this.value)"></label>').join("")+'</div><div class="fields action"><label class="field">Общая сложность<select onchange="editSession(\'rpe\',this.value)">'+options(["","1","2","3","4","5","6","7","8","9","10"],s.rpe)+'</select></label><label style="flex:1;min-width:180px">Заметки<textarea oninput="editSession(\'comment\',this.value)">'+esc(s.comment)+'</textarea></label></div><div class="row action"><button class="primary" onclick="finishSession()">'+lucide("check")+" "+(s.finished?"Тренировка завершена":"Завершить тренировку")+'</button><button onclick="showReport(\''+s.id+'\')">Экран для скриншота</button><button onclick="deleteSession(\''+s.id+'\')">Удалить</button></div></div>';
 layout("Тренировка","Записывай результаты прямо между подходами",body)
}
function options(arr,sel){return arr.map(x=>'<option '+(x===String(sel)?"selected":"")+' value="'+esc(x)+'">'+(x||"Не указано")+'</option>').join("")}
function editSet(e,i,k,v){ses(sessionId).exercises[e].sets[i][k]=v;save();if(k==="done"){const s=ses(sessionId),el=$("workoutProgress");if(el)el.textContent=s.exercises.reduce((n,e)=>n+e.sets.filter(x=>x.done).length,0)+" из "+s.exercises.reduce((n,e)=>n+e.sets.length,0)+" подходов выполнено"}}
function editExercise(e,k,v){ses(sessionId).exercises[e][k]=v;save()}
function editSession(k,v){ses(sessionId)[k]=v;save()}
function addSet(e){ses(sessionId).exercises[e].sets.push({weight:"",reps:"",done:false});save();render()}
function removeSet(e,i){const sets=ses(sessionId).exercises[e].sets;if(sets.length===1)return;sets.splice(i,1);save();render()}
function finishSession(){ses(sessionId).finished=true;save();render()}
function deleteSession(id){if(!confirm("Удалить запись этой тренировки?"))return;db.sessions=db.sessions.filter(s=>s.id!==id);save();go("calendar")}
function showReport(id){const s=ses(id);const lines=s.exercises.map(e=>'<tr><td>'+esc(e.num)+' '+esc(e.name)+'</td><td>'+e.sets.map((x,i)=>(i+1)+'. '+esc(x.weight||"без веса")+' × '+esc(x.reps||"—")).join('<br>')+'</td><td>'+esc(e.rpe||"—")+'</td><td>'+esc(e.comment||"")+'</td></tr>').join("");layout("Отчёт для Владимира","Сделай скриншот этого экрана",'<div class="report card"><h2>'+esc(s.programName)+' · '+fmt(s.date)+'</h2><div class="report-scroll"><table class="table"><thead><tr><th>Упражнение</th><th>Подходы</th><th>RPE</th><th>Комментарий</th></tr></thead><tbody>'+lines+'</tbody></table></div><p>'+['duration','heartRate','heartMax','activeCalories','totalCalories'].map(k=>({duration:"Длительность",heartRate:"Пульс",heartMax:"Макс. пульс",activeCalories:"Активные ккал",totalCalories:"Общие ккал"}[k]+": "+esc(s[k]||"—"))).join(" · ")+'</p><p>'+esc(s.comment)+'</p></div><button class="noprint" onclick="openSession(\''+s.id+'\')">← Вернуться к тренировке</button>')}
function programs(){let list=db.programs.map(p=>'<div class="card"><div class="row between"><div><h2>'+esc(p.name)+'</h2><small>'+p.exercises.length+' упражнений</small></div><button onclick="renameProgram(\''+p.id+'\')">Переименовать</button></div>'+p.exercises.map(e=>'<div class="row between"><span>'+esc(e.num)+' '+esc(e.name)+'</span><button class="small" onclick="editProgramExercise(\''+p.id+'\',\''+e.id+'\')">Изменить</button></div>').join('')+'<div class="action row"><button class="small" onclick="addExercise(\''+p.id+'\')">+ Упражнение</button><button class="small" onclick="duplicateProgram(\''+p.id+'\')">Дублировать</button></div></div>').join("");layout("Программы","Неограниченное число программ; правки шаблона не меняют прошлые тренировки",'<div class="row"><button class="primary" onclick="createProgram()">+ Новая программа</button></div>'+list)}
function createProgram(){const name=prompt("Название программы");if(!name?.trim())return;db.programs.push({id:uid(),name:name.trim(),exercises:[]});save();render()}
function renameProgram(id){const p=program(id),n=prompt("Название программы",p.name);if(!n?.trim())return;p.name=n.trim();save();render()}
function addExercise(id){const p=program(id),num=prompt("Номер, например 5.1");if(!num)return;const name=prompt("Название упражнения");if(!name)return;p.exercises.push({id:uid(),num,name,sets:[{weight:"",reps:""}],hint:""});save();render()}
function editProgramExercise(pid,eid){const e=program(pid).exercises.find(x=>x.id===eid);const name=prompt("Название",e.name);if(name===null)return;const num=prompt("Номер упражнения",e.num);if(num===null)return;const hint=prompt("Подсказка по технике",e.hint);if(hint===null)return;e.name=name;e.num=num;e.hint=hint;save();render()}
function duplicateProgram(id){const p=JSON.parse(JSON.stringify(program(id)));p.id=uid();p.name+=" · копия";p.exercises.forEach(e=>e.id=uid());db.programs.push(p);save();render()}

function reports(){
 const p=program(reportProgramId)||db.programs[0];if(!p){layout("Отчёты","Сравнение тренировок","<p>Добавь тренировочные программы.</p>");return}reportProgramId=p.id;
 const all=db.sessions.filter(s=>s.programId===p.id&&s.finished).sort((a,b)=>a.date.localeCompare(b.date));if(reportIds===null)reportIds=all.slice(-Math.min(2,all.length)).map(s=>s.id);
 else reportIds=reportIds.filter(id=>all.some(s=>s.id===id));
 const chosen=all.filter(s=>reportIds.includes(s.id));const display=chosen.slice(-4);
 const selections='<div class="card noprint"><h2>Сравнить тренировки</h2><label>Программа<select onchange="setReportProgram(this.value)">'+db.programs.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===p.id?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select></label><p class="muted" style="margin-top:14px">Выбери до четырёх дат для сравнения.</p><div class="report-date-grid">'+all.map(s=>'<label class="date-option"><input type="checkbox" '+(reportIds.includes(s.id)?'checked':'')+' onchange="toggleReportDate(\''+s.id+'\',this.checked)"><span>'+fmt(s.date)+'</span></label>').join('')+'</div><div class="row action"><button class="primary" onclick="downloadReport()">Сохранить картинку PNG</button><button onclick="window.print()">Печать / PDF</button></div></div>';
 let view='';
 if(!all.length){view='<div class="card">В этой программе ещё нет завершённых тренировок. Импортируй историю в разделе «Данные».</div>'}
 else if(!display.length){view='<div class="card">Выбери даты выше.</div>'}
 else{
  const cols=display.map(x=>'<th>'+esc(x.date.slice(8))+'/'+esc(x.date.slice(5,7))+'</th>').join('');
  let rows=p.exercises.map(ex=>{
   const vals=display.map(s=>{const e=s.exercises.find(x=>x.num===ex.num||x.id===ex.id);return '<td>'+(e?e.sets.map((st,i)=>'<div class="comparison-set"><small>'+(i+1)+'</small> '+esc(st.weight||'—')+' × '+esc(st.reps||'—')+'</div>').join(''):'—')+'</td>'}).join('');
   return '<tr><th class="comparison-exercise">'+esc(ex.num)+' '+esc(ex.name)+'</th>'+vals+'</tr>'
  }).join('');
  view='<div class="card comparison-card"><div class="report-brand">ALISA <span>/ TRAINING LOG</span></div><h2>'+esc(p.name)+'</h2><p class="muted">Сравнение тренировок · '+display.map(s=>esc(s.date.slice(8)+'.'+s.date.slice(5,7))).join(' / ')+'</p><div class="comparison-scroll"><table class="comparison-table"><thead><tr><th>Упражнение</th>'+cols+'</tr></thead><tbody>'+rows+'</tbody></table></div></div>';
 }
 layout("Отчёты","Сравни несколько дат и сохрани готовую картинку для Владимира",selections+view)
}
function setReportProgram(id){reportProgramId=id;reportIds=null;render()}
function toggleReportDate(id,on){if(on){if(reportIds.length>=4){alert('Можно сравнить до четырёх тренировок');render();return}reportIds.push(id)}else reportIds=reportIds.filter(x=>x!==id);render()}
function wrapText(ctx,text,maxWidth){let lines=[],line='';for(const w of String(text).split(/\s+/)){const test=line?line+' '+w:w;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=w}else line=test}if(line)lines.push(line);return lines}
function downloadReport(){
 const p=program(reportProgramId);if(!p){alert('Сначала добавь программу');return}const sessions=db.sessions.filter(s=>(reportIds||[]).includes(s.id)&&s.programId===p.id).sort((a,b)=>a.date.localeCompare(b.date));if(!sessions.length){alert('Выбери хотя бы одну дату');return}
 const W=1240,pad=42,colName=415,col=(W-2*pad-colName)/sessions.length,x0=pad,y0=230,rows=[];
 const cvs=document.createElement('canvas'),ctx=cvs.getContext('2d');ctx.font='27px Manrope, sans-serif';
 for(const ex of p.exercises){const nameLines=wrapText(ctx,ex.num+' '+ex.name,colName-32);const count=Math.max(3,...sessions.map(s=>s.exercises.find(e=>e.num===ex.num)?.sets.length||0));rows.push({ex,nameLines,height:Math.max(nameLines.length*33+30,count*32+42)})}
 const height=y0+rows.reduce((a,b)=>a+b.height,0)+66;cvs.width=W;cvs.height=height;ctx.fillStyle='#fcfaf9';ctx.fillRect(0,0,W,height);
 ctx.fillStyle='#372a31';ctx.font='700 48px sans-serif';ctx.fillText('ALISA',pad,80);ctx.fillStyle='#a7647f';ctx.font='600 25px sans-serif';ctx.fillText(p.name,pad,125);ctx.fillStyle='#87777e';ctx.font='21px sans-serif';ctx.fillText('СРАВНЕНИЕ ТРЕНИРОВОК',pad,164);
 ctx.fillStyle='#f4e6eb';ctx.fillRect(pad,y0-55,W-pad*2,55);ctx.fillStyle='#704656';ctx.font='700 22px sans-serif';ctx.fillText('Упражнение',pad+16,y0-19);sessions.forEach((s,i)=>ctx.fillText(s.date.slice(8)+'.'+s.date.slice(5,7),pad+colName+i*col+20,y0-19));
 let yy=y0;for(const r of rows){ctx.fillStyle='#fff';ctx.fillRect(pad,yy,W-pad*2,r.height);ctx.strokeStyle='#e9dae1';ctx.lineWidth=1;ctx.strokeRect(pad,yy,W-pad*2,r.height);ctx.beginPath();ctx.moveTo(pad+colName,yy);ctx.lineTo(pad+colName,yy+r.height);sessions.forEach((_,i)=>{if(i>0){ctx.moveTo(pad+colName+i*col,yy);ctx.lineTo(pad+colName+i*col,yy+r.height)}});ctx.stroke();ctx.font='600 22px sans-serif';ctx.fillStyle='#372a31';r.nameLines.forEach((t,j)=>ctx.fillText(t,pad+14,yy+36+j*33));sessions.forEach((s,i)=>{const e=s.exercises.find(e=>e.num===r.ex.num),sets=e?.sets||[];ctx.font='21px sans-serif';ctx.fillStyle='#372a31';sets.forEach((st,k)=>ctx.fillText((k+1)+'. '+(st.weight||'—')+' × '+(st.reps||'—'),pad+colName+i*col+18,yy+35+k*32))});yy+=r.height}
 cvs.toBlob(b=>{if(!b)return;const url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download='ALISA-'+p.name.replace(/\s+/g,'-')+'-'+sessions.map(s=>s.date).join('_')+'.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)},'image/png')
}

function history(){layout("История","Все записанные тренировки",db.sessions.length?db.sessions.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(s=>'<div class="card row between"><div><b>'+fmt(s.date)+'</b><p>'+esc(s.programName)+' · '+(s.finished?"✓ завершена":"черновик")+'</p></div><div class="row"><button onclick="openSession(\''+s.id+'\')">Открыть</button><button class="small" onclick="showReport(\''+s.id+'\')">Отчёт</button></div></div>').join(""):'<div class="card">Пока нет тренировок. Начни с календаря.</div>')}
const metricNames={weight:"Вес",bodyfat:"Процент жира",muscle:"Мышечная масса",inbody:"InBody",cycle_start:"Начало цикла",cycle_end:"Конец цикла",cycle_day:"День цикла",sleep:"Сон",mood:"Самочувствие",waist:"Талия",hips:"Бёдра",other:"Другое"};
function metrics(){const list=db.measurements.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(m=>'<tr><td>'+esc(m.date)+'</td><td>'+esc(metricNames[m.type]||m.type)+'</td><td>'+esc(m.value)+'</td><td>'+esc(m.source)+'</td><td>'+esc(m.note)+'</td><td><button class="small" aria-label="Удалить показатель" onclick="deleteMetric(\''+m.id+'\')">'+lucide("trash-2")+'</button></td></tr>').join("");layout("Показатели","Вес, InBody, цикл из Flo, самочувствие и любые другие измерения",'<div class="card"><h2>Новая запись</h2><form onsubmit="addMetric(event)"><div class="fields"><label class="field">Дата<input id="mDate" type="date" required value="'+day+'"></label><label class="field">Показатель<select id="mType">'+["weight","bodyfat","muscle","inbody","cycle_start","cycle_end","cycle_day","sleep","mood","waist","hips","other"].map(x=>'<option value="'+x+'">'+metricNames[x]+'</option>').join("")+'</select></label><label class="field">Значение<input id="mValue" required placeholder="63,9 / начало"></label><label class="field">Источник<input id="mSource" placeholder="Flo / InBody / весы"></label></div><label class="action">Заметка<input id="mNote" placeholder="По желанию"></label><div class="action"><button class="primary" type="submit">Сохранить показатель</button></div></form></div><div class="card"><h2>История показателей</h2><div style="overflow:auto"><table class="table"><thead><tr><th>Дата</th><th>Тип</th><th>Значение</th><th>Источник</th><th>Заметка</th><th></th></tr></thead><tbody>'+list+'</tbody></table></div></div>')}
function addMetric(e){e.preventDefault();db.measurements.push({id:uid(),date:$("mDate").value,type:$("mType").value,value:$("mValue").value,source:$("mSource").value,note:$("mNote").value});save();render()}
function deleteMetric(id){if(!confirm("Удалить измерение?"))return;db.measurements=db.measurements.filter(x=>x.id!==id);save();render()}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function backup(){download("alisa-backup-"+localDate(new Date())+".json",JSON.stringify(db,null,2),"application/json")}
function dataPage(){if(sessionStorage.getItem("foxy-recovery-mode")==="1"){layout("Новый пароль","Задай новый пароль для своего дневника",'<div class="card"><form onsubmit="cloudSetNewPassword(event)"><label>Новый пароль<input id="newPassword" type="password" minlength="8" required autocomplete="new-password"></label><label class="action">Повтори пароль<input id="newPasswordConfirm" type="password" minlength="8" required autocomplete="new-password"></label><button class="primary action" type="submit">Сохранить новый пароль</button><button class="action" type="button" onclick="cloudCancelRecovery()">Войти по письму без пароля</button><p id="cloudStatus" class="note" role="status">Не менее 8 символов. Тренировки и показатели сохранятся.</p></form></div>');return}layout("Данные и синхронизация","Твой дневник на всех устройствах",'<div class="card"><h2>Учётная запись ALISA</h2><p class="muted">Вход без пароля: укажи email и нажми «Войти» в письме. Дневник и старая история привязаны к твоему email.</p><form onsubmit="cloudSendLoginLink(event)"><label>Электронная почта<input id="cloudEmail" type="email" autocomplete="email" required placeholder="you@example.com"></label><div class="row action"><button id="sendLoginLink" class="primary" type="submit">Получить письмо для входа</button><button type="button" onclick="cloudLogout()">Выйти</button></div></form><p id="cloudStatus" class="note" role="status">'+esc(syncLabel())+'</p><button onclick="cloudPush()">Синхронизировать</button><div id="syncConflict" '+(syncConflict?'':'hidden')+' class="action"><p>Если одна запись изменена на двух устройствах, выбери, какие изменения оставить. Перед выбором скачается резервная копия.</p><div class="row"><button onclick="cloudResolve(\'local\')">Оставить изменения устройства</button><button onclick="cloudResolve(\'remote\')">Оставить изменения из облака</button></div></div></div><div class="card"><h2>Старая история</h2><p>Подготовленная история добавится автоматически после первого входа с подтверждённым email владельца. Уже существующие записи сохранятся. Повторный вход не создаёт дубликаты.</p><label>Добавить другой файл истории<input type="file" accept=".json,application/json" onchange="importHistory(this)"></label></div><div class="card"><h2>Резервная копия</h2><p>Скачай все тренировки, программы, расписание и показатели.</p><button onclick="backup()">Скачать JSON</button><hr class="sep"><label>Восстановить резервную копию<input type="file" accept=".json,application/json" onchange="restoreBackup(this)"></label><p class="muted">Восстановление заменяет локальный дневник. При включённой синхронизации изменения отправятся в твою базу.</p></div><div class="card"><h2>Импорт показателей</h2><p>CSV с колонками <code>date,type,value,source,note</code>.</p><label>Выбрать CSV<input type="file" accept=".csv,text/csv" onchange="importCsv(this)"></label><div id="preview" class="action"></div></div><div class="card"><h3>Apple Watch и Flo</h3><p>Пульс, время и калории вводятся в итогах тренировки; измерения и цикл — в «Показатели». Прямой интеграции с Apple Health и Flo нет.</p></div>')}

async function importHistory(input){
 const file=input.files?.[0];if(!file)return;
 try{
  const doc=JSON.parse(await file.text());if(doc.format!=="foxy-seed-v1"||!Array.isArray(doc.sessions)||!Array.isArray(doc.measurements))throw Error("Это не файл истории ALISA");
  if(!doc.sessions.every(s=>s.id&&s.date&&s.programId&&Array.isArray(s.exercises)))throw Error("Некорректная структура тренировок");
  if(!doc.measurements.every(m=>m.id&&m.date&&m.type))throw Error("Некорректные измерения");
  const knownS=new Set(db.sessions.map(s=>s.id)),knownM=new Set(db.measurements.map(m=>m.id));
  const sessions=doc.sessions.filter(s=>!knownS.has(s.id));
  const measurements=doc.measurements.filter(m=>!knownM.has(m.id));
  if(!confirm("Добавить "+sessions.length+" тренировок и "+measurements.length+" показателей? Существующие записи не будут изменены."))return;
  db.sessions.push(...sessions);db.measurements.push(...measurements);save();
  render();alert("Импортировано: "+sessions.length+" тренировок и "+measurements.length+" показателей");
 }catch(err){alert("Не удалось импортировать историю: "+err.message)}
}

async function restoreBackup(input){const file=input.files[0];if(!file)return;try{const d=JSON.parse(await file.text());if(!Array.isArray(d.programs)||!Array.isArray(d.sessions)||!Array.isArray(d.measurements)||typeof d.schedule!=="object")throw Error("Неверный формат ALISA");if(!confirm("Заменить все записи из этого браузера импортированными?"))return;db=d;save();render();alert("Восстановлено")}catch(e){alert("Импорт не выполнен: "+e.message)}}
function csvRows(text){const out=[];let row=[],val="",quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){val+='"';i++}else quoted=!quoted}else if(c===","&&!quoted){row.push(val);val=""}else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&text[i+1]==="\n")i++;row.push(val);if(row.some(x=>x.trim()))out.push(row);row=[];val=""}else val+=c}row.push(val);if(row.some(x=>x.trim()))out.push(row);return out}
async function importCsv(input){const file=input.files[0];if(!file)return;try{const rows=csvRows((await file.text()).replace(/^\uFEFF/,""));const header=rows.shift().map(x=>x.trim().toLowerCase());const required=["date","type","value","source","note"];if(required.some(k=>!header.includes(k)))throw Error("Нужны колонки: "+required.join(", "));const valid=rows.map(r=>Object.fromEntries(required.map(k=>[k,(r[header.indexOf(k)]||"").trim()]))).filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&r.type&&r.value);$("preview").innerHTML='<p>Найдено корректных записей: '+valid.length+' из '+rows.length+'. Добавить в дневник?</p><button class="primary" id="confirmCsv">Импортировать</button>';$("confirmCsv").onclick=()=>{db.measurements.push(...valid.map(r=>({...r,id:uid()})));save();render();alert("Добавлено "+valid.length+" записей")}}catch(e){alert("Ошибка CSV: "+e.message)}}


const CLOUD_CONFIG={url:"https://ktutaxylnqchvlgfuoeh.supabase.co",key:"sb_publishable_1s1qUg4NI3DIPcU71g2I9w_iL_kXWx1"};
const CLOUD_SESSION_KEY="foxy-cloud-session-v2",CLOUD_OWNER_KEY="foxy-diary-owner-v1";
let syncReady=false,syncBusy=false,syncTimer=null,syncUser=null,syncHistory=null,syncConflict=false,syncMessage="На устройстве · войди для синхронизации";
const cloudConfig=()=>CLOUD_CONFIG;
const cloudSession=()=>{try{return JSON.parse(localStorage.getItem(CLOUD_SESSION_KEY)||sessionStorage.getItem("foxy-cloud-session-v1")||"{}")}catch(_){return {}}};
function syncLabel(){return syncMessage}
function cloudInfo(message){syncMessage=message;for(const id of ["cloudStatus","syncBadge"]){const el=$(id);if(el)el.textContent=message}const box=$("syncConflict");if(box)box.hidden=!syncConflict}
function storeCloudSession(r){localStorage.setItem(CLOUD_SESSION_KEY,JSON.stringify({access_token:r.access_token,refresh_token:r.refresh_token,expires_at:Date.now()+Number(r.expires_in||3600)*1000}));sessionStorage.removeItem("foxy-cloud-session-v1")}
async function cloudRequest(path,opts={}){
 const s=cloudSession(),res=await fetch(CLOUD_CONFIG.url+path,{...opts,headers:{apikey:CLOUD_CONFIG.key,"Content-Type":"application/json",...(s.access_token?{Authorization:"Bearer "+s.access_token}:{}),...(opts.headers||{})}});
 const raw=await res.text();let data;try{data=raw?JSON.parse(raw):null}catch(_){data=null}
 if(!res.ok){const error=Error(data?.msg||data?.message||data?.error_description||data?.error||("Ошибка сервера "+res.status));error.status=res.status;throw error}
 return data
}
async function cloudAuthenticated(){
 let s=cloudSession();if(!s.access_token)throw Error("Войди в ALISA, чтобы включить синхронизацию");
 if(!s.expires_at||Date.now()>s.expires_at-60000){
  const r=await cloudRequest("/auth/v1/token?grant_type=refresh_token",{method:"POST",body:JSON.stringify({refresh_token:s.refresh_token})});storeCloudSession(r)
 }
 const u=await cloudRequest("/auth/v1/user");if(!u?.id)throw Error("Войди в ALISA ещё раз");
 if(!u.email_confirmed_at)throw Error("Подтверди email по письму и войди снова");
 return u
}
function validDiary(x){return x&&Array.isArray(x.programs)&&Array.isArray(x.sessions)&&Array.isArray(x.measurements)&&x.schedule&&typeof x.schedule==="object"&&!Array.isArray(x.schedule)}
function sameValue(a,b){const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==="object"?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;return JSON.stringify(stable(a))===JSON.stringify(stable(b))}
function mergeDiary(base,local,remote,preference){
 if(!validDiary(base)||!validDiary(local)||!validDiary(remote))throw Error("Неверный формат дневника");
 const equal=sameValue;
 function pick(b,l,r,name){if(equal(l,b))return r;if(equal(r,b)||equal(l,r))return l;if(preference==="local")return l;if(preference==="remote")return r;const e=Error("Эта запись изменена на двух устройствах: "+name+". Выбери версию в разделе «Данные».");e.conflict=true;throw e}
 const out={...remote,...local,version:3};
 for(const section of ["programs","sessions","measurements"]){
  const maps=[base,local,remote].map(d=>new Map(d[section].map(x=>[x.id,x]))),ids=new Set([...maps[1].keys(),...maps[2].keys()]);
  out[section]=[];
  for(const id of ids){const v=pick(...maps.map(m=>m.get(id)),section==="sessions"?"тренировка":section==="programs"?"программа":"показатель");if(v!==undefined)out[section].push(v)}
 }
 out.historyImports=[...new Set([...(local.historyImports||[]),...(remote.historyImports||[])])];
 out.schedule={};for(const date of new Set([...Object.keys(local.schedule),...Object.keys(remote.schedule)])){const v=pick(base.schedule[date],local.schedule[date],remote.schedule[date],"план на "+date);if(v!==undefined)out.schedule[date]=v}
 return out
}
function queueCloudSync(){
 if(!syncReady)return;
 clearTimeout(syncTimer);cloudInfo(navigator.onLine===false?"Без интернета · изменения сохранены на устройстве":"Сохранено на устройстве · отправляю в облако");
 if(navigator.onLine!==false)syncTimer=setTimeout(()=>syncCloud(),900)
}
async function syncCloud(preference){
 if(!syncReady||syncBusy)return;
 if(navigator.onLine===false){cloudInfo("Без интернета · изменения сохранены на устройстве");return}
 syncBusy=true;clearTimeout(syncTimer);
 try{
  const u=await cloudAuthenticated();if(u.id!==syncUser)throw Error("Учётная запись изменилась. Войди ещё раз");
  const owner=localStorage.getItem(CLOUD_OWNER_KEY);if(owner&&owner!==u.id)throw Error("На устройстве дневник другой учётной записи. Войди в прежнюю учётную запись");
  const captured=JSON.parse(JSON.stringify(db));
  const rows=await cloudRequest("/rest/v1/foxy_diaries?user_id=eq."+encodeURIComponent(u.id)+"&select=payload,revision");
  const row=rows?.[0],remote=row?.payload||initial();
  let cached;try{cached=JSON.parse(localStorage.getItem("foxy-cloud-base-"+u.id)||"null")}catch(_){}
  const base=cached?.payload||initial(),merged=mergeDiary(base,captured,remote,preference);
  if(syncHistory&&!merged.historyImports.includes("private-history-v1")){const ids=new Set(merged.sessions.map(x=>x.id)),mids=new Set(merged.measurements.map(x=>x.id));merged.sessions.push(...syncHistory.sessions.filter(x=>!ids.has(x.id)));merged.measurements.push(...syncHistory.measurements.filter(x=>!mids.has(x.id)));merged.historyImports.push("private-history-v1")}
  const saved=await cloudRequest("/rest/v1/rpc/foxy_save_diary",{method:"POST",body:JSON.stringify({p_payload:merged,p_revision:row?.revision||0})});
  if(!validDiary(saved?.payload))throw Error("Сервер вернул неверный формат");
  db=mergeDiary(captured,db,saved.payload,"local");
  localStorage.setItem(STORE,JSON.stringify(db));localStorage.setItem(CLOUD_OWNER_KEY,u.id);localStorage.setItem("foxy-cloud-base-"+u.id,JSON.stringify(saved));
  syncConflict=false;cloudInfo("Синхронизировано · "+new Date().toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"}));
  if(!sameValue(db,saved.payload))syncTimer=setTimeout(()=>syncCloud(),900);
  else if(!document.activeElement?.matches?.("input,textarea,select"))render()
 }catch(e){
  syncConflict=!!e.conflict||String(e.message).includes("FOXY_REVISION_CONFLICT");
  cloudInfo(syncConflict?"Изменения сохранены на устройстве. "+(e.conflict?e.message:"Дневник обновился на другом устройстве. Нажми «Синхронизировать», чтобы повторить."):navigator.onLine===false?"Без интернета · изменения сохранены на устройстве":"Сохранено на устройстве · "+e.message)
 }finally{syncBusy=false}
}
async function connectCloud(){
 syncReady=false;const u=await cloudAuthenticated();
 const owner=localStorage.getItem(CLOUD_OWNER_KEY);if(owner&&owner!==u.id)throw Error("На устройстве дневник другой учётной записи. Войди в прежнюю учётную запись");
 syncUser=u.id;
 syncHistory=await cloudRequest("/rest/v1/rpc/foxy_claim_history",{method:"POST",body:"{}"});
 if(syncHistory&&(!Array.isArray(syncHistory.sessions)||!Array.isArray(syncHistory.measurements)))throw Error("Неверный формат старой истории");
 syncReady=true;render();await syncCloud()
}
async function cloudSendLoginLink(event){
 if(event)event.preventDefault();
 const button=$("sendLoginLink");
 try{
 const email=$("cloudEmail").value.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error("Укажи корректный email");
 const wait=Number(sessionStorage.getItem("foxy-email-resend-at")||0)-Date.now();if(wait>0)throw Error("Повторить отправку можно через "+Math.ceil(wait/1000)+" сек.");
 if(button){button.disabled=true;button.textContent="Отправляю письмо…"}
 await cloudRequest("/auth/v1/otp?redirect_to="+encodeURIComponent("https://alisiatkc.github.io/foxy-diary/index.html"),{method:"POST",body:JSON.stringify({email,create_user:true})});
 sessionStorage.setItem("foxy-email-resend-at",String(Date.now()+60000));
 cloudInfo("Письмо отправлено. Открой последнее письмо от Supabase и нажми Sign in / Войти. Ссылка одноразовая. Пароль не нужен. Проверь также «Спам».")
 }catch(e){cloudInfo("Не удалось отправить письмо: "+(e.status===429?"Слишком много запросов. Подожди немного и повтори.":e.message))}
 finally{if(button){button.disabled=false;button.textContent="Получить письмо для входа"}}
}
async function cloudLogout(){
 clearTimeout(syncTimer);syncReady=false;syncUser=null;
 try{await cloudRequest("/auth/v1/logout",{method:"POST"})}catch(_){}
 localStorage.removeItem(CLOUD_SESSION_KEY);sessionStorage.removeItem("foxy-cloud-session-v1");syncConflict=false;cloudInfo("Выполнен выход · локальные записи сохранены");render()
}
async function cloudResolve(preference){
 if(!confirm("Сохранить резервную копию и при различиях использовать "+(preference==="local"?"версию этого устройства":"облачную версию")+"? Записи без различий будут объединены."))return;
 backup();await syncCloud(preference)
}
async function cloudPush(){if(!syncReady){try{await connectCloud()}catch(e){cloudInfo(e.message)}}else await syncCloud()}

function cloudCancelRecovery(){sessionStorage.removeItem("foxy-recovery-mode");page="data";render()}
async function cloudForgotPassword(){
 try{const email=$("cloudEmail").value.trim();if(!email)throw Error("Укажи email своей учётной записи");
 await cloudRequest("/auth/v1/recover?redirect_to="+encodeURIComponent("https://alisiatkc.github.io/foxy-diary/index.html"),{method:"POST",body:JSON.stringify({email})});
 cloudInfo("Письмо для восстановления отправлено. Открой ссылку Reset password из последнего письма; затем задай новый пароль в ALISA. Проверь также «Спам».")
 }catch(e){cloudInfo("Не удалось отправить письмо: "+e.message)}
}
async function cloudSetNewPassword(event){
 event.preventDefault();
 try{const password=$("newPassword").value,confirmation=$("newPasswordConfirm").value;
 if(password.length<8)throw Error("Пароль должен содержать не менее 8 символов");if(password!==confirmation)throw Error("Пароли не совпадают");
 await cloudRequest("/auth/v1/user",{method:"PUT",body:JSON.stringify({password})});
 $("newPassword").value="";$("newPasswordConfirm").value="";sessionStorage.removeItem("foxy-recovery-mode");
 await connectCloud()
 }catch(e){cloudInfo("Не удалось сохранить пароль: "+e.message)}
}
function consumeAuthCallback(){
 const params=new URLSearchParams(window.location.hash.replace(/^#/,""));
 if(params.has("error_description")){cloudInfo("Ссылка недействительна или устарела. Запроси новое письмо кнопкой «Получить письмо для входа».");window.history.replaceState(null,"",window.location.pathname+window.location.search);page="data";render();return true}
 if(params.get("access_token")&&params.get("refresh_token")){
 storeCloudSession({access_token:params.get("access_token"),refresh_token:params.get("refresh_token"),expires_in:Number(params.get("expires_in")||3600)});
 window.history.replaceState(null,"",window.location.pathname+window.location.search);
 if(params.get("type")==="recovery")sessionStorage.setItem("foxy-recovery-mode","1");else{sessionStorage.removeItem("foxy-recovery-mode");page="history"}
 }
 if(sessionStorage.getItem("foxy-recovery-mode")==="1"){syncReady=false;page="data";render();return true}
 return false
}

async function startCloud(){if(consumeAuthCallback())return;if(!cloudSession().access_token)return;try{await connectCloud()}catch(e){cloudInfo("Локальные записи сохранены · "+e.message)}}
window.addEventListener("online",()=>{if(syncReady)syncCloud();else startCloud()});
window.addEventListener("offline",()=>cloudInfo("Без интернета · изменения сохраняются на устройстве"));
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&syncReady)syncCloud()});

render();
startCloud();
