window.openModal = function(element) {
  const imgUrl = element.querySelector('.slide-img').src;
  const captionText = element.querySelector('.slide-caption').textContent;
  document.getElementById('modal-img').src = imgUrl;
  document.getElementById('modal-caption').textContent = captionText;
  document.getElementById('gallery-modal').style.display = 'flex';
}

window.closeModal = function(event) {
  if (event.target.id === 'gallery-modal' || event.target.className === 'modal-close') {
    document.getElementById('gallery-modal').style.display = 'none';
  }
}

window.scrollToSections = function(ids) {
  let topY = Infinity;
  const yOffset = -20;
  
  ids.forEach(id => {
    const el = document.getElementById(id);
    if(el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      if (y < topY) topY = y;
      
      el.classList.add('highlight');
      setTimeout(() => {
        el.classList.remove('highlight');
      }, 800);
    }
  });

  if (topY !== Infinity) {
    window.scrollTo({top: topY, behavior: 'smooth'});
  }
}

const GAS_URL = "https://script.google.com/macros/s/AKfycbw_-V9SlwCDibw7KEwNOpcNgfxIr0yydQZHFofet31fNlenf6yf2EIlip9GMOUa_bEqmg/exec";

window.recordWake = function() { fetch(GAS_URL + "?action=wake"); }
window.recordSleep = function() { fetch(GAS_URL + "?action=sleep"); }
window.recordGoSchool = function() { fetch(GAS_URL + "?action=goSchool"); }
window.recordLeaveSchool = function() { fetch(GAS_URL + "?action=leaveSchool"); }

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

document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16);
  const transitTimeInput = document.getElementById('transit-time');
  if(transitTimeInput) {
    transitTimeInput.value = localISOTime;
  }
});

let slideIndex = 0;
const slides = document.querySelectorAll('.slide-item');
let slideInterval;

function showSlide(n) {
  slides.forEach(s => s.classList.remove('active'));
  slideIndex = (n + slides.length) % slides.length;
  if(slides[slideIndex]) {
    slides[slideIndex].classList.add('active');
  }
}

window.changeSlide = function(n) {
  clearInterval(slideInterval);
  showSlide(slideIndex + n);
  startSlideShow();
}

function startSlideShow() {
  if(slides.length > 0) {
    slideInterval = setInterval(() => {
      showSlide(slideIndex + 1);
    }, 4000);
  }
}
startSlideShow();
