import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

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

function getDayOfWeek(dateString) {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const d = new Date(dateString);
  return Number.isNaN(d.getTime()) ? '' : `(${days[d.getDay()]})`;
}

let allTodos = [];

const q = query(collection(db, "todos"), orderBy("createdAt"));
onSnapshot(q, (snapshot) => {
  allTodos = [];
  snapshot.forEach((docSnap) => {
    allTodos.push({ id: docSnap.id, ...docSnap.data() });
  });
  renderTodos();
});

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
  const todo = allTodos.find(t => t.id === id);
  if(todo) {
    await updateDoc(doc(db, "todos", id), { completed: !todo.completed });
  }
}

window.deleteTodo = async function(id) {
  await deleteDoc(doc(db, "todos", id));
}
