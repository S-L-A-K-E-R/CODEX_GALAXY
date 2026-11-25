/* CODEX Galaxy — deterministic spacecraft prediction and replay. */
(function(root){
const buildFlight=function buildFlight(P){
'use strict';
const {V,G}=P, DAY=86400, KM=149597870.7, ACC=DAY*DAY/(KM*1000), RAD=Math.PI/180;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const copy=b=>({...b,pos:[...b.pos],vel:[...b.vel],trail:[]});
// Integrate the massive bodies using the existing engine, then interpolate their
// position and velocity with cubic Hermite segments. Spacecraft is a test particle.
function ephemeris(initial){
 const bs=initial.map(copy), grid=[bs.map(copy)], interval=.1*DAY;
 function at(t){
  const i=Math.floor(t/interval), u=(t-i*interval)/interval, d=interval/DAY;
  while(grid.length<=i+1){P.step(bs,d);if(bs.length!==initial.length)throw Error('Planet collision: exploration ephemeris ended');grid.push(bs.map(copy));}
  return grid[i].map((a,j)=>{
   const b=grid[i+1][j],u2=u*u,u3=u2*u;
   return {...a,pos:a.pos.map((x,k)=>(2*u3-3*u2+1)*x+(u3-2*u2+u)*d*a.vel[k]+(-2*u3+3*u2)*b.pos[k]+(u3-u2)*d*b.vel[k]),vel:a.pos.map((x,k)=>((6*u2-6*u)*x+(-6*u2+6*u)*b.pos[k])/d+(3*u2-4*u+1)*a.vel[k]+(3*u2-2*u)*b.vel[k])};
  });
 }
 return {at};
}
function launch(bs,origin,altitude=0){
 const b=bs.find(x=>x.name===origin);if(!b)throw Error('Unknown launch body');
 const r=b.radius+(altitude>0?altitude:.01)/KM;
 return {pos:V.add(b.pos,[r,0,0]),vel:V.add(b.vel,altitude>0?[0,0,Math.sqrt(G*b.mass/r)]:[0,0,0])};
}
function validate(nodes,horizon,bs){
 if(!Number.isFinite(horizon)||horizon<=0||horizon>730*DAY)throw Error('Prediction must span 0–730 days.');
 const sorted=nodes.map(n=>({...n})).sort((a,b)=>a.start-b.start);
 for(let i=0;i<sorted.length;i++){
  const n=sorted[i];
  if(![n.start,n.duration,n.accel,n.angle,n.elevation].every(Number.isFinite)||n.start<0||n.duration<=0||n.start+n.duration>horizon||n.accel<0||n.accel>100||Math.abs(n.elevation)>90||!['local','inertial','prograde','retrograde'].includes(n.frame)||!bs.some(b=>b.name===n.reference))throw Error('Invalid maneuver: check time, duration, direction and acceleration.');
  if(i&&sorted[i-1].start+sorted[i-1].duration>n.start+1e-7)throw Error('Maneuvers cannot overlap.');
 }
 return sorted;
}
function thrustDirection(n,s,bs){
 const b=bs.find(b=>b.name===n.reference), r=V.unit(V.sub(s.pos,b.pos)), v=V.sub(s.vel,b.vel);
 let tang=V.unit(V.sub(v,V.mul(r,V.dot(v,r))));
 if(V.len(tang)<1e-8)tang=V.unit(V.cross(r,[0,1,0]));
 if(V.len(tang)<1e-8)tang=V.unit(V.cross(r,[0,0,1]));
 if(n.frame==='prograde'||n.frame==='retrograde'){let u=V.unit(v);if(V.len(u)<1e-8)u=tang;return V.mul(u,n.frame==='retrograde'?-1:1);}
 const a=n.angle*RAD,e=n.elevation*RAD;
 if(n.frame==='inertial')return [Math.cos(a)*Math.cos(e),Math.sin(e),Math.sin(a)*Math.cos(e)];
 return V.add(V.mul(V.add(V.mul(r,Math.cos(a)),V.mul(tang,Math.sin(a))),Math.cos(e)),V.mul(V.unit(V.cross(tang,r)),Math.sin(e)));
}
function gravity(pos,bs){
 let out=[0,0,0];
 for(const b of bs){const d=V.sub(b.pos,pos),r2=V.dot(d,d),soft=Math.max(1e-10,b.radius*.12),k=G*b.mass/Math.pow(r2+soft*soft,1.5);for(let i=0;i<3;i++)out[i]+=k*d[i];}
 return out;
}
function acceleration(s,bs,n){const g=gravity(s.pos,bs);return n&&n.accel?V.add(g,V.mul(thrustDirection(n,s,bs),n.accel*ACC)):g;}
function advance(s,t,dt,eph,n){
 const h=dt/DAY, b0=eph.at(t), bm=eph.at(t+dt/2), b1=eph.at(t+dt);
 const a=acceleration(s,b0,n);
 const s2={pos:V.add(s.pos,V.mul(s.vel,h/2)),vel:V.add(s.vel,V.mul(a,h/2))},a2=acceleration(s2,bm,n);
 const s3={pos:V.add(s.pos,V.mul(s2.vel,h/2)),vel:V.add(s.vel,V.mul(a2,h/2))},a3=acceleration(s3,bm,n);
 const s4={pos:V.add(s.pos,V.mul(s3.vel,h)),vel:V.add(s.vel,V.mul(a3,h))},a4=acceleration(s4,b1,n);
 const sum=(a,b,c,d)=>a.map((x,i)=>(x+2*b[i]+2*c[i]+d[i])*h/6);
 return {pos:V.add(s.pos,sum(s.vel,s2.vel,s3.vel,s4.vel)),vel:V.add(s.vel,sum(a,a2,a3,a4))};
}
function orbit(s,b){
 const r=V.sub(s.pos,b.pos),v=V.sub(s.vel,b.vel),d=V.len(r),mu=G*b.mass,h=V.cross(r,v),energy=V.dot(v,v)/2-mu/d;
 const e=V.len(V.sub(V.mul(V.cross(v,h),1/mu),V.unit(r))),p=V.dot(h,h)/mu;
 return {altitude:(d-b.radius)*KM,speed:V.len(v)*KM/DAY,periapsis:(p/(1+e)-b.radius)*KM,apoapsis:energy<0&&e<1?(p/(1-e)-b.radius)*KM:Infinity,eccentricity:e,bound:energy<0&&e<1};
}
function predict(initial,ship,nodes,horizon){
 const sorted=validate(nodes,horizon,initial),eph=ephemeris(initial),points=[],sampleEvery=Math.max(1,horizon/1800);
 let s={pos:[...ship.pos],vel:[...ship.vel]},t=0,nextSample=Math.min(sampleEvery,60),index=0,steps=0,status='complete',impact=null,deltaV=0;
 const point=()=>({t,pos:[...s.pos],vel:[...s.vel],deltaV});
 points.push(point());
 while(t<horizon-1e-7){
  if(++steps>100000){status='step-limit';break;}
  while(index<sorted.length&&t>=sorted[index].start+sorted[index].duration-1e-7)index++;
  const upcoming=sorted[index],active=upcoming&&t>=upcoming.start-1e-7?upcoming:null;
  const boundary=upcoming?(active?upcoming.start+upcoming.duration:upcoming.start):horizon;
  const bs=eph.at(t);
  let dt=active&&active.accel>0?5:1800;
  for(const b of bs){
   const r=V.len(V.sub(s.pos,b.pos)),v=V.len(V.sub(s.vel,b.vel));
   if(r<=b.radius){impact=b.name;break;}
   dt=Math.min(dt,.025*Math.sqrt(r**3/(G*b.mass))*DAY);
   if(v>0)dt=Math.min(dt,.04*r/v*DAY);
  }
  if(impact){status='impact';break;}
  dt=Math.min(Math.max(.05,dt),horizon-t,boundary-t,nextSample-t);
  if(dt<=1e-7){nextSample+=sampleEvery;continue;}
  const old=s,oldT=t;
  s=advance(s,t,dt,eph,active);t+=dt;
  const endBodies=eph.at(t);
  // Locate the first surface crossing inside this short integration step.
  let hitFraction=1;
  for(let j=0;j<endBodies.length;j++){
   const b=endBodies[j];if(V.len(V.sub(s.pos,b.pos))>b.radius)continue;
   let lo=0,hi=1;
   for(let k=0;k<22;k++){const m=(lo+hi)/2,trial=V.add(old.pos,V.mul(V.sub(s.pos,old.pos),m)),center=V.add(bs[j].pos,V.mul(V.sub(b.pos,bs[j].pos),m));if(V.len(V.sub(trial,center))>b.radius)lo=m;else hi=m;}
   if(hi<=hitFraction){hitFraction=hi;impact=b.name;}
  }
  if(impact){s={pos:V.add(old.pos,V.mul(V.sub(s.pos,old.pos),hitFraction)),vel:V.add(old.vel,V.mul(V.sub(s.vel,old.vel),hitFraction))};t=oldT+dt*hitFraction;status='impact';}
  if(active)deltaV+=active.accel*(t-oldT)/1000;
  if(impact||t>=nextSample-1e-6||Math.abs(t-boundary)<1e-6||t>=horizon-1e-6){points.push(point());if(t>=nextSample-1e-6)nextSample=t+Math.min(sampleEvery,endBodies.some(b=>V.len(V.sub(s.pos,b.pos))<20*b.radius)?60:sampleEvery);}
  if(impact)break;
 }
 if(points.at(-1).t<t)points.push(point());
 return {points,eph,status,impact,end:t,steps,deltaV,nodes:sorted};
}
function sample(plan,t){
 t=clamp(t,0,plan.end);const a=plan.points;let lo=0,hi=a.length-1;
 while(hi-lo>1){let m=(lo+hi)>>1;if(a[m].t<=t)lo=m;else hi=m;}
 const p=a[lo],q=a[hi],f=q.t===p.t?0:(t-p.t)/(q.t-p.t),mix=(x,y)=>x.map((v,i)=>v+(y[i]-v)*f);
 return {t,pos:mix(p.pos,q.pos),vel:mix(p.vel,q.vel),deltaV:p.deltaV+(q.deltaV-p.deltaV)*f};
}
return {DAY,KM,ACC,launch,validate,ephemeris,predict,sample,orbit,thrustDirection};
};
if(typeof module!=='undefined')module.exports=buildFlight(require('./physics.js'));else root.GalaxyFlight=buildFlight(root.GalaxyPhysics);
})(typeof globalThis!=='undefined'?globalThis:this);
