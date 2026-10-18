import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc, serverTimestamp, query, orderBy, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";
// ▼追加：認証用のモジュールを読み込む
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

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
// ▼追加：認証の初期化
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

function getDayOfWeek(dateString) {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const d = new Date(dateString);
  return Number.isNaN(d.getTime()) ? '' : `(${days[d.getDay()]})`;
}

let allTodos = [];
let unsubscribeTodos = null; // リスナー解除用

// ▼変更：ログイン状態を監視して、ログインしている時だけデータを読み込むようにする
onAuthStateChanged(auth, (user) => {
  if (user) {
    // ログイン成功！データを読み込む
    console.log("ログイン中:", user.email);
    loadData();
  } else {
    // ログインしていない場合、ポップアップを表示してログインを促す
    console.log("未ログイン。ログイン画面を表示します。");
    signInWithPopup(auth, provider).catch((error) => {
      console.error("ログインエラー:", error);
      alert("データベースにアクセスするにはログインが必要です。");
    });
  }
});

// ▼変更：データ読み込み処理を関数にまとめる
function loadData() {
  const q = query(collection(db, "todos"), orderBy("createdAt"));
  unsubscribeTodos = onSnapshot(q, (snapshot) => {
    allTodos = [];
    snapshot.forEach((docSnap) => {
      allTodos.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderTodos();
  }, (error) => {
    console.error("データ読み込みエラー（権限がない可能性があります）:", error);
  });
  
  // 今日の掲示板データもロードする
  if (window.updateBulletinUI) {
    window.updateBulletinUI();
  }
}

function renderTodos() {
  const container = document.getElementById('todo-list-container');
  if(!container) return;
  container.innerHTML = '';
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const currentDay = today.getDay();
  const daysToSunday = currentDay === 0 ? 0 : 7 - currentDay;
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + daysToSunday);

  const groups = {
    today: { title: '今日まで', items: [] },
    tomorrow: { title: '明日まで', items: [] },
    thisWeek: { title: '今週中', items: [] },
    nextWeek: { title: '来週以降・未定', items: [] }
  };

  allTodos.forEach((todo) => {
    if(!todo.date) {
      groups.nextWeek.items.push(todo);
      return;
    }
    const d = new Date(todo.date);
    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if(dateOnly <= today) {
      groups.today.items.push(todo);
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
      groups.tomorrow.items.push(todo);
    } else if (dateOnly <= endOfWeek) {
      groups.thisWeek.items.push(todo);
    } else {
      groups.nextWeek.items.push(todo);
    }
  });

  for (const key in groups) {
    if (groups[key].items.length > 0) {
      groups[key].items.sort((a, b) => new Date(a.date || '9999-12-31') - new Date(b.date || '9999-12-31'));
      
      const header = document.createElement('div');
      header.className = 'todo-category-title';
      header.textContent = groups[key].title;
      container.appendChild(header);

      groups[key].items.forEach(todo => {
        const div = document.createElement('div');
        div.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        div.setAttribute('data-subject', todo.subject);
        
        const rawDate = new Date(todo.date);
        const dateStr = Number.isNaN(rawDate.getTime()) ? '' : `${rawDate.getMonth()+1}/${rawDate.getDate()}${getDayOfWeek(todo.date)}`;
        
        div.innerHTML = `
          <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="window.toggleTodo('${todo.id}')">
          <div class="todo-subject">${todo.subject}</div>
          <div class="todo-text">
            ${dateStr ? `<span class="todo-date-inline">${dateStr}</span><br>` : ''}${todo.text}
          </div>
          <button class="todo-del" onclick="window.deleteTodo('${todo.id}')">×</button>
        `;
        container.appendChild(div);
      });
    }
  }
}

window.addTodo = async function() {
  // 未ログイン時は処理しない
  if (!auth.currentUser) { alert("ログインが必要です"); return; }

  const date = document.getElementById('todo-date').value;
  const subject = document.getElementById('todo-subject').value;
  const text = document.getElementById('todo-text').value;
  
  if(!text) return;
  
  await addDoc(collection(db, "todos"), { 
    date: date, 
    subject: subject, 
    text: text, 
    completed: false,
    createdAt: serverTimestamp()
  });
  
  document.getElementById('todo-text').value = '';
}

window.toggleTodo = async function(id) {
  if (!auth.currentUser) return;
  const todo = allTodos.find(t => t.id === id);
  if(todo) {
    await updateDoc(doc(db, "todos", id), { completed: !todo.completed });
  }
}

window.deleteTodo = async function(id) {
  if (!auth.currentUser) return;
  await deleteDoc(doc(db, "todos", id));
}

window.loadBulletin = async function(dateStr) {
  // 未ログイン時は処理しない
  if (!auth.currentUser) return;

  const textarea = document.getElementById('bulletin-textarea');
  if(!textarea) return;
  textarea.value = '読み込み中...';
  try {
    const docRef = doc(db, "bulletinBoards", dateStr);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      textarea.value = docSnap.data().text || '';
    } else {
      textarea.value = '';
    }
  } catch(e) {
    console.error("掲示板読み込みエラー:", e);
    textarea.value = '';
  }
};

window.saveBulletin = async function(dateStr, text) {
  if (!auth.currentUser) { alert("ログインが必要です"); return; }
  try {
    await setDoc(doc(db, "bulletinBoards", dateStr), { text: text }, { merge: true });
  } catch(e) {
    console.error("保存失敗", e);
    alert("保存に失敗しました。権限がありません。");
  }
};
