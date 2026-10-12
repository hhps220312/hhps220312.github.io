const stationNames = {
  home: "自宅", school: "学校", takaoka_higashi: "高丘東小学校前",
  chuo_center: "中央センター前", takaoka_nishi: "高丘西口", okubo: "大久保駅",
  akashi: "明石駅", sannomiya: "三ノ宮駅", subway_sannomiya: "地下鉄三宮",
  nozaki: "野崎通5丁目", aotani: "青谷"
};

function getEdges(node, time, from, to) {
  const h = time.getHours();
  const edges = {};
  
  if (node === 'home') {
    edges.takaoka_higashi = 5;
    edges.chuo_center = 5;
    edges.takaoka_nishi = 10;
  }
  if (node === 'takaoka_higashi') {
    edges.home = 5;
    edges.chuo_center = 2;
    edges.okubo = 13;
  }
  if (node === 'chuo_center') {
    edges.home = 5;
    edges.takaoka_nishi = 3;
    if (h >= 6 && h <= 9 && from === 'home') {
      edges.okubo = 12;
    } else {
      edges.takaoka_higashi = 2;
      edges.okubo = 15;
    }
  }
  if (node === 'takaoka_nishi') {
    edges.home = 10;
    edges.chuo_center = 3;
    edges.okubo = 18;
  }
  if (node === 'okubo') {
    edges.takaoka_higashi = 13;
    edges.chuo_center = 15;
    edges.takaoka_nishi = 18;
    edges.akashi = 5;
    edges.sannomiya = 35;
  }
  if (node === 'akashi') {
    edges.okubo = 5;
    edges.sannomiya = 15;
  }
  if (node === 'sannomiya') {
    edges.okubo = 35;
    edges.akashi = 15;
    edges.subway_sannomiya = 7;
  }
  if (node === 'subway_sannomiya') {
    edges.sannomiya = 7;
    if (to === 'school') {
      edges.nozaki = 18;
      edges.aotani = 25;
    } else {
      edges.nozaki = 18;
      edges.aotani = 20;
    }
  }
  if (node === 'nozaki') {
    edges.subway_sannomiya = 18;
    edges.school = 10;
  }
  if (node === 'aotani') {
    edges.subway_sannomiya = 20;
    edges.school = 10;
  }
  if (node === 'school') {
    if (to === 'home' || from === 'school') {
      edges.aotani = 10;
      edges.nozaki = 15;
    } else {
      edges.nozaki = 10;
      edges.aotani = 10;
    }
  }
  
  return edges;
}

function findShortestPath(start, end, startTime) {
  const nodes = Object.keys(stationNames);
  const distances = {};
  const previous = {};
  const unvisited = new Set(nodes);
  const arrivalTimes = {};

  nodes.forEach(n => distances[n] = Infinity);
  distances[start] = 0;
  arrivalTimes[start] = new Date(startTime.getTime());

  while(unvisited.size > 0) {
    let curr = null;
    unvisited.forEach(n => {
      if (curr === null || distances[n] < distances[curr]) curr = n;
    });
    if (distances[curr] === Infinity || curr === end) break;
    unvisited.delete(curr);

    const currTime = arrivalTimes[curr];
    const edges = getEdges(curr, currTime, start, end);
    
    for (let neighbor in edges) {
      if (!unvisited.has(neighbor)) continue;
      
      let travelTime = edges[neighbor];
      let waitTime = 0;
      
      if (curr !== 'home' && curr !== 'school' && neighbor !== 'home' && neighbor !== 'school' && !(curr === 'sannomiya' && neighbor === 'subway_sannomiya') && !(curr === 'subway_sannomiya' && neighbor === 'sannomiya')) {
        waitTime = 4;
      }

      let alt = distances[curr] + travelTime + waitTime;
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = curr;
        arrivalTimes[neighbor] = new Date(currTime.getTime() + (travelTime + waitTime) * 60000);
      }
    }
  }

  let path = [];
  let u = end;
  while(u) {
    path.unshift(u);
    u = previous[u];
  }
  return path[0] === start ? path : null;
}

window.calculateTransit = function() {
  const from = document.getElementById('transit-from').value;
  const to = document.getElementById('transit-to').value;
  const res = document.getElementById('transit-result');
  const timeInput = document.getElementById('transit-time').value;
  
  const addMin = (d, m) => new Date(d.getTime() + m * 60000);
  const formatTime = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  if (from === to) {
    res.innerHTML = "出発地と目的地の組み合わせが同じです。";
    return;
  }

  let startTime = new Date();
  if (timeInput) {
    startTime = new Date(timeInput);
  }
  
  let isMidnight = false;
  const h = startTime.getHours();
  if (h >= 0 && h < 5 || (h === 23 && startTime.getMinutes() >= 30)) {
    isMidnight = true;
    if (h >= 0 && h < 5) {
      startTime.setHours(5, 30, 0, 0);
    } else {
      startTime.setDate(startTime.getDate() + 1);
      startTime.setHours(5, 30, 0, 0);
    }
  }

  const path = findShortestPath(from, to, startTime);
  if (!path) {
    res.innerHTML = "ルートが見つかりませんでした。";
    return;
  }

  let html = "";
  if (isMidnight) {
    html += `<div style="color:var(--accent-red); font-size:12px; margin-bottom:8px;">※深夜帯のため翌朝の始発時刻で検索しました</div>`;
  }

  let currentTime = new Date(startTime.getTime());

  for(let i=0; i<path.length; i++) {
    const node = path[i];
    const nodeName = stationNames[node];
    
    if(i === 0) {
      html += `<strong>${formatTime(currentTime)} ${nodeName} 発</strong><br>`;
    } else if (i === path.length - 1) {
      html += `<strong>${formatTime(currentTime)} ${nodeName} 着</strong><br>`;
    } else {
      html += `<strong>${formatTime(currentTime)} ${nodeName} 経由</strong><br>`;
    }
    
    if(i < path.length - 1) {
      const nextNode = path[i+1];
      const travelTime = getEdges(node, currentTime, from, to)[nextNode];
      
      let waitTime = 0;
      if (node !== 'home' && node !== 'school' && nextNode !== 'home' && nextNode !== 'school' && !(node === 'sannomiya' && nextNode === 'subway_sannomiya') && !(node === 'subway_sannomiya' && nextNode === 'sannomiya')) {
        waitTime = 4;
      }
      
      let moveType = "乗車";
      if (node === 'home' || nextNode === 'home' || node === 'school' || nextNode === 'school' || (node === 'sannomiya' && nextNode === 'subway_sannomiya') || (node === 'subway_sannomiya' && nextNode === 'sannomiya')) {
        moveType = "徒歩";
        waitTime = 0;
      }
      
      html += `<span style="color:#666; font-size:12px;">↓ ${waitTime > 0 ? `待ち${waitTime}分 + ` : ''}${moveType}${travelTime}分</span><br>`;
      currentTime = addMin(currentTime, travelTime + waitTime);
    }
  }
  html += `<br><span style="font-size:12px; color:#666;">※正しくはジョルダンで調べるじょ！</span>`;
  res.innerHTML = html;
}
