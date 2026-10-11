/* Original instrumental BGM; embedded audio avoids file:// media restrictions. */
(() => {
  const buttons=[...document.querySelectorAll('#musicToggle,[data-music-toggle]')];
  let context=null,gains=[],buffers=null,sources=[],loading=null;
  let activated=false,wanted=false,playing=false,mode=0,scene='scene-hero',operation=0;
  function update(error=false){
    buttons.forEach(button=>{
      button.setAttribute('aria-pressed',String(playing));
      button.setAttribute('aria-label',playing?'暂停背景音乐':error?'重试播放背景音乐':'开启背景音乐');
      button.querySelector('span').textContent=playing?'音乐 · 开':error?'重试音乐':'开启音乐';
      button.classList.toggle('is-playing',playing);
    });
  }
  function setup(){
    if(context)return;
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtx)throw new Error('Audio unavailable');
    context=new AudioCtx();
    gains=[0,1].map(()=>{const gain=context.createGain();gain.gain.value=0;gain.connect(context.destination);return gain;});
  }
  function load(){
    if(!loading){
      loading=Promise.all(window.WEDDING_MUSIC_DATA.map(data=>{
        const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));
        return context.decodeAudioData(bytes.buffer);
      })).then(decoded=>{buffers=decoded;}).catch(error=>{loading=null;throw error;});
    }
    return loading;
  }
  function resetSource(index){
    if(!buffers)return;
    if(sources[index]){sources[index].stop();sources[index].disconnect();}
    const source=context.createBufferSource();source.buffer=buffers[index];source.loop=true;
    source.connect(gains[index]);source.start();sources[index]=source;
  }
  function volume(seconds=2.4){
    if(!context)return;
    const level=scene==='scene-letter'?.28:scene==='scene-mystery'?.22:mode===1?.38:.34;
    gains.forEach((node,i)=>{
      const gain=node.gain,now=context.currentTime;
      if(gain.cancelAndHoldAtTime)gain.cancelAndHoldAtTime(now);
      else {gain.cancelScheduledValues(now);gain.setValueAtTime(gain.value,now);}
      gain.linearRampToValueAtTime(i===mode&&playing?level:0,now+seconds);
    });
  }
  async function start(){
    activated=true;wanted=true;const token=++operation;
    try{
      setup();const resume=context.resume();
      await Promise.all([resume,load()]);
      if(token!==operation||!wanted)return;
      if(!sources.length){resetSource(0);resetSource(1);}
      playing=true;volume(1.3);update();
    }catch(_){if(token!==operation)return;wanted=false;playing=false;volume(0);update(true);}
  }
  function pause(keepIntent=false){
    operation++;if(!keepIntent)wanted=false;playing=false;volume(0);
    context?.suspend().catch(()=>{});update();
  }
  buttons.forEach(button=>button.addEventListener('click',()=>{activated=true;if(wanted)pause();else start();}));
  document.addEventListener('click',event=>{
    if(!activated&&event.target.closest('button')&&!event.target.closest('#musicToggle,[data-music-toggle]'))start();
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){if(wanted)pause(true);}
    else if(wanted)start();
  });
  window.weddingMusic={setScene(id){
    scene=id;const next=id==='scene-universe'||id==='scene-finale'?1:0;
    if(next!==mode){mode=next;resetSource(mode);}
    if(id==='scene-hero')resetSource(0);
    volume();
  }};
})();
