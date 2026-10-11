/* Three.js particle journey; no external requests or assets. */
(() => {
  const stage = document.getElementById('cosmosStage');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let renderer;
  try {
    if (!window.THREE) return;
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch (_) { return; } // The existing CSS nebula and 2D stars remain usable.
  stage.appendChild(renderer.domElement);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const world = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, .1, 150);
  camera.position.z = 19;
  const sprite = document.createElement('canvas'); sprite.width = sprite.height = 64;
  const ctx = sprite.getContext('2d');
  const glow = ctx.createRadialGradient(32,32,0,32,32,32);
  glow.addColorStop(0,'rgba(255,255,255,1)'); glow.addColorStop(.15,'rgba(255,255,255,.9)');
  glow.addColorStop(.4,'rgba(255,255,255,.24)'); glow.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=glow;ctx.fillRect(0,0,64,64);
  const texture = new THREE.CanvasTexture(sprite);
  let seed=1729; const random=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
  const count = window.innerWidth < 700 ? 2200 : 4200;
  const positions = new Float32Array(count*3), scattered = new Float32Array(count*3), galaxy = new Float32Array(count*3), heart = new Float32Array(count*3), colors=new Float32Array(count*3);
  const color=new THREE.Color();
  for(let i=0;i<count;i++) {
    const k=i*3, r=.45+Math.pow(random(),.6)*10, arm=i%4, angle=arm*Math.PI/2+r*.72+(random()-.5)*.65;
    galaxy[k]=Math.cos(angle)*r;galaxy[k+1]=(random()-.5)*(1.2-r*.075);galaxy[k+2]=Math.sin(angle)*r;
    scattered[k]=(random()-.5)*38;scattered[k+1]=(random()-.5)*26;scattered[k+2]=(random()-.5)*26;
    const t=random()*Math.PI*2, fill=.7+random()*.3;
    heart[k]=16*Math.pow(Math.sin(t),3)*.38*fill;
    heart[k+1]=(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*.38*fill;
    heart[k+2]=(random()-.5)*3;
    color.setHSL(.72+random()*.1,.35+random()*.3,.63+random()*.28);
    if(i%8===0)color.set('#ffe6b7');color.toArray(colors,k);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const material=new THREE.PointsMaterial({size:.2,map:texture,vertexColors:true,transparent:true,opacity:.96,depthWrite:false,blending:THREE.AdditiveBlending});
  const cloud=new THREE.Points(geometry,material);cloud.frustumCulled=false;world.add(cloud);
  const farGeometry=new THREE.BufferGeometry(), farPositions=new Float32Array(650*3);
  for(let i=0;i<farPositions.length;i++)farPositions[i]=(random()-.5)*75;
  farGeometry.setAttribute('position',new THREE.BufferAttribute(farPositions,3));
  const farStars=new THREE.Points(farGeometry,new THREE.PointsMaterial({size:.085,color:'#ddd6ff',map:texture,transparent:true,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending}));world.add(farStars);
  // Two warm stars travel toward each other as the story progresses.
  const pair=new THREE.Group();world.add(pair);
  const pairMaterial=new THREE.SpriteMaterial({map:texture,color:'#ffe6bc',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  const starA=new THREE.Sprite(pairMaterial),starB=new THREE.Sprite(pairMaterial.clone());
  starB.material.color.set('#d5b2ff');starA.scale.set(1.1,1.1,1);starB.scale.copy(starA.scale);pair.add(starA,starB);
  let active=false, lost=false, frame=null, progress=0, target=0, clock=0, previous=0, pointerX=0,pointerY=0;
  const smooth=(a,b,t)=>{const x=Math.max(0,Math.min(1,(t-a)/(b-a)));return x*x*(3-2*x);};
  function paint(now=0) {
    frame=null;
    if(!active||document.hidden||lost)return;
    const dt=previous?Math.min((now-previous)/1000,.05):0;previous=now;
    if(!reduced.matches)clock+=dt;
    progress=reduced.matches?target:progress+(target-progress)*.065;
    const toGalaxy=smooth(.02,.43,progress),toHeart=smooth(.62,.96,progress);
    const tilt=1.08*(1-toHeart),cs=Math.cos(tilt),sn=Math.sin(tilt);
    for(let i=0;i<count;i++) {
      const k=i*3,gx=galaxy[k],gy=galaxy[k+1]*cs-galaxy[k+2]*sn,gz=galaxy[k+1]*sn+galaxy[k+2]*cs;
      positions[k]=(scattered[k]*(1-toGalaxy)+gx*toGalaxy)*(1-toHeart)+heart[k]*toHeart;
      positions[k+1]=(scattered[k+1]*(1-toGalaxy)+gy*toGalaxy)*(1-toHeart)+heart[k+1]*toHeart;
      positions[k+2]=(scattered[k+2]*(1-toGalaxy)+gz*toGalaxy)*(1-toHeart)+heart[k+2]*toHeart;
    }
    geometry.attributes.position.needsUpdate=true;
    cloud.rotation.z=Math.sin(clock*.09)*.12*(1-toHeart);
    cloud.rotation.y=Math.sin(clock*.07)*.22;
    farStars.rotation.y=clock*.009;
    const separation=6*(1-smooth(.35,.83,progress))+.35;
    starA.position.set(-separation,Math.sin(clock*.4)*.6,2);
    starB.position.set(separation,-Math.sin(clock*.4)*.6,2);
    pair.visible=progress>.22;
    camera.position.x+=(pointerX*.65-camera.position.x)*.03;
    camera.position.y+=(pointerY*.4-camera.position.y)*.03;
    camera.lookAt(0,0,0);renderer.render(world,camera);
    if(!reduced.matches)frame=requestAnimationFrame(paint);
  }
  function kick(){if(active&&!document.hidden&&!lost&&frame===null)frame=requestAnimationFrame(paint);}
  function resize(){renderer.setSize(window.innerWidth,window.innerHeight);camera.aspect=window.innerWidth/window.innerHeight;camera.position.z=camera.aspect<.8?29:19;camera.updateProjectionMatrix();kick();}
  window.addEventListener('resize',resize);
  window.addEventListener('pointermove',e=>{if(!reduced.matches){pointerX=e.clientX/window.innerWidth*2-1;pointerY=1-e.clientY/window.innerHeight*2;}},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=null;previous=0;}else kick();});
  reduced.addEventListener('change',kick);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;stage.classList.remove('is-active');cancelAnimationFrame(frame);frame=null;});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;stage.classList.toggle('is-active',active);kick();});
  window.weddingCosmos={
    setActive(value){active=value;stage.classList.toggle('is-active',value&&!lost);cancelAnimationFrame(frame);frame=null;previous=0;if(value){progress=target=clock=0;pointerX=pointerY=0;kick();}},
    setProgress(value){target=Math.max(0,Math.min(1,value));kick();}
  };
  resize();
})();
