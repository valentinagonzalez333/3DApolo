function mostrarToast(mensaje, tipo = "error") {
  let contenedor = document.getElementById("toast-contenedor");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "toast-contenedor";
    document.body.appendChild(contenedor);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;

  const iconos = { error: "✕", success: "✓", warning: "⚠", info: "ℹ" };

  toast.innerHTML = `
    <span class="toast-icono">${iconos[tipo] || "ℹ"}</span>
    <span class="toast-mensaje">${mensaje}</span>
    <button class="toast-cerrar" onclick="this.parentElement.remove()">×</button>
  `;

  contenedor.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast-visible"));

  setTimeout(() => {
    toast.classList.remove("toast-visible");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ── Limpiar al cargar ─────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("usuario").value  = "";
  document.getElementById("password").value = "";

  // El proyecto usa sessionStorage — limpiar solo eso al hacer login
  sessionStorage.clear();
});

// ── Formulario ────────────────────────────────────────────────────────────────
document.getElementById("login-forma").addEventListener("submit", async (e) => {
  e.preventDefault();

  const mensajeError = document.querySelector(".error");
  mensajeError?.classList.add("escondido");

  const user     = document.getElementById("usuario").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!user || !password) {
    mostrarToast("Por favor completa todos los campos", "warning");
    return;
  }

  const boton = document.querySelector("#login-forma button[type='submit']");
  boton.disabled = true;

  try {
   const respt = await fetch("https://3dapolo-production.up.railway.app/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ usuario, password })
});

    const resJson = await respt.json().catch(() => null);

    if (!respt.ok || !resJson) {
      mostrarToast("Error del servidor, intenta de nuevo", "error");
      return;
    }

    if (resJson.ok) {
      // Guardar en sessionStorage (consistente con el resto del proyecto)
      sessionStorage.setItem("usuario",       resJson.usuario);
      sessionStorage.setItem("rol",           resJson.rol);
      sessionStorage.setItem("id_usuario",    resJson.id_usuario);
      sessionStorage.setItem("ultimo_acceso", new Date().toISOString());

      mostrarToast(`Bienvenido, ${resJson.usuario}`, "success");

      setTimeout(() => { window.location.href = "/inicio"; }, 800);

    } else {
      mostrarToast(resJson.msg || "Usuario o contraseña incorrectos", "error");
    }

  } catch (error) {
    console.error("Error en login:", error);
    mostrarToast("Error de conexión con el servidor", "error");
  } finally {
    boton.disabled = false;
  }
});