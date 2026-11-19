const featurePages={
 'grammar-trainer':{ru:'Тренажёр по грамматике',en:'Grammar trainer',icon:'🧩',descriptionRu:'Теория и практика по учебнику Fundamentals of English Grammar.',descriptionEn:'Theory and practice based on Fundamentals of English Grammar.'},
 exam:{ru:'Всё об экзамене',en:'About the exam',icon:'📄',descriptionRu:'ОГЭ по английскому языку (2027)',descriptionEn:'OGE English exam (2027)'},
 mocks:{ru:'Пробники',en:'Mock exams',icon:'📝',descriptionRu:'Полные варианты и результаты пробных экзаменов.',descriptionEn:'Full practice papers and mock exam results.'},
 trainer:{ru:'Тренажер по заданиям',en:'Task trainer',icon:'🎯',descriptionRu:'Все типы заданий ОГЭ: начни с формата или с темы.',descriptionEn:'Every OGE task type: start with a format or a topic.'},
 knowledge:{ru:'База знаний',en:'Knowledge base',icon:'📒',descriptionRu:'Правила, памятки и материалы для подготовки.',descriptionEn:'Rules, study notes and preparation resources.'},
 profile:{ru:'Профиль',en:'Profile',icon:'👤',descriptionRu:'Твои данные и прогресс в этом браузере.',descriptionEn:'Your details and progress in this browser.'},
 community:{ru:'Комьюнити',en:'Community',icon:'💬',descriptionRu:'Место для общения и совместной подготовки.',descriptionEn:'A place to connect and prepare together.'},
 forecast:{ru:'Ожидаемый результат',en:'Expected result',icon:'📈',descriptionRu:'Прогресс, ошибки и данные для будущего прогноза ОГЭ.',descriptionEn:'Progress, mistakes and evidence for a future OGE forecast.'},
 settings:{ru:'Настройки сайта',en:'Site settings',icon:'⚙️',descriptionRu:'Язык, оформление и удобство занятий.',descriptionEn:'Language, appearance and study preferences.'}
};
let localProfile={name:'',goal:''};try{const p=JSON.parse(localStorage.getItem(SlovoContent.preview?'slovo-preview-profile-v1':'slovo-profile-v1'));if(p&&typeof p==='object')localProfile={name:typeof p.name==='string'?p.name.slice(0,80):'',goal:['3','4','5'].includes(p.goal)?p.goal:''}}catch{}
function emptyFeature(title,description){return `<div class="empty-state"><h2>${esc(title)}</h2><p>${esc(description)}</p></div>`}
function featureStats(){const records=Object.entries(state.practice||{}).filter(([id,r])=>taskIds.has(id)&&r&&typeof r==='object');const attempted=records.length,firstCorrect=records.filter(([,r])=>r.firstCorrect===true).length,totalAttempts=records.reduce((n,[,r])=>n+(Number(r.attempts)||0),0),errors=records.reduce((n,[,r])=>n+(Number(r.errors)||0),0);return{records,attempted,firstCorrect,totalAttempts,errors,accuracy:attempted?Math.round(firstCorrect/attempted*100):null}}
function recordAttempt(task,correct,chapter){if(!state.practice||typeof state.practice!=='object'||Array.isArray(state.practice))state.practice={};const previous=state.practice[task.id],old=previous&&typeof previous==='object'?previous:null;state.practice[task.id]={attempts:(Number(old?.attempts)||0)+1,errors:(Number(old?.errors)||0)+(correct?0:1),correct:(Number(old?.correct)||0)+(correct?1:0),firstCorrect:old?old.firstCorrect:correct,lastCorrect:correct,lastAt:new Date().toISOString(),kind:chapter.kind,chapterId:chapter.id}}
// Toggle Switch motion from DesignBookmark: position 320/18, stretch 300/20.
function animateSettingSwitch(input, track){
 const reduce = matchMedia('(prefers-reduced-motion: reduce)');
 const knob = track.firstElementChild;
 const target = Number(input.checked);
 const positionStyle = getComputedStyle(knob);
 const running = track.getAnimations()[0];
 const motion = track.switchMotion;
 const frameIndex = running ? Math.min(42,Math.round((running.currentTime || 0)*42/700)) : 0;
 const mix = running ? motion[frameIndex] : 1-target;
 const translate = running ? new DOMMatrixReadOnly(positionStyle.transform).e : mix*20;
 const stretch = running ? parseFloat(positionStyle.width)-26 : 0;
 for (const element of [track,knob]) element.getAnimations().forEach(animation=>animation.cancel());
 if (reduce.matches) return;
 const samples = [], trackFrames = [], knobFrames = [];
 let position = mix, velocity = 0, width = stretch/10, stretchVelocity = 60;
 for (let frame=0; frame<=42; frame++){
  const progress = Math.max(0,Math.min(1,position));
  const grow = Math.max(0,Math.min(1,width))*10;
  const x = frame===0 ? translate : position*20-(target ? grow*progress : 0);
  samples.push(progress);
  trackFrames.push({background:'color-mix(in srgb, var(--switch-on) '+(progress*100)+'%, var(--switch-off))'});
  knobFrames.push({width:(26+grow)+'px',transform:'translateX('+x+'px)'});
  for(let step=0;step<4;step++){
   velocity += (320*(target-position)-18*velocity)/240;
   position += velocity/240;
   stretchVelocity += (-300*width-20*stretchVelocity)/240;
   width += stretchVelocity/240;
  }
 }
 track.switchMotion = samples;
 track.animate(trackFrames,{duration:700});
 knob.animate(knobFrames,{duration:700});
}

function settingsPage(){
 const options = [
  ['language',tr('Язык сайта и подготовки','Interface and study language'),'ru','en','Русский','English'],
  ['theme',tr('Тема сайта','Theme'),'light','dark',tr('Светлая','Light'),tr('Тёмная','Dark')],
  ['layout',tr('Версия дизайна','Design version'),'notion','compact','Notion',tr('Компактная','Compact')],
  ['lowVision',tr('Версия для слабовидящих','Low-vision mode'),false,true],
  ['fun','Приколюхи',false,true],
 ];
 const settingId = key => 'setting-'+key.toLowerCase();
 $('#secondary-view').innerHTML = `<div class="settings-panel"><div class="settings-toggles">
 ${options.map(([key,label,,on,offLabel,onLabel])=>`<div class="setting-row">
  <label class="setting-name" for="${settingId(key)}">${label}</label>
  <div class="setting-control">
   ${offLabel?`<span id="${settingId(key)}-options" class="setting-options"><span>${offLabel}</span> / <span>${onLabel}</span></span>`:''}
   <label class="setting-toggle">
    <input id="${settingId(key)}" type="checkbox" role="switch" ${offLabel?`aria-describedby="${settingId(key)}-options"`:''} ${preferences[key]===on?'checked':''}>
    <span class="setting-track" aria-hidden="true"><i></i></span>
   </label>
  </div>
 </div>`).join('')}</div>
 <p class="settings-save-status" id="settings-status" role="status">${preferenceStorageFailed ? tr('Браузер запретил сохранение настроек.','Your browser blocked saving preferences.') : tr('Настройки сохраняются автоматически в этом браузере.','Settings are saved automatically in this browser.')}</p></div>`;
 for (const [key,,off,on] of options) {
  const input = $('#'+settingId(key));
  input.onchange = () => {
   const track = input.nextElementSibling;
   preferences[key] = input.checked ? on : off;
   persistPreferences();
   if (key==='language') {
    showPage('settings');
    const updated = $('#'+settingId(key));
    updated.focus();
    animateSettingSwitch(updated,updated.nextElementSibling);
   } else {
    animateSettingSwitch(input,track);
   }
   $('#settings-status').textContent = preferenceStorageFailed ? tr('Не удалось сохранить настройки.','Could not save settings.') : tr('Настройки сохранены.','Settings saved.');
   translateInterface();
  };
 }
}
function profilePage(){const stats=featureStats();$('#secondary-view').innerHTML=`<div class="profile-intro"><span class="profile-avatar" aria-hidden="true">${esc(localProfile.name.trim().slice(0,1).toUpperCase()||'С')}</span><div><h2>${esc(localProfile.name||tr('Мой профиль','My profile'))}</h2><p>${tr('Локальный профиль (без регистрации)','Local profile (no account required)')}</p></div></div><form id="profile-form" class="profile-form"><label for="profile-name">${tr('Имя','Name')}</label><input id="profile-name" maxlength="80" autocomplete="given-name" value="${esc(localProfile.name)}" placeholder="${tr('Как к тебе обращаться?','What should we call you?')}"><label for="profile-goal">${tr('Целевая оценка','Target grade')}</label><select id="profile-goal"><option value="">${tr('Пока не выбрана','Not set yet')}</option>${['3','4','5'].map(x=>`<option value="${x}" ${localProfile.goal===x?'selected':''}>${x}</option>`).join('')}</select><button class="button dark">${tr('Сохранить профиль','Save profile')}</button><p id="profile-status" role="status"></p></form><div class="evidence-grid"><div><small>${tr('Правильные ответы','Correct answers')}</small><strong>${activeLearned().length}</strong></div><div><small>${tr('Попытки с начала учёта','Recorded attempts')}</small><strong>${stats.totalAttempts}</strong></div><div><small>${tr('Серия занятий','Study streak')}</small><strong>${streak()} ${tr('дней','days')}</strong></div></div><p class="feature-note">${tr('Имя, цель и учебные результаты доступны только в этом браузере. Целевая оценка — пожелание, а не прогноз.','Your name, goal and results are stored only in this browser. A target grade is a goal, not a prediction.')}</p>`;$('#profile-form').onsubmit=e=>{e.preventDefault();localProfile={name:$('#profile-name').value.trim().slice(0,80),goal:$('#profile-goal').value};try{localStorage.setItem(SlovoContent.preview?'slovo-preview-profile-v1':'slovo-profile-v1',JSON.stringify(localProfile));profilePage();$('#profile-status').textContent=tr('Профиль сохранён.','Profile saved.')}catch{$('#profile-status').textContent=tr('Браузер запретил сохранение профиля.','Your browser blocked saving the profile.')}}}
function forecastPage(){const stats=featureStats();const kinds=[['vocab',tr('Лексика','Vocabulary')],['grammar',tr('Грамматика','Grammar')],['formation',tr('Словообразование','Word formation')],['reading',tr('Чтение','Reading')]];const vocabPractised=vocabulary.filter(c=>c.tasks.some(t=>state.practice?.[t.id])).length;$('#secondary-view').innerHTML=`<div class="forecast-status"><span class="status-label">${tr('Недостаточно данных','Insufficient data')}</span><h2>${tr('Прогноз ОГЭ пока недоступен','An OGE forecast is not available yet')}</h2><p>${tr('Пока нет результатов полных пробников, данных по аудированию, письму и говорению и проверенной модели прогноза. Процент правильных ответов в тренировках не переводится в баллы или оценку ОГЭ.','Full mock results, listening, writing and speaking evidence, and a validated forecast model are not available yet. Practice accuracy is not converted into an OGE score or grade.')}</p></div><h2 class="feature-heading">${tr('Что уже известно','Evidence collected so far')}</h2><div class="evidence-grid"><div><small>${tr('Первые ответы: верно','First-attempt accuracy')}</small><strong>${stats.accuracy===null?'—':stats.accuracy+'%'}</strong></div><div><small>${tr('Ошибки в попытках','Errors across attempts')}</small><strong>${stats.errors}</strong></div><div><small>${tr('Лексические темы с попытками','Vocabulary topics attempted')}</small><strong>${vocabPractised} / 13</strong></div></div><div class="coverage-list">${kinds.map(([kind,label])=>{const attempted=stats.records.filter(([,r])=>r.kind===kind).length,totalTasks=chapters.filter(c=>c.kind===kind).reduce((n,c)=>n+c.tasks.length,0);return `<div><span>${label}</span><strong>${attempted} / ${totalTasks}</strong></div>`}).join('')}${[tr('Аудирование','Listening'),tr('Письмо','Writing'),tr('Говорение','Speaking'),tr('Полные пробники','Full mock exams')].map(x=>`<div><span>${x}</span><small>${tr('Нет данных','No data')}</small></div>`).join('')}</div><p class="feature-note">${tr('Учёт ошибок и первых попыток начинается с этого обновления. Старые правильные ответы сохранены, но прежние ошибки восстановить нельзя. Просмотр карточек попыткой не считается.','Mistake and first-attempt tracking starts with this update. Earlier correct answers are preserved, but past mistakes cannot be reconstructed. Viewing flashcards does not count as an attempt.')}</p><button class="button dark" id="forecast-practise">${tr('Перейти к заданиям','Open the task trainer')}</button>`;$('#forecast-practise').onclick=()=>showPage('trainer')}
function renderExamPage(){
 const content=document.getElementById('exam-content').content.cloneNode(true);
 $('#secondary-view').replaceChildren(content);
}
function renderFeaturePage(page){switch(page){case 'grammar-trainer':grammarTrainerPage();break;case 'exam':renderExamPage();break;case 'settings':settingsPage();break;case 'profile':profilePage();break;case 'trainer':taskTrainerPage();break;case 'forecast':forecastPage();break;case 'mocks':$('#secondary-view').innerHTML=emptyFeature(tr('Пробники появятся здесь','Mock exams will appear here'),tr('Полные варианты ещё не добавлены.','No full practice papers have been added yet.'));break;case 'knowledge':$('#secondary-view').innerHTML=emptyFeature(tr('База знаний пока пуста','The knowledge base is empty'),tr('Здесь будут правила, объяснения и материалы для повторения.','Rules, explanations and revision resources will appear here.'));break;case 'community':$('#secondary-view').innerHTML=emptyFeature(tr('Комьюнити готовится к запуску','The community is coming later'),tr('Обсуждения и общение появятся после подключения сообщества.','Discussions and social features will appear when the community is connected.'));break}}
