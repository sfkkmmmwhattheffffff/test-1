/* OGE 2027 task families. Written and oral numbering are kept separate. */
const ogeTaskFamilies=[
{id:'listening-choice',section:'listening',ru:'Выбор ответа',en:'Multiple choice',range:'1–4',part:'written',descriptionRu:'Короткие записи: выбрать один ответ из трёх по запрашиваемой информации.',descriptionEn:'Short recordings: choose one of three answers for specific information.'},
{id:'listening-match',section:'listening',ru:'Соответствие высказываний и рубрик',en:'Match speakers to headings',range:'5',part:'written',descriptionRu:'Пять высказываний и шесть рубрик: сопоставить говорящих A–E с рубриками; одна лишняя.',descriptionEn:'Match five speakers A–E to six headings. One heading is extra.'},
{id:'listening-table',section:'listening',ru:'Заполнение таблицы',en:'Table completion',range:'6–11',part:'written',descriptionRu:'Интервью: заполнить шесть полей таблицы, не более одного слова в каждом; числа записываются словами.',descriptionEn:'Listen to an interview and fill six fields with no more than one word each. Write numbers as words.'},
{id:'reading-match',section:'reading',ru:'Соответствие текстов и вопросов',en:'Match texts to questions',range:'12',part:'written',descriptionRu:'Шесть текстов A–F и семь вопросов: найти текст с ответом на каждый выбранный вопрос. Один вопрос лишний.',descriptionEn:'Match six texts A–F to seven questions. One question has no matching text.'},
{id:'reading-statements',section:'reading',ru:'True / False / Not stated',en:'True / False / Not stated',range:'13–19',part:'written',descriptionRu:'Прочитать текст и оценить семь утверждений: верно, неверно или в тексте не сказано.',descriptionEn:'Read a text and classify seven statements as True, False or Not stated.'},
{id:'grammar',section:'language',ru:'Заполнение пропусков · грамматические формы',en:'Gap fill · grammatical forms',range:'20–28',part:'written',descriptionRu:'Преобразовать исходное слово так, чтобы его грамматическая форма соответствовала контексту.',descriptionEn:'Change the base word to the grammatical form required by the context.'},
{id:'formation',section:'language',ru:'Заполнение пропусков · словообразование',en:'Gap fill · word formation',range:'29–34',part:'written',descriptionRu:'Образовать родственное слово, которое грамматически и лексически подходит в пропуск.',descriptionEn:'Form a related word that fits the gap grammatically and lexically.'},
{id:'email',section:'writing',ru:'Электронное письмо другу',en:'An email to a friend',range:'35',part:'written',descriptionRu:'Написать ответное электронное письмо, ответить на три вопроса друга; объём 100–120 слов.',descriptionEn:'Write a reply email answering your friend’s three questions in 100–120 words.'},
{id:'speaking-reading',section:'speaking',ru:'Чтение текста вслух',en:'Reading a text aloud',range:'1',part:'oral',descriptionRu:'Подготовиться к чтению небольшого текста и прочитать его вслух. Требуется проверка произношения.',descriptionEn:'Prepare a short text and read it aloud. Pronunciation needs to be assessed.'},
{id:'speaking-dialogue',section:'speaking',ru:'Диалог-расспрос',en:'A telephone survey',range:'2',part:'oral',descriptionRu:'Дать полные устные ответы на шесть вопросов телефонного опроса.',descriptionEn:'Give full spoken answers to six questions in a telephone survey.'},
{id:'speaking-monologue',section:'speaking',ru:'Монолог',en:'A monologue',range:'3',part:'oral',descriptionRu:'Построить связное высказывание по теме с опорой на четыре пункта плана.',descriptionEn:'Give a coherent talk on a topic using the four points in the plan.'}
];
const numberedTaskFamilies={
 'listening-choice':[1,4,'Выбрать ответ по прослушанной записи.','Choose an answer based on the recording.'],
 'listening-table':[6,11,'Заполнить одно поле таблицы по прослушанному интервью.','Fill one table entry based on the interview.'],
 'reading-statements':[13,19,'Определить, верно ли утверждение, неверно или в тексте об этом не сказано.','Decide whether the statement is True, False or Not stated.']
};
const ogeTaskTypes=ogeTaskFamilies.flatMap(family=>{
 const numbered=numberedTaskFamilies[family.id];
 if(!numbered)return [family];
 const [first,last,descriptionRu,descriptionEn]=numbered;
 return Array.from({length:last-first+1},(_,offset)=>{
  const number=first+offset;
  return {...family,id:`${family.id}-${number}`,family:family.id,range:String(number),offset,descriptionRu,descriptionEn};
 });
});
const ogeSections=[['listening','Аудирование','Listening'],['reading','Чтение','Reading'],['language','Грамматика и лексика','Grammar and vocabulary'],['writing','Письмо','Writing'],['speaking','Устная часть','Oral part']];
const trainerTopicEnglish=['Family and friends','Appearance and personality','Leisure and entertainment','Healthy lifestyle','Shopping and pocket money','School and school life','Careers and professions','Holidays and travel','City and country life','Nature and the environment','Mass media','Russia and English-speaking countries','Outstanding people'];
function trainerTopicLabel(topic){if(topic==='all')return tr('Все темы','All topics');const c=vocabulary.find(c=>c.topicNumber===Number(topic));return preferences.language==='en'?trainerTopicEnglish[Number(topic)-1]:c.title}
function trainerTypeLabel(type){
 const range=type.range.includes('–');
 const number=range?tr('Задания','Tasks'):tr('Задание','Task');
 return `${number} ${type.range}. ${tr(type.ru,type.en)}`;
}
function trainerTypeRange(type){return tr(type.part==='oral'?'Устная часть · ':'Письменная часть · ',type.part==='oral'?'Oral part · ':'Written part · ')+type.range}
function trainerExerciseMetadata(c){if(c.kind==='vocab')return null;let type=c.examType;if(!type)type=c.kind==='formation'?'formation':c.kind==='grammar'?'grammar':c.kind==='reading'?'reading-match':null;if(!type)return null;const topics=c.topicNumbers||[c.topicNumber||3];return{chapter:c,index:chapters.indexOf(c),type,topics}}
function availableTrainerExercises(type,topic){
 const selected=ogeTaskTypes.find(task=>task.id===type);
 const family=selected?.family??type;
 return chapters.map(trainerExerciseMetadata).filter(exercise=>{
  if(!exercise||(family&&exercise.type!==family))return false;
  if(topic&&topic!=='all'&&!exercise.topics.includes(Number(topic)))return false;
  return selected?.family!=='reading-statements'||Boolean(exercise.chapter.tasks[selected.offset]);
 });
}
let trainerSelection={route:'type',type:null,topic:null};
function taskTrainerPage(){const selection=trainerSelection,selectedType=ogeTaskTypes.find(t=>t.id===selection.type);$('#secondary-view').innerHTML=`<div class="trainer-routes" role="group" aria-label="${tr('Порядок выбора','Selection order')}"><button class="button ${selection.route==='type'?'dark':'light'}" id="trainer-by-type" aria-pressed="${selection.route==='type'}">${tr('Сначала тип задания','Task type first')}</button><button class="button ${selection.route==='topic'?'dark':'light'}" id="trainer-by-topic" aria-pressed="${selection.route==='topic'}">${tr('Сначала тема','Topic first')}</button></div><div id="trainer-steps" class="trainer-steps"></div><div id="trainer-content"></div><div class="trainer-source"><p>${tr('Форматы и номера сверены со спецификацией и демоверсиями ФИПИ ОГЭ-2027. Упражнения на платформе — авторские тренировочные; наличие типа в каталоге не означает, что для него уже добавлены материалы.','Task formats and numbering were checked against the FIPI OGE 2027 specification and sample papers. Platform exercises are original practice. A listed task type may not have materials yet.')}</p><a href="https://fipi.ru/oge/demoversii-specifikacii-kodifikatory" target="_blank" rel="noopener noreferrer">${tr('Документы ФИПИ ↗','FIPI documents ↗')}</a></div>`;
function reset(route){trainerSelection={route,type:null,topic:null};taskTrainerPage()}
$('#trainer-by-type').onclick=()=>reset('type');$('#trainer-by-topic').onclick=()=>reset('topic');
const chooseType=id=>{selection.type=id;taskTrainerPage()},chooseTopic=id=>{selection.topic=id;taskTrainerPage()};
const typeStep=`<button class="text-button" id="trainer-step-type">${selectedType?esc(trainerTypeLabel(selectedType)):tr('Тип задания','Task type')}</button>`;
const topicStep=`<button class="text-button" id="trainer-step-topic">${selection.topic?esc(trainerTopicLabel(selection.topic)):tr('Тема','Topic')}</button>`;
$('#trainer-steps').innerHTML=(selection.route==='type'?typeStep+'<span>→</span>'+topicStep:topicStep+'<span>→</span>'+typeStep);
$('#trainer-step-type').onclick=()=>{selection.type=null;if(selection.route==='type')selection.topic=null;taskTrainerPage()};$('#trainer-step-topic').onclick=()=>{selection.topic=null;if(selection.route==='topic')selection.type=null;taskTrainerPage()};
const content=$('#trainer-content');
function typePicker(){content.innerHTML=`<h2 class="trainer-step-title">${tr('Выбери тип задания','Choose a task type')}</h2>${selection.topic?`<p class="feature-note">${esc(trainerTopicLabel(selection.topic))}</p>`:''}${ogeSections.map(([id,ru,en])=>`<section class="trainer-group"><h3>${tr(ru,en)}</h3>${ogeTaskTypes.filter(t=>t.section===id).map(t=>{const count=availableTrainerExercises(t.id,selection.topic).length;return `<button class="trainer-choice" data-exam-type="${t.id}"><span class="trainer-choice-body"><strong>${esc(trainerTypeLabel(t))}</strong><small>${esc(trainerTypeRange(t))}</small><span>${esc(tr(t.descriptionRu,t.descriptionEn))}</span></span><span class="trainer-availability ${count?'available':''}">${count?tr('Упражнений: ','Exercises: ')+count:tr('Пока нет материалов','No materials yet')}</span></button>`}).join('')}</section>`).join('')}`;document.querySelectorAll('[data-exam-type]').forEach(b=>b.onclick=()=>chooseType(b.dataset.examType))}
function topicPicker(){const topics=['all',...vocabulary.map(c=>String(c.topicNumber))];content.innerHTML=`<h2 class="trainer-step-title">${tr('Выбери тему','Choose a topic')}</h2>${selectedType?`<p class="feature-note">${esc(trainerTypeLabel(selectedType))} · ${esc(trainerTypeRange(selectedType))}</p>`:''}<div class="trainer-topic-list">${topics.map(topic=>{const count=availableTrainerExercises(selection.type,topic).length;return `<button class="trainer-topic-choice" data-trainer-topic="${topic}"><span>${esc(trainerTopicLabel(topic))}</span><small>${count?tr('Упражнений: ','Exercises: ')+count:tr('Пока нет материалов','No materials yet')}</small><span aria-hidden="true">→</span></button>`}).join('')}</div>`;document.querySelectorAll('[data-trainer-topic]').forEach(b=>b.onclick=()=>chooseTopic(b.dataset.trainerTopic))}
if(selection.type&&selection.topic){const exercises=availableTrainerExercises(selection.type,selection.topic);content.innerHTML=`<div class="trainer-result-heading"><span class="status-label">${esc(trainerTypeRange(selectedType))}</span><h2>${esc(trainerTypeLabel(selectedType))}</h2><p>${esc(trainerTopicLabel(selection.topic))}</p><p class="feature-note">${esc(tr(selectedType.descriptionRu,selectedType.descriptionEn))}</p></div>${exercises.length?`<div id="task-library" class="topic-list">${topicCards(exercises.map(x=>x.chapter))}</div>`:`<div class="empty-state" id="trainer-no-materials"><h2>${tr('Материалы для этого сочетания пока не добавлены','No exercises for this combination yet')}</h2><p>${tr('Можно выбрать другую тему или тип задания. Аудиозадания появятся вместе с записями; письмо и говорение — с материалами и проверкой преподавателя.','Choose another topic or task type. Listening tasks need recordings; writing and speaking need materials and teacher assessment.')}</p></div>`}<div class="trainer-result-actions"><button class="button light" id="trainer-change-type">${tr('Другой тип задания','Change task type')}</button><button class="button light" id="trainer-change-topic">${tr('Другая тема','Change topic')}</button></div>`;bindTopics();
if(selectedType.family==='reading-statements'){
 content.querySelectorAll('#task-library [data-topic]').forEach(button=>{
  button.onclick=()=>{
   const index=Number(button.dataset.topic);
   start(index,false,6,{task:chapters[index].tasks[selectedType.offset],label:trainerTypeLabel(selectedType)});
  };
 });
}
$('#trainer-change-type').onclick=()=>{selection.type=null;taskTrainerPage()};$('#trainer-change-topic').onclick=()=>{selection.topic=null;taskTrainerPage()}}
else if(selection.route==='type'?!selection.type:!!selection.topic)typePicker();else topicPicker();translateInterface()}
