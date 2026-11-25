const assert=require('node:assert/strict'),P=require('./physics.js'),{V}=P;
let bs=P.solar();assert.equal(bs.length,9);assert.ok(V.len(bs.reduce((a,b)=>V.add(a,V.mul(b.vel,b.mass)),[0,0,0]))<1e-15);const energy=bs=>bs.reduce((s,b,i)=>s+.5*b.mass*V.dot(b.vel,b.vel)-bs.slice(i+1).reduce((n,c)=>n+P.G*b.mass*c.mass/V.len(V.sub(b.pos,c.pos)),0),0);let initial=energy(bs);for(let i=0;i<1825;i++)P.step(bs,.2);assert.ok(Math.abs((energy(bs)-initial)/initial)<1e-4);assert.equal(bs.length,9);let a=P.body({name:'a',mass:1,radius:.1,pos:[0,0,0],vel:[1,0,0]}),b=P.body({name:'b',mass:2,radius:.1,pos:[.05,0,0],vel:[0,0,0]}),events=[];let pair=[a,b];P.step(pair,.001,events);assert.equal(pair.length,1);assert.equal(pair[0].mass,3);assert.ok(Math.abs(pair[0].vel[0]-1/3)<1e-12);assert.equal(events.length,1);assert.equal(P.restore(bs).length,9);assert.throws(()=>P.restore([{name:'bad',mass:-1}]));console.log('Physics tests passed: solar system, momentum, energy, collisions, save validation.');

const S=require('./presets.js');
assert.equal(S.presets.length,11);
assert.equal(new Set(S.presets.map(p=>p.id)).size,S.presets.length);
const state=bs=>bs.map(({name,mass,radius,pos,vel,kind,color,orbit})=>({name,mass,radius,pos,vel,kind,color,orbit}));
for(const p of S.presets){
  const a=S.create(p.id),b=S.create(p.id);
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
