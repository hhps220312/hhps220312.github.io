// 1ポイントあたりの円レート（計算式をそのまま入れています）
const rates = {
  "現金": 1,
  "PayPay": 1 / 100,
  "楽天PAY": 1,
  "TikTok-Lite": 1 / 100, // もし違ったら直してね
  "ポイム": 100 / 11000,
  "トリマ": 190 / 24000,
  "マクロミル": 273 / 300,
  "レシチャレ": 300 / 33000,
  "Uvoice": 100 / 1050
};

// 取引データを保存する配列（ローカルストレージから読み込み）
let transactions = JSON.parse(localStorage.getItem('secret_wallet_data')) || [];

// 画面を更新する関数
function updateDashboard() {
  let totalYen = 0;
  const serviceBalances = {};

  // サービスごとの残高を0で初期化
  Object.keys(rates).forEach(service => {
    serviceBalances[service] = 0;
  });

  // 全ての取引をループして残高を計算
  transactions.forEach(tx => {
    serviceBalances[tx.service] += tx.points;
  });

  // サービスごとのカードHTMLを生成
  const serviceListEl = document.getElementById('service-list');
  serviceListEl.innerHTML = '';

  Object.keys(rates).forEach(service => {
    const points = serviceBalances[service];
    if (points !== 0) {
      const exactYen = points * rates[service];
      totalYen += exactYen; // 総資産にプラス

      // 少数第4位まで表示（整数ならそのまま）
      const displayYen = Number.isInteger(exactYen) ? exactYen : exactYen.toFixed(4);

      serviceListEl.innerHTML += `
        <div class="service-card">
          <h3>${service}</h3>
          <div class="details">
            <strong>${Math.floor(exactYen)} 円</strong><br>
            <span style="font-size: 0.8em; color: #888;">
              ${points} pt (正確には ${displayYen} 円)
            </span>
          </div>
        </div>
      `;
    }
  });

  // 総資産額の表示（小数点以下切り捨て）
  document.getElementById('total-yen').innerText = Math.floor(totalYen).toLocaleString() + ' 円';

  // 履歴リストの更新
  const historyListEl = document.getElementById('history-list');
  historyListEl.innerHTML = '';
  // 最新の履歴を上に表示するために逆順にする
  [...transactions].reverse().forEach(tx => {
    const sign = tx.points > 0 ? '+' : '';
    historyListEl.innerHTML += `
      <li>
        <strong>${tx.service}</strong>: ${sign}${tx.points}pt <br>
        <span style="color: #888; font-size: 0.8em;">${tx.memo}</span>
      </li>
    `;
  });
}

// 登録ボタンが押された時の処理
function addTransaction() {
  const service = document.getElementById('service-select').value;
  const points = parseInt(document.getElementById('point-input').value, 10);
  const memo = document.getElementById('memo-input').value;

  if (isNaN(points)) {
    alert("ポイント数を入力してね！");
    return;
  }

  // 取引データを追加
  transactions.push({
    service: service,
    points: points,
    memo: memo,
    date: new Date().toISOString()
  });

  // ローカルストレージに保存（ブラウザを閉じても消えないようにする）
  localStorage.setItem('secret_wallet_data', JSON.stringify(transactions));

  // フォームを空にする
  document.getElementById('point-input').value = '';
  document.getElementById('memo-input').value = '';

  // 画面を更新
  updateDashboard();
}

// 最初に画面を開いた時の処理
updateDashboard();
