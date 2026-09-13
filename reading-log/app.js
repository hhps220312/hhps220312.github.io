// Firebaseの設定と初期化
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDM6DkbrZS1AncdaSxLzQdQVEitn8d3U9w",
  authDomain: "reading-log-5cde5.firebaseapp.com",
  projectId: "reading-log-5cde5",
  storageBucket: "reading-log-5cde5.firebasestorage.app",
  messagingSenderId: "457857942220",
  appId: "1:457857942220:web:3d8e62253f44191771f869",
  measurementId: "G-8L4HHPXGHH"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

let allBooks = []; // 取得した本のデータを保持

// ==========================================
// UI タブの切り替え
// ==========================================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    e.target.classList.add('active');
    document.getElementById(e.target.dataset.target).classList.add('active');
    
    if(e.target.dataset.target === 'book-list-section') {
      loadBooks();
    }
  });
});

// ==========================================
// フォームの動的追加機能
// ==========================================
document.getElementById('add-contributor-btn').addEventListener('click', () => {
  const container = document.getElementById('contributors-container');
  const div = document.createElement('div');
  div.className = 'contributor-row';
  div.innerHTML = `
    <input type="text" class="contributor-role" placeholder="役職 (例: 絵, 訳)">
    <input type="text" class="contributor-name" placeholder="名前">
    <button type="button" class="remove-btn secondary-btn">✕</button>
  `;
  container.appendChild(div);
  
  div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
});

document.getElementById('add-progress-btn').addEventListener('click', () => {
  const container = document.getElementById('progress-container');
  const div = document.createElement('div');
  div.className = 'progress-row';
  div.innerHTML = `
    <input type="date" class="prog-date">
    <input type="text" class="prog-page" placeholder="ページ/章">
    <input type="text" class="prog-note" placeholder="感想・メモ" style="flex:2;">
    <button type="button" class="remove-btn secondary-btn">✕</button>
  `;
  container.appendChild(div);
  
  div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
});

// ==========================================
// データベースへの登録処理
// ==========================================
document.getElementById('add-book-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');
  btn.textContent = "登録中...";
  btn.disabled = true;

  try {
    // 関係者データの収集
    const contributors = [];
    document.querySelectorAll('.contributor-row').forEach(row => {
      const role = row.querySelector('.contributor-role').value;
      const name = row.querySelector('.contributor-name').value;
      if (name) contributors.push({ role, name });
    });

    // 途中記録データの収集
    const progressLogs = [];
    document.querySelectorAll('.progress-row').forEach(row => {
      const date = row.querySelector('.prog-date').value;
      const page = row.querySelector('.prog-page').value;
      const note = row.querySelector('.prog-note').value;
      if (date || note) progressLogs.push({ date, page, note });
    });

    // 評価の取得
    const ratingObj = document.querySelector('input[name="rating"]:checked');
    const rating = ratingObj ? parseInt(ratingObj.value) : 0;

    const bookData = {
      status: document.querySelector('input[name="book-status"]:checked').value,
      title: document.getElementById('title').value,
      coverUrl: document.getElementById('cover-url').value,
      contributors: contributors,
      summary: document.getElementById('summary').value,
      acquisition: {
        type: document.getElementById('acq-type').value,
        place: document.getElementById('acq-place').value,
        date: document.getElementById('acq-date').value,
      },
      readingDates: {
        start: document.getElementById('start-date').value,
        end: document.getElementById('end-date').value,
      },
      progressLogs: progressLogs,
      finalReview: document.getElementById('final-review').value,
      rating: rating,
      createdAt: new Date()
    };

    // Firestoreに保存
    await addDoc(collection(db, "books"), bookData);
    
    alert("本を登録しました！");
    document.getElementById('add-book-form').reset();
    document.getElementById('progress-container').innerHTML = ''; // 途中記録クリア
    
    // 本棚タブに戻る
    document.querySelector('[data-target="book-list-section"]').click();

  } catch (error) {
    console.error("Error adding document: ", error);
    alert("エラーが発生しました。");
  } finally {
    btn.textContent = "登録する";
    btn.disabled = false;
  }
});

// ==========================================
// 本棚の表示・検索処理
// ==========================================
async function loadBooks() {
  const container = document.getElementById('books-container');
  container.innerHTML = '<p>読み込み中...</p>';
  
  try {
    const q = query(collection(db, "books"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    allBooks = [];
    querySnapshot.forEach((doc) => {
      allBooks.push({ id: doc.id, ...doc.data() });
    });
    
    renderBooks(allBooks);
  } catch (error) {
    console.error("Error getting documents: ", error);
    container.innerHTML = '<p>データの取得に失敗しました。</p>';
  }
}

function renderBooks(booksToRender) {
  const container = document.getElementById('books-container');
  container.innerHTML = '';
  
  if (booksToRender.length === 0) {
    container.innerHTML = '<p>本が見つかりません。</p>';
    return;
  }

  booksToRender.forEach(book => {
    const authorObj = book.contributors && book.contributors.length > 0 ? book.contributors[0].name : "不明";
    const coverHtml = book.coverUrl 
      ? `<img src="${book.coverUrl}" alt="表紙" class="book-cover">`
      : `<div class="book-cover">No Image</div>`;
      
    let stars = "";
    for(let i=0; i<book.rating; i++) stars += "★";

    const card = document.createElement('div');
    card.className = 'book-card';
    card.innerHTML = `
      ${coverHtml}
      <div class="book-info">
        <div class="book-title">${book.title}</div>
        <div class="book-author">${authorObj}</div>
        <div>
          <span class="book-badge">${book.status === 'wish' ? '欲しい本' : '読書記録'}</span>
          <span style="color:#f1c40f;">${stars}</span>
        </div>
      </div>
    `;
    
    // カードクリックで詳細（カレンダー含む）表示
    card.addEventListener('click', () => showBookDetails(book));
    container.appendChild(card);
  });
}

// 検索・フィルター機能
document.getElementById('search-btn').addEventListener('click', executeSearch);
document.getElementById('search-input').addEventListener('keyup', (e) => {
  if(e.key === 'Enter') executeSearch();
});

document.querySelectorAll('input[name="status-filter"]').forEach(radio => {
  radio.addEventListener('change', executeSearch);
});

function executeSearch() {
  const keyword = document.getElementById('search-input').value.toLowerCase();
  const statusFilter = document.querySelector('input[name="status-filter"]:checked').value;
  
  const filtered = allBooks.filter(book => {
    const matchStatus = statusFilter === 'all' || book.status === statusFilter;
    
    const authorNames = book.contributors ? book.contributors.map(c => c.name).join(' ') : "";
    const matchKeyword = book.title.toLowerCase().includes(keyword) || authorNames.toLowerCase().includes(keyword);
    
    return matchStatus && matchKeyword;
  });
  
  renderBooks(filtered);
}

// ==========================================
// 詳細・カレンダーモーダルの表示
// ==========================================
function showBookDetails(book) {
  const modal = document.getElementById('calendar-modal');
  const detailsContainer = document.getElementById('modal-book-details');
  
  // 読書日数の計算
  let daysTakenText = "未計算";
  if (book.readingDates && book.readingDates.start && book.readingDates.end) {
    const start = new Date(book.readingDates.start);
    const end = new Date(book.readingDates.end);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 開始日も含めるため+1
    daysTakenText = `${diffDays}日かかりました`;
  }
  
  // 読んだ日を抽出 (開始日、終了日、途中記録の日付)
  const readDates = new Set();
  if(book.readingDates.start) readDates.add(book.readingDates.start);
  if(book.readingDates.end) readDates.add(book.readingDates.end);
  if(book.progressLogs) {
    book.progressLogs.forEach(log => {
      if(log.date) readDates.add(log.date);
    });
  }

  // 簡易カレンダー生成（読んだ日をリスト化して視覚化）
  let calendarHtml = '<div class="calendar-view">';
  // 本来は月のカレンダーを作りますが、今回は読んだ記録がある日をハイライトする簡易版です
  const sortedDates = Array.from(readDates).sort();
  sortedDates.forEach(dateStr => {
    calendarHtml += `<div class="cal-day read" title="読んだ日">${dateStr.slice(5)}</div>`;
  });
  calendarHtml += '</div>';

  detailsContainer.innerHTML = `
    <h3>${book.title}</h3>
    <p><strong>入手:</strong> ${book.acquisition?.type || ''} (${book.acquisition?.place || ''}) - ${book.acquisition?.date || ''}</p>
    <p><strong>読書期間:</strong> ${book.readingDates?.start || '?'} 〜 ${book.readingDates?.end || '?'} (${daysTakenText})</p>
    <hr style="margin: 10px 0;">
    <h4>あらすじ</h4>
    <p>${book.summary || 'なし'}</p>
    <hr style="margin: 10px 0;">
    <h4>読んだ日</h4>
    ${sortedDates.length > 0 ? calendarHtml : '<p>記録がありません</p>'}
    <hr style="margin: 10px 0;">
    <h4>最終的な感想</h4>
    <p>${book.finalReview || 'なし'}</p>
  `;
  
  modal.style.display = "block";
}

// モーダルを閉じる処理
document.querySelector('.close-modal').addEventListener('click', () => {
  document.getElementById('calendar-modal').style.display = "none";
});
window.addEventListener('click', (e) => {
  if (e.target === document.getElementById('calendar-modal')) {
    document.getElementById('calendar-modal').style.display = "none";
  }
});

// 初期ロード
loadBooks();
