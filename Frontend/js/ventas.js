const body = document.body;
const mode = document.getElementById('btn_modo');

// cargar modo guardado
const guardado = localStorage.getItem('mode');

if (guardado === 'dark') {
  body.classList.add('dark-mode');
}

mode.addEventListener('click', () => {
  const isDark = body.classList.toggle('dark-mode');
  localStorage.setItem('mode', isDark ? 'dark' : 'light');
});