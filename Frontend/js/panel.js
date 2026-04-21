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

const API = "http://localhost:4000/api";

const cargarDashboard = async () => {
  try {
    const gastos = await fetch(`${API}/gastos`).then(r => r.json());
    const productos = await fetch(`${API}/productos`).then(r => r.json());

    
    const totalGastos = gastos.reduce((acc, g) => acc + Number(g.monto), 0);
    document.getElementById("gastos").textContent = "$" + totalGastos;

   
    document.getElementById("productos").textContent = productos.length;

    //SOLO EJEMPLOS
    document.getElementById("ventas").textContent = "$1200";
    document.getElementById("usuarios").textContent = "5";

    // tabla
    const tabla = document.getElementById("tablaDatos");
    tabla.innerHTML = "";

    gastos.slice(0, 5).forEach(g => {
      tabla.innerHTML += `
        <tr>
          <td>${g.descripcion}</td>
          <td>$${g.monto}</td>
          <td>${new Date(g.fecha).toLocaleDateString()}</td>
        </tr>
      `;
    });

  } catch (error) {
    console.error("Error cargando dashboard:", error);
  }
};
cargarDashboard();
lucide.createIcons();