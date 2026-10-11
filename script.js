const GAS_URL = "https://script.google.com/macros/s/AKfycbw_-V9SlwCDibw7KEwNOpcNgfxIr0yydQZHFofet31fNlenf6yf2EIlip9GMOUa_bEqmg/exec";

function recordWake() { fetch(GAS_URL + "?action=wake"); }
function recordSleep() { fetch(GAS_URL + "?action=sleep"); }
function recordGoSchool() { fetch(GAS_URL + "?action=goSchool"); }
function recordLeaveSchool() { fetch(GAS_URL + "?action=leaveSchool"); }

function updateClock() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  document.getElementById('clock').textContent = `${year}年${month}月${date}日 ${hours}:${minutes}`;
  document.getElementById('seconds').textContent = `${seconds}秒`;
}

setInterval(updateClock, 1000);
updateClock();

const images = Array.from({length: 13}, (_, i) => `fire/${String(i + 1).padStart(3, '0')}.jpg`);
let currentSlideIndex = 0;
const slideImg = document.getElementById('slide-img');
let slideInterval;

function showSlide(index) {
  if (index >= images.length) currentSlideIndex = 0;
  if (index < 0) currentSlideIndex = images.length - 1;
  slideImg.src = images[currentSlideIndex];
}

function changeSlide(step) {
  currentSlideIndex += step;
  showSlide(currentSlideIndex);
  resetInterval();
}

function resetInterval() {
  clearInterval(slideInterval);
  slideInterval = setInterval(() => changeSlide(1), 4000);
}

showSlide(currentSlideIndex);
resetInterval();

let todos = JSON.parse(localStorage.getItem('hajime_todos')) || [];

function renderTodos() {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';
  
  const grouped = todos.reduce((acc, todo) => {
    if (!acc[todo.date]) acc[todo.date] = [];
    acc[todo.date].push(todo);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  const days = ['日', '月', '火', '水', '木', '金', '土'];

  sortedDates.forEach(dateStr => {
    const dateObj = new Date(dateStr);
    const dayName = days[dateObj.getDay()];
    const groupDiv = document.createElement('div');
    groupDiv.className = 'todo-date-group';
    
    let headerHtml = `<div class="date-header">${dateStr.replace('-', '/').replace('-', '/')} (${dayName})</div>`;
    
    let itemsHtml = grouped[dateStr].map(todo => `
      <div class="todo-item">
        <span class="todo-subject-tag">${todo.subject}</span>
        <span class="todo-text">${todo.task}</span>
        <button class="todo-delete" onclick="deleteTodo('${todo.id}')">完了</button>
      </div>
    `).join('');
    
    groupDiv.innerHTML = headerHtml + itemsHtml;
    list.appendChild(groupDiv);
  });
}

function addTodo() {
  const task = document.getElementById('todo-task').value;
  const date = document.getElementById('todo-date').value;
  const subject = document.getElementById('todo-subject').value;

  if (!task || !date) return alert('タスクと日付を入力してください');

  const newTodo = { id: Date.now().toString(), task, date, subject };
  todos.push(newTodo);
  localStorage.setItem('hajime_todos', JSON.stringify(todos));
  renderTodos();
  document.getElementById('todo-task').value = '';
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  localStorage.setItem('hajime_todos', JSON.stringify(todos));
  renderTodos();
}

renderTodos();

function getMockBusData(baseMinutes) {
  const now = new Date();
  const times = [];
  for(let i=0; i<5; i++) {
    const d = new Date(now.getTime() + (baseMinutes + i * 25) * 60000);
    times.push({
      time: d,
      timeStr: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
      wait: Math.floor((d - now) / 60000)
    });
  }
  return times;
}

function calculateTransit() {
  const route = document.getElementById('route-select').value;
  const detailEl = document.getElementById('transit-detail');
  
  const higashi = getMockBusData(12);
  const chuo = getMockBusData(14); 
  const nishiguchi = getMockBusData(7); 
  
  if (route === 'to_school') {
    let selectedStop = "";
    let selectedBus = null;
    let dest = "大久保駅 ➔ 三ノ宮 ➔ 野崎通5丁目";

    const validHigashi = higashi.filter(b => b.wait >= 5)[0];
    const validChuo = chuo.filter(b => b.wait >= 5)[0];
    const validNishiguchi = nishiguchi.filter(b => b.wait >= 10)[0];

    if (validHigashi && validChuo) {
      selectedStop = "高丘東小学校前";
      selectedBus = validHigashi;
    } else if (validHigashi) {
      selectedStop = "高丘東小学校前";
      selectedBus = validHigashi;
    } else if (validChuo) {
      selectedStop = "中央センター前";
      selectedBus = validChuo;
    }

    if (selectedBus && selectedBus.wait > 30 && validNishiguchi && validNishiguchi.wait < selectedBus.wait) {
      selectedStop = "高丘西口";
      selectedBus = validNishiguchi;
    } else if (!selectedBus && validNishiguchi) {
      selectedStop = "高丘西口";
      selectedBus = validNishiguchi;
    }

    if(selectedBus) {
      detailEl.innerHTML = `<strong>${selectedStop}</strong> 発 ➔ ${selectedBus.timeStr} <br><small>(${selectedBus.wait}分後に出発)</small><br>経由・到着: ${dest}`;
    } else {
      detailEl.innerHTML = "現在乗車可能なバスが見つかりません。";
    }
  } else {
    detailEl.innerHTML = `<strong>青谷</strong> 発 ➔ 検索中... <br>経由・到着: 三ノ宮 ➔ 大久保駅 ➔ 自宅(高丘東/中央/西口)`;
  }
}
