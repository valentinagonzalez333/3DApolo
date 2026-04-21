const body = document.body;
const mode = document.getElementById('btn_modo');

// cargar modo guardado
const guardado = localStorage.getItem('mode');

if (guardado === 'dark') {
  body.classList.add('dark-mode');
  mode.checked = true; 
}

mode.addEventListener('change', () => {
  if (mode.checked) {
    body.classList.add('dark-mode');
    localStorage.setItem('mode', 'dark');
  } else {
    body.classList.remove('dark-mode');
    localStorage.setItem('mode', 'light');
  }
});
