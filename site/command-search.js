/*
 * Command button interaction adapted from DesignBookmark, MIT.
 * https://designbookmark.com/motion-src/react/command-button.tsx
 */
(() => {
 const host = document.getElementById('command-search');
 const trigger = document.getElementById('command-trigger');
 const form = document.getElementById('command-field');
 const input = document.getElementById('command-query');
 const results = document.getElementById('command-results');
 const shell = host.querySelector('.command-shell');
 const caps = trigger.querySelectorAll('kbd');
 const mac = /mac|iphone|ipad|ipod/i.test(navigator.userAgentData?.platform ?? navigator.platform);
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const press = {stiffness:520,damping:34,mass:.6};
 const expansion = {stiffness:300,damping:28,mass:1};
 const swap = {duration:180,easing:'cubic-bezier(.23,1,.32,1)'};
 const fold = value => value.toLocaleLowerCase().replaceAll('ё','е').trim();
 let layoutMotion, pressMotion;

 caps[0].textContent = mac ? '⌘' : 'Ctrl';
 trigger.setAttribute('aria-keyshortcuts', mac ? 'Meta+K' : 'Control+K');

 // The same damped oscillator drives both the shell width and its press scale.
 function spring(element, property, from, to, physics, unit) {
  if (reduced.matches || !element.animate || from === to) return;
  const decay = physics.damping / (2 * physics.mass);
  const frequency = Math.sqrt(physics.stiffness / physics.mass - decay ** 2);
  const frames = [];
  for (let frame = 0; frame <= 60; frame++) {
   const t = frame / 60;
   const remaining = Math.exp(-decay * t) *
    (Math.cos(frequency * t) + decay / frequency * Math.sin(frequency * t));
   frames.push({[property]: (to + (from - to) * remaining) + unit});
   if (t > .25 && Math.exp(-decay * t) < .0001) break;
  }
  frames.push({[property]: to + unit});
  return element.animate(frames, {duration:(frames.length-1)*1000/60, easing:'linear'});
 }

 function setPressed(active){
  const current = parseFloat(getComputedStyle(shell).scale) || 1;
  const target = active && !reduced.matches ? .97 : 1;
  if (Number(shell.style.scale || 1) === target) return;
  pressMotion?.cancel();
  shell.style.scale = target;
  pressMotion = spring(shell,'scale',current,target,press,'');
 }

 const clear = {opacity:1,filter:'blur(0px)'};
 const blurred = {opacity:0,filter:'blur(4px)'};
 function setOpen(open, restore=false){
  if(open===host.classList.contains('is-open'))return;
  const previous = parseFloat(getComputedStyle(shell).width);
  layoutMotion?.cancel();
  const incoming = open ? form : trigger;
  const outgoing = open ? trigger : form;
  const outgoingStyle = getComputedStyle(outgoing);
  const start = {opacity:outgoingStyle.opacity,filter:outgoingStyle.filter};
  for(const element of [incoming,outgoing]){
   for(const animation of element.getAnimations()) animation.cancel();
  }
  outgoing.inert=true;
  incoming.hidden=false;
  incoming.inert=false;
  host.classList.toggle('is-open',open);
  trigger.setAttribute('aria-expanded',String(open));
  layoutMotion=spring(shell,'width',previous,shell.offsetWidth,expansion,'px');
  if(reduced.matches){
   outgoing.hidden=true;
  }else{
   const exit=outgoing.animate([start,blurred],swap);
   exit.onfinish=()=>{if(outgoing.inert)outgoing.hidden=true};
   incoming.animate([blurred,clear],{...swap,delay:60,fill:'backwards'});
  }
  if(open){
   const label=tr('Поиск по «Слову»','Search Slovo');
   input.setAttribute('aria-label',label);
   input.placeholder=label;
   input.focus({preventScroll:true});
  }else{
   input.value='';
   results.replaceChildren();
   results.hidden=true;
   if(restore)trigger.focus({preventScroll:true});
  }
 }

 function matches(query){
  const found=[];
  for(const button of document.querySelectorAll('#sidebar [data-page]')){
   const label=button.querySelector('.nav-name')?.textContent;
   if(label&&fold(label).includes(query))found.push({label,kind:tr('Раздел','Section'),open:()=>button.click()});
  }
  for(const chapter of vocabulary){
   const title=preferences.language==='en'&&chapter.titleEn?chapter.titleEn:chapter.title;
   const index=chapters.indexOf(chapter);
   if(fold(chapter.title+' '+(chapter.titleEn||'')).includes(query)){
    found.push({label:title,kind:tr('Тема лексики','Vocabulary topic'),open:()=>viewVocabulary(index)});
   }
   for(const task of chapter.tasks){
    if(!fold(task.prompt+' '+task.answer).includes(query))continue;
    found.push({label:task.prompt+' — '+task.answer,kind:title,open:()=>{
     viewVocabulary(index);
     const search=document.getElementById('word-search');
     search.value=task.prompt;
     search.dispatchEvent(new Event('input'));
    }});
    if(found.length>=80)break;
   }
  }
  return found.sort((a,b)=>Number(fold(b.label).startsWith(query))-Number(fold(a.label).startsWith(query))).slice(0,8);
 }

 function renderResults(){
  results.replaceChildren();
  const query=fold(input.value);
  results.hidden=!query;
  if(!query)return;
  const found=matches(query);
  if(!found.length){
   const status=document.createElement('p');
   status.setAttribute('role','status');
   status.textContent=tr('Ничего не найдено','No results');
   results.append(status);
   return;
  }
  for(const item of found){
   const button=document.createElement('button');
   const label=document.createElement('span');
   const kind=document.createElement('small');
   button.type='button';
   label.textContent=item.label;
   kind.textContent=item.kind;
   button.append(label,kind);
   button.onclick=()=>{setOpen(false);item.open();document.getElementById('main-content').focus({preventScroll:true})};
   results.append(button);
  }
 }

 trigger.onclick=()=>setOpen(true);
 trigger.onpointerdown=()=>setPressed(true);
 for(const type of ['pointerup','pointerleave','pointercancel'])trigger.addEventListener(type,()=>setPressed(false));
 input.oninput=renderResults;
 form.onsubmit=event=>{event.preventDefault();results.querySelector('button')?.click()};
 host.addEventListener('focusout',()=>{
  queueMicrotask(()=>{if(!host.contains(document.activeElement)&&!input.value)setOpen(false)});
 });
 host.addEventListener('keydown',event=>{
  if(!['ArrowUp','ArrowDown'].includes(event.key)||results.hidden)return;
  const choices=[input,...results.querySelectorAll('button')];
  const index=choices.indexOf(document.activeElement);
  const next=choices[(index+(event.key==='ArrowDown'?1:-1)+choices.length)%choices.length];
  event.preventDefault();
  next.focus();
 });
 document.addEventListener('pointerdown',event=>{if(!host.contains(event.target))setOpen(false)});
 window.addEventListener('keydown',event=>{
  if(host.classList.contains('is-open')&&event.key==='Escape'){
   event.preventDefault();
   setOpen(false,true);
   return;
  }
  if(document.querySelector('dialog[open]')||host.classList.contains('is-open'))return;
  const modifier=mac?event.metaKey:event.ctrlKey;
  const key=event.code==='KeyK'||event.key.toLowerCase()==='k';
  caps[0].toggleAttribute('data-on',modifier);
  caps[1].toggleAttribute('data-on',key);
  setPressed(modifier||key);
  if(modifier&&key&&!event.altKey&&!event.shiftKey&&!event.repeat){
   event.preventDefault();
   caps[1].dataset.on='';
   setPressed(true);
   setOpen(true);
  }
 });
 function release(){
  caps.forEach(cap=>delete cap.dataset.on);
  setPressed(false);
 }
 window.addEventListener('keyup',event=>{
  const modifier=mac?event.metaKey:event.ctrlKey;
  caps[0].toggleAttribute('data-on',modifier);
  caps[1].removeAttribute('data-on');
  setPressed(modifier);
 });
 window.addEventListener('blur',release);
})();
