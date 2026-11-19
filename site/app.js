const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const allTasks=chapters.flatMap(c=>c.tasks),taskIds=new Set(allTasks.map(t=>t.id)),total=allTasks.length;
const vocabulary=chapters.filter(c=>c.kind==='vocab'),vocabIds=new Set(vocabulary.flatMap(c=>c.tasks.map(t=>t.id)));
let state;try{state=JSON.parse(localStorage.getItem(SlovoContent.preview?'slovo-preview-progress-v1':'slovo-oge-v1'))}catch{}
if(!state||!Array.isArray(state.learned))state={learned:[],dates:[]};
// Keep earlier results even when their old demo vocabulary is no longer in this course.
state.dates=Array.isArray(state.dates)?state.dates:[];
if(!state.practice||typeof state.practice!=='object'||Array.isArray(state.practice))state.practice={};
let session=null,currentPage='home',storageFailed=false,selectedChapter=null;
const today=()=>new Date().toLocaleDateString('en-CA');
const activeLearned=()=>state.learned.filter(w=>taskIds.has(w.id));
function topicRetry(c){
 return Object.hasOwn(state.topicRetries||{},c.id)&&Array.isArray(state.topicRetries[c.id])
  ? state.topicRetries[c.id] : null;
}
function topicProgress(c){
 const correct=new Set(topicRetry(c)??activeLearned().map(word=>word.id));
 return c.tasks.filter(task=>correct.has(task.id)).length;
}
function save(){try{localStorage.setItem(SlovoContent.preview?'slovo-preview-progress-v1':'slovo-oge-v1',JSON.stringify(state))}catch{storageFailed=true}renderStats()}
function award(t,c){
 const retry=topicRetry(c);
 if(retry&&!retry.includes(t.id))retry.push(t.id);
 if(!state.learned.some(w=>w.id===t.id))state.learned.push({id:t.id,date:today()});if(!state.dates.includes(today()))state.dates.push(today())}
function streak(){let n=0,d=new Date();if(!state.dates.includes(today()))d.setDate(d.getDate()-1);while(state.dates.includes(d.toLocaleDateString('en-CA'))){n++;d.setDate(d.getDate()-1)}return n}
function sourceMarkup(c){const source=preferences.language==='en'?(c.kind==='vocab'?'Quizlet · @antoxaenglish · Imported 18 November 2026.':c.readingType==='true-false-not-stated'?'New original reading practice. OGE 2027 written task type: 13–19. Not a FIPI bank task.':c.block?'Original practice text based on the Quizlet topic. The task format was checked against the FIPI OGE 2027 written sample. This is not a FIPI task.':'Original practice from Elizaveta’s local materials, 2 November 2026.'):c.source;return `<p class="source-note">${esc(source)} ${c.sourceUrl?`<a href="${esc(c.sourceUrl)}" target="_blank" rel="noopener noreferrer">Источник ↗</a>`:''}</p>`}
const vocabularyTopicEmoji={
 1:'👪', 2:'🪞', 3:'🎨', 4:'🏃', 5:'🛍️', 6:'🏫', 7:'💼',
 8:'🧳', 9:'🏙️', 10:'🌿', 11:'📰', 12:'🌍', 13:'🌟'
};
function topicStatus(c,i){
 const count=topicProgress(c), total=c.tasks.length;
 const percent=total?count/total*100:0;
 const progressLabel=tr('Прогресс темы','Topic progress');
 const done=total>0&&count===total;
 return {
  done,
  ring:`<span class="topic-ring${done?' is-complete':''}" role="progressbar" aria-label="${progressLabel}" aria-valuemin="0" aria-valuemax="${total||1}" aria-valuenow="${count}" aria-valuetext="${tr(Math.floor(percent)+'% изучено',Math.floor(percent)+'% learned')}">
   <svg viewBox="0 0 36 36" aria-hidden="true">
    <circle class="topic-ring-track" cx="18" cy="18" r="15"/>
    <circle class="topic-ring-fill" cx="18" cy="18" r="15" pathLength="100" stroke-dasharray="${percent} 100" transform="rotate(-90 18 18)"/>
   </svg><span aria-hidden="true">${tr(Math.floor(percent)+'% изучено',Math.floor(percent)+'% learned')}</span>
  </span>`,
  actions:done?`<div class="topic-actions">
   <span class="topic-complete"><span class="topic-status-icon" aria-hidden="true">✓</span>${tr('Тема пройдена','Topic completed')}</span>
   <button class="topic-retry" type="button" data-retry-topic="${i}"><span class="topic-status-icon" aria-hidden="true">↻</span>${tr('Пройти тему ещё раз','Retake topic')}</button>
  </div>`:''
 };
}
function topicCards(list, vocabularyList=false){
 return list.map(c=>{
  const i=chapters.indexOf(c), status=vocabularyList?topicStatus(c,i):null;
  const title=preferences.language==='en'&&c.titleEn?c.titleEn:c.title;
  return `<div class="topic-row${vocabularyList?' vocabulary-topic-row':''}${status?.done?' is-complete':''}">
   <button class="topic" type="button" data-topic="${i}">
    ${vocabularyList?`<span class="topic-emoji" aria-hidden="true">${vocabularyTopicEmoji[c.topicNumber]??'📚'}</span>`:''}
    <div><small>${c.topicNumber?`Тема ${String(c.topicNumber).padStart(2,'0')}`:'Дополнительная практика'}</small>
    <h3>${esc(title)}</h3><p>${esc(c.subtitle)}</p>${status?.ring??''}</div>
   </button>
   ${vocabularyList?`<div class="topic-study"><button class="button dark" type="button" data-study-topic="${i}">${tr('Учить','Study')}</button></div>`:''}
   ${status?.actions??''}
  </div>`;
 }).join('');
}
function restartTopic(i){
 const c=chapters[i];
 state.topicRetries={...state.topicRetries,[c.id]:[]};
 save();
 start(i,true,'all');
}
function bindTopics(){
 document.querySelectorAll('[data-topic]').forEach(b=>b.onclick=()=>{
  const i=Number(b.dataset.topic);
  if(chapters[i].kind==='vocab')viewVocabulary(i);
  else start(i);
 });
 document.querySelectorAll('[data-study-topic]').forEach(b=>b.onclick=()=>openVocabularyModes(Number(b.dataset.studyTopic)));
 document.querySelectorAll('[data-retry-topic]').forEach(b=>b.onclick=()=>restartTopic(Number(b.dataset.retryTopic)));
}
function completedVocabularyTopics(){
 const known=new Set(activeLearned().map(word=>word.id));
 return vocabulary.filter(chapter=>chapter.tasks.length&&chapter.tasks.every(task=>known.has(task.id)));
}
function renderDictionary(){
 const completed=completedVocabularyTopics();
 $('#secondary-view').innerHTML=completed.length?`<div class="word-list">${completed.map(chapter=>`
  <button class="vocab-card" type="button" data-dictionary-topic="${chapters.indexOf(chapter)}">
   <h3><span aria-hidden="true">${vocabularyTopicEmoji[chapter.topicNumber]??'📚'}</span> ${esc(preferences.language==='en'&&chapter.titleEn?chapter.titleEn:chapter.title)}</h3>
   <small>${tr('Всего терминов','Total terms')}: ${chapter.tasks.length}</small>
  </button>`).join('')}</div>`:`<p>${tr('Пройденных тем пока нет.','No completed topics yet.')}</p>`;
 document.querySelectorAll('[data-dictionary-topic]').forEach(button=>{
  button.onclick=()=>viewVocabulary(Number(button.dataset.dictionaryTopic),'words');
 });
}
const defaultVocabularyBatch=20;
let vocabularyBackPage='vocabulary';
function renderStats(){$('#word-count').textContent=completedVocabularyTopics().length}
function shuffle(items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function chooseQuizLength(topic){const c=chapters[topic];session={mode:'length',topic};$('#trainer').classList.remove('wide-trainer');$('#session-label').textContent=tr('ПРОВЕРИТЬ СЕБЯ','CHECK YOURSELF')+' · '+(preferences.language==='en'?(interfaceEnglish[c.title]||c.title):c.title);$('#session-progress').style.width='0%';$('#exercise').innerHTML=`<div class="quiz-length-heading"><h2>${tr('Сколько слов потренируем?','How many words would you like to practise?')}</h2><p>${tr('Выбери длину этой тренировки.','Choose the length of this session.')}</p></div><div class="quiz-length-options">${[[String(defaultVocabularyBatch),tr('20 слов','20 words'),tr('По умолчанию','Default')],['6',tr('6 слов','6 words'),tr('Короткая тренировка','A short session')],['50',tr('50 слов','50 words'),tr('Большая тренировка','A longer session')],['all',tr('Все слова','All words'),tr('Весь набор: ','The whole set: ')+c.tasks.length]].map(([value,label,description])=>`<button class="quiz-length-option" data-quiz-size="${value}"><strong>${label}</strong><small>${description}</small></button>`).join('')}</div><p class="feature-note">${tr('В коротких тренировках сначала идут слова без правильного ответа. «Все слова» включает весь набор, даже слова, на которые ты уже отвечала верно.','Shorter sessions prioritise words not yet answered correctly. All words includes the whole set, even words you have answered correctly before.')}</p>`;document.querySelectorAll('[data-quiz-size]').forEach(b=>b.onclick=()=>start(topic,false,b.dataset.quizSize==='all'?'all':Number(b.dataset.quizSize)));if(!$('#trainer').open)$('#trainer').showModal();$('[data-quiz-size="20"]').focus()}
function start(topic=0,review=false,size=defaultVocabularyBatch){const c=chapters[topic];let tasks=c.tasks;const limit=[6,defaultVocabularyBatch,50,'all'].includes(size)?size:defaultVocabularyBatch;if(c.kind==='vocab'){if(limit==='all')tasks=[...c.tasks];else{const knownIds=new Set(topicRetry(c)??state.learned.map(w=>w.id)),pending=tasks.filter(t=>!knownIds.has(t.id)),known=tasks.filter(t=>knownIds.has(t.id));tasks=(review||!pending.length?shuffle(tasks):[...pending,...known]).slice(0,limit)}}session={topic,tasks,index:0,correct:0,answered:false,used:[],review,limit};if(!$('#trainer').open)$('#trainer').showModal();if(c.passage)$('#trainer').classList.add('wide-trainer');if(c.block)renderFormationBlock();else renderExercise()}
const normalise=s=>s.toLowerCase().replace(/[\s'’]/g,'').trim();
const wordForm=s=>s.trim().toLowerCase();
function isCorrect(t,value,c){const clean=c.kind==='formation'?wordForm:normalise;return(t.accepted||[t.answer]).some(a=>clean(value)===clean(a))}
function startFlashcards(topic){
 const deck=[...chapters[topic].tasks];
 session={mode:'flashcards',topic,deck,tasks:deck,index:0,flipped:false,reversed:false,shuffled:false,ratings:new Map(),ratedThisRound:new Set(),round:1};
 if(!$('#trainer').open)$('#trainer').showModal();
 renderFlashcard();
}
function moveFlashcard(direction){
 const next=session.index+direction;
 if(next<0||next>=session.tasks.length)return;
 session.index=next;
 session.flipped=false;
 renderFlashcard();
}
function rateFlashcard(known){
 const {tasks,index,ratings,ratedThisRound}=session;
 const task=tasks[index];
 ratings.set(task.id,known);
 ratedThisRound.add(task.id);
 const next=tasks.findIndex((item,i)=>i>index&&!ratedThisRound.has(item.id));
 const remaining=next<0?tasks.findIndex(item=>!ratedThisRound.has(item.id)):next;
 if(remaining<0){finishFlashcardRound();return}
 session.index=remaining;
 session.flipped=false;
 renderFlashcard();
}
function finishFlashcardRound(){
 const {deck,ratings,round,topic}=session;
 session.mode='flashcards-results';
 const known=deck.filter(task=>ratings.get(task.id)===true);
 const review=deck.filter(task=>ratings.get(task.id)===false);
 const group=(title,tasks)=>`<details class="flashcard-group"><summary>${title} · ${tasks.length}</summary>
  <ul>${tasks.map(task=>`<li data-no-translate>${esc(task.prompt)} — ${esc(task.answer)}</li>`).join('')}</ul></details>`;
 $('#session-progress').style.width='100%';
 $('#exercise').innerHTML=`<h2>${review.length?tr('Круг завершён','Round complete')+' · '+round:tr('Все карточки отмечены как выученные','All cards marked as learnt')}</h2>
  ${group(tr('Выучены','Learnt'),known)}${group(tr('Ещё не выучены','Still learning'),review)}
  <div class="chapter-actions">${review.length?
   `<button class="button dark" id="flashcard-review">${tr('Повторить невыученные','Review unlearnt cards')} · ${review.length}</button>`:
   `<button class="button light" id="flashcard-restart">${tr('Начать заново','Start again')}</button>`}
   <button class="button light" id="flashcard-check">${tr('Проверить себя','Check yourself')}</button></div>`;
 if(review.length){
  $('#flashcard-review').onclick=()=>{
   Object.assign(session,{mode:'flashcards',tasks:session.shuffled?shuffle(review):review,index:0,flipped:false,ratedThisRound:new Set(),round:round+1});
   renderFlashcard();
  };
 }else $('#flashcard-restart').onclick=()=>startFlashcards(topic);
 $('#flashcard-check').onclick=()=>chooseQuizLength(topic);
 $('#exercise button').focus();
}
function renderFlashcard(){
 const {topic,tasks,index,flipped,reversed,shuffled,ratings,deck,round}=session;
 const c=chapters[topic],t=tasks[index];
 const showTranslation=reversed!==flipped;
 const known=[...ratings.values()].filter(Boolean).length,review=ratings.size-known;
 $('#session-label').textContent=tr('Карточки','Flashcards')+' · '+(preferences.language==='en'&&c.titleEn?c.titleEn:c.title);
 $('#session-progress').style.width=known/deck.length*100+'%';
 $('#exercise').innerHTML=`
  <div class="flashcard-top">
   <span>${tr('Круг','Round')} ${round}</span><span id="flashcard-count" aria-live="polite">${index+1} / ${tasks.length}</span>
  </div>
  <button class="flashcard" id="flip-card" aria-label="${tr('Перевернуть карточку','Flip card')}" aria-pressed="${flipped}">
   <span class="eyebrow">${showTranslation?'РУССКИЙ':'ENGLISH'}</span>
   <span class="flashcard-text" lang="${showTranslation?'ru':'en'}" data-no-translate>${esc(showTranslation?t.answer:t.prompt)}</span>
   <span class="flashcard-hint">${tr('Нажми, чтобы перевернуть','Click to flip')} ↻</span>
  </button>
  <div class="flashcard-ratings">
   <button type="button" class="button light" id="flashcard-unknown" aria-pressed="${ratings.get(t.id)===false}"><span aria-hidden="true">✕</span> ${tr('Не выучил','Still learning')}</button>
   <button type="button" class="button light" id="flashcard-known" aria-pressed="${ratings.get(t.id)===true}"><span aria-hidden="true">✓</span> ${tr('Выучил','Learnt')}</button>
  </div>
  <p class="flashcard-tally" aria-live="polite">${tr('Выучены','Learnt')}: ${known} · ${tr('Ещё не выучены','Still learning')}: ${review}</p>
  <div class="flashcard-navigation">
   <button class="button light" id="flashcard-prev" aria-label="Предыдущая карточка" ${index===0?'disabled':''}>←</button>
   <span>← → ${tr('листать · пробел перевернуть','browse · Space to flip')}</span>
   <button class="button light" id="flashcard-next" aria-label="Следующая карточка" ${index===tasks.length-1?'disabled':''}>→</button>
  </div>
  <div class="flashcard-options"><button class="text-button" id="flashcard-shuffle" aria-pressed="${shuffled}">${tr('Перемешать','Shuffle')}</button><button class="text-button" id="flashcard-direction">${reversed?tr('Сначала русский','Russian first'):tr('Сначала английский','English first')} ↔</button></div>
  <button class="button dark" id="flashcard-check">${tr('Проверить себя','Check yourself')} →</button>`;
 $('#flip-card').onclick=()=>{session.flipped=!flipped;renderFlashcard()};
 $('#flashcard-prev').onclick=()=>moveFlashcard(-1);
 $('#flashcard-next').onclick=()=>moveFlashcard(1);
 $('#flashcard-unknown').onclick=()=>rateFlashcard(false);
 $('#flashcard-known').onclick=()=>rateFlashcard(true);
 $('#flashcard-direction').onclick=()=>{session.reversed=!reversed;session.flipped=false;renderFlashcard()};
 $('#flashcard-shuffle').onclick=()=>{
  session.shuffled=!shuffled;
  const inRound=new Set(tasks.map(task=>task.id));
  session.tasks=session.shuffled?shuffle(tasks):deck.filter(task=>inRound.has(task.id));
  session.index=0;
  session.flipped=false;
  renderFlashcard();
 };
 $('#flashcard-check').onclick=()=>chooseQuizLength(topic);
 $('#flip-card').focus();
}
$('#trainer').addEventListener('keydown',e=>{if(!$('#trainer').open||session?.mode!=='flashcards'||e.altKey||e.ctrlKey||e.metaKey)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();moveFlashcard(e.key==='ArrowLeft'?-1:1)}else if(e.code==='Space'&&(e.target===$('#trainer')||e.target===$('#flip-card')||e.target===$('#exercise'))){e.preventDefault();$('#flip-card').click()}});
function renderExercise(){const c=chapters[session.topic],t=session.tasks[session.index],n=session.tasks.length;$('#session-label').textContent=`${c.title.toUpperCase()} · ${session.index+1} / ${n}`;$('#session-progress').style.width=session.index/n*100+'%';const label={vocab:'Выбери перевод',grammar:'Измени грамматическую форму',formation:'Образуй подходящее слово',reading:c.readingType==='true-false-not-stated'?tr('Оцени утверждение по тексту','Classify the statement using the text'):'Выбери вопрос к тексту'}[c.kind];let choices=t.choices;
if(c.kind==='vocab'){const pool=[...new Set(c.tasks.map(x=>x.answer))].filter(v=>v!==t.answer);choices=shuffle([t.answer,...shuffle(pool).slice(0,3)])}
$('#exercise').innerHTML=`${c.passage?`<details class="reading-passage" open><summary>${esc(c.passageTitle)}</summary><div data-no-translate lang="en">${c.passage.map(p=>`<p>${esc(p)}</p>`).join('')}</div></details>`:''}<div class="exercise-word"><span class="eyebrow">${label}</span>${c.kind==='vocab'?`<h2>${esc(t.prompt)}</h2><p>Тема: ${esc(c.title)}</p>`:`<h3>${esc(t.base)}</h3><p class="task-text">${esc(t.prompt)}</p>`}${sourceMarkup(c)}</div>${choices?`<div class="answer-grid">${choices.map(v=>`<button class="answer" ${c.kind==='reading'&&c.readingType!=='true-false-not-stated'&&session.used.includes(v[0])?'disabled':''}>${esc(v)}</button>`).join('')}</div>`:'<form id="answer-form"><label for="typed-answer">Твой ответ</label><input id="typed-answer" autocomplete="off" autocapitalize="none" spellcheck="false" required><button class="button dark">Проверить</button></form>'}<div id="feedback" aria-live="polite"></div>`;
if(choices)document.querySelectorAll('.answer').forEach(b=>b.onclick=()=>answer(c.kind==='reading'?b.textContent[0]:b.textContent,b));else{$('#answer-form').onsubmit=e=>{e.preventDefault();answer($('#typed-answer').value)};$('#typed-answer').focus()}}
function answer(value,button){if(session.answered||!value.trim())return;session.answered=true;const c=chapters[session.topic],t=session.tasks[session.index],correct=isCorrect(t,value,c);recordAttempt(t,correct,c);if(correct){session.correct++;award(t,c)}save();if(c.kind==='reading'&&c.readingType!=='true-false-not-stated')session.used.push(t.answer);
document.querySelectorAll('.answer').forEach(b=>{b.disabled=true;if((c.kind==='reading'?b.textContent[0]:b.textContent)===t.answer)b.classList.add('correct')});if(button&&!correct)button.classList.add('wrong');if($('#typed-answer')){$('#typed-answer').disabled=true;$('#answer-form button').disabled=true}
$('#feedback').innerHTML=`<p class="feedback">${correct?'✦ Верно!':`Правильный ответ: <strong>${esc(t.answer)}</strong>.`}<br>${esc(explanationFor(c,t))}</p><button class="button dark next" id="next">${session.index===session.tasks.length-1?'Посмотреть результат':'Следующее задание →'}</button>`;$('#next').onclick=()=>{session.index++;session.answered=false;if(session.index===session.tasks.length)finish();else renderExercise()}}
function renderFormationBlock(){const c=chapters[session.topic];$('#trainer').classList.add('wide-trainer');$('#session-label').textContent=`СЛОВООБРАЗОВАНИЕ · ${c.title.toUpperCase()}`;$('#session-progress').style.width='0%';$('#exercise').innerHTML=`<div class="formation-intro"><span class="eyebrow">АВТОРСКАЯ ТРЕНИРОВКА · 29–34</span><h2>${esc(c.textTitle)}</h2><p>Прочитай текст. Преобразуй слова справа так, чтобы они грамматически и лексически соответствовали тексту. В каждый пропуск впиши одно слово.</p></div><form id="formation-form"><p class="task-text">${esc(c.intro)}</p>${c.tasks.map((t,i)=>`<div class="gap-row"><label for="gap-${i}"><strong>${t.number}.</strong> ${esc(t.prompt)}</label><div class="gap-entry"><strong>${esc(t.base)}</strong><input id="gap-${i}" name="gap-${i}" aria-label="Ответ ${t.number}" autocomplete="off" autocapitalize="none" spellcheck="false" required></div><div class="gap-feedback" id="gap-feedback-${i}"></div></div>`).join('')}<button class="button dark" id="check-block">Проверить все 6 ответов</button></form>${sourceMarkup(c)}<div id="block-result" aria-live="polite"></div>`;
$('#formation-form').onsubmit=e=>{e.preventDefault();if(session.answered)return;session.answered=true;const results=c.tasks.map((t,i)=>{const input=$(`#gap-${i}`),value=input.value,correct=isCorrect(t,value,c);recordAttempt(t,correct,c);input.disabled=true;input.classList.add(correct?'correct':'wrong');if(correct){session.correct++;award(t,c)}$(`#gap-feedback-${i}`).innerHTML=`<p>${correct?tr('✓ Верно','✓ Correct'):tr('Твой ответ: ','Your answer: ')+esc(value)+tr('. Ответ: ','. Answer: ')+`<strong>${esc(t.answer)}</strong>`}. ${esc(explanationFor(c,t))}</p>`;return{number:t.number,value,correct}});save();$('#check-block').disabled=true;$('#session-progress').style.width='100%';$('#block-result').innerHTML=`<h3>Верных ответов: ${session.correct} из 6</h3><p>Это результат авторской тренировки, а не экзаменационная оценка.</p><button class="button dark next" id="finish">Продолжить ↗</button><button class="text-button" id="repeat">Повторить текст</button>`;$('#finish').onclick=closeTraining;$('#repeat').onclick=()=>{session.correct=0;session.answered=false;renderFormationBlock()};$('#block-result').scrollIntoView({block:'nearest'})}}
function closeTraining(){$('#trainer').close();$('#trainer').classList.remove('wide-trainer');if(selectedChapter!==null&&currentPage==='vocabulary')viewVocabulary(selectedChapter,vocabularyBackPage);else showPage(currentPage)}
function finish(){const n=session.tasks.length;$('#session-progress').style.width='100%';$('#session-label').textContent='ТРЕНИРОВКА ЗАВЕРШЕНА';$('#exercise').innerHTML=`<div class="exercise-word"><div class="result-icon">✳</div><h2>Маленький шаг сделан!</h2><p>Верных ответов: <strong>${session.correct} из ${n}</strong>.<br>Один верный ответ ещё не означает, что слово усвоено надолго.</p><p>${storageFailed?'Браузер запретил сохранение: прогресс доступен до закрытия страницы.':'Прогресс сохранён в этом браузере. XP начисляется один раз за задание.'}</p><button class="button dark next" id="finish">Продолжить ↗</button><button class="text-button" id="repeat">Повторить сессию</button>${chapters[session.topic].kind==='vocab'&&session.limit!=='all'?`<button class="text-button" id="next-batch">${tr('Следующие '+session.limit+' слов →','Next '+session.limit+' words →')}</button>`:''}</div>`;$('#finish').onclick=closeTraining;$('#repeat').onclick=()=>{session.index=0;session.correct=0;session.answered=false;session.used=[];renderExercise()};if($('#next-batch'))$('#next-batch').onclick=()=>{const {topic,limit}=session;$('#trainer').close();start(topic,false,limit)}}
function viewVocabulary(i,backPage='vocabulary'){
 selectedChapter=i;
 vocabularyBackPage=backPage;
 showPage('vocabulary',true);
 const c=chapters[i];
 const title=preferences.language==='en'&&c.titleEn?c.titleEn:c.title;
 $('#page-title').textContent=title;
 $('.breadcrumb strong').textContent=tr('Лексика','Vocabulary')+' / '+title;
 $('#secondary-view').innerHTML=`
  <button class="text-button" id="back-topics">${tr('← Все темы','← All topics')}</button>
  <div class="chapter-actions">
   <button class="button light" id="chapter-wordlist" aria-expanded="true" aria-controls="chapter-words">${tr('Вордлист','Word list')}</button>
   <button class="button light" id="chapter-flashcards">${tr('Учить слова','Study words')}</button>
   <button class="button light" id="chapter-start">${tr('Проверить себя','Check yourself')}</button>
   <button class="button light" id="chapter-formation">${tr('Задания формата ОГЭ','OGE-style tasks')}</button>
  </div>
  <section id="chapter-words">
   <label class="search-label" for="word-search">${tr('Найти слово или перевод','Find a word or translation')}</label>
   <input class="search-input" id="word-search" type="search">
   <p id="search-count" role="status"></p><div class="word-list" id="catalogue"></div>
  </section>`;
 function catalogue(){
  const query=$('#word-search').value.trim().toLocaleLowerCase();
  const tasks=c.tasks.filter(task=>(task.prompt+' '+task.answer).toLocaleLowerCase().includes(query));
  const known=new Set(activeLearned().map(word=>word.id));
  $('#search-count').textContent=tr('Найдено: ','Found: ')+tasks.length+' / '+c.tasks.length;
  $('#catalogue').innerHTML=tasks.map(task=>`<div class="vocab-card"><small>${known.has(task.id)?tr('ВЕРНЫЙ ОТВЕТ ✓','CORRECT ANSWER ✓'):tr('ДЛЯ ПРАКТИКИ','TO PRACTISE')}</small><h3>${esc(task.prompt)}</h3><strong>${esc(task.answer)}</strong></div>`).join('')||`<p>${tr('Ничего не найдено.','No terms found.')}</p>`;
 }
 $('#chapter-wordlist').onclick=()=>{
  const panel=$('#chapter-words');
  panel.hidden=!panel.hidden;
  $('#chapter-wordlist').setAttribute('aria-expanded',String(!panel.hidden));
  if(!panel.hidden){catalogue();$('#word-search').focus()}
 };
 catalogue();
 $('#word-search').oninput=catalogue;
 $('#back-topics').onclick=()=>showPage(backPage);
 $('#chapter-start').onclick=()=>chooseQuizLength(i);
 $('#chapter-flashcards').onclick=()=>openVocabularyModes(i);
 $('#chapter-formation').onclick=()=>start(chapters.findIndex(chapter=>chapter.block&&chapter.topicNumber===c.topicNumber));
}
function renderLibrary(kind){const list=chapters.filter(c=>c.kind===kind);$('#secondary-view').innerHTML=`<p class="route-intro">${kind==='vocab'?`Все 13 доступных наборов Quizlet · ${vocabulary.reduce((n,c)=>n+c.tasks.length,0)} слов и выражений после объединения повторов.<br>В исходной папке нет набора 14/14.`:'13 новых текстов по темам Quizlet и дополнительная тренировка из материалов Елизаветы. Новые тексты: 6 пропусков, без вариантов ответа.'}</p><label class="search-label" for="topic-search">Найти тему</label><input class="search-input" id="topic-search" type="search" placeholder="Название темы"><div class="topic-list" id="library-topics"></div>`;function update(){const q=$('#topic-search').value.trim().toLowerCase(),filtered=list.filter(c=>(c.title+' '+c.subtitle+' '+c.source).toLowerCase().includes(q));$('#library-topics').innerHTML=topicCards(filtered,kind==='vocab')||'<p>Темы не найдены.</p>';bindTopics()}update();$('#topic-search').oninput=update}
const emptyPages=new Set(['grammar-trainer','mocks','forecast','path','achievements']);
function showPage(page,keepChapter=false){closeHeaderSections();currentPage=page;if(!keepChapter)selectedChapter=null;const names={...Object.fromEntries(Object.entries(featurePages).map(([key,value])=>[key,value.ru])),russia:'Russia in English',home:'Обзор',words:'Мой словарь',vocabulary:'Лексика',formation:'Словообразование',path:'Мой маршрут',achievements:'Достижения'};$('.breadcrumb strong').textContent=names[page];$('#page-icon').textContent={...Object.fromEntries(Object.entries(featurePages).map(([key,value])=>[key,value.icon])),home:'📖',vocabulary:'📚',formation:'✏️',russia:'🇷🇺',words:'🗂️',path:'🧭',achievements:'🏅'}[page];document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page));$('#home-view').hidden=page!=='home';$('#secondary-view').hidden=page==='home';$('#page-title').innerHTML=page==='home'?'Привет, это Слово — платформа для подготовки к ОГЭ по английскому языку.':names[page];
const isEmpty=emptyPages.has(page);
if(!isEmpty){
if(contentPage(page)&&!contentPage(page).builtin)$('#secondary-view').innerHTML='';
if(featurePages[page])renderFeaturePage(page);
if(page==='russia')$('#secondary-view').innerHTML='<div class="empty-state"><span class="result-icon" aria-hidden="true">⌑</span><h2>Материалы появятся здесь</h2><p>Раздел пока пуст.</p></div>';
if(page==='vocabulary')renderLibrary('vocab');if(page==='formation')renderLibrary('formation');
if(page==='words')renderDictionary();
if(page==='path'){$('#secondary-view').innerHTML=`<div class="module-links"><button class="button dark" data-go="vocabulary">Лексика · 13 тем</button><button class="button light" data-go="formation">Словообразование · 13 текстов</button></div><h2>Грамматика и чтение</h2><div class="topic-list">${topicCards(chapters.filter(c=>c.kind==='grammar'||c.kind==='reading'))}</div>`;document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>showPage(b.dataset.go));bindTopics()}
if(page==='achievements')$('#secondary-view').innerHTML=`<div class="achievement-grid">${[['✦','Первый ответ',1],['✳','Хорошее начало',6],['⚑','Весь маршрут',total]].map(([icon,title,n])=>`<div class="achievement ${activeLearned().length<n?'locked':''}"><span>${icon}</span><h3>${title}</h3><p>Верных ответов впервые: ${n}</p><small>${activeLearned().length>=n?'Получено ✓':`${activeLearned().length} / ${n}`}</small></div>`).join('')}</div>`;
}
renderStats();
applyContentPage(page);
if(isEmpty)$('#secondary-view').innerHTML='<p data-no-translate>раздел пока пуст :(</p>';
if(mobileSidebarOpen){mobileSidebarOpen=false;syncSidebar()}}
let desktopSidebarOpen=true,mobileSidebarOpen=false;
const sidebarMedia=window.matchMedia('(max-width:800px)');
function syncSidebar(){const open=sidebarMedia.matches?mobileSidebarOpen:desktopSidebarOpen;document.body.classList.toggle('sidebar-open',sidebarMedia.matches&&open);document.body.classList.toggle('sidebar-collapsed',!sidebarMedia.matches&&!open);$('#sidebar').inert=!open;$('#sidebar-toggle').setAttribute('aria-expanded',String(open));$('#sidebar-toggle').setAttribute('aria-label',open?'Скрыть меню':'Открыть меню');$('#sidebar-backdrop').hidden=!sidebarMedia.matches||!open}
$('#sidebar-toggle').onclick=()=>{closeHeaderSections();if(sidebarMedia.matches)mobileSidebarOpen=!mobileSidebarOpen;else desktopSidebarOpen=!desktopSidebarOpen;syncSidebar()};
$('#sidebar-backdrop').onclick=()=>{mobileSidebarOpen=false;syncSidebar();$('#sidebar-toggle').focus()};
sidebarMedia.addEventListener('change',()=>{mobileSidebarOpen=false;syncSidebar()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mobileSidebarOpen&&!$('#trainer').open&&!$('#info').open){mobileSidebarOpen=false;syncSidebar();$('#sidebar-toggle').focus()}});
function closeHeaderSections(restoreFocus=false){$('#header-sections').hidden=true;$('#header-sections-toggle').setAttribute('aria-expanded','false');if(restoreFocus)$('#header-sections-toggle').focus()}
$('#header-home').onclick=()=>showPage('home');
$('#header-sections-toggle').onclick=()=>{const menu=$('#header-sections');if(!menu.hidden){closeHeaderSections();return}menu.replaceChildren();document.querySelectorAll('#sidebar .nav-item[data-page]').forEach(source=>{const button=document.createElement('button');button.type='button';button.className='header-section-item';button.textContent=source.querySelector('.nav-name').textContent;if(source.dataset.page===currentPage)button.setAttribute('aria-current','page');button.onclick=()=>{showPage(source.dataset.page);$('#main-content').focus()};menu.append(button)});menu.hidden=false;$('#header-sections-toggle').setAttribute('aria-expanded','true')};
document.addEventListener('click',e=>{if(!e.target.closest('#header-sections,#header-sections-toggle'))closeHeaderSections()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#header-sections').hidden){e.preventDefault();closeHeaderSections(true)}});
$('#workspace-home').onclick=()=>showPage('home');syncSidebar();
document.querySelectorAll('[data-page],[data-open-page]').forEach(b=>b.onclick=()=>showPage(b.dataset.page||b.dataset.openPage));$('#close-trainer').onclick=closeTraining;$('#trainer').addEventListener('cancel',event=>{event.preventDefault();closeTraining()});$('#help').onclick=()=>$('#info').showModal();$('.close-info').onclick=()=>$('#info').close();$('#reset').onclick=()=>{state={learned:[],dates:[],practice:{}};save();showPage(currentPage);$('#reset-status').textContent='Прогресс ОГЭ сброшен.'};showPage(previewInitialPage());
if(SlovoContent.preview){const lessonId=new URLSearchParams(location.search).get('lesson');const i=chapters.findIndex(c=>c.id===lessonId);if(i>=0){if(chapters[i].kind==='vocab')viewVocabulary(i);else start(i)}}
startInterfaceTranslation();

