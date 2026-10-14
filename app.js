(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const cfg = window.PHOTO_ARCHIVE || {};
  const photos = (cfg.photos || []).filter(p => p && /^\d{4}-\d{2}-\d{2}$/.test(p.date) && typeof p.file === 'string').sort((a,b) => a.date.localeCompare(b.date));
  const format = d => d.replaceAll('-', '.');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const state = {base:0, compare:Math.max(0,photos.length-1), mode:'split', amount:50, scale:1, x:0, y:0, playing:false};
  const cache = new Map(); let revision=0, timer=0, animation=null, gesture=null;
  const pointers = new Map(); const cards=[];
  function placeholder(p) {
    const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#17252d"/><path d="M0 600L300 390 500 550 850 260 1200 500V800H0Z" fill="#22353e"/><text x="600" y="350" text-anchor="middle" font-family="sans-serif" font-size="40" fill="#d5f679">${escape(format(p.date))}</text><text x="600" y="415" text-anchor="middle" font-family="sans-serif" font-size="23" fill="#dce5e7">写真ファイルがありません</text><text x="600" y="462" text-anchor="middle" font-family="sans-serif" font-size="19" fill="#98adb7">${escape(p.file)}</text></svg>`);
  }
  function source(p) { return (cfg.photoPath || 'assets/photos/') + p.file; }
  function load(i) {
    if(cache.has(i)) {const value=cache.get(i);cache.delete(i);cache.set(i,value);return value;}
    const p=photos[i];
    const promise=new Promise(resolve => {
      const img=new Image(); img.decoding='async';
      img.onload=async()=>{try{await img.decode();}catch{} resolve({url:img.currentSrc||img.src, missing:false, ratio:img.naturalWidth/img.naturalHeight});};
      img.onerror=()=>resolve({url:placeholder(p),missing:true,ratio:1.5});
      if(p.srcset){img.sizes='100vw';img.srcset=p.srcset;}
      img.src=source(p);
    });
    cache.set(i,promise);
    // Keep only a few decoded-photo references; the browser owns its HTTP cache.
    if(cache.size>4) {for(const key of cache.keys()){if(key!==state.base&&key!==state.compare&&key!==i){cache.delete(key);break;}}}
    return promise;
  }
  function setPhoto(el, result, p, label){el.src=result.url;el.alt=`${label}：${format(p.date)}${result.missing?'（写真未配置）':''}`;}
  function updateUI(scroll=false){
    $('baseSelect').value=state.base; $('compareSelect').value=state.compare;
    $('baseBadge').textContent=`基準 ${format(photos[state.base].date)}`;
    $('compareBadge').textContent=`${state.playing?'再生':'比較'} ${format(photos[state.compare].date)}`;
    cards.forEach((el,i)=>{el.classList.toggle('is-base',i===state.base);el.classList.toggle('is-compare',i===state.compare);el.setAttribute('aria-label',`${format(photos[i].date)}${i===state.base?' 基準日':''}${i===state.compare?' 比較日':''}`);el.querySelector('.tag').textContent=[i===state.base?'基準':'',i===state.compare?'比較':''].filter(Boolean).join(' / ')||'撮影日';});
    if(scroll&&cards[state.compare])cards[state.compare].scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});
  }
  async function render(scroll=false){
    const token=++revision; $('loading').hidden=false;updateUI(scroll);
    const [a,b]=await Promise.all([load(state.base),load(state.compare)]);
    if(token!==revision)return;
    setPhoto($('base'),a,photos[state.base],'基準写真');setPhoto($('comparison'),b,photos[state.compare],'比較写真');
    $('loading').hidden=true;
    const missing=[a.missing?photos[state.base].file:'',b.missing?photos[state.compare].file:''].filter(Boolean);
    $('status').textContent=missing.length?`未配置：${[...new Set(missing)].join(' ／ ')}`:state.mode==='difference'?'差分には明るさ・天候・撮影位置の違いも含まれます。':'写真を選んで、街の変化を比較できます。';
    if(a.ratio&&b.ratio&&Math.abs(a.ratio-b.ratio)>.02&&!missing.length)$('status').textContent+=' 写真の縦横比が異なります。比較には同じ比率を推奨します。';
    paint();
  }
  function paint(){
    const split=state.mode==='split';const diff=state.mode==='difference';
    $('overlay').style.clipPath=split?`inset(0 0 0 ${state.amount}%)`:'none';
    $('overlay').style.opacity=state.mode==='fade'?state.amount/100:1;
    $('overlay').style.mixBlendMode=diff?'difference':'normal';
    $('divider').hidden=!split||state.playing;
    $('divider').style.left=state.amount+'%';$('divider').setAttribute('aria-valuenow',Math.round(state.amount));
    $('blend').value=state.amount;$('blend').disabled=diff||state.playing;
    $('leftLabel').textContent=state.mode==='fade'?'基準のみ':'基準';$('rightLabel').textContent=state.mode==='fade'?'比較のみ':'比較';
    $('hint').textContent=state.playing?'撮影順に自動再生中':diff?'色の違いを表示（天候・構図のずれも含む）':state.scale>1?'ドラッグで移動・倍率をタップでリセット':split?'境界を左右に動かして比較':'スライダーで透明度を調整';
    document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===state.mode));
  }
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function transform(){
    const r=$('viewport').getBoundingClientRect();state.x=clamp(state.x,-r.width*(state.scale-1)/2,r.width*(state.scale-1)/2);state.y=clamp(state.y,-r.height*(state.scale-1)/2,r.height*(state.scale-1)/2);
    $('plane').style.transform=`translate(${state.x}px,${state.y}px) scale(${state.scale})`;
    $('viewport').classList.toggle('zoomed',state.scale>1);$('reset').textContent=Math.round(state.scale*100)+'%';paint();
  }
  function zoom(value){state.scale=clamp(value,1,4);transform();}
  function reset(){state.scale=1;state.x=state.y=0;transform();}
  function stop(){
    state.playing=false;clearTimeout(timer);animation?.cancel();animation=null;revision++;
    $('playPhoto').style.opacity=0;$('viewport').classList.remove('playing');$('play').textContent='▶ 自動再生';$('play').setAttribute('aria-pressed','false');
    $('baseBadge').hidden=false;$('comparison').parentElement.hidden=false;
    render();
  }
  function choose(i,target='compare'){if(state.playing)stop();state[target]=clamp(i,0,photos.length-1);render();}
  async function playNext(){
    if(!state.playing)return;
    const token=++revision; const next=(state.compare+1)%photos.length;
    $('loading').hidden=false;const result=await load(next);
    if(!state.playing||token!==revision)return;
    $('loading').hidden=true;
    setPhoto($('playPhoto'),result,photos[next],'再生写真');
    const duration=$('playStyle').value==='fade'&&!reduced.matches?Math.min(900,Number($('speed').value)/2):0;
    if(duration){animation=$('playPhoto').animate([{opacity:0},{opacity:1}],{duration,easing:'ease-in-out',fill:'forwards'});try{await animation.finished;}catch{return;}}
    else $('playPhoto').style.opacity=1;
    if(!state.playing||token!==revision)return;
    state.compare=next;setPhoto($('base'),result,photos[next],'再生写真');
    animation?.cancel();animation=null;$('playPhoto').style.opacity=0;
    updateUI(true);$('status').textContent=result.missing?`未配置：${photos[next].file}`:`再生中：${format(photos[next].date)}`;
    const connection=navigator.connection; if(!connection?.saveData)load((next+1)%photos.length);
    timer=setTimeout(playNext,Number($('speed').value));
  }
  async function start(){
    state.playing=true;reset();const token=++revision;
    $('play').textContent='Ⅱ 停止';$('play').setAttribute('aria-pressed','true');$('viewport').classList.add('playing');$('baseBadge').hidden=true;$('overlay').hidden=true;paint();
    $('loading').hidden=false;const result=await load(state.compare);if(!state.playing||token!==revision)return;
    setPhoto($('base'),result,photos[state.compare],'再生写真');$('loading').hidden=true;updateUI();
    timer=setTimeout(playNext,Number($('speed').value));
  }
  if(!photos.length){$('status').textContent='data.js に写真データを追加してください。';$('loading').hidden=true;document.querySelectorAll('button,select,input').forEach(el=>el.disabled=true);return;}
  if(cfg.title){$('title').firstChild.textContent=cfg.title;document.title=cfg.title+' — 定点観測';}
  $('count').textContent=`${photos.length}時点`;
  photos.forEach((p,i)=>{
    for(const id of ['baseSelect','compareSelect']){const option=document.createElement('option');option.value=i;option.textContent=format(p.date);$(id).append(option);}
    const card=document.createElement('button');card.className='card';card.type='button';
    const img=document.createElement('img');img.alt='';img.loading='lazy';img.decoding='async';img.src=p.thumb||source(p);img.onerror=()=>{img.onerror=null;img.src=placeholder(p);};
    const body=document.createElement('div');body.className='card-body';const time=document.createElement('time');time.dateTime=p.date;time.textContent=format(p.date);const tag=document.createElement('span');tag.className='tag';body.append(time,tag);card.append(img,body);
    card.onclick=()=>choose(i,document.querySelector('input[name=target]:checked').value);$('timeline').append(card);cards.push(card);
  });
  $('baseSelect').onchange=e=>choose(Number(e.target.value),'base');$('compareSelect').onchange=e=>choose(Number(e.target.value));
  $('previous').onclick=()=>choose((state.compare-1+photos.length)%photos.length);$('next').onclick=()=>choose((state.compare+1)%photos.length);
  $('swap').onclick=()=>{if(state.playing)stop();[state.base,state.compare]=[state.compare,state.base];render();};
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{if(state.playing)stop();state.mode=b.dataset.mode;paint();render();});
  $('blend').oninput=e=>{state.amount=Number(e.target.value);paint();};
  $('divider').onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();state.amount=e.key==='Home'?0:e.key==='End'?100:clamp(state.amount+(e.key==='ArrowRight'?2:-2),0,100);paint();}};
  const splitAt=e=>{const r=$('viewport').getBoundingClientRect();state.amount=clamp((e.clientX-r.left)/r.width*100,0,100);paint();};
  $('divider').onpointerdown=e=>{e.stopPropagation();$('divider').setPointerCapture(e.pointerId);splitAt(e);};
  $('divider').onpointermove=e=>{if($('divider').hasPointerCapture(e.pointerId))splitAt(e);};
  $('viewport').onpointerdown=e=>{
    if(e.target.closest('button'))return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});$('viewport').setPointerCapture(e.pointerId);
    const values=[...pointers.values()];
    gesture=values.length===2?{distance:Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y),scale:state.scale}:{x:e.clientX,y:e.clientY,px:state.x,py:state.y};
  };
  $('viewport').onpointermove=e=>{
    if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const values=[...pointers.values()];
    if(values.length===2&&gesture?.distance){zoom(gesture.scale*Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y)/Math.max(gesture.distance,1));}
    else if(values.length===1&&state.scale>1&&gesture?.x!==undefined){state.x=gesture.px+e.clientX-gesture.x;state.y=gesture.py+e.clientY-gesture.y;transform();}
  };
  const release=e=>{pointers.delete(e.pointerId);const value=[...pointers.values()][0];gesture=value?{x:value.x,y:value.y,px:state.x,py:state.y}:null;};
  $('viewport').onpointerup=release;$('viewport').onpointercancel=release;$('viewport').onlostpointercapture=release;
  // Leave normal page scrolling intact. Use Ctrl/Cmd+wheel for photo zoom.
  $('viewport').addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();zoom(state.scale*Math.exp(-e.deltaY*.003));}},{passive:false});
  $('zoomIn').onclick=()=>zoom(state.scale+.25);$('zoomOut').onclick=()=>zoom(state.scale-.25);$('reset').onclick=reset;
  $('play').onclick=()=>state.playing?stop():start();
  if(photos.length<2)$('play').disabled=true;
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.playing)stop();});
  window.addEventListener('resize',()=>{pointers.clear();gesture=null;transform();});
  $('help').onclick=()=>$('helpDialog').showModal();$('closeHelp').onclick=()=>$('helpDialog').close();
  $('helpDialog').onclick=e=>{if(e.target===$('helpDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}};
  const expand=()=>{const active=$('app').classList.toggle('expanded');document.body.classList.toggle('expanded',active);$('fullscreen').textContent=active?'閉じる ⛶':'全画面 ⛶';};
  $('fullscreen').onclick=async()=>{if($('app').classList.contains('expanded')){expand();return;}try{if(document.fullscreenElement)await document.exitFullscreen();else if($('app').requestFullscreen)await $('app').requestFullscreen();else expand();}catch{expand();}};
  document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'閉じる ⛶':'全画面 ⛶';});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('app').classList.contains('expanded'))expand();});
  render();
})();
