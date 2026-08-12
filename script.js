// ガス（GAS）のURL
const GAS_URL = "https://script.google.com/macros/s/AKfycbw_-V9SlwCDibw7KEwNOpcNgfxIr0yydQZHFofet31fNlenf6yf2EIlip9GMOUa_bEqmg/exec";

// 打刻ボタンの機能
function recordWake() { fetch(GAS_URL + "?action=wake"); }
function recordSleep() { fetch(GAS_URL + "?action=sleep"); }
function recordGoSchool() { fetch(GAS_URL + "?action=goSchool"); }
function recordLeaveSchool() { fetch(GAS_URL + "?action=leaveSchool"); }

// 時計を動かす機能
function updateClock() {
  const now = new Date();
  
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  const dateTimeString = `${year}年${month}月${date}日 ${hours}:${minutes}`;
  const secondsString = `${seconds}秒`;
  
  document.getElementById('clock').textContent = dateTimeString;
  document.getElementById('seconds').textContent = secondsString;
}

// 1秒ごとに時計を更新
setInterval(updateClock, 1000);
updateClock();
