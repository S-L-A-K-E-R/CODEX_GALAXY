const assert=require('node:assert/strict'),P=require('./physics.js'),{V}=P;
let bs=P.solar();assert.equal(bs.length,9);assert.ok(V.len(bs.reduce((a,b)=>V.add(a,V.mul(b.vel,b.mass)),[0,0,0]))<1e-15);const energy=bs=>bs.reduce((s,b,i)=>s+.5*b.mass*V.dot(b.vel,b.vel)-bs.slice(i+1).reduce((n,c)=>n+P.G*b.mass*c.mass/V.len(V.sub(b.pos,c.pos)),0),0);let initial=energy(bs);for(let i=0;i<1825;i++)P.step(bs,.2);assert.ok(Math.abs((energy(bs)-initial)/initial)<1e-4);assert.equal(bs.length,9);let a=P.body({name:'a',mass:1,radius:.1,pos:[0,0,0],vel:[1,0,0]}),b=P.body({name:'b',mass:2,radius:.1,pos:[.05,0,0],vel:[0,0,0]}),events=[];let pair=[a,b];P.step(pair,.001,events);assert.equal(pair.length,1);assert.equal(pair[0].mass,3);assert.ok(Math.abs(pair[0].vel[0]-1/3)<1e-12);assert.equal(events.length,1);assert.equal(P.restore(bs).length,9);assert.throws(()=>P.restore([{name:'bad',mass:-1}]));console.log('Physics tests passed: solar system, momentum, energy, collisions, save validation.');

const S=require('./presets.js');
assert.equal(S.presets.length,12);
assert.equal(new Set(S.presets.map(p=>p.id)).size,S.presets.length);
const state=bs=>bs.map(({name,mass,radius,pos,vel,kind,color,orbit})=>({name,mass,radius,pos,vel,kind,color,orbit}));
for(const p of S.presets){
  const epoch=Date.UTC(2026,10,25,9,38);const a=S.create(p.id,epoch),b=S.create(p.id,epoch);
  assert.deepEqual(state(a),state(b),p.id+' deterministic reset');
  assert.equal(P.restore(a).length,a.length);
  assert.ok(a.length<=100);
  assert.ok(V.len(a.reduce((v,x)=>V.add(v,V.mul(x.vel,x.mass)),[0,0,0]))<1e-14,p.id+' momentum');
  for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)assert.ok(V.len(V.sub(a[i].pos,a[j].pos))>a[i].radius+a[j].radius,p.id+' starts without overlap');
  for(let i=0;i<100;i++)P.step(a,P.safeDt(a));
  assert.ok(a.every(b=>[...b.pos,...b.vel].every(Number.isFinite)),p.id+' finite integration');
}
assert.equal(S.create('asteroid-belt').length,39);
assert.equal(S.create('figure-eight').length,3);
assert.notDeepEqual(state(S.create('figure-eight')),state(S.create('perturbed-eight')));
assert.throws(()=>S.create('unknown'));
const impact=S.create('collision'),impacts=[];let days=0;
while(impact.length>1&&days<100){const dt=P.safeDt(impact);P.step(impact,dt,impacts);days+=dt;}
assert.equal(impact.length,1);assert.equal(impacts.length,1);
assert.ok(Math.abs(impact[0].mass-2*P.EARTH)<1e-15);
console.log('Scenario tests passed: reproducibility, momentum, integration, collision, validation.');

const j2000=Date.UTC(2000,0,1,12), day=86400000;
const now=S.create('solar-now',j2000), tomorrow=S.create('solar-now',j2000+day);
assert.equal(now.length,9);
assert.notDeepEqual(state(now),state(tomorrow));
const rel=(bs,i,k)=>V.sub(bs[i][k],bs[0][k]);
const earth=rel(now,3,'pos');
// J2000 Earth–Moon barycenter: heliocentric ecliptic x≈−.177 AU, y≈.967 AU.
assert.ok(Math.abs(earth[0]+.177)<.003);
assert.ok(Math.abs(earth[2]-.967)<.003);
assert.ok(Math.abs(earth[1])<.001);
assert.ok(Math.abs(rel(now,1,'pos')[1])>1e-3,'inclined Mercury orbit');
for(let i=1;i<9;i++){
  const measured=V.sub(rel(tomorrow,i,'pos'),rel(now,i,'pos'));
  assert.ok(V.len(V.sub(measured,rel(now,i,'vel')))<.003,'velocity matches position derivative');
  assert.ok(V.len(rel(now,i,'vel'))>0);
}
assert.throws(()=>S.create('solar-now'));
assert.throws(()=>S.create('solar-now',Date.UTC(2051,0,1)));
assert.throws(()=>S.create('solar-now',NaN));
assert.ok(S.validEpoch(Date.UTC(1800,0,1)));
assert.ok(S.validEpoch(Date.UTC(2050,11,31)));
console.log('Dated Solar System tests passed: epoch, position, inclination, velocity and validation.');
