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
 const expansion = {stiffness:300,damping:34-.3*20,mass:1};
 const swap = {duration:180,easing:'cubic-bezier(.23,1,.32,1)'};
 const fold = value => value.toLocaleLowerCase().replaceAll('ё','е').trim();
 let layoutMotion, pressMotion;

 caps[0].textContent = mac ? '⌘' : 'Ctrl';
 trigger.setAttribute('aria-keyshortcuts', mac ? 'Meta+K' : 'Control+K');

 // Sample the damped spring into transform-only keyframes.
 function spring(element, from, to, physics, transform) {
  if (reduced.matches || !element.animate) return;
  let position=from, velocity=0;
  const frames=[{transform:transform(from)}];
  for(let frame=0;frame<48;frame++){
   for(let step=0;step<4;step++){
    const acceleration=(physics.stiffness*(to-position)-physics.damping*velocity)/physics.mass;
    velocity+=acceleration/240;
    position+=velocity/240;
   }
   frames.push({transform:transform(position)});
   if(Math.abs(to-position)<.001 && Math.abs(velocity)<.01)break;
  }
  frames.push({transform:transform(to)});
  return element.animate(frames,{duration:(frames.length-1)*1000/60,easing:'linear'});
 }

 function setPressed(active){
  const scale=pressMotion?Number(new DOMMatrixReadOnly(getComputedStyle(trigger).transform).a):1;
  pressMotion?.cancel();
  const target=active ? .97 : 1;
  trigger.style.transform=active?'scale(.97)':'';
  pressMotion=spring(trigger,scale,target,press,value=>'scale('+value+')');
 }

 function setOpen(open, restore=false){
  if(open===!form.hidden)return;
  const previous=shell.getBoundingClientRect().width;
  layoutMotion?.cancel();
  host.classList.toggle('is-open',open);
  form.hidden=!open;
  trigger.hidden=open;
  trigger.setAttribute('aria-expanded',String(open));
  const width=shell.offsetWidth;
  layoutMotion=spring(shell,previous/width,1,expansion,value=>'scaleX('+value+')');
  const contents=open?form:trigger;
  if(!reduced.matches)contents.animate?.([{opacity:0},{opacity:1}],{...swap,delay:60});
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
  if(!form.hidden&&event.key==='Escape'){
   event.preventDefault();
   setOpen(false,true);
   return;
  }
  if(document.querySelector('dialog[open]')||!form.hidden)return;
  const modifier=mac?event.metaKey:event.ctrlKey;
  const key=event.code==='KeyK'||event.key.toLowerCase()==='k';
  if(modifier)caps[0].dataset.on='';
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
  if(['KeyK','MetaLeft','MetaRight','ControlLeft','ControlRight'].includes(event.code))release();
 });
 window.addEventListener('blur',release);
})();
