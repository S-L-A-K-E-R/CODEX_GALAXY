/* CODEX Galaxy — exploration mission control. */
(function flightUI(){
'use strict';
const P=GalaxyPhysics,F=GalaxyFlight,V=P.V,$=id=>document.getElementById(id),canvas=$('flightMap'),ctx=canvas.getContext('2d');
let initial=P.solar();const earth=initial.find(b=>b.name==='Earth'),moonDistance=.00257;
initial.push(P.body({...P.catalog.find(b=>b.key==='moon'),name:'Moon',pos:V.add(earth.pos,[0,0,moonDistance]),vel:V.add(earth.vel,[-Math.sqrt(P.G*earth.mass/moonDistance),0,0])}));P.centerMomentum(initial);
let nodes=[],nextId=1,editing=null,plan=null,time=0,playing=false,last=0,zoom=1,pan=[0,0],drag=null,hover=null,dirty=false,origin='Earth',ship=null,goalTime=Infinity,screenPoints=[],W=0,H=0;
const num=x=>Number.isFinite(x)?x.toLocaleString('en-US',{maximumFractionDigits:1}):'—';
function clock(t){if(t>=86400)return (t/86400).toFixed(2)+' d';const h=Math.floor(t/3600),m=Math.floor(t/60)%60,s=Math.floor(t)%60;return [h,m,s].map(x=>String(x).padStart(2,'0')).join(':');}
function message(s){$('flightStatus').textContent=s;}
function options(id,items){for(const name of items){const o=document.createElement('option');o.value=name;o.textContent=name;$(id).append(o);}}
const planets=initial.filter(b=>b.kind!=='star').map(b=>b.name);
for(const id of ['origin','target','burnReference'])options(id,planets);
options('mapReference',['Sun',...planets]);for(const id of ['origin','target','burnReference','mapReference'])$(id).value='Earth';
function getHorizon(){return $('horizon').valueAsNumber*3600;}
function goal(s,b){const o=F.orbit(s,b);return $('objective').value==='science'?o.altitude>=0&&o.altitude<=b.radius*F.KM*4:o.altitude>=0&&o.bound&&o.periapsis>5&&o.apoapsis<b.radius*F.KM*30;}
function evaluateGoal(){goalTime=Infinity;if(!plan)return;const name=$('target').value;for(const s of plan.points){if(goal(s,plan.eph.at(s.t).find(b=>b.name===name))){goalTime=s.t;break;}}}
function renderNodes(){
 const list=$('maneuvers');list.replaceChildren();
 if(!nodes.length){const p=document.createElement('p');p.className='muted';p.textContent='No maneuvers. Coast under gravity, or select a point on the predicted path.';list.append(p);}
 nodes.slice().sort((a,b)=>a.start-b.start).forEach((n,i)=>{
  const row=document.createElement('div');row.className='maneuver'+(n.id===editing?' selected':'');
  const b=document.createElement('button');b.type='button';b.className='node-select';b.textContent=`${String(i+1).padStart(2,'0')} · T+${clock(n.start)} · ${n.accel?num(n.accel)+' m/s²':'COAST'} / ${num(n.duration)} s`;b.onclick=()=>edit(n);
  const del=document.createElement('button');del.type='button';del.textContent='×';del.title='Delete maneuver';del.setAttribute('aria-label','Delete maneuver '+(i+1));del.onclick=()=>{const old=nodes;nodes=nodes.filter(x=>x.id!==n.id);if(recompute()){if(editing===n.id)clearEditor();renderNodes();}else {nodes=old;renderNodes();}};
  row.append(b,del);list.append(row);
 });
}
function clearEditor(t=0){editing=null;$('burnForm').reset();$('burnTime').value=Math.round(t*100)/100;$('burnReference').value=origin;$('burnTitle').textContent='NEW MANEUVER';$('applyBurn').textContent='Add maneuver';renderNodes();}
function edit(n){editing=n.id;$('burnTime').value=n.start;$('burnDuration').value=n.duration;$('burnAccel').value=n.accel;$('burnFrame').value=n.frame;$('burnReference').value=n.reference;$('burnAngle').value=n.angle;$('burnElevation').value=n.elevation;$('burnTitle').textContent='EDIT MANEUVER';$('applyBurn').textContent='Update maneuver';renderNodes();}
function recompute(){
 playing=false;try{
  const horizon=getHorizon();const result=F.predict(initial,ship,nodes,horizon);
  plan=result;time=0;dirty=false;$('timeline').max=plan.end;$('timeline').value=0;evaluateGoal();
  message(plan.status==='impact'?'PREDICTED IMPACT · '+plan.impact+' at T+'+clock(plan.end):plan.status==='step-limit'?'PREDICTION LIMIT · '+clock(plan.end)+' of '+clock(horizon)+' · shorten the horizon or plan an escape burn':'PREDICTION READY · '+clock(plan.end)+' · '+num(plan.deltaV)+' km/s total Δv');
  $('flightPlay').disabled=false;$('flightPlay').textContent='▶ Play';renderNodes();return true;
 }catch(e){message(e.message);$('flightPlay').textContent='▶ Play';return false;}
}
function resetMission(){
 origin=$('origin').value;ship=F.launch(initial,origin,Number($('launchSite').value));nodes=[];nextId=1;editing=null;zoom=1;pan=[0,0];hover=null;$('mapReference').value=origin;$('burnReference').value=origin;
 if($('launchSite').value==='0'){
  nodes.push({id:nextId++,start:0,duration:90,accel:25,frame:'inertial',reference:origin,angle:0,elevation:0});
  if(origin==='Earth'&&getHorizon()>=430)nodes.push({id:nextId++,start:90,duration:340,accel:25,frame:'inertial',reference:origin,angle:85,elevation:0});
 }
 clearEditor();if(!recompute()){plan=null;message('Unable to initialize mission. Check the prediction horizon.');}fit();
}
$('burnForm').onsubmit=e=>{
 e.preventDefault();if(!ship)return;
 const n={id:editing??nextId,start:$('burnTime').valueAsNumber,duration:$('burnDuration').valueAsNumber,accel:$('burnAccel').valueAsNumber,frame:$('burnFrame').value,reference:$('burnReference').value,angle:$('burnAngle').valueAsNumber,elevation:$('burnElevation').valueAsNumber};
 const previous=nodes;nodes=[...nodes.filter(x=>x.id!==n.id),n];
 if(recompute()){if(editing===null)nextId++;edit(n);}else{nodes=previous;renderNodes();}
};
$('newBurn').onclick=()=>clearEditor(time);$('newMission').onclick=resetMission;
$('predictBtn').onclick=()=>{if(recompute())fit();};
$('horizon').oninput=()=>{dirty=true;playing=false;$('flightPlay').disabled=true;$('flightPlay').textContent='▶ Play';message('HORIZON CHANGED · Recalculate prediction');};
$('origin').onchange=resetMission;$('launchSite').onchange=resetMission;
$('target').onchange=evaluateGoal;$('objective').onchange=evaluateGoal;
$('mapReference').onchange=fit;$('plane').onchange=fit;
$('fitFlight').onclick=fit;
$('flightPlay').onclick=()=>{if(!plan||dirty)return;if(time>=plan.end)time=0;playing=!playing;last=performance.now();$('flightPlay').textContent=playing?'Ⅱ Pause':'▶ Play';};
$('rewind').onclick=()=>{playing=false;time=0;$('flightPlay').textContent='▶ Play';};
$('timeline').oninput=()=>{playing=false;time=Number($('timeline').value);$('flightPlay').textContent='▶ Play';};
function axes(v){return $('plane').value==='xy'?[v[0],v[1]]:[v[0],v[2]];}
function relative(s){const b=plan.eph.at(s.t).find(b=>b.name===$('mapReference').value);return axes(V.sub(s.pos,b.pos));}
let baseScale=1;
function fit(){
 zoom=1;pan=[0,0];if(!plan)return;
 const b=plan.eph.at(0).find(b=>b.name===$('mapReference').value);
 let extent=b.radius*2;
 for(const s of plan.points){const [x,y]=relative(s);extent=Math.max(extent,Math.abs(x),Math.abs(y));}
 baseScale=.43*Math.min(W||600,H||500)/Math.max(extent,1e-10);
}
function screen(v){return [W/2+pan[0]+v[0]*baseScale*zoom,H/2+pan[1]-v[1]*baseScale*zoom];}
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);W=r.width;H=r.height;canvas.width=Math.max(1,Math.round(W*d));canvas.height=Math.max(1,Math.round(H*d));ctx.setTransform(d,0,0,d,0,0);fit();}
new ResizeObserver(resize).observe(canvas);
function pathSegment(a,b,color,dashed){ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.setLineDash(dashed?[5,4]:[]);ctx.stroke();ctx.setLineDash([]);}
let cachePlan=null,cacheRef='',cachePlane='',relativePoints=[];
function draw(){
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#070f19';ctx.fillRect(0,0,W,H);
 if(!plan)return;
 const ref=$('mapReference').value,plane=$('plane').value;
 if(cachePlan!==plan||cacheRef!==ref||cachePlane!==plane){relativePoints=plan.points.map(relative);cachePlan=plan;cacheRef=ref;cachePlane=plane;}
 const center=screen([0,0]),scale=baseScale*zoom;
 ctx.strokeStyle='#223345';ctx.lineWidth=1;
 const tick=10**Math.floor(Math.log10(80/scale)),spacing=tick*scale;
 if(spacing>5&&spacing<1000){ctx.beginPath();for(let x=((center[0]%spacing)+spacing)%spacing;x<W;x+=spacing){ctx.moveTo(x,0);ctx.lineTo(x,H);}for(let y=((center[1]%spacing)+spacing)%spacing;y<H;y+=spacing){ctx.moveTo(0,y);ctx.lineTo(W,y);}ctx.stroke();}
 const bs=plan.eph.at(time),primary=bs.find(b=>b.name===ref);
 ctx.font='11px ui-monospace,monospace';
 for(const b of bs){const [x,y]=screen(axes(V.sub(b.pos,primary.pos))),radius=Math.max(3,b.radius*scale);if(x+radius<0||x-radius>W||y+radius<0||y-radius>H)continue;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fillStyle=b.color;ctx.globalAlpha=.65;ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#c9d7e6';ctx.fillText(b.name,x+Math.min(radius,100)+6,y-6);}
 screenPoints=relativePoints.map(screen);
 // Group adjacent segments of the same visual state to avoid one stroke per point.
 let style='';
 function flush(){if(!style)return;const [color,dash]=style.split('|');ctx.strokeStyle=color;ctx.lineWidth=2;ctx.setLineDash(dash==='1'?[5,4]:[]);ctx.stroke();ctx.setLineDash([]);}
 let nodeIndex=0;
 for(let i=1;i<screenPoints.length;i++){
  const a=plan.points[i-1],b=plan.points[i],mid=(a.t+b.t)/2;
  while(nodeIndex<plan.nodes.length&&mid>=plan.nodes[nodeIndex].start+plan.nodes[nodeIndex].duration)nodeIndex++;
  const n=plan.nodes[nodeIndex],active=n&&n.accel>0&&mid>=n.start;
  const key=(active?'#f6bc64':mid<=time?'#75e7cf':'#72bde5')+'|'+(mid>time&&!active?'1':'0');
  if(key!==style){flush();ctx.beginPath();ctx.moveTo(...screenPoints[i-1]);style=key;}
  ctx.lineTo(...screenPoints[i]);
 }
 flush();
 for(const [i,n] of plan.nodes.entries()){
  if(n.start>plan.end)continue;
  const s=F.sample(plan,n.start),p=screen(relative(s));ctx.fillStyle=n.id===editing?'#fff':'#f6bc64';ctx.strokeStyle='#101820';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p[0],p[1]-7);ctx.lineTo(p[0]+7,p[1]);ctx.lineTo(p[0],p[1]+7);ctx.lineTo(p[0]-7,p[1]);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillText('M'+(i+1),p[0]+10,p[1]-10);
  if(n.accel){const body=plan.eph.at(n.start),dir=F.thrustDirection(n,s,body),[dx,dy]=axes(dir),len=Math.hypot(dx,dy);if(len>.001){const end=[p[0]+dx/len*28,p[1]-dy/len*28];pathSegment(p,end,'#f6bc64',false);ctx.beginPath();ctx.arc(...end,3,0,Math.PI*2);ctx.fill();}}
 }
 if(hover!==null){const p=screen(relative(F.sample(plan,hover)));ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(...p,8,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#fff';ctx.fillText('T+'+clock(hover),p[0]+12,p[1]+16);}
 const s=F.sample(plan,time),p=screen(relative(s)),burn=plan.nodes.find(n=>n.accel>0&&time>=n.start&&time<n.start+n.duration&&time<plan.end);
 const vel=axes(burn?F.thrustDirection(burn,s,bs):V.sub(s.vel,primary.vel)),theta=Math.atan2(-vel[1],vel[0]);ctx.save();ctx.translate(...p);ctx.rotate(theta);ctx.fillStyle=burn?'#ffd18b':'#f0f7ff';ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(-7,-6);ctx.lineTo(-4,0);ctx.lineTo(-7,6);ctx.closePath();ctx.fill();if(burn){ctx.fillStyle='#f6bc64';ctx.beginPath();ctx.moveTo(-6,-3);ctx.lineTo(-17-Math.random()*4,0);ctx.lineTo(-6,3);ctx.fill();}ctx.restore();
 ctx.fillStyle='#c9d7e6';ctx.fillText('FRAME / '+ref.toUpperCase()+' · '+plane.toUpperCase(),14,20);
 ctx.fillText(num(tick*F.KM)+' km / grid',14,H-14);
 $('timeline').value=time;$('flightClock').textContent='T+'+clock(time);
 $('engineState').textContent=burn?'ENGINE ON · '+num(burn.accel)+' m/s²':'ENGINE OFF';
 const target=bs.find(b=>b.name===$('target').value),o=F.orbit(s,target);
 $('altitude').textContent=num(o.altitude)+' km';$('speed').textContent=num(o.speed)+' km/s';$('periapsis').textContent=num(o.periapsis)+' km';$('apoapsis').textContent=Number.isFinite(o.apoapsis)?num(o.apoapsis)+' km':'ESCAPE / UNBOUND';$('deltaV').textContent=num(s.deltaV)+' km/s';
 $('missionResult').textContent=goalTime<=time?'OBJECTIVE ACHIEVED':plan.impact&&time>=plan.end?'MISSION IMPACT':goalTime<Infinity?'OBJECTIVE PREDICTED AT T+'+clock(goalTime):'OBJECTIVE PENDING';
}
function nearest(x,y){
 if(!plan)return null;let best=14*14,at=null;
 for(let i=1;i<screenPoints.length;i++){const a=screenPoints[i-1],b=screenPoints[i],dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy,f=den?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/den)):0,d=(x-a[0]-f*dx)**2+(y-a[1]-f*dy)**2;if(d<best){best=d;at=plan.points[i-1].t+(plan.points[i].t-plan.points[i-1].t)*f;}}
 return at;
}
function pointer(e){const r=canvas.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];}
canvas.addEventListener('pointerdown',e=>{const [x,y]=pointer(e);drag={x,y,pan:[...pan],moved:false};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{const [x,y]=pointer(e);if(drag){if(Math.hypot(x-drag.x,y-drag.y)>4)drag.moved=true;if(drag.moved){pan=[drag.pan[0]+x-drag.x,drag.pan[1]+y-drag.y];hover=null;return;}}hover=nearest(x,y);});
canvas.addEventListener('pointerup',e=>{if(!drag)return;const [x,y]=pointer(e);if(!drag.moved&&plan){const n=plan.nodes.find(n=>{if(n.start>plan.end)return false;const p=screen(relative(F.sample(plan,n.start)));return Math.hypot(x-p[0],y-p[1])<10;});if(n)edit(n);else{const t=nearest(x,y);if(t!==null){clearEditor(t);message('MANEUVER POINT SELECTED · T+'+clock(t)+' · configure and add burn');}}}drag=null;});
canvas.addEventListener('pointercancel',()=>{drag=null;});canvas.addEventListener('pointerleave',()=>{hover=null;});
canvas.addEventListener('wheel',e=>{e.preventDefault();const [x,y]=pointer(e),old=zoom;zoom=Math.max(.05,Math.min(1e7,zoom*Math.exp(-e.deltaY*.0015)));const f=zoom/old;pan=[x-W/2+(pan[0]-(x-W/2))*f,y-H/2+(pan[1]-(y-H/2))*f];},{passive:false});
$('zoomIn').onclick=()=>{zoom=Math.min(1e7,zoom*1.5);};$('zoomOut').onclick=()=>{zoom=Math.max(.05,zoom/1.5);};
function frame(now){
 if(playing&&plan){const w=$('flightWarp').value==='auto'?plan.end/20:Number($('flightWarp').value);time=Math.min(plan.end,time+Math.min(.25,(now-last)/1000)*w);if(time>=plan.end){playing=false;$('flightPlay').textContent='▶ Replay';}}
 last=now;draw();requestAnimationFrame(frame);
}
$('horizon').value=3;resetMission();resize();requestAnimationFrame(frame);
})();
