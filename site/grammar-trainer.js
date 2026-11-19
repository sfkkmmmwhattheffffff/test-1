const grammarAnswer = (value, id) => {
 const clean=value.normalize('NFKC').trim().replace(/[‘’]/g,"'").replace(/\s+/g,' ');
 return id==='11-10'?clean:clean.toLowerCase();
};

let grammarBookUrl='';

function grammarBookPicker(){
 return `<label class="button light grammar-book-picker">
  <span>${grammarBookUrl?tr('Заменить PDF учебника','Replace textbook PDF'):tr('Открыть PDF учебника','Open textbook PDF')}</span>
  <input class="grammar-book-input" type="file" accept="application/pdf,.pdf">
 </label>`;
}

function bindGrammarBookPicker(root,onLoad){
 const input=root.querySelector('.grammar-book-input');
 input.onchange=()=>{
  const file=input.files[0];
  if(!file)return;
  if(grammarBookUrl)URL.revokeObjectURL(grammarBookUrl);
  grammarBookUrl=URL.createObjectURL(file);
  onLoad();
 };
}

function grammarTrainerPage(){
 const host=$('#secondary-view');
 host.innerHTML=`
  <div class="grammar-book-tools">
   ${grammarBookPicker()}
   <p class="feature-note">${tr('Выбери PDF Fundamentals of English Grammar, 4-е издание. Оригинальные таблицы откроются на нужных страницах. Файл читается в браузере.','Select Fundamentals of English Grammar, 4th edition. Original charts open at the relevant page. The file is read in your browser.')}</p>
  </div>
  <label class="search-label" for="grammar-search">${tr('Найти грамматическую тему','Find a grammar topic')}</label>
  <input class="search-input" id="grammar-search" type="search" placeholder="${tr('Например: Present Perfect или артикли','For example: Present Perfect or articles')}">
  <p class="feature-note" id="grammar-count" role="status"></p>
  <div id="grammar-chapters"></div>
  <p class="source-note" lang="en" data-no-translate>Betty S. Azar, Stacy A. Hagen. Fundamentals of English Grammar. 4th ed., 2011.</p>`;
 const search=$('#grammar-search'), content=$('#grammar-chapters');

 function catalogue(){
  const query=search.value.trim().toLocaleLowerCase();
  let total=0;
  content.innerHTML=grammarCourse.map(chapter=>{
   const matchesChapter=[chapter.title,chapter.titleEn].some(title=>title.toLocaleLowerCase().includes(query));
   const lessons=chapter.lessons.filter(lesson=>matchesChapter||
    [lesson.id,lesson.title,lesson.theory,lesson.questions[0].prompt].some(value=>value.toLocaleLowerCase().includes(query)));
   if(!lessons.length)return '';
   total+=lessons.length;
   const title=tr(chapter.title,chapter.titleEn);
   const number=/^\d+$/.test(chapter.id)?tr('Глава ','Chapter ')+chapter.id+' ':'';
   return `<details class="grammar-chapter" ${query?'open':''}>
     <summary>${esc(number+title)} <small>${lessons.length}</small></summary>
     <div class="grammar-lessons">${lessons.map(lesson=>`<button type="button" class="trainer-choice" data-grammar-lesson="${lesson.id}">
      <span class="trainer-choice-body"><strong>${esc(lesson.title)}</strong><small>${lesson.id} (${tr('с.','p.')} ${lesson.page})</small></span>
      <span aria-hidden="true">→</span>
     </button>`).join('')}</div>
    </details>`;
  }).join('')||`<p>${tr('Темы не найдены.','No topics found.')}</p>`;
  $('#grammar-count').textContent=tr('Тем в каталоге: ','Topics shown: ')+total;
  content.querySelectorAll('[data-grammar-lesson]').forEach(button=>button.onclick=()=>{
   const id=button.dataset.grammarLesson;
   const lesson=grammarCourse.flatMap(chapter=>chapter.lessons).find(lesson=>lesson.id===id);
   renderGrammarLesson(lesson);
  });
 }
 bindGrammarBookPicker(host,()=>{
  host.querySelector('.grammar-book-picker span').textContent=tr('PDF учебника открыт','Textbook PDF loaded');
 });
 search.oninput=catalogue;
 catalogue();
}

function grammarLessonView(lesson,body){
 const exercise=$('#exercise');
 $('#trainer').classList.remove('wide-trainer');
 $('#session-label').textContent=tr('ГРАММАТИКА','GRAMMAR')+' ('+lesson.id+')';
 setSessionProgress(0);
 session={mode:'grammar-course'};
 exercise.innerHTML=`<article class="grammar-lesson">
  <button type="button" class="button light grammar-fullscreen" aria-pressed="false"></button>
  ${body}
 </article>`;
 if(!$('#trainer').open)$('#trainer').showModal();
 const button=exercise.querySelector('.grammar-fullscreen');
 function sync(){
  const on=$('#trainer').classList.contains('grammar-expanded');
  button.textContent=on?tr('Выйти из полноэкранного режима','Exit full screen'):tr('На весь экран','Full screen');
  button.setAttribute('aria-pressed',String(on));
 }
 button.onclick=()=>{
  $('#trainer').classList.toggle('grammar-expanded');
  sync();
 };
 sync();
 exercise.querySelector('h2').focus();
 return exercise;
}

document.getElementById('trainer').addEventListener('close',event=>event.currentTarget.classList.remove('grammar-expanded'));

function renderGrammarLesson(lesson){
 const pdfPage=Number(lesson.page)+13;
 const title=tr('Оригинал учебника','Original textbook')+' ('+tr('с. ','p. ')+lesson.page+')';
 const pdfUrl=grammarBookUrl&&grammarBookUrl+'#page='+pdfPage;
 const exercise=grammarLessonView(lesson,`
  <h2 tabindex="-1">${esc(lesson.title)}</h2>
  <h3>${tr('Теория','Theory')}</h3>
  <p class="source-note">${tr('Таблица','Chart')} ${lesson.id} (${tr('с.','p.')} ${lesson.page})</p>
  ${pdfUrl?`<p><a href="${esc(pdfUrl)}" target="_blank" rel="noopener">${esc(title)} ↗</a></p>
   <iframe class="grammar-book-frame" title="${esc(title)}" src="${esc(pdfUrl)}"></iframe>`:`
   <p>${tr('Открой PDF, чтобы прочитать полное объяснение и примеры в оригинале.','Open the PDF to read the complete explanation and original examples.')}</p>
   ${grammarBookPicker()}`}
  <h3>${tr('Краткий конспект','Summary')}</h3>
  <p lang="ru" data-no-translate>${esc(lesson.theory)}</p>
  <h3>${tr('Пример в контексте','Example in context')}</h3>
  <p class="grammar-context" lang="en" data-no-translate>${esc(lesson.context)}</p>
  <button type="button" class="button dark" id="grammar-train" aria-expanded="false" aria-controls="grammar-practice-menu">${tr('Тренировать','Practise')}</button>
  <div id="grammar-practice-menu" class="grammar-practice-menu" hidden></div>`);
 if(!pdfUrl)bindGrammarBookPicker(exercise,()=>renderGrammarLesson(lesson));
 const train=$('#grammar-train'), menu=$('#grammar-practice-menu');
 train.onclick=()=>{
  if(!menu.hidden){
   menu.hidden=true;
   train.setAttribute('aria-expanded','false');
   return;
  }
  menu.innerHTML=`<button type="button" class="button light" data-grammar-practice="all">${tr('Все задания блока','All exercises in this block')} (${lesson.questions.length})</button>
   ${lesson.questions.map((question,index)=>`<button type="button" class="trainer-choice" data-grammar-practice="${index}">
    <span class="trainer-choice-body"><strong>${tr('Задание','Exercise')} ${index+1}</strong><span lang="en" data-no-translate>${esc(question.prompt)}</span>
    ${question.reference?`<small>${esc(question.reference)}</small>`:''}</span><span aria-hidden="true">→</span>
   </button>`).join('')}`;
  menu.querySelectorAll('[data-grammar-practice]').forEach(button=>button.onclick=()=>{
   const selected=button.dataset.grammarPractice;
   renderGrammarPractice(lesson,selected==='all'?null:Number(selected));
  });
  menu.hidden=false;
  train.setAttribute('aria-expanded','true');
  menu.querySelector('button').focus();
 };
}

function renderGrammarPractice(lesson,selected){
 const questions=selected===null?lesson.questions:[lesson.questions[selected]];
 grammarLessonView(lesson,`
  <button type="button" class="text-button" id="grammar-theory-back">${tr('← К теории и выбору заданий','← Back to theory and exercises')}</button>
  <h2 tabindex="-1">${esc(lesson.title)}</h2>
  <form id="grammar-form">
   ${questions.map((question,index)=>`<div class="grammar-question">
    <small>${tr('Задание','Exercise')} ${(selected??index)+1}${question.reference?' ('+esc(question.reference)+')':''}</small>
    <label for="grammar-answer-${index}" lang="en" data-no-translate>${esc(question.prompt)}</label>
    <input class="search-input" id="grammar-answer-${index}" name="answer-${index}" lang="en" spellcheck="false" autocomplete="off" required>
    <p class="grammar-feedback" aria-live="polite"></p>
   </div>`).join('')}
   <button type="submit" class="button dark">${tr('Проверить','Check')}</button>
  </form>
  <div id="grammar-result" aria-live="polite"></div>`);
 $('#grammar-theory-back').onclick=()=>{
  renderGrammarLesson(lesson);
  $('#grammar-train').click();
 };
 const form=$('#grammar-form');
 form.onsubmit=event=>{
  event.preventDefault();
  const inputs=[...form.querySelectorAll('input')];
  const empty=inputs.find(input=>!input.value.trim());
  if(empty){empty.value='';empty.reportValidity();return}
  let score=0;
  for(const [index,input] of inputs.entries()){
   const question=questions[index];
   const correct=question.answers.some(answer=>grammarAnswer(answer,lesson.id)===grammarAnswer(input.value,lesson.id));
   if(correct)score++;
   input.disabled=true;
   input.classList.add(correct?'correct':'wrong');
   input.closest('.grammar-question').querySelector('.grammar-feedback').textContent=
    correct?tr('✓ Верно','✓ Correct'):tr('Правильный ответ: ','Correct answer: ')+question.answers[0];
  }
  form.querySelector('button').disabled=true;
  setSessionProgress(1);
  $('#grammar-result').innerHTML=`<p>${tr('Верных ответов: ','Correct answers: ')}${score} / ${inputs.length}</p>
   <button type="button" class="button light" id="grammar-retry">${tr('Попробовать ещё раз','Try again')}</button>`;
  $('#grammar-retry').onclick=()=>renderGrammarPractice(lesson,selected);
 };
}
