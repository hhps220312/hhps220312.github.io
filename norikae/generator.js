import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAyIm_ng794iUZPm6O0QTFrPt5y6f2MeQc",
  authDomain: "hhps220312.firebaseapp.com",
  projectId: "hhps220312",
  storageBucket: "hhps220312.firebasestorage.app",
  messagingSenderId: "302599891588",
  appId: "1:302599891588:web:daf9df859574814bc130d1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DB_DOC_ID = "main_data";
const COLLECTION_NAME = "timetable_data";

let walkTimesData = {};
let linesData = [];

const walkSections = [
  { id: "home_chuo", name: "自宅 〜 中央センター前", defaultTime: 5 },
  { id: "home_higashi", name: "自宅 〜 高丘東小学校前", defaultTime: 5 },
  { id: "home_nishi", name: "自宅 〜 高丘西口", defaultTime: 10 },
  { id: "okubo_bus_jr", name: "大久保駅バス停 〜 JR大久保駅", defaultTime: 3 },
  { id: "sannomiya_subway", name: "JR三ノ宮 〜 地下鉄三宮駅前", defaultTime: 7 },
  { id: "nozaki_school", name: "野崎通5丁目 〜 学校", defaultTime: 10 },
  { id: "aotani_school", name: "青谷 〜 学校", defaultTime: 10 },
  { id: "nagao_akashi", name: "長尾先生 〜 明石", defaultTime: 15 }
];

const stationIdMap = {
  "自宅": "home",
  "学校": "school",
  "高丘東小学校前": "takaoka_higashi",
  "中央センター前": "chuo_center",
  "高丘西口": "takaoka_nishi",
  "大久保駅": "okubo",
  "明石駅": "akashi",
  "三ノ宮駅": "sannomiya",
  "地下鉄三宮駅前": "subway_sannomiya",
  "野崎通5丁目": "nozaki",
  "青谷": "aotani",
  "大久保駅バス停": "okubo_bus",
  "長尾先生": "nagao",
  "西明石駅": "nishi_akashi",
  "神戸駅": "kobe"
};

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 3000);
}

async function loadDataFromFirebase() {
  try {
    const docRef = doc(db, COLLECTION_NAME, DB_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      walkTimesData = data.walkTimes || {};
      linesData = data.lines || [];
    }
  } catch (e) {
    console.error("データの読み込みに失敗しました", e);
  }
  renderWalkInputs();
  updateLineSelect();
}

async function saveDataToFirebase() {
  try {
    const docRef = doc(db, COLLECTION_NAME, DB_DOC_ID);
    await setDoc(docRef, {
      walkTimes: walkTimesData,
      lines: linesData
    });
    showToast("Firebaseに保存しました");
  } catch (e) {
    alert("保存エラー: " + e.message);
  }
}

function renderWalkInputs() {
  const container = document.getElementById('walk-times-container');
  container.innerHTML = '';
  walkSections.forEach(sec => {
    const val = walkTimesData[sec.id] !== undefined ? walkTimesData[sec.id] : sec.defaultTime;
    container.innerHTML += `
      <div class="stop-row">
        <span class="stop-name" style="width:220px;">${sec.name}</span>
        <input type="number" id="walk_${sec.id}" class="time-input" value="${val}"> 分
      </div>
    `;
  });
}

window.saveWalkTimes = async function() {
  walkSections.forEach(sec => {
    const val = document.getElementById(`walk_${sec.id}`).value;
    walkTimesData[sec.id] = parseInt(val, 10) || sec.defaultTime;
  });
  await saveDataToFirebase();
};

window.registerLine = async function() {
  const type = document.getElementById('line-type').value;
  const name = document.getElementById('line-name').value.trim();
  const stopsStr = document.getElementById('line-stops').value.trim();
  
  if (!name || !stopsStr) { alert("路線名と停車駅を入力してください"); return; }
  
  const stops = stopsStr.split(',').map(s => s.trim()).filter(s => s);
  
  const existingLineIndex = linesData.findIndex(l => l.name === name);
  const newLine = { type, name, stops, entries: [] };
  
  if (existingLineIndex >= 0) {
    if(confirm("既に同じ名前の路線があります。上書きしますか？(登録済みの便データは消えます)")) {
      linesData[existingLineIndex] = newLine;
    } else {
      return;
    }
  } else {
    linesData.push(newLine);
  }
  
  document.getElementById('line-name').value = '';
  document.getElementById('line-stops').value = '';
  
  await saveDataToFirebase();
  updateLineSelect();
};

function updateLineSelect() {
  const select = document.getElementById('select-line');
  select.innerHTML = '<option value="">▼路線を選択してください</option>';
  linesData.forEach((line, index) => {
    select.innerHTML += `<option value="${index}">${line.name} (${line.type})</option>`;
  });
}

window.loadLineStops = function() {
  const index = document.getElementById('select-line').value;
  const container = document.getElementById('time-entry-container');
  const inputsContainer = document.getElementById('stops-inputs');
  const typeContainer = document.getElementById('train-type-container');
  const listContainer = document.getElementById('entries-list');
  
  if (index === "") {
    container.style.display = 'none';
    listContainer.innerHTML = '';
    return;
  }
  
  const line = linesData[index];
  inputsContainer.innerHTML = '';
  
  line.stops.forEach((stop, i) => {
    inputsContainer.innerHTML += `
      <div class="stop-row">
        <span class="stop-name">${stop}</span>
        <input type="time" id="time_${i}" class="time-input">
      </div>
    `;
  });
  
  typeContainer.style.display = line.type === 'jr' ? 'block' : 'none';
  container.style.display = 'block';
  
  renderEntriesList(line);
};

function renderEntriesList(line) {
  const list = document.getElementById('entries-list');
  list.innerHTML = '';
  
  line.entries.sort((a, b) => {
    const timeA = Object.values(a.times).find(t => t);
    const timeB = Object.values(b.times).find(t => t);
    return (timeA || "") > (timeB || "") ? 1 : -1;
  });
  
  line.entries.forEach((entry, idx) => {
    const timesStr = line.stops.map(s => entry.times[s] || "--").join(" → ");
    const typeStr = entry.trainType ? `[${entry.trainType}] ` : "";
    list.innerHTML += `<li style="font-size:13px; margin-bottom:5px;">${typeStr}${timesStr} <button onclick="deleteEntry(${linesData.indexOf(line)}, ${idx})" style="padding:2px 5px; background:red; font-size:10px; color:white; border:none; border-radius:3px; cursor:pointer;">削除</button></li>`;
  });
}

window.saveTimetableEntry = async function() {
  const index = document.getElementById('select-line').value;
  if (index === "") return;
  const line = linesData[index];
  
  const times = {};
  let hasInput = false;
  
  line.stops.forEach((stop, i) => {
    const val = document.getElementById(`time_${i}`).value;
    if (val) {
      times[stop] = val;
      hasInput = true;
    }
  });
  
  if (!hasInput) { alert("最低一つの時間を入力してください"); return; }
  
  const trainType = line.type === 'jr' ? document.getElementById('train-type').value : null;
  
  line.entries.push({ times, trainType });
  
  line.stops.forEach((stop, i) => document.getElementById(`time_${i}`).value = '');
  
  await saveDataToFirebase();
  renderEntriesList(line);
};

window.deleteEntry = async function(lineIdx, entryIdx) {
  if(!confirm("この便を削除しますか？")) return;
  linesData[lineIdx].entries.splice(entryIdx, 1);
  await saveDataToFirebase();
  renderEntriesList(linesData[lineIdx]);
};

window.generateCode = function() {
  let jsCode = `// 自動生成された transit.js\n\n`;
  jsCode += `const stationNames = ${JSON.stringify(stationIdMap, null, 2)};\n\n`;
  jsCode += `const walkTimes = ${JSON.stringify(walkTimesData, null, 2)};\n\n`;
  jsCode += `const linesData = ${JSON.stringify(linesData, null, 2)};\n\n`;
  
  jsCode += `
function getEdges(node, currentTime, from, to) {
  const edges = {};
  
  // 徒歩ルートの構築
  if (node === 'home') {
    edges.chuo_center = walkTimes.home_chuo;
    edges.takaoka_higashi = walkTimes.home_higashi;
    edges.takaoka_nishi = walkTimes.home_nishi;
  }
  if (node === 'chuo_center') edges.home = walkTimes.home_chuo;
  if (node === 'takaoka_higashi') edges.home = walkTimes.home_higashi;
  if (node === 'takaoka_nishi') edges.home = walkTimes.home_nishi;
  if (node === 'okubo_bus') edges.okubo = walkTimes.okubo_bus_jr;
  if (node === 'okubo') edges.okubo_bus = walkTimes.okubo_bus_jr;
  if (node === 'sannomiya') edges.subway_sannomiya = walkTimes.sannomiya_subway;
  if (node === 'subway_sannomiya') edges.sannomiya = walkTimes.sannomiya_subway;
  if (node === 'nozaki') edges.school = walkTimes.nozaki_school;
  if (node === 'aotani') edges.school = walkTimes.aotani_school;
  if (node === 'school') { edges.nozaki = walkTimes.nozaki_school; edges.aotani = walkTimes.aotani_school; }
  if (node === 'nagao') edges.akashi = walkTimes.nagao_akashi;
  if (node === 'akashi') edges.nagao = walkTimes.nagao_akashi;

  // 時刻表データからのエッジ抽出
  const currentStr = String(currentTime.getHours()).padStart(2, '0') + ":" + String(currentTime.getMinutes()).padStart(2, '0');
  
  linesData.forEach(line => {
    line.entries.forEach(entry => {
      // 指定時刻以降で直近の便を探す処理
      const stops = Object.keys(entry.times);
      const nodeIndex = stops.indexOf(stationNames[node]);
      
      if (nodeIndex !== -1 && nodeIndex < stops.length - 1) {
        const departureTime = entry.times[stops[nodeIndex]];
        if (departureTime >= currentStr) {
          const nextStopName = stops[nodeIndex + 1];
          const nextNodeId = Object.keys(stationNames).find(key => stationNames[key] === nextStopName);
          const arrivalTime = entry.times[nextStopName];
          
          if (nextNodeId && arrivalTime) {
            // JRの乗り換えロジック (大久保-西明石-三ノ宮)
            if (line.type === 'jr' && node === 'okubo' && nextNodeId === 'nishi_akashi') {
               // 快速・新快速への乗り換え評価など独自ロジックをここに組み込む
            }
            
            // 所要時間の計算
            const depParts = departureTime.split(':');
            const arrParts = arrivalTime.split(':');
            let travelMins = (parseInt(arrParts[0])*60 + parseInt(arrParts[1])) - (parseInt(depParts[0])*60 + parseInt(depParts[1]));
            if (travelMins < 0) travelMins += 24 * 60; // 日またぎ
            
            // 最短のものだけを採用
            if (!edges[nextNodeId] || travelMins < edges[nextNodeId]) {
               edges[nextNodeId] = travelMins;
            }
          }
        }
      }
    });
  });
  
  return edges;
}

// 最短経路探索アルゴリズム (ダイクストラ法)
function findShortestPath(start, end, startTime) {
  // ※実際のtransit.js組み込み時に実装
  return null;
}

window.calculateTransit = function() {
  // ※実際のtransit.js組み込み時に実装
};
`;

  document.getElementById('output-code').value = jsCode;
};

document.addEventListener('DOMContentLoaded', loadDataFromFirebase);
