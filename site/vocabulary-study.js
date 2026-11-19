const vocabularyModes = {
 cards: ['Карточки', 'Flashcards', 'Листай слова и переворачивай карточки.', 'Flip cards to review terms.'],
 learn: ['Заучивание', 'Learn', 'Сначала выбери перевод, затем вспомни слово. Ошибки вернутся в очередь.', 'Choose a translation, then recall the word. Missed items come back.'],
 write: ['Письмо', 'Write', 'Вводи английские слова по переводу.', 'Type English terms from their translations.'],
 spell: ['Правописание на слух', 'Spell', 'Прослушай слово и запиши его.', 'Listen and type the word you hear.'],
 test: ['Тест', 'Test', 'Выбор перевода и письменные ответы. Результат после последнего вопроса.', 'Multiple choice and typed answers. See results at the end.'],
 match: ['Подбор пар', 'Match', 'Соедини слова с переводами и узнай своё время.', 'Match terms and translations against the clock.'],
 review: ['Интервальное повторение', 'Spaced review', 'Оцени, насколько легко вспомнилось слово, и вернись к нему по расписанию.', 'Rate your recall and review cards when they are due.']
};
const vocabularyModeName = mode => tr(...vocabularyModes[mode].slice(0, 2));

function showVocabularyStudy(topic, title, markup, progress=0) {
 $('#trainer').classList.remove('wide-trainer');
 const chapter=chapters[topic];
 $('#session-label').textContent=title?title+' ('+(preferences.language==='en'&&chapter.titleEn?chapter.titleEn:chapter.title)+')':'';
 setSessionProgress(progress/100);
 $('#exercise').innerHTML=markup;
 if(!$('#trainer').open)$('#trainer').showModal();
}

function openVocabularyModes(topic) {
 session={mode:'study-menu',topic};
 showVocabularyStudy(topic,tr('Изучить слова','Study words'),`
  <div class="vocabulary-modes">
   ${Object.entries(vocabularyModes).map(([id,[ru,en,detailRu,detailEn]])=>`
    <button type="button" class="quiz-length-option" data-study-mode="${id}"><strong>${tr(ru,en)}</strong><small>${tr(detailRu,detailEn)}</small></button>`).join('')}
  </div>`);
 document.querySelectorAll('[data-study-mode]').forEach(button=>button.onclick=()=>{
  const mode=button.dataset.studyMode;
  if(mode==='cards')startFlashcards(topic);
  else if(mode==='review')startVocabularyReview(topic);
  else chooseVocabularyStudyLength(topic,mode);
 });
 $('#exercise button').focus();
}

function chooseVocabularyStudyLength(topic,mode) {
 showVocabularyStudy(topic,vocabularyModeName(mode),`
  <h2>${tr('Сколько слов?','How many words?')}</h2>
  <div class="quiz-length-options">
   ${[[defaultVocabularyBatch,tr('20 слов','20 words')],[6,tr('6 слов','6 words')],[50,tr('50 слов','50 words')],['all',tr('Все слова','All words')]].map(([size,label])=>`
    <button type="button" class="quiz-length-option" data-study-size="${size}"><strong>${label}</strong></button>`).join('')}
  </div><button class="text-button" id="study-back">${tr('← Все режимы','← All modes')}</button>`);
 $('#study-back').onclick=()=>openVocabularyModes(topic);
 document.querySelectorAll('[data-study-size]').forEach(button=>button.onclick=()=>startVocabularyStudy(topic,mode,button.dataset.studySize));
 $('#exercise button').focus();
}

function startVocabularyStudy(topic,mode,size) {
 const chapter=chapters[topic];
 const known=new Set(topicRetry(chapter)??activeLearned().map(task=>task.id));
 const tasks=size==='all'?shuffle(chapter.tasks):
  [...shuffle(chapter.tasks.filter(task=>!known.has(task.id))),...shuffle(chapter.tasks.filter(task=>known.has(task.id)))].slice(0,Number(size));
 session={mode,topic,tasks,index:0,results:[],mastered:new Set()};
 if(mode==='match'){
  session.matchStarted=performance.now();
  prepareVocabularyMatch([...tasks]);
 }else{
  session.queue=tasks.map(task=>({task,written:mode==='write'||mode==='spell'}));
  renderVocabularyQuestion();
 }
}

function recordVocabularyAnswer(task,correct){
 const chapter=chapters[session.topic];
 recordAttempt(task,correct,chapter);
 if(correct)award(task,chapter);
 save();
}

function renderVocabularyQuestion(){
 const {mode,topic,index,queue,tasks,mastered}=session;
 const {task,written}=queue[0];
 const isTest=mode==='test', spelling=mode==='spell';
 const typed=written||(isTest&&index%2===1);
 const instruction=spelling?tr('Прослушай и запиши слово','Listen and type the word'):
  typed?tr('Введи слово по-английски','Type the English term'):tr('Выбери перевод','Choose the translation');
 const options=shuffle([task.answer,...shuffle([...new Set(chapters[topic].tasks.map(t=>t.answer))].filter(answer=>answer!==task.answer)).slice(0,3)]);
 const count=mode==='learn'?mastered.size:index;
 const learn=mode==='learn';
 showVocabularyStudy(topic,learn?'':vocabularyModeName(mode),`
  <div class="exercise-word${learn?' learn-question':''}">
   <p aria-live="polite">${count} / ${tasks.length}${learn?' '+tr('выучено','learnt'):''}</p>
   ${learn?`<h2 lang="${typed?'ru':'en'}" data-no-translate>${esc(typed?task.answer:task.prompt)}</h2><p>${instruction}</p>`:`
    <h2>${instruction}</h2>
    ${spelling?`<button class="button light" id="study-speak" type="button">${tr('Прослушать','Play audio')}</button><p id="study-audio-status" role="status"></p>`:`<p data-no-translate>${esc(typed?task.answer:task.prompt)}</p>`}`}
   ${typed?`<form id="study-form"><input class="search-input" id="study-input" lang="en" aria-label="${instruction}" autocomplete="off" autocapitalize="none" spellcheck="false" required>
   <button class="button dark">${tr('Ответить','Answer')}</button></form>`:
   `<div class="study-answers">${options.map(option=>`<button class="answer" type="button" data-study-answer data-no-translate>${esc(option)}</button>`).join('')}</div>`}
   <div id="study-feedback" aria-live="polite"></div>
  </div>`,count/tasks.length*100);
 function submit(value){
  if(!value.trim())return;
  const expected=typed?task.prompt:task.answer;
  const clean=text=>text.normalize('NFKC').trim().toLowerCase().replace(/’/g,"'").replace(/\s+/g,' ');
  const correct=clean(value)===clean(expected);
  session.queue.shift();
  session.index++;
  if(isTest){
   session.results.push({task,value,expected,correct});
   advance();
   return;
  }
  recordVocabularyAnswer(task,correct);
  if(mode==='learn'){
   if(correct&&typed)session.mastered.add(task.id);
   else session.queue.push({task,written:correct});
  }else session.results.push({task,value,expected,correct});
  document.querySelectorAll('#study-form :is(input,button),[data-study-answer]').forEach(control=>control.disabled=true);
  $('#study-feedback').innerHTML=`<p class="feedback">${correct?tr('✓ Верно','✓ Correct'):tr('Правильный ответ: ','Correct answer: ')+`<strong data-no-translate>${esc(expected)}</strong>`}</p>
   <button class="button dark" id="study-next">${tr('Продолжить','Continue')}</button>`;
  $('#study-next').onclick=advance;
  $('#study-next').focus();
 }
 function advance(){
  if(session.queue.length)renderVocabularyQuestion();
  else finishVocabularyStudy();
 }
 if(typed){
  $('#study-form').onsubmit=event=>{event.preventDefault();submit($('#study-input').value)};
  $('#study-input').focus();
 }else{
  document.querySelectorAll('[data-study-answer]').forEach(button=>button.onclick=()=>submit(button.textContent));
  $('[data-study-answer]').focus();
 }
 if(spelling){
  $('#study-speak').onclick=()=>playVocabularyWord(task.prompt);
  $('#study-speak').focus();
 }
}

function playVocabularyWord(word){
 const status=$('#study-audio-status');
 const unavailable=()=>{status.textContent=tr('Озвучивание недоступно в этом браузере.','Audio playback is unavailable in this browser.')};
 if(!('speechSynthesis' in window)){unavailable();return}
 window.speechSynthesis.cancel();
 const speech=new SpeechSynthesisUtterance(word);
 speech.lang='en-GB';
 speech.rate=.85;
 speech.onerror=event=>{if(!['canceled','interrupted'].includes(event.error))unavailable()};
 status.textContent='';
 window.speechSynthesis.speak(speech);
}

function prepareVocabularyMatch(remaining){
 const round=[], translations=new Set();
 session.matchRemaining=remaining.filter(task=>{
  if(round.length===6||translations.has(task.answer))return true;
  translations.add(task.answer);
  round.push(task);
  return false;
 });
 session.matchTerms=shuffle(round);
 session.matchDefinitions=shuffle(round);
 session.matchSolved=new Set();
 session.matchSelected=null;
 renderVocabularyMatch();
}

function renderVocabularyMatch(){
 const {topic,index,tasks,matchTerms,matchDefinitions,matchSolved,matchSelected}=session;
 const column=(entries,side)=>`<div>${entries.map((task,i)=>`<button class="answer" type="button" data-match-side="${side}" data-match-index="${i}" aria-pressed="${matchSelected?.side===side&&matchSelected.task===task}" ${matchSolved.has(task.id)?'disabled':''} data-no-translate>${esc(side==='term'?task.prompt:task.answer)}</button>`).join('')}</div>`;
 showVocabularyStudy(topic,vocabularyModeName('match'),`<h2>${tr('Соедини слова и переводы','Match the terms and translations')}</h2>
  <p>${index} / ${tasks.length}</p>
  <div class="study-match">${column(matchTerms,'term')}${column(matchDefinitions,'definition')}</div>
  <p id="match-status" role="status"></p>`,index/tasks.length*100);
 document.querySelectorAll('[data-match-side]').forEach(button=>button.onclick=()=>{
  const side=button.dataset.matchSide;
  const task=(side==='term'?matchTerms:matchDefinitions)[Number(button.dataset.matchIndex)];
  if(!matchSelected||matchSelected.side===side){
   session.matchSelected=matchSelected?.task===task?null:{side,task};
   renderVocabularyMatch();
   const target=session.matchSelected?document.querySelector(`[data-match-side="${side==='term'?'definition':'term'}"]:not(:disabled)`):null;
   (target||document.querySelector(`[data-match-side="${side}"][data-match-index="${button.dataset.matchIndex}"]`))?.focus();
   return;
  }
  session.matchSelected=null;
  if(matchSelected.task.id===task.id){
   recordVocabularyAnswer(task,true);
   matchSolved.add(task.id);
   session.index++;
   if(matchSolved.size===matchTerms.length){
    if(session.matchRemaining.length)prepareVocabularyMatch(session.matchRemaining);
    else finishVocabularyStudy();
   }else renderVocabularyMatch();
  }else{
   renderVocabularyMatch();
   $('#match-status').textContent=tr('Эти карточки не составляют пару.','These cards do not match.');
  }
  (document.querySelector('[data-match-side]:not(:disabled)')||$('#study-return'))?.focus();
 });
}

function finishVocabularyStudy(){
 const {mode,topic,results,tasks}=session;
 if(mode==='test')results.forEach(({task,correct})=>recordVocabularyAnswer(task,correct));
 const score=mode==='learn'||mode==='match'?tasks.length:results.filter(result=>result.correct).length;
 const detail=mode==='match'?`<p>${tr('Время: ','Time: ')}${Math.round((performance.now()-session.matchStarted)/1000)} ${tr('с','s')}</p>`:'';
 showVocabularyStudy(topic,vocabularyModeName(mode),`<h2>${tr('Тренировка завершена','Session complete')}</h2>
  <p>${score} / ${tasks.length} ${tr('слов','words')}</p>${detail}
  ${results.some(result=>!result.correct)?`<details><summary>${tr('Разобрать ошибки','Review mistakes')}</summary>
   <ul>${results.filter(result=>!result.correct).map(result=>`<li data-no-translate>${esc(result.task.prompt)} (${esc(result.value)}) → <strong>${esc(result.expected)}</strong></li>`).join('')}</ul></details>`:''}
  <button class="button dark" id="study-return">${tr('К режимам изучения','Study modes')}</button>`,100);
 $('#study-return').onclick=()=>openVocabularyModes(topic);
 $('#study-return').focus();
}

function startVocabularyReview(topic){
 const chapter=chapters[topic], now=Date.now();
 const schedule=state.vocabularyReviews?.[chapter.id]??{};
 const due=chapter.tasks.filter(task=>schedule[task.id]&&schedule[task.id]<=now);
 const fresh=chapter.tasks.filter(task=>!schedule[task.id]).slice(0,20);
 session={mode:'review',topic,tasks:[...due,...fresh],index:0,flipped:false};
 renderVocabularyReview();
}

function renderVocabularyReview(){
 const {topic,tasks,index,flipped}=session;
 const task=tasks[index], title=vocabularyModeName('review');
 if(!task){
  showVocabularyStudy(topic,title,`<h2>${tr('На сегодня всё','Review complete')}</h2><p>${tr('За раз добавляется до 20 новых карточек. Оценки запоминания сохраняются в браузере.','Up to 20 new cards are added per session. Recall ratings are saved in this browser.')}</p>
  <button class="button dark" id="study-return">${tr('К режимам изучения','Study modes')}</button>`,100);
  $('#study-return').onclick=()=>openVocabularyModes(topic);
  $('#study-return').focus();
  return;
 }
 const ratings=[[5,'Повторить','Again'],[60,'Трудно','Hard'],[1440,'Помню','Good'],[5760,'Легко','Easy']];
 showVocabularyStudy(topic,title,`<p>${index+1} / ${tasks.length}</p>
  <button type="button" class="flashcard" id="review-card"><strong class="flashcard-text" data-no-translate>${esc(flipped?task.answer:task.prompt)}</strong><span>${tr('Перевернуть карточку','Flip card')}</span></button>
  ${flipped?`<div class="review-ratings">${ratings.map(([minutes,ru,en])=>`<button type="button" class="button light" data-review-minutes="${minutes}">${tr(ru,en)}</button>`).join('')}</div>`:''}`,index/tasks.length*100);
 $('#review-card').onclick=()=>{session.flipped=!flipped;renderVocabularyReview()};
 (flipped?$('[data-review-minutes]'):$('#review-card')).focus();
 document.querySelectorAll('[data-review-minutes]').forEach(button=>button.onclick=()=>{
  const id=chapters[topic].id;
  const schedule=state.vocabularyReviews?.[id]??{};
  schedule[task.id]=Date.now()+Number(button.dataset.reviewMinutes)*60000;
  state.vocabularyReviews={...state.vocabularyReviews,[id]:schedule};
  save();
  session.index++;
  session.flipped=false;
  renderVocabularyReview();
 });
}
