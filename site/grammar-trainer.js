const grammarAnswer = (value, id) => {
 const clean=value.normalize('NFKC').trim().replace(/[‘’]/g,"'").replace(/\s+/g,' ');
 return id==='11-10'?clean:clean.toLowerCase();
};

function grammarTrainerPage(){
 const host=$('#secondary-view');
 host.innerHTML=`
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
   const number=/^\d+$/.test(chapter.id)?tr('Глава ','Chapter ')+chapter.id+' · ':'';
   return `<details class="grammar-chapter" ${query?'open':''}>
     <summary>${esc(number+title)} <small>${lessons.length}</small></summary>
     <div class="grammar-lessons">${lessons.map(lesson=>`<button type="button" class="trainer-choice" data-grammar-lesson="${lesson.id}">
      <span class="trainer-choice-body"><strong>${esc(lesson.title)}</strong><small>${lesson.id} · ${tr('с.','p.')} ${lesson.page}</small></span>
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
 search.oninput=catalogue;
 catalogue();
}

function renderGrammarLesson(lesson){
 const exercise=$('#exercise');
 $('#trainer').classList.remove('wide-trainer');
 $('#session-label').textContent=tr('ГРАММАТИКА','GRAMMAR')+' · '+lesson.id;
 $('#session-progress').style.width='0%';
 session={mode:'grammar-course'};
 exercise.innerHTML=`
  <article class="grammar-lesson">
   <h2 tabindex="-1">${esc(lesson.title)}</h2>
   <p class="source-note">${tr('Таблица','Chart')} ${lesson.id} · ${tr('с.','p.')} ${lesson.page}</p>
   <h3>${tr('Теория','Theory')}</h3>
   <p lang="ru" data-no-translate>${esc(lesson.theory)}</p>
   <h3>${tr('Практика','Practice')}</h3>
   <form id="grammar-form">
    ${lesson.questions.map((question,index)=>`<div class="grammar-question">
     <label for="grammar-answer-${index}" lang="en" data-no-translate>${esc(question.prompt)}</label>
     ${question.reference?`<small lang="ru">${esc(question.reference)}</small>`:''}
     <input class="search-input" id="grammar-answer-${index}" name="answer-${index}" lang="en" spellcheck="false" autocomplete="off" required>
     <p class="grammar-feedback" aria-live="polite"></p>
    </div>`).join('')}
    <button type="submit" class="button dark">${tr('Проверить','Check')}</button>
   </form>
   <div id="grammar-result" aria-live="polite"></div>
  </article>`;
 const form=$('#grammar-form');
 form.onsubmit=event=>{
  event.preventDefault();
  const inputs=[...form.querySelectorAll('input')];
  const empty=inputs.find(input=>!input.value.trim());
  if(empty){empty.value='';empty.reportValidity();return}
  let score=0;
  for(const [index,input] of inputs.entries()){
   const question=lesson.questions[index];
   const correct=question.answers.some(answer=>grammarAnswer(answer,lesson.id)===grammarAnswer(input.value,lesson.id));
   if(correct)score++;
   input.disabled=true;
   input.classList.add(correct?'correct':'wrong');
   input.closest('.grammar-question').querySelector('.grammar-feedback').textContent=
    correct?tr('✓ Верно','✓ Correct'):tr('Правильный ответ: ','Correct answer: ')+question.answers[0];
  }
  form.querySelector('button').disabled=true;
  $('#session-progress').style.width='100%';
  $('#grammar-result').innerHTML=`<p>${tr('Верных ответов: ','Correct answers: ')}${score} / ${inputs.length}</p>
   <button type="button" class="button light" id="grammar-retry">${tr('Попробовать ещё раз','Try again')}</button>`;
  $('#grammar-retry').onclick=()=>renderGrammarLesson(lesson);
 };
 if(!$('#trainer').open)$('#trainer').showModal();
 exercise.querySelector('h2').focus();
}
