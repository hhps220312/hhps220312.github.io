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

function updateWeatherUI(city, weatherCode, maxTemp, minTemp, precip) {
  const iconMap = {
    0: '☀️', 1: '⛅️', 2: '⛅️', 3: '☁️',
    45: '🌫️', 48: '🌫️', 51: '🌧️', 53: '🌧️', 55: '🌧️',
    56: '🌧️', 57: '🌧️', 61: '☔️', 63: '☔️', 65: '☔️',
    66: '☔️', 67: '☔️', 71: '⛄️', 73: '⛄️', 75: '⛄️',
    77: '⛄️', 80: '🌧️', 81: '🌧️', 82: '🌧️', 95: '⛈️',
    96: '⛈️', 99: '⛈️'
  };
  const icon = iconMap[weatherCode] || '🌤️';
  document.getElementById('weather-icon').textContent = icon;
  document.getElementById('weather-city').textContent = city;
  document.getElementById('weather-info').innerHTML = `${maxTemp}°C / ${minTemp}°C <span style="color:#2196f3; margin-left:4px;">☔️ ${precip}%</span>`;
  document.getElementById('weather-link').href = `https://www.google.com/search?q=${city}+天気`;
}

async function fetchWeatherData(lat, lon, city) {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo`);
    const data = await res.json();
    const cw = data.current_weather;
    const daily = data.daily;
    updateWeatherUI(city, cw.weathercode, Math.round(daily.temperature_2m_max[0]), Math.round(daily.temperature_2m_min[0]), daily.precipitation_probability_max[0]);
  } catch(e) {}
}

function initWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ja`);
        const data = await res.json();
        const city = data.locality || data.city || '現在地';
        fetchWeatherData(lat, lon, city);
      } catch(e) {
        fetchWeatherData(lat, lon, '現在地');
      }
    }, () => {
      fetchWeatherData(34.6431, 134.9976, '明石市');
    });
  } else {
    fetchWeatherData(34.6431, 134.9976, '明石市');
  }
}
initWeather();
