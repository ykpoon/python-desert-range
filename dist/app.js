import {lessons} from './lessons.js';
import {createWorld} from './world.js';

const byId = id => document.getElementById(id);
const icon = name => '<svg aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
const storageKey = 'desert-code-range-progress-v1';
const positions = [[-3.9, 2.08, -1.5], [0, 2.56, -2.2], [3.9, 2.08, -1.5]];
const lessonCount = lessons.length;

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const scored = Array.isArray(saved.scored) ? saved.scored.filter(x => typeof x === 'string') : [];
    return {scored:new Set(scored), active:Number.isInteger(saved.active) ? saved.active : 0};
  } catch {
    return {scored:new Set(), active:0};
  }
}

const profile = restore();
const complete = index => lessons[index].rounds.every((_, round) => profile.scored.has(index + ':' + round));
const unlocked = index => index === 0 || complete(index - 1);
function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({scored:[...profile.scored],active:lesson}));
  } catch { /* Play continues if local storage is unavailable. */ }
}

let lesson = Math.max(0, Math.min(lessonCount - 1, profile.active));
if (!unlocked(lesson)) lesson = 0;
let round = 0;
let phase = 'scan';
const moving = new Set();
let drag = null;
let raf = 0;
let lastFrame = 0;
let monitor = 0;
let targetButtons = [];
let activeWorker = null;
let workerTimer = null;
let enlarged = false;

const range = byId('range');
const canvas = byId('world');
const camera = createWorld(canvas);
const helpDialog = byId('help-dialog');
const codeDialog = byId('code-dialog');
const finishDialog = byId('finish-dialog');
const feedback = byId('feedback');
const keys = byId('target-keys');
const currentRound = () => lessons[lesson].rounds[round];
const modalIsOpen = () => helpDialog.open || codeDialog.open || finishDialog.open;

function startLesson(index) {
  if (!unlocked(index)) return;
  lesson = index;
  const pending = lessons[lesson].rounds.findIndex((_, step) => !profile.scored.has(lesson + ':' + step));
  round = pending < 0 ? 0 : pending;
  camera.reset();
  save();
  renderRound();
  renderRoute();
}

function renderRoute() {
  const count = lessons.filter((_, index) => complete(index)).length;
  byId('mastery').textContent = count + ' / ' + lessonCount;
  byId('progress').value = count;
  byId('score').textContent = lessons.reduce((sum, item, index) => sum + item.rounds.filter((_, step) => profile.scored.has(index + ':' + step)).length * 100, 0);
  const nav = byId('missions');
  const focusedIndex = Array.from(nav.children).indexOf(document.activeElement);
  nav.replaceChildren(...lessons.map((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'level';
    button.disabled = !unlocked(index);
    button.dataset.complete = complete(index);
    if (lesson === index) button.setAttribute('aria-current','true');
    const indicator = complete(index) ? 'check' : button.disabled ? 'lock' : 'target';
    if (button.disabled) button.title = '完成上一關後解鎖';
    button.innerHTML = '<span class="level-icon">' + icon(item.icon) + '</span><span><strong>' + item.name + '</strong><small>' + item.tag + '</small></span><span class="level-status">' + icon(indicator) + '</span>';
    button.addEventListener('click', () => startLesson(index));
    return button;
  }));
  if (focusedIndex !== -1) nav.children[focusedIndex]?.focus({preventScroll:true});
}

function renderRound() {
  const item = lessons[lesson];
  const challenge = currentRound();
  phase = 'scan';
  byId('sector').textContent = '關卡 ' + String(lesson + 1).padStart(2,'0') + ' / ' + String(lessonCount).padStart(2,'0');
  byId('mission-title').textContent = item.name;
  byId('mission-intro').textContent = item.intro;
  byId('location-name').textContent = item.site;
  byId('round').innerHTML = '任務 <b>' + (round + 1) + '</b> / ' + item.rounds.length;
  byId('round-pips').replaceChildren(...item.rounds.map((_, index) => {
    const pip=document.createElement('i');
    if (index === round) pip.className='active';
    else if (profile.scored.has(lesson + ':' + index)) pip.className='done';
    return pip;
  }));
  byId('prompt-title').textContent = '掃描任務';
  byId('prompt').textContent = challenge.prompt;
  byId('hint-text').hidden = true;
  byId('hint').setAttribute('aria-expanded','false');
  byId('hint-text').textContent = challenge.hint;
  byId('advance').hidden = true;
  feedback.hidden = true;
  byId('scan').disabled = false;
  stopWorker();
  targetButtons = challenge.options.map((name, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'world-target';
    button.dataset.color = index;
    button.innerHTML = '<span class="target-ring">' + icon('code') + '</span><span class="target-caption"><small>' + (index+1) + '</small><span></span></span>';
    button.querySelector('.target-caption span').textContent = name;
    button.setAttribute('aria-label','資料靶 ' + (index + 1) + '，' + name);
    button.addEventListener('click',() => select(index));
    return button;
  });
  byId('targets').replaceChildren(...targetButtons);
  keys.replaceChildren(...challenge.options.map((name, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quiet-button';
    button.textContent = (index + 1) + ' · ' + name;
    button.addEventListener('click',() => select(index));
    return button;
  }));
  clearTimeout(monitor);
  draw();
}

function flash() {
  const sweep = byId('sweep');
  sweep.classList.remove('flash');
  requestAnimationFrame(() => sweep.classList.add('flash'));
}

function announce(text, error = false, auto = false) {
  clearTimeout(monitor);
  feedback.textContent = text;
  feedback.dataset.error = error;
  feedback.hidden = false;
  if (auto) monitor=setTimeout(() => {feedback.hidden=true;},2800);
}

function select(index) {
  if (phase !== 'scan') return;
  const challenge = currentRound();
  flash();
  targetButtons.forEach(button => delete button.dataset.hit);
  if (index !== challenge.correct) {
    targetButtons[index].dataset.hit = 'wrong';
    announce('未命中。再讀一次題目，或者看看提示。',true,true);
    return;
  }

  phase = challenge.code ? 'code' : 'solved';
  targetButtons[index].dataset.hit = 'correct';
  targetButtons.forEach(button => {button.disabled = true;});
  Array.from(keys.children).forEach(button => {button.disabled = true;});
  byId('scan').disabled = true;
  byId('prompt-title').textContent = '掃描成功';
  byId('prompt').textContent = challenge.explanation;
  byId('hint-text').hidden = true;
  byId('hint').setAttribute('aria-expanded','false');
  showAction();
  announce('命中 · 資料驗證成功',false,true);

  if (challenge.code) {
    prepareCode(challenge.code);
    openCode();
  } else {
    award();
    if (!enlarged) byId('advance').focus({preventScroll:true});
  }
}

function showAction() {
  const advance = byId('advance');
  advance.hidden = false;
  advance.textContent = phase === 'code' ? '開啟控制台' : round === lessons[lesson].rounds.length - 1 ? '查看關卡成績' : '下一項任務';
}

function award() {
  profile.scored.add(lesson + ':' + round);
  save();
  renderRoute();
}

function next() {
  if (phase === 'code') {openCode();return;}
  if (phase !== 'solved') return;
  if (round + 1 < lessons[lesson].rounds.length) {
    round++;
    camera.reset();
    renderRound();
    range.scrollIntoView({block:'nearest'});
    targetButtons[0].focus({preventScroll:true});
    return;
  }
  closeEnlarged();
  const final = lesson === lessonCount - 1;
  byId('finish-title').textContent = final ? '沙城訓練完成！' : lessons[lesson].name + ' · 完成';
  byId('finish-text').textContent = final
    ? '你已完成全部 ' + lessonCount + ' 關，共獲得 ' + byId('score').textContent + ' 分。可再次挑戰任何關卡。'
    : '本關 ' + lessons[lesson].rounds.length + ' 項任務已完成。下一關「' + lessons[lesson + 1].name + '」已解鎖。';
  byId('finish-action').textContent = final ? '返回首關' : '進入下一關';
  moving.clear();
  finishDialog.showModal();
}

function prepareCode(task) {
  byId('code-input').value = task.initial;
  byId('code-instruction').textContent = task.instruction;
  byId('expected').textContent = task.expected;
  byId('code-hint-text').hidden = true;
  byId('code-hint-text').textContent = task.hint;
  byId('code-hint').setAttribute('aria-expanded','false');
  byId('output').hidden = true;
  byId('run-status').textContent = '';
  byId('after-code').hidden = true;
}

function openCode() {
  moving.clear();
  closeEnlarged();
  if (!codeDialog.open) codeDialog.showModal();
}

function stopWorker() {
  clearTimeout(workerTimer);
  if (activeWorker) activeWorker.terminate();
  activeWorker = null;
  byId('run').disabled = false;
}

const pythonFeedback = {
  'SyntaxError':'語法有誤。看看括號、引號、冒號和程式拼寫。',
  'IndentationError':'檢查縮排。迴圈內的指令要放在下一行，並縮排四格。',
  'NameError':'Python 找不到名稱。檢查變數有沒有先設定，拼寫是否相同。',
  'TypeError':'檢查運算使用的資料類型。',
  'IndexError':'列表索引超出了範圍，第一項的索引是 0。',
  'TimeLimitError':'執行時間過長，請檢查迴圈。',
};

function reportRun(message, isError, output = '') {
  const status = byId('run-status');
  status.textContent = message;
  status.dataset.error = isError;
  byId('output').textContent = output;
  byId('output').hidden = !output;
}

function runCode() {
  const source = byId('code-input').value;
  if (phase === 'solved') return;
  if (!source.trim() || source.length > 5000) {
    reportRun('請輸入程式碼，最多 5,000 個字元。',true);
    return;
  }
  const task = currentRound().code;
  stopWorker();
  byId('run').disabled = true;
  reportRun('正在執行 Python…',false);
  try {
    activeWorker = new Worker('./python-worker.js');
  } catch {
    stopWorker();
    reportRun('控制台啟動失敗，請重新載入網頁。',true);
    return;
  }
  activeWorker.onerror = () => {
    stopWorker();
    reportRun('控制台載入失敗，請重新載入網頁。',true);
  };
  activeWorker.onmessage = ({data}) => {
    stopWorker();
    const output = data.output.replace(/\n$/,'');
    if (data.error) {
      const label = data.error.split(':')[0];
      reportRun(pythonFeedback[label] || '程式執行時遇到問題。',true,[output,data.error].filter(Boolean).join('\n'));
    } else if (output !== task.expected) {
      reportRun('輸出與目標有分別。可以修改後再執行。',true,output || '（沒有輸出）');
    } else if (data.missing.length) {
      reportRun('輸出正確。再按題目要求用指定的語法完成。',true,output);
    } else {
      phase = 'solved';
      award();
      showAction();
      reportRun('程式任務完成！',false,output);
      byId('after-code').hidden = false;
      byId('after-code').focus({preventScroll:true});
    }
  };
  workerTimer = setTimeout(() => {
    stopWorker();
    reportRun('程式執行時間過長，請檢查迴圈。',true);
  },3300);
  activeWorker.postMessage({source,syntax:task.syntax});
}

function toggleHint(buttonId, textId) {
  const field=byId(textId);
  field.hidden=!field.hidden;
  byId(buttonId).setAttribute('aria-expanded',String(!field.hidden));
}

function draw() {
  camera.draw();
  for (const [index, button] of targetButtons.entries()) {
    const point = camera.available ? camera.project(...positions[index]) : {x:.19+index*.31,y:.45,depth:1};
    button.hidden = point.depth < .6 || point.x < .05 || point.x > .95 || point.y < .13 || point.y > .88;
    button.style.left = 100 * point.x + '%';
    button.style.top = 100 * point.y + '%';
  }
  const compass = ['N','NE','E','SE','S','SW','W','NW'];
  byId('heading').textContent = compass[(Math.round(camera.state.yaw/(Math.PI/4))+16)%8];
}

function tick(t) {
  const seconds = lastFrame ? Math.min(.06, (t - lastFrame) / 1000) : .016;
  lastFrame = t;
  const rate = 4.35 * seconds;
  const axis = (pos, neg) => Number(moving.has(pos)) - Number(moving.has(neg));
  camera.move(rate * axis('d','a'),rate * axis('w','s'));
  camera.rotate(1.65 * seconds * axis('arrowright','arrowleft'),1.1 * seconds * axis('arrowup','arrowdown'));
  draw();
  raf = moving.size ? requestAnimationFrame(tick) : 0;
  if (!raf) lastFrame = 0;
}

function startMoving(key) {
  if (modalIsOpen() || !camera.available) return;
  moving.add(key);
  if (!raf) raf = requestAnimationFrame(tick);
}

function scanCenter() {
  if (phase !== 'scan') return;
  const rect = range.getBoundingClientRect();
  const middle = {x:rect.left + rect.width / 2, y:rect.top + rect.height / 2};
  const index = targetButtons.findIndex(button => {
    if (button.hidden) return false;
    const r = button.getBoundingClientRect();
    return middle.x >= r.left && middle.x <= r.right && middle.y >= r.top && middle.y <= r.bottom;
  });
  if (index >= 0) select(index);
  else announce('準星未對準資料靶。亦可直接點選靶。',true,true);
}

function closeEnlarged() {
  if (!enlarged) return;
  enlarged = false;
  range.classList.remove('enlarged');
  byId('expand').setAttribute('aria-pressed','false');
  draw();
}

const moveKeys = ['w','a','s','d','arrowleft','arrowright','arrowup','arrowdown'];
window.addEventListener('keydown', event => {
  if (modalIsOpen() || event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key.toLowerCase();
  if (key === 'escape') { closeEnlarged(); return; }
  if (moveKeys.includes(key)) {
    if (event.target.closest?.('button, a') && key.startsWith('arrow')) return;
    event.preventDefault();
    startMoving(key);
  }
  if (['1','2','3'].includes(key) && !event.repeat) select(Number(key)-1);
  if (key === ' ' && !event.repeat && !event.target.closest?.('button, a')) {
    event.preventDefault();
    scanCenter();
  }
});
window.addEventListener('keyup', event => moving.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => {moving.clear();drag=null;});
canvas.addEventListener('pointerdown', event => {
  if (!camera.available || event.button !== 0 || !event.isPrimary) return;
  drag = {id:event.pointerId,x:event.clientX,y:event.clientY};
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (drag?.id !== event.pointerId) return;
  camera.rotate((event.clientX-drag.x)*.006,(drag.y-event.clientY)*.005);
  Object.assign(drag,{x:event.clientX,y:event.clientY});
  draw();
});
canvas.addEventListener('lostpointercapture',() => {drag=null;});
for (const button of document.querySelectorAll('#movement button')) {
  button.addEventListener('pointerdown',event => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    startMoving(button.dataset.key);
  });
  button.addEventListener('lostpointercapture',() => moving.delete(button.dataset.key));
}
byId('expand').addEventListener('click',() => {
  if (enlarged) {closeEnlarged();return;}
  enlarged=true;
  range.classList.add('enlarged');
  byId('expand').setAttribute('aria-pressed','true');
  draw();
});
byId('recenter').addEventListener('click',() => {camera.reset();draw();});
byId('scan').addEventListener('click',scanCenter);
byId('hint').addEventListener('click',() => toggleHint('hint','hint-text'));
byId('code-hint').addEventListener('click',() => toggleHint('code-hint','code-hint-text'));
byId('reveal-targets').addEventListener('click',() => {
  keys.hidden=!keys.hidden;
  byId('reveal-targets').setAttribute('aria-expanded',String(!keys.hidden));
});
byId('help').addEventListener('click',() => {moving.clear();helpDialog.showModal();});
byId('advance').addEventListener('click',next);
byId('run').addEventListener('click',runCode);
byId('reset-code').addEventListener('click',() => {
  if (phase === 'code') {prepareCode(currentRound().code);byId('code-input').focus();}
});
byId('after-code').addEventListener('click',() => {codeDialog.close();next();});
codeDialog.addEventListener('close',stopWorker);
byId('code-input').addEventListener('keydown',event => {
  if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey) {
    const input=event.currentTarget;
    const line=input.value.slice(0,input.selectionStart).split('\n').at(-1);
    const prefix=line.match(/^ */)[0] + (line.trimEnd().endsWith(':') ? '    ' : '');
    if (prefix) {
      event.preventDefault();
      input.setRangeText('\n'+prefix,input.selectionStart,input.selectionEnd,'end');
    }
  }
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) runCode();
});
byId('finish-action').addEventListener('click',() => {
  finishDialog.close();
  startLesson((lesson+1)%lessonCount);
  byId('mission-title').scrollIntoView({block:'nearest'});
});
new ResizeObserver(draw).observe(range);
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  moving.clear();
  camera.useSoftware();
  if (!camera.available) {
    range.classList.add('fallback');
    announce('3D 畫面暫停。你仍可點選資料靶完成任務。',false,true);
  }
  draw();
});
startLesson(lesson);
if (!camera.available) {
  range.classList.add('fallback');
  byId('movement').hidden=true;
  announce('目前裝置未能載入 3D 畫面。你仍可點選資料靶完成任務。',false,true);
}
