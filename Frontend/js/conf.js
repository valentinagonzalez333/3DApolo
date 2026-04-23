// ── Constante base API (relativa, funciona en localhost Y en Railway/Vercel) ──
const API = "/api";

// ── Auth helper ───────────────────────────────────────────────────────────────
const getHeaders = () => ({
  "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
  "Content-Type": "application/json"
});

async function verificarSesion() {
  try {
    const res = await fetch(`${API}/me`, { headers: getHeaders() });
    if (!res.ok) { window.location.href = "/login"; return false; }
    return true;
  } catch {
    window.location.href = "/login";
    return false;
  }
}

// ── Modo oscuro ───────────────────────────────────────────────────────────────
const body = document.body;
const modeToggle = document.getElementById("btn_modo");

if (localStorage.getItem("mode") === "dark") body.classList.add("dark-mode");

modeToggle?.addEventListener("change", () => {
  const isDark = body.classList.toggle("dark-mode");
  localStorage.setItem("mode", isDark ? "dark" : "light");
});

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const ok = await verificarSesion();
  if (!ok) return;

  const miId = sessionStorage.getItem("id_usuario");
  const rol  = sessionStorage.getItem("rol");

  actualizarInterfazDerecha();

  if (rol?.toLowerCase() === "administrador") {
    document.getElementById("adminPanel").style.display = "block";
    cargarUsuarios();
    cargarProveedores();
    cargarCategorias();
  } else {
    document.getElementById("userPanel").style.display = "block";
    cargarPerfil();
  }

  document.getElementById("cerrar")?.addEventListener("click", async () => {
    sessionStorage.clear();
    await fetch(`${API}/logout`, { method: "POST", headers: getHeaders() }).catch(() => {});
    window.location.href = "/login";
  });

  document.getElementById("btnEditarPerfil")?.addEventListener("click", () => {
    window.prepararEdicion(miId);
  });
});

// ── USUARIO: abrir modal nuevo ────────────────────────────────────────────────
document.getElementById("agregarUser")?.addEventListener("click", () => {
  document.getElementById("id_usuario").value       = "";
  document.getElementById("nombre").value           = "";
  document.getElementById("correo").value           = "";
  document.getElementById("usuarioInput").value     = "";
  document.getElementById("rolInput").value         = "cajero";
  document.getElementById("estado").value           = "1";
  document.getElementById("modalTitle").textContent = "Nuevo Usuario";

  document.getElementById("seccionContrasena").innerHTML = `
    <div class="form-group">
      <input type="password" id="contrasena" placeholder="Contraseña">
    </div>
    <div class="form-group">
      <input type="password" id="confirmarContrasena" placeholder="Confirmar contraseña">
    </div>`;

  document.getElementById("modalUser").classList.remove("hidden");
});

// ── USUARIO: guardar ──────────────────────────────────────────────────────────
document.getElementById("guardarUser")?.addEventListener("click", async () => {
  const idEnModal = document.getElementById("id_usuario").value;
  const datos = {
    nombre:  document.getElementById("nombre").value,
    correo:  document.getElementById("correo").value,
    usuario: document.getElementById("usuarioInput").value,
    rol:     document.getElementById("rolInput").value,
    estado:  document.getElementById("estado").value,
  };

  try {
    let res;

    if (!idEnModal) {
      const pass      = document.getElementById("contrasena")?.value;
      const confirmar = document.getElementById("confirmarContrasena")?.value;
      if (!pass)             return alert("La contraseña es obligatoria.");
      if (pass !== confirmar) return alert("Las contraseñas no coinciden.");
      datos.contrasena = pass;

      res = await fetch(`${API}/usuarios`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(datos)
      });

    } else {
      const actual = document.getElementById("contrasenaActual")?.value;
      const nueva  = document.getElementById("nuevaContrasena")?.value;

      if (actual) {
        if (!nueva) return alert("Escribe la nueva contraseña.");
        const rp = await fetch(`${API}/usuarios/pass/${idEnModal}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({ actual, nueva })
        });
        if (!rp.ok) {
          const e = await rp.json();
          return alert(e.msg || "Contraseña actual incorrecta.");
        }
      }

      res = await fetch(`${API}/usuarios/${idEnModal}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(datos)
      });

      const miId = sessionStorage.getItem("id_usuario");
      if (res.ok && String(idEnModal) === String(miId)) {
        sessionStorage.setItem("usuario", datos.usuario);
        sessionStorage.setItem("rol", datos.rol);
        actualizarInterfazDerecha();
      }
    }

    if (res.ok) { cerrarModal(); cargarUsuarios(); }
    else { const e = await res.json(); alert(e.msg || "Error al guardar."); }
  } catch {
    alert("Error de conexión.");
  }
});

document.getElementById("cerrarModalBtn")?.addEventListener("click", cerrarModal);

// ── PROVEEDOR: abrir modal nuevo ──────────────────────────────────────────────
document.getElementById("agregarProveedor")?.addEventListener("click", () => {
  document.getElementById("id_proveedor").value         = "";
  document.getElementById("provNombre").value           = "";
  document.getElementById("provCorreo").value           = "";
  document.getElementById("provUbicacion").value        = "";
  document.getElementById("modalTitleProv").textContent = "Nuevo Proveedor";
  document.getElementById("modalProveedor").classList.remove("hidden");
});

// ── PROVEEDOR: guardar ────────────────────────────────────────────────────────
document.getElementById("guardarProveedor")?.addEventListener("click", async () => {
  const id    = document.getElementById("id_proveedor").value;
  const datos = {
    nombre:    document.getElementById("provNombre").value,
    correo:    document.getElementById("provCorreo").value,
    ubicacion: document.getElementById("provUbicacion").value,
  };
  try {
    const res = await fetch(
      id ? `${API}/proveedores/${id}` : `${API}/proveedores`,
      { method: id ? "PUT" : "POST", headers: getHeaders(), body: JSON.stringify(datos) }
    );
    if (res.ok) { cerrarModalProveedor(); cargarProveedores(); }
    else { const e = await res.json(); alert(e.msg || "Error al guardar proveedor."); }
  } catch { alert("Error de conexión."); }
});

// ── CATEGORÍA: abrir modal nuevo ──────────────────────────────────────────────
document.getElementById("agregarCategoria")?.addEventListener("click", () => {
  document.getElementById("id_categoria").value        = "";
  document.getElementById("catNombre").value           = "";
  document.getElementById("modalTitleCat").textContent = "Nueva Categoría";
  document.getElementById("modalCategoria").classList.remove("hidden");
});

// ── CATEGORÍA: guardar ────────────────────────────────────────────────────────
document.getElementById("guardarCategoria")?.addEventListener("click", async () => {
  const id    = document.getElementById("id_categoria").value;
  const datos = { nombre: document.getElementById("catNombre").value };
  try {
    const res = await fetch(
      id ? `${API}/categorias/${id}` : `${API}/categorias`,
      { method: id ? "PUT" : "POST", headers: getHeaders(), body: JSON.stringify(datos) }
    );
    if (res.ok) { cerrarModalCategoria(); cargarCategorias(); }
    else { const e = await res.json(); alert(e.msg || "Error al guardar categoría."); }
  } catch { alert("Error de conexión."); }
});

// ── MODAL CONTRASEÑA: abrir ───────────────────────────────────────────────────
document.getElementById("btnAbrirCambioPass")?.addEventListener("click", () => {
  document.getElementById("passActual").value             = "";
  document.getElementById("passNueva").value              = "";
  document.getElementById("passConfirmar").value          = "";
  document.getElementById("grupoNueva").style.display     = "none";
  document.getElementById("grupoConfirmar").style.display = "none";
  document.getElementById("passError").style.display      = "none";
  document.getElementById("modalCambiarPass").classList.remove("hidden");
});

document.getElementById("passActual")?.addEventListener("input", (e) => {
  const tiene = e.target.value.length > 0;
  document.getElementById("grupoNueva").style.display     = tiene ? "block" : "none";
  document.getElementById("grupoConfirmar").style.display = tiene ? "block" : "none";
  if (!tiene) document.getElementById("passError").style.display = "none";
});

// ── MODAL CONTRASEÑA: guardar ─────────────────────────────────────────────────
document.getElementById("btnGuardarPass")?.addEventListener("click", async () => {
  const miId    = sessionStorage.getItem("id_usuario");
  const actual  = document.getElementById("passActual").value.trim();
  const nueva   = document.getElementById("passNueva").value.trim();
  const confirmar = document.getElementById("passConfirmar").value.trim();

  const mostrarError = (msg) => {
    const el = document.getElementById("passError");
    el.textContent   = "⚠ " + msg;
    el.style.display = "block";
  };

  document.getElementById("passError").style.display = "none";

  if (!actual)             return mostrarError("Ingresa tu contraseña actual.");
  if (!nueva)              return mostrarError("Ingresa la nueva contraseña.");
  if (nueva.length < 6)    return mostrarError("Mínimo 6 caracteres.");
  if (nueva !== confirmar)  return mostrarError("Las contraseñas no coinciden.");
  if (nueva === actual)     return mostrarError("La nueva contraseña no puede ser igual a la actual.");

  try {
    const res = await fetch(`${API}/usuarios/pass/${miId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ actual, nueva })
    });

    if (res.ok) { cerrarModalPass(); alert("✅ Contraseña actualizada."); }
    else { const e = await res.json(); mostrarError(e.msg || "Contraseña actual incorrecta."); }
  } catch {
    mostrarError("Error de conexión.");
  }
});

// ── Panel derecho ─────────────────────────────────────────────────────────────
function actualizarInterfazDerecha() {
  const elU = document.getElementById("usuario");
  const elR = document.getElementById("rol");
  const elA = document.getElementById("ultimoAcceso");

  if (elU) elU.textContent = sessionStorage.getItem("usuario") || "";
  if (elR) elR.textContent = sessionStorage.getItem("rol")     || "";

  if (elA) {
    const raw = sessionStorage.getItem("ultimo_acceso");
    if (raw) {
      const diff = Math.floor((new Date() - new Date(raw)) / 60000);
      const hrs  = Math.floor(diff / 60);
      const dias = Math.floor(hrs / 24);
      const txt  = diff < 1  ? "Conectado ahora mismo"
        : diff < 60 ? `Hace ${diff} min`
        : hrs  < 24 ? `Hace ${hrs} h`
        : `Hace ${dias} día${dias > 1 ? "s" : ""}`;
      elA.textContent = "🕐 " + txt;
    }
  }
}

// ── Cargar datos ──────────────────────────────────────────────────────────────
async function cargarPerfil() {
  const miId = sessionStorage.getItem("id_usuario");
  try {
    const res  = await fetch(`${API}/usuarios/${miId}`, { headers: getHeaders() });
    const data = await res.json();
    const u    = Array.isArray(data) ? data[0] : (data.data || data);

    document.getElementById("info-nombre").textContent  = u.nombre  || "—";
    document.getElementById("info-correo").textContent  = u.correo  || "—";
    document.getElementById("info-usuario").textContent = u.usuario || "—";
    document.getElementById("info-rol").textContent     = u.rol     || "—";

    const estadoTd = document.getElementById("info-estado");
    if (estadoTd) {
      estadoTd.innerHTML = u.estado == 1
        ? '<span class="badge-activo">✓ Activo</span>'
        : '<span class="badge-inactivo">✗ Inactivo</span>';
    }
  } catch (e) { console.error("Error cargando perfil:", e); }
}

async function cargarUsuarios() {
  try {
    const res   = await fetch(`${API}/usuarios`, { headers: getHeaders() });
    const data  = await res.json();
    const tbody = document.getElementById("tablaUsuarios");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach(u => {
      tbody.innerHTML += `
        <tr>
          <td>${u.usuario}</td>
          <td>${u.rol}</td>
          <td>
            <button onclick="prepararEdicion(${u.id_usuario})">✏️ Editar</button>
            <button onclick="eliminarUsuario(${u.id_usuario})">🗑️</button>
          </td>
        </tr>`;
    });
  } catch (e) { console.error("Error usuarios:", e); }
}

async function cargarProveedores() {
  try {
    const res   = await fetch(`${API}/proveedores`, { headers: getHeaders() });
    const data  = await res.json();
    const tbody = document.getElementById("tablaProveedores");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach(p => {
      tbody.innerHTML += `
        <tr>
          <td>${p.nombre}</td>
          <td>${p.correo}</td>
          <td>${p.ubicacion}</td>
          <td>
            <button onclick="editarProveedor(${p.id_proveedor})">✏️</button>
            <button onclick="eliminarProveedor(${p.id_proveedor})">🗑️</button>
          </td>
        </tr>`;
    });
  } catch (e) { console.error("Error proveedores:", e); }
}

async function cargarCategorias() {
  try {
    const res   = await fetch(`${API}/categorias`, { headers: getHeaders() });
    const data  = await res.json();
    const tbody = document.getElementById("tablaCategorias");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach(c => {
      tbody.innerHTML += `
        <tr>
          <td>${c.nombre}</td>
          <td>
            <button onclick="editarCategoria(${c.id_categoria})">✏️</button>
            <button onclick="eliminarCategoria(${c.id_categoria})">🗑️</button>
          </td>
        </tr>`;
    });
  } catch (e) { console.error("Error categorías:", e); }
}

// ── Funciones globales ────────────────────────────────────────────────────────
window.prepararEdicion = async (id) => {
  try {
    const res  = await fetch(`${API}/usuarios/${id}`, { headers: getHeaders() });
    const data = await res.json();
    const u    = Array.isArray(data) ? data[0] : (data.data || data);
    if (!u) return alert("No se encontraron los datos.");

    document.getElementById("id_usuario").value       = u.id_usuario;
    document.getElementById("nombre").value           = u.nombre    || "";
    document.getElementById("correo").value           = u.correo    || "";
    document.getElementById("usuarioInput").value     = u.usuario   || "";
    document.getElementById("rolInput").value         = u.rol       || "cajero";
    document.getElementById("estado").value           = u.estado;
    document.getElementById("modalTitle").textContent = "Editar Usuario";

    document.getElementById("seccionContrasena").innerHTML = `
      <div class="form-group">
        <input type="password" id="contrasenaActual" placeholder="Contraseña actual (opcional)">
      </div>
      <div class="form-group" id="grupoNuevaPass" style="display:none;">
        <input type="password" id="nuevaContrasena" placeholder="Nueva contraseña">
      </div>
      <small style="color:#999;font-size:11px;padding:0 2px;">
        Deja vacío si no deseas cambiar la contraseña
      </small>`;

    document.getElementById("contrasenaActual").addEventListener("input", (e) => {
      document.getElementById("grupoNuevaPass").style.display =
        e.target.value.length > 0 ? "block" : "none";
    });

    document.getElementById("modalUser").classList.remove("hidden");
  } catch { alert("Error cargando usuario."); }
};

window.eliminarUsuario = async (id) => {
  if (!confirm("¿Eliminar este usuario?")) return;
  try {
    const res  = await fetch(`${API}/usuarios/${id}`, { method: "DELETE", headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) return alert(data.msg || "No se pudo eliminar.");
    cargarUsuarios();
  } catch { console.error("Error eliminando usuario"); }
};

window.editarProveedor = async (id) => {
  try {
    const res = await fetch(`${API}/proveedores/${id}`, { headers: getHeaders() });
    const p   = await res.json();
    document.getElementById("id_proveedor").value         = p.id_proveedor;
    document.getElementById("provNombre").value           = p.nombre    || "";
    document.getElementById("provCorreo").value           = p.correo    || "";
    document.getElementById("provUbicacion").value        = p.ubicacion || "";
    document.getElementById("modalTitleProv").textContent = "Editar Proveedor";
    document.getElementById("modalProveedor").classList.remove("hidden");
  } catch { alert("Error cargando proveedor."); }
};

window.eliminarProveedor = async (id) => {
  if (!confirm("¿Eliminar este proveedor?")) return;
  try {
    await fetch(`${API}/proveedores/${id}`, { method: "DELETE", headers: getHeaders() });
    cargarProveedores();
  } catch { console.error("Error eliminando proveedor"); }
};

window.editarCategoria = async (id) => {
  try {
    const res = await fetch(`${API}/categorias/${id}`, { headers: getHeaders() });
    const c   = await res.json();
    document.getElementById("id_categoria").value        = c.id_categoria;
    document.getElementById("catNombre").value           = c.nombre || "";
    document.getElementById("modalTitleCat").textContent = "Editar Categoría";
    document.getElementById("modalCategoria").classList.remove("hidden");
  } catch { alert("Error cargando categoría."); }
};

window.eliminarCategoria = async (id) => {
  if (!confirm("¿Eliminar esta categoría?")) return;
  try {
    await fetch(`${API}/categorias/${id}`, { method: "DELETE", headers: getHeaders() });
    cargarCategorias();
  } catch { console.error("Error eliminando categoría"); }
};

// ── Buscador ──────────────────────────────────────────────────────────────────
const buscador = document.getElementById("buscador");

buscador?.addEventListener("keydown", async (e) => {
  if (e.key !== "Enter") return;
  const q = buscador.value.trim().toLowerCase();
  if (!q) return;
  buscador.blur();

  try {
    const [productos, usuarios, ventas, gastos] = await Promise.all([
      fetch(`${API}/productos`, { headers: getHeaders() }).then(r => r.json()),
      fetch(`${API}/usuarios`,  { headers: getHeaders() }).then(r => r.json()),
      fetch(`${API}/ventas`,    { headers: getHeaders() }).then(r => r.json()),
      fetch(`${API}/gastos`,    { headers: getHeaders() }).then(r => r.json())
    ]);

    const prod  = productos.find(p => p.nombre?.toLowerCase().includes(q));
    if (prod)  return (window.location.href = `/productos?id=${prod.id_producto}`);

    const user  = usuarios.find(u => u.usuario?.toLowerCase().includes(q));
    if (user)  return (window.location.href = `/configuracion?user=${user.id_usuario}`);

    const venta = Array.isArray(ventas) && ventas.find(v => String(v.id_ventas).includes(q));
    if (venta) return (window.location.href = `/reportes?venta=${venta.id_ventas}`);

    const gasto = Array.isArray(gastos) && gastos.find(g => g.descripcion?.toLowerCase().includes(q));
    if (gasto) return (window.location.href = `/gastos?gasto=${gasto.id_gasto}`);

    alert("No se encontró nada.");
  } catch { alert("Error al buscar."); }
});

// ── Cerrar modales ────────────────────────────────────────────────────────────
function cerrarModal()          { document.getElementById("modalUser")?.classList.add("hidden"); }
function cerrarModalProveedor() { document.getElementById("modalProveedor")?.classList.add("hidden"); }
function cerrarModalCategoria() { document.getElementById("modalCategoria")?.classList.add("hidden"); }
function cerrarModalPass()      { document.getElementById("modalCambiarPass")?.classList.add("hidden"); }

window.cerrarModal          = cerrarModal;
window.cerrarModalProveedor = cerrarModalProveedor;
window.cerrarModalCategoria = cerrarModalCategoria;
window.cerrarModalPass      = cerrarModalPass;