// 🌙 MODO OSCURO
const body = document.body;
const mode = document.getElementById('btn_modo');

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


// 🚀 TODO EN UN SOLO DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {

  const usuario = localStorage.getItem("usuario");
  const rol = localStorage.getItem("rol");

  // 🔐 PROTECCIÓN
  if (!usuario) {
    window.location.href = "/login";
    return;
  }

  // 🔥 TRAER DATOS DEL BACKEND
  try {
    const res = await fetch(`http://localhost:4000/api/conf?usuario=${usuario}`);
    const data = await res.json();

    if (data.ok) {
      document.getElementById("usuario").textContent = data.usuario;
      document.getElementById("rol").textContent = data.rol;
    } else {
      window.location.href = "/login";
    }

  } catch (error) {
    console.error("Error:", error);
  }


  // 🎯 CONTROL POR ROL
  if (rol === "administrador") {

    document.getElementById("adminPanel").style.display = "block";

    // 🔥 cargar usuarios
    const res = await fetch("http://localhost:4000/api/usuarios");
    const usuarios = await res.json();

    const tabla = document.getElementById("tablaUsuarios");

    tabla.innerHTML = "";

    usuarios.forEach(user => {
      tabla.innerHTML += `
        <tr>
          <td>${user.usuario}</td>
          <td>${user.rol}</td>
          <td>
            <button onclick="editar('${user.usuario}')">Editar</button>
            <button onclick="eliminar('${user.usuario}')">Eliminar</button>
          </td>
        </tr>
      `;
    });

  } else {

    document.getElementById("userPanel").style.display = "block";

  }


  // 🔴 CERRAR SESIÓN
  const btnCerrar = document.getElementById("cerrar");

  if (btnCerrar) {
    btnCerrar.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "/login";
    });
  }

});


// 🔴 ELIMINAR
function eliminar(usuario) {
  if (confirm("¿Eliminar usuario?")) {

    fetch(`http://localhost:4000/api/usuarios/${usuario}`, {
      method: "DELETE"
    }).then(() => location.reload());

  }
}


// 🟡 EDITAR (puedes mejorar luego con modal)
function editar(usuario) {
  alert("Editar usuario: " + usuario);
}


// 🔐 CAMBIAR CONTRASEÑA
document.getElementById("btnCambiarPass")?.addEventListener("click", async () => {

  const nueva = document.getElementById("nuevaPass").value;
  const usuario = localStorage.getItem("usuario");

  await fetch("http://localhost:4000/api/cambiar-pass", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ usuario, nueva })
  });

  alert("Contraseña actualizada");

});