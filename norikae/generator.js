import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

// はじめシステムのFirebaseを使います（ログイン不要設定済み）
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

// 追加してほしいと要望があった区間を含む徒歩区間リスト
const walkSections = [
  { id: "home_chuo", name: "自宅 〜 中央センター前" },
  { id: "home_higashi", name: "自宅 〜 高丘東小学校前" },
  { id: "home_nishi", name: "自宅 〜 高丘西口" },
  { id: "okubo_bus_jr", name: "大久保駅バス停 〜 JR大久保駅" },
  { id: "sannomiya_subway", name: "JR三ノ宮 〜 地下鉄三宮駅前" },
  { id: "nozaki_school", name: "野崎通5丁目 〜 学校" },
  { id: "aotani_school", name: "青谷 〜 学校" },
  { id: "nagao_akashi", name: "長尾先生 〜 明石" } // 追加要望分
];

// 初期化処理
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('walk-times-container');
  walkSections.forEach(sec => {
    container.innerHTML += `
      <div style="margin-bottom: 5px;">
        <span style="display:inline-block; width:220px;">${sec.name}</span>
        <input type="number" id="walk_${sec.id}" class="time-input" placeholder="分"> 分
      </div>
    `;
  });
});

// --- ここから先の処理（保存やコード生成ロジック）は、文字数制限のため一旦ここまでとします ---
// ※ window に関数を紐づけて HTML から呼べるようにする準備だけしておきます
window.saveWalkTimes = async function() { alert("徒歩時間の保存機能（準備中）"); };
window.registerLine = async function() { alert("路線の登録機能（準備中）"); };
window.loadLineStops = async function() { alert("停車駅読み込み機能（準備中）"); };
window.saveTimetableEntry = async function() { alert("時刻の保存機能（準備中）"); };
window.generateCode = async function() { alert("コード生成機能（準備中）"); };
