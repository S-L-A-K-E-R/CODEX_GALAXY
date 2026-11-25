/* CODEX Galaxy — deterministic scenario library. */
(function(root){
const buildPresets=function buildPresets(P) {
  'use strict';
  const {G,V,EARTH,R_EARTH}=P;
  const template=key=>P.catalog.find(b=>b.key===key);
  const make=(key,name,pos,vel,extra={})=>P.body({...template(key),name,pos,vel,...extra});
  const star=(name,pos,vel,extra={})=>make('sun',name,pos,vel,extra);
  function orbit(key,name,primary,r,angle,inclination=0,extra={}){
    const c=Math.cos(angle),s=Math.sin(angle),ci=Math.cos(inclination),si=Math.sin(inclination);
    const speed=Math.sqrt(G*primary.mass/r);
    return make(key,name,V.add(primary.pos,[r*c,r*s*si,r*s*ci]),V.add(primary.vel,[-speed*s,speed*c*si,speed*c*ci]),extra);
  }
  function figureEight(perturb=0){
    // Equal-mass Newtonian choreography (dimensionless G=m=1 initial conditions).
    // AU and solar mass units require multiplying velocities by sqrt(G).
    const scale=Math.sqrt(G), u=[.466203685*scale,0,.43236573*scale];
    return [
      star('Aster A',[-.97000436,0,.24308753],u,{color:'#ffb55f'}),
      star('Aster B',[.97000436,0,-.24308753],V.mul(u,1+perturb),{color:'#83caff'}),
      star('Aster C',[0,0,0],V.mul(u,-2),{color:'#fa8275'})
    ];
  }
  function binary(){
    const separation=1.4,m1=1,m2=.6,omega=Math.sqrt(G*(m1+m2)/separation**3);
    const x1=-separation*m2/(m1+m2),x2=separation*m1/(m1+m2);
    const a=star('Helios A',[x1,0,0],[0,0,omega*x1]);
    const b=make('red','Helios B',[x2,0,0],[0,0,omega*x2],{mass:m2,radius:P.R_SUN*.6});
    const center={mass:m1+m2,pos:[0,0,0],vel:[0,0,0]};
    return [a,b,orbit('earth','Tatooine',center,4.5,.9),orbit('jupiter','Far giant',center,8,3.5)];
  }
  function chaotic(){
    return [
      star('Amber',[-1.25,0,-.15],[.003,.001,.004],{mass:1.1}),
      make('red','Crimson',[.9,.15,-.45],[-.005,-.002,.003],{mass:.75,radius:P.R_SUN*.7}),
      star('Azure',[.2,-.1,1.2],[.004,.001,-.006],{mass:1.25,color:'#84bcff'})
    ];
  }
  function collision(){
    return [
      make('earth','Gaia A',[-.012,0,0],[.00025,0,0],{mass:EARTH,radius:R_EARTH}),
      make('earth','Gaia B',[.012,0,0],[-.00025,0,0],{mass:EARTH,radius:R_EARTH,color:'#e28c5b'})
    ];
  }
  function moons(){
    const planet=make('jupiter','Jovia',[0,0,0],[0,0,0]);
    return [planet,
      ...[.003,.005,.008,.014].map((r,i)=>orbit('moon',['Io','Europa','Ganymede','Callisto'][i],planet,r,i*1.7,0,{mass:EARTH*[.015,.008,.025,.018][i],orbit:r})),
      orbit('moon','Polar wanderer',planet,.026,1.4,Math.PI/2,{mass:EARTH*.004})
    ];
  }
  function belt(){
    const sun=star('Sol',[0,0,0],[0,0,0]);
    const bs=[sun,orbit('earth','Inner world',sun,1,.7,0,{orbit:1}),orbit('jupiter','Giant shepherd',sun,4.8,3.2,0,{orbit:4.8})];
    for(let i=0;i<36;i++){
      const r=2.15+.95*((i*17)%37)/36,angle=i*2.399963229728653;
      bs.push(orbit('asteroid','Belt '+String(i+1).padStart(2,'0'),sun,r,angle,.05*Math.sin(i)));
    }
    return bs;
  }
  function inclined(){
    const sun=star('Sol',[0,0,0],[0,0,0]);
    return [sun,orbit('earth','Equator',sun,.8,.2,0,{orbit:.8}),
      orbit('mars','Tilted',sun,1.25,1.7,Math.PI/4),
      orbit('ice','Polar',sun,2.1,2.7,Math.PI/2),
      orbit('jupiter','Retrograde',sun,3.5,4.4,Math.PI),
      orbit('saturn','Oblique',sun,5,5.2,Math.PI*2/3)];
  }
  function flyby(){
    const sun=star('Sol',[0,0,0],[0,0,0]);
    return [sun,orbit('earth','Earthlike',sun,1,.7,0,{orbit:1}),orbit('jupiter','Outer giant',sun,3,2.4,0,{orbit:3}),
      make('red','Rogue star',[-8,.35,-1.6],[.025,0,.004],{mass:.8,radius:P.R_SUN*.75})];
  }

  // NASA/JPL SSD, Approximate Positions of the Planets, Table 1 (1800–2050).
  // https://ssd.jpl.nasa.gov/planets/approx_pos.html
  // Each row: a (AU), e, I, L, longitude of perihelion, longitude of node;
  // followed by the six secular rates per Julian century. Angles in degrees.
  const elements=[
    [[.38709927,.20563593,7.00497902,252.25032350,77.45779628,48.33076593],[.00000037,.00001906,-.00594749,149472.67411175,.16047689,-.12534081]],
    [[.72333566,.00677672,3.39467605,181.97909950,131.60246718,76.67984255],[.00000390,-.00004107,-.00078890,58517.81538729,.00268329,-.27769418]],
    [[1.00000261,.01671123,-.00001531,100.46457166,102.93768193,0],[.00000562,-.00004392,-.01294668,35999.37244981,.32327364,0]],
    [[1.52371034,.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891],[.00001847,.00007882,-.00813131,19140.30268499,.44441088,-.29257343]],
    [[5.20288700,.04838624,1.30439695,34.39644051,14.72847983,100.47390909],[-.00011607,-.00013253,-.00183714,3034.74612775,.21252668,.20469106]],
    [[9.53667594,.05386179,2.48599187,49.95424423,92.59887831,113.66242448],[-.00125060,-.00050991,.00193609,1222.49362201,-.41897216,-.28867794]],
    [[19.18916464,.04725744,.77263783,313.23810451,170.95427630,74.01692503],[-.00196176,-.00004397,-.00242939,428.48202785,.40805281,.04240589]],
    [[30.06992276,.00859048,1.77004347,-55.12002969,44.96476227,131.78422574],[.00026291,.00005105,.00035372,218.45945325,-.32241464,-.00508664]]
  ];
  const DAY_MS=86400000, J2000=Date.UTC(2000,0,1,12), RAD=Math.PI/180;
  const validEpoch=ms=>Number.isFinite(ms)&&ms>=Date.UTC(1800,0,1)&&ms<Date.UTC(2051,0,1);
  function heliocentric(row,days){
    const T=days/36525;
    const [a,e,I,L,peri,node]=row[0].map((v,i)=>v+row[1][i]*T);
    const M=(((L-peri+180)%360+360)%360-180)*RAD;
    let E=M;
    for(let n=0;n<12;n++){
      const delta=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));
      E-=delta;
      if(Math.abs(delta)<1e-13)break;
    }
    const x=a*(Math.cos(E)-e),y=a*Math.sqrt(1-e*e)*Math.sin(E);
    const w=(peri-node)*RAD, O=node*RAD, i=I*RAD;
    const u=x*Math.cos(w)-y*Math.sin(w), v=x*Math.sin(w)+y*Math.cos(w);
    // J2000 ecliptic (X,Y,Z) -> sandbox (X,-Z,Y), with XZ orbital plane.
    return [u*Math.cos(O)-v*Math.cos(i)*Math.sin(O),-v*Math.sin(i),
      u*Math.sin(O)+v*Math.cos(i)*Math.cos(O)];
  }
  function datedSolar(epochMs){
    if(!validEpoch(epochMs))throw Error('Solar System date must be in 1800–2050 (UTC). Check your device clock.');
    // UTC approximates the ephemeris time scale here; sufficient for this model.
    const days=(epochMs-J2000)/DAY_MS, h=.01;
    const bs=P.solar();
    bs[0].pos=[0,0,0];bs[0].vel=[0,0,0];
    elements.forEach((row,i)=>{
      const b=bs[i+1];
      b.pos=heliocentric(row,days);
      b.vel=V.mul(V.sub(heliocentric(row,days+h),heliocentric(row,days-h)),1/(2*h));
      b.orbit=row[0][0]+row[1][0]*days/36525;
      // Earth represents the Earth–Moon barycenter; no separate Moon in this preset.
      if(i===2)b.mass+=.0123*EARTH;
    });
    return bs;
  }
  const presets=[
    {id:'solar',name:'Solar System',label:'SOL SYSTEM',category:'CLASSIC',description:'Our Sun and eight planets in approximate circular orbits.',warp:10,create:P.solar},
    {id:'solar-now',name:'Solar System Now',label:'SOL SYSTEM / NOW',category:'EPHEMERIS',description:'Approximate planetary positions at a device-clock epoch.',warp:10,create:datedSolar},
    {id:'empty',name:'Empty Space',label:'CUSTOM SYSTEM',category:'SANDBOX',description:'Build a universe from scratch.',warp:10,create:()=>[]},
    {id:'figure-eight',name:'Three-body Figure Eight',label:'FIGURE EIGHT',category:'CHOREOGRAPHY',description:'Three equal stars share a single looping path. Try nudging a velocity.',warp:250,create:()=>figureEight()},
    {id:'perturbed-eight',name:'Broken Figure Eight',label:'BROKEN FIGURE EIGHT',category:'CHAOS',description:'The same choreography, but one star starts 8% faster. Compare their trails.',warp:250,create:()=>figureEight(.08)},
    {id:'chaotic-triple',name:'Chaotic Three-body',label:'CHAOTIC TRIPLE',category:'CHAOS',description:'Three unequal stars in a non-hierarchical system; watch close encounters and possible ejections.',warp:100,create:chaotic},
    {id:'binary',name:'Binary Star System',label:'BINARY SYSTEM',category:'ORBITAL',description:'Two stars orbit each other while two distant planets circle the pair.',warp:250,create:binary},
    {id:'collision',name:'Planetary Collision',label:'PLANETARY COLLISION',category:'IMPACT',description:'Two Earth-mass planets rush toward a head-on merger.',warp:50,create:collision},
    {id:'moons',name:'Kingdom of Moons',label:'KINGDOM OF MOONS',category:'ORBITAL',description:'Five moons orbit a gas giant, including a polar moon.',warp:10,create:moons},
    {id:'asteroid-belt',name:'Asteroid Belt',label:'ASTEROID BELT',category:'MANY BODY',description:'36 asteroids, an inner planet and a giant shepherd orbit a star.',warp:50,create:belt},
    {id:'inclined',name:'Crossed Orbits',label:'CROSSED ORBITS',category:'3D ORBITS',description:'Five planets follow tilted, polar and retrograde paths around one star.',warp:250,create:inclined},
    {id:'flyby',name:'Stellar Flyby',label:'STELLAR FLYBY',category:'ENCOUNTER',description:'A rogue star passes near a small planetary system and disturbs its orbits.',warp:250,create:flyby}
  ];
  const get=id=>presets.find(p=>p.id===id);
  function create(id,epochMs){
    const preset=get(id);
    if(!preset)throw Error('Unknown scenario: '+id);
    return P.centerMomentum(preset.create(epochMs));
  }
  return {presets,get,create,validEpoch};
};
if(typeof module!=='undefined')module.exports=buildPresets(require('./physics.js'));
else root.GalaxyPresets=buildPresets(root.GalaxyPhysics);
})(typeof globalThis!=='undefined'?globalThis:this);
