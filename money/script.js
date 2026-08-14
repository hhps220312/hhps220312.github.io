// --- 口座の設定とレート ---
const accountSettings = {
    '現金': { type: 'yen', rate: 1 },
    'PayPay': { type: 'yen', rate: 1 },
    '楽天ペイ': { type: 'yen', rate: 1 },
    'TikTok-Lite': { type: 'point', rate: 1 / 100 },      // 100pt = 1円
    'ポイム': { type: 'point', rate: 100 / 11000 },       // 11000pt = 100円
    'トリマ': { type: 'point', rate: 190 / 24000 },       // 24000pt = 190円
    'マクロミル': { type: 'point', rate: 273 / 300 },     // 300pt = 273円
    'レシチャレ': { type: 'point', rate: 300 / 33000 },   // 33000pt = 300円
    'Uvoice': { type: 'point', rate: 100 / 1050 }        // 1050pt = 100円
};

// --- 初期データ（画像に合わせたダミーデータ） ---
let transactions = [
    { id: 1, type: 'deposit', year: 2026, month: 8, day: 1, amount: 3000, account: 'PayPay', memo: 'TikTok-Liteから送金' },
    { id: 2, type: 'withdraw', year: 2026, month: 8, day: 1, amount: 900, account: '現金', memo: 'アイスを買った' },
    { id: 3, type: 'deposit', year: 2026, month: 8, day: 3, amount: 3000, account: 'PayPay', memo: 'おじいちゃんからもらった' }
];

let currentTransactionType = 'deposit'; // 'deposit' or 'withdraw'

// --- 初期化処理 ---
document.addEventListener('DOMContentLoaded', () => {
    initDateSelects();
    initAccountSelect();
    renderAll();

    // モーダル背景クリックで閉じる
    document.getElementById('modal-overlay').addEventListener('click', function(e) {
        if(e.target === this) closeModal();
    });

    // お預入れ/お引出しトグル
    document.getElementById('btn-deposit').addEventListener('click', () => setTransactionType('deposit'));
    document.getElementById('btn-withdraw').addEventListener('click', () => setTransactionType('withdraw'));

    // 口座変更時に単位を変更
    document.getElementById('input-account').addEventListener('change', updateUnitLabel);

    // 月変更時に履歴を再描画
    document.getElementById('history-month-select').addEventListener('change', renderHistory);

    // フォーム送信
    document.getElementById('transaction-form').addEventListener('submit', handleFormSubmit);
});

// --- プルダウンの初期化 ---
function initDateSelects() {
    const now = new Date();
    // 年
    const yearSelect = document.getElementById('input-year');
    for (let y = 2020; y <= 2030; y++) {
        yearSelect.add(new Option(y, y));
    }
    yearSelect.value = now.getFullYear();

    // 月
    const monthSelect = document.getElementById('input-month');
    for (let m = 1; m <= 12; m++) {
        const val = m.toString().padStart(2, '0');
        monthSelect.add(new Option(val, m));
    }
    monthSelect.value = now.getMonth() + 1;

    // 日
    const daySelect = document.getElementById('input-day');
    for (let d = 1; d <= 31; d++) {
        const val = d.toString().padStart(2, '0');
        daySelect.add(new Option(val, d));
    }
    daySelect.value = now.getDate();
}

function initAccountSelect() {
    const select = document.getElementById('input-account');
    for (let accName in accountSettings) {
        select.add(new Option(accName, accName));
    }
    updateUnitLabel();
}

function updateUnitLabel() {
    const account = document.getElementById('input-account').value;
    const isYen = accountSettings[account].type === 'yen';
    document.getElementById('unit-label').innerText = isYen ? '円' : 'Pt';
}

function setTransactionType(type) {
    currentTransactionType = type;
    const btnDep = document.getElementById('btn-deposit');
    const btnWith = document.getElementById('btn-withdraw');
    
    if (type === 'deposit') {
        btnDep.classList.add('active');
        btnWith.classList.remove('active');
    } else {
        btnDep.classList.remove('active');
        btnWith.classList.add('active');
    }
}

// --- 残高計算・描画処理 ---
function getAccountBalances() {
    let balances = {};
    for (let accName in accountSettings) balances[accName] = 0;

    transactions.forEach(t => {
        if (!balances[t.account]) return;
        if (t.type === 'deposit') {
            balances[t.account] += t.amount;
        } else {
            balances[t.account] -= t.amount;
        }
    });
    return balances;
}

function renderAll() {
    renderBalances();
    updateHistoryMonthDropdown();
    renderHistory();
}

function renderBalances() {
    const balances = getAccountBalances();
    const grid = document.getElementById('account-grid');
    grid.innerHTML = '';
    
    let totalYen = 0;

    for (let accName in accountSettings) {
        const config = accountSettings[accName];
        const rawBalance = balances[accName];
        
        // 円換算
        const exactYen = rawBalance * config.rate;
        totalYen += exactYen;

        // 表示用の文字列作成（整数部のみ）
        const displayVal = Math.floor(rawBalance).toLocaleString();
        const unit = config.type === 'yen' ? '円' : 'Pt';

        // カード生成
        const card = document.createElement('div');
        card.className = 'account-card';
        card.innerHTML = `
            <div class="account-name">${accName}</div>
            <div class="account-amount">${displayVal}${unit}</div>
        `;
        
        // クリックでモーダル表示
        card.addEventListener('click', () => openModal(accName, rawBalance, exactYen, config.type));
        grid.appendChild(card);
    }

    // 合計残高（小数点切り捨て）
    document.getElementById('total-balance-amount').innerText = Math.floor(totalYen).toLocaleString();
}

// --- 履歴の描画 ---
function updateHistoryMonthDropdown() {
    const select = document.getElementById('history-month-select');
    const currentVal = select.value;
    select.innerHTML = '';

    // 取引から存在する「年-月」を抽出
    let months = new Set();
    transactions.forEach(t => {
        months.add(`${t.year}-${t.month}`);
    });
    
    // ソート（新しい順）
    let sortedMonths = Array.from(months).sort((a, b) => {
        const [ya, ma] = a.split('-').map(Number);
        const [yb, mb] = b.split('-').map(Number);
        if (ya !== yb) return yb - ya;
        return mb - ma;
    });

    if (sortedMonths.length === 0) {
        // データがない場合は今月
        const now = new Date();
        sortedMonths.push(`${now.getFullYear()}-${now.getMonth() + 1}`);
    }

    sortedMonths.forEach(m => {
        const [y, mm] = m.split('-');
        const text = `▼${y}年${mm}月`;
        select.add(new Option(text, m));
    });

    if (currentVal && Array.from(select.options).some(opt => opt.value === currentVal)) {
        select.value = currentVal;
    }
}

function renderHistory() {
    const select = document.getElementById('history-month-select');
    const selectedMonthKey = select.value;
    if (!selectedMonthKey) return;
    
    const [selYear, selMonth] = selectedMonthKey.split('-').map(Number);
    document.getElementById('history-current-month-display').innerText = `${selYear}年${selMonth}月`;

    const tbody = document.getElementById('history-table');
    tbody.innerHTML = '';

    // 選択された月のデータを抽出し、日付け順にソート
    const filtered = transactions.filter(t => t.year === selYear && t.month === selMonth)
                                 .sort((a, b) => a.day - b.day);

    filtered.forEach(t => {
        const tr = document.createElement('tr');
        
        // ラベル
        const typeText = t.type === 'deposit' ? 'お預入れ' : 'お引出し';
        const typeClass = t.type === 'deposit' ? 'badge-deposit' : 'badge-withdraw';
        
        // 金額表記
        const config = accountSettings[t.account];
        const unit = config.type === 'yen' ? '円' : 'Pt';
        const sign = t.type === 'deposit' ? '' : '-';
        const amountStr = `${sign}${t.amount.toLocaleString()}${unit}`;

        const dayStr = t.day.toString().padStart(2, '0') + '日';

        tr.innerHTML = `
            <td><span class="badge ${typeClass}">${typeText}</span></td>
            <td>${dayStr}</td>
            <td>${amountStr}</td>
            <td>${t.account}</td>
            <td>${t.memo}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- フォーム送信処理 ---
function handleFormSubmit(e) {
    e.preventDefault();
    
    const year = parseInt(document.getElementById('input-year').value);
    const month = parseInt(document.getElementById('input-month').value);
    const day = parseInt(document.getElementById('input-day').value);
    const account = document.getElementById('input-account').value;
    const amount = parseInt(document.getElementById('input-amount').value);
    const memo = document.getElementById('input-memo').value;

    if (isNaN(amount) || amount <= 0) {
        alert('正しい金額を入力してください');
        return;
    }

    const newTx = {
        id: Date.now(),
        type: currentTransactionType,
        year, month, day,
        account,
        amount,
        memo
    };

    transactions.push(newTx);
    
    // フォームリセット（金額とメモのみ）
    document.getElementById('input-amount').value = '';
    document.getElementById('input-memo').value = '';

    renderAll();
}

// --- モーダル処理 ---
function openModal(accountName, rawPoints, exactYen, type) {
    document.getElementById('modal-title').innerText = accountName;
    
    const unit = type === 'yen' ? '円' : 'Pt';
    document.getElementById('modal-pts').innerText = rawPoints.toLocaleString() + ' ' + unit;
    
    // 円の正確な値を表示（小数点第3位まで）
    document.getElementById('modal-yen').innerText = exactYen.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
    }) + ' 円';

    document.getElementById('modal-overlay').classList.add('show');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('show');
}
