/* CODEX Galaxy — Newtonian gravity in AU, solar masses and days. */
(function(root){
'use strict';
const G=0.0002959122082855911, EARTH=3.0034896e-6, R_EARTH=4.26352e-5, R_SUN=0.00465047;
const V={add:(a,b)=>a.map((x,i)=>x+b[i]),sub:(a,b)=>a.map((x,i)=>x-b[i]),mul:(a,s)=>a.map(x=>x*s),dot:(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len:a=>Math.hypot(...a),unit:a=>{let n=Math.hypot(...a);return n?a.map(x=>x/n):[0,0,0]}};
const catalog=[
 {key:'sun',category:'Stars',name:'Sun-like star',tag:'G2 V',mass:1,radius:R_SUN,color:'#ffba59',kind:'star'},
 {key:'red',category:'Stars',name:'Red dwarf',tag:'M V',mass:.2,radius:R_SUN*.25,color:'#ff684c',kind:'star'},
 {key:'blue',category:'Stars',name:'Blue giant',tag:'B III',mass:8,radius:R_SUN*5,color:'#92caff',kind:'star'},
 {key:'white',category:'Stars',name:'White dwarf',tag:'DA',mass:.6,radius:R_EARTH*1.2,color:'#c6deff',kind:'star'},
 {key:'earth',category:'Planets',name:'Terrestrial world',tag:'ROCK',mass:EARTH,radius:R_EARTH,color:'#4987b9',kind:'earth'},
 {key:'mars',category:'Planets',name:'Desert world',tag:'ROCK',mass:.107*EARTH,radius:.532*R_EARTH,color:'#c7764d',kind:'rock'},
 {key:'jupiter',category:'Planets',name:'Gas giant',tag:'GAS',mass:317.8*EARTH,radius:11.2*R_EARTH,color:'#d2ad88',kind:'gas'},
 {key:'saturn',category:'Planets',name:'Ringed giant',tag:'GAS',mass:95.16*EARTH,radius:9.45*R_EARTH,color:'#d9bd8b',kind:'ring'},
 {key:'ice',category:'Planets',name:'Ice giant',tag:'ICE',mass:17.1*EARTH,radius:3.88*R_EARTH,color:'#649edb',kind:'ice'},
 {key:'moon',category:'Moons',name:'Lunar body',tag:'MOON',mass:.0123*EARTH,radius:.273*R_EARTH,color:'#b4b4ad',kind:'rock'},
 {key:'asteroid',category:'Small bodies',name:'Rocky asteroid',tag:'AST',mass:4.7e-10,radius:3.1e-6,color:'#8b8276',kind:'rock'},
 {key:'comet',category:'Small bodies',name:'Comet',tag:'ICE',mass:5e-16,radius:3e-8,color:'#a9d9e5',kind:'ice'},
 {key:'blackhole',category:'Exotics',name:'Black hole',tag:'BH',mass:10,radius:1.97e-7,color:'#a98eff',kind:'blackhole'},
 {key:'neutron',category:'Exotics',name:'Neutron star',tag:'NS',mass:1.4,radius:8e-8,color:'#e0d5ff',kind:'star'}
];
let nextId=1;
function body(spec){return {id:nextId++,name:spec.name,kind:spec.kind||'rock',color:spec.color||'#aaa',mass:spec.mass,radius:spec.radius,pos:[...(spec.pos||[0,0,0])],vel:[...(spec.vel||[0,0,0])],trail:[],lastTrail:-Infinity,orbit:spec.orbit||0};}
function solar(){const sun=body({...catalog[0],name:'Sun'});const data=[['Mercury',.387,.0553,.383,'#a9a39a','rock',.1],['Venus',.723,.815,.949,'#dbb779','rock',1.8],['Earth',1,1,1,'#4987b9','earth',3.1],['Mars',1.524,.107,.532,'#c7764d','rock',4.7],['Jupiter',5.203,317.8,11.21,'#d2ad88','gas',.8],['Saturn',9.537,95.16,9.45,'#d9bd8b','ring',2.5],['Uranus',19.19,14.54,4.01,'#86d1d5','ice',4.1],['Neptune',30.07,17.15,3.88,'#557ddc','ice',5.6]];const bs=[sun,...data.map(([name,a,m,r,color,kind,t])=>body({name,mass:m*EARTH,radius:r*R_EARTH,color,kind,orbit:a,pos:[a*Math.cos(t),0,a*Math.sin(t)],vel:[-Math.sin(t)*Math.sqrt(G/a),0,Math.cos(t)*Math.sqrt(G/a)]}))];return centerMomentum(bs);}
function centerMomentum(bs){let m=0,p=[0,0,0],v=[0,0,0];for(const b of bs){m+=b.mass;p=V.add(p,V.mul(b.pos,b.mass));v=V.add(v,V.mul(b.vel,b.mass));}if(m>0)for(const b of bs){b.pos=V.sub(b.pos,V.mul(p,1/m));b.vel=V.sub(b.vel,V.mul(v,1/m));}return bs;}
function accelerations(bs){const a=bs.map(()=>[0,0,0]);for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){const d=V.sub(bs[j].pos,bs[i].pos),r2=V.dot(d,d),soft=Math.max(1e-10,(bs[i].radius+bs[j].radius)*.12),k=G/Math.pow(r2+soft*soft,1.5);for(let n=0;n<3;n++){a[i][n]+=k*bs[j].mass*d[n];a[j][n]-=k*bs[i].mass*d[n];}}return a;}
function merge(bs,events){for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){let a=bs[i],b=bs[j];if(V.len(V.sub(a.pos,b.pos))>a.radius+b.radius)continue;const keep=a.mass>=b.mass?a:b,other=keep===a?b:a,m=a.mass+b.mass;keep.pos=V.mul(V.add(V.mul(a.pos,a.mass),V.mul(b.pos,b.mass)),1/m);keep.vel=V.mul(V.add(V.mul(a.vel,a.mass),V.mul(b.vel,b.mass)),1/m);keep.mass=m;keep.radius=Math.cbrt(a.radius**3+b.radius**3);keep.orbit=0;events.push({name:keep.name+' absorbed '+other.name,removed:other.id,kept:keep.id});bs.splice(bs.indexOf(other),1);i=-1;break;}}
function step(bs,dt,events=[]){merge(bs,events);const a=accelerations(bs);for(let i=0;i<bs.length;i++){const b=bs[i];b.vel=V.add(b.vel,V.mul(a[i],dt*.5));b.pos=V.add(b.pos,V.mul(b.vel,dt));}const a2=accelerations(bs);for(let i=0;i<bs.length;i++)bs[i].vel=V.add(bs[i].vel,V.mul(a2[i],dt*.5));merge(bs,events);}
function safeDt(bs){let dt=.2;for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){let a=bs[i],b=bs[j],r=V.len(V.sub(a.pos,b.pos)),v=V.len(V.sub(a.vel,b.vel));if(r>0){dt=Math.min(dt,.035*Math.sqrt(r**3/(G*(a.mass+b.mass))));if(v>0)dt=Math.min(dt,.15*r/v);}}return Math.max(1e-7,dt);}
function circularVelocity(pos,primary){if(!primary)return [0,0,0];let d=V.sub(pos,primary.pos),r=V.len(d);if(r<1e-9)return [...primary.vel];let t=V.unit(V.cross(d,[0,1,0]));if(V.len(t)<.001)t=V.unit(V.cross(d,[1,0,0]));return V.add(primary.vel,V.mul(t,Math.sqrt(G*primary.mass/r)));}
function restore(data){if(!Array.isArray(data)||data.length>100)throw Error('Invalid body list');return data.map(b=>{if(!b||typeof b.name!=='string'||!Number.isFinite(b.mass)||b.mass<=0||b.mass>1e5||!Number.isFinite(b.radius)||b.radius<=0||b.radius>1e3||!['pos','vel'].every(k=>Array.isArray(b[k])&&b[k].length===3&&b[k].every(x=>Number.isFinite(x)&&Math.abs(x)<1e8)))throw Error('Invalid body data');return body({name:b.name.slice(0,64),mass:b.mass,radius:b.radius,pos:b.pos,vel:b.vel,kind:['star','earth','rock','gas','ring','ice','blackhole'].includes(b.kind)?b.kind:'rock',color:/^#[0-9a-f]{6}$/i.test(b.color)?b.color:'#aaaaaa',orbit:Number.isFinite(b.orbit)?Math.max(0,b.orbit):0});});}
const api={G,EARTH,R_EARTH,R_SUN,V,catalog,body,solar,step,safeDt,circularVelocity,restore,centerMomentum};if(typeof module!=='undefined')module.exports=api;else root.GalaxyPhysics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
