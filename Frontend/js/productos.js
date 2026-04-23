const API = "/api";

async function verificarSesion() {
  try {
    const res = await fetch(`${API}/me`, { credentials: "include" });
    if (!res.ok) { window.location.href = "/login"; return false; }
    return true;
  } catch {
    window.location.href = "/login";
    return false;
  }
}

// ── Variables globales ────────────────────────────────────────────────────────
const tabla        = document.getElementById("tablaProductos");
const modal        = document.getElementById("modalProducto");
const categoria    = document.getElementById("categoria");
const proveedor    = document.getElementById("proveedor");
const productoId   = document.getElementById("productoId");
const formProducto = document.getElementById("formProducto");

let editando           = false;
let todosLosProductos  = [];

// ── Modo oscuro ───────────────────────────────────────────────────────────────
const body = document.body;
const mode = document.getElementById("btn_modo");

if (localStorage.getItem("mode") === "dark") {
  body.classList.add("dark-mode");
  if (mode) mode.checked = true;
}

mode?.addEventListener("change", () => {
  const isDark = body.classList.toggle("dark-mode");
  localStorage.setItem("mode", isDark ? "dark" : "light");
});

// ── Cargar productos ──────────────────────────────────────────────────────────
const cargarProductos = async () => {
  try {
    const res = await fetch(`${API}/productos`, { credentials: "include" });
    todosLosProductos = await res.json();
    renderTabla(todosLosProductos);
  } catch (err) {
    console.error("Error cargando productos:", err);
  }
};

// ── Render tabla ──────────────────────────────────────────────────────────────
const renderTabla = (data) => {
  tabla.innerHTML = "";

  data.forEach(p => {
    // URL relativa — funciona en local y en producción sin cambios
    const imgSrc = p.url || "/img/default.png";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id_producto}</td>
      <td><img src="${imgSrc}" width="40" style="border-radius:6px;object-fit:cover;height:40px;"></td>
      <td>${p.nombre}</td>
      <td>${p.categoria  || "N/A"}</td>
      <td>${p.proveedor  || "N/A"}</td>
      <td>$${p.precio_compra}</td>
      <td>$${p.precio_venta}</td>
      <td>${p.stock}</td>
      <td>${p.stock_minimo}</td>
      <td>${p.iva      ?? 0}%</td>
      <td>${p.descuenti ?? 0}%</td>
      <td>${p.estado == 1 ? "Activo" : "❌"}</td>
      <td>${p.descripcion || ""}</td>
      <td>
        <button onclick="editarProducto(${p.id_producto})">✏️</button>
        <button onclick="eliminarProducto(${p.id_producto})">🗑️</button>
      </td>
    `;
    tabla.appendChild(tr);
  });
};

// ── Buscador ──────────────────────────────────────────────────────────────────
document.getElementById("buscador")?.addEventListener("input", (e) => {
  const txt      = e.target.value.toLowerCase();
  const filtrados = todosLosProductos.filter(p =>
    p.nombre.toLowerCase().includes(txt)
  );
  renderTabla(filtrados);
});

// ── Cargar selects (categorías y proveedores) ─────────────────────────────────
const cargarSelects = async () => {
  try {
    const [cat, prov] = await Promise.all([
      fetch(`${API}/categorias`,  { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/proveedores`, { credentials: "include" }).then(r => r.json())
    ]);

    categoria.innerHTML = cat
      .map(c => `<option value="${c.id_categoria}">${c.nombre}</option>`)
      .join("");

    proveedor.innerHTML = prov
      .map(p => `<option value="${p.id_proveedor}">${p.nombre}</option>`)
      .join("");

  } catch (err) {
    console.error("Error cargando selects:", err);
  }
};

// ── Modal ─────────────────────────────────────────────────────────────────────
const abrirModal = () => {
  modal.style.display = "flex";
  formProducto.reset();
  productoId.value = "";
  editando = false;
  document.getElementById("tituloProducto").textContent = "Nuevo Producto";
};

const cerrarModal = () => {
  modal.style.display = "none";
  formProducto.reset();
  productoId.value = "";
  editando = false;
};

document.getElementById("cerrarModalProducto").onclick = cerrarModal;

// ── Guardar ───────────────────────────────────────────────────────────────────
formProducto.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fd = new FormData();
  fd.append("nombre",       document.getElementById("nombre").value);
  fd.append("categoria_id", document.getElementById("categoria").value);
  fd.append("proveedor_id", document.getElementById("proveedor").value);
  fd.append("precio_compra", document.getElementById("compra").value);
  fd.append("precio_venta",  document.getElementById("venta").value);
  fd.append("stock",         document.getElementById("stock").value);
  fd.append("stock_minimo",  document.getElementById("stockMin").value);
  fd.append("iva",           document.getElementById("iva").value || 0);
  fd.append("descuenti",     document.getElementById("descuenti").value || 0);
  fd.append("descripcion",   document.getElementById("descripcion").value);
  fd.append("estado",        document.getElementById("estado").value);

  const imgFile = document.getElementById("imagen").files[0];
  if (imgFile) fd.append("imagen", imgFile);

  const url    = editando ? `${API}/productos/${productoId.value}` : `${API}/productos`;
  const metodo = editando ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method: metodo,
      credentials: "include",
      body: fd
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    cerrarModal();
    cargarProductos();

  } catch (err) {
    console.error(err);
    alert("Error al guardar producto: " + err.message);
  }
});

// ── Editar ────────────────────────────────────────────────────────────────────
window.editarProducto = async (id) => {
  try {
    // Reusar los datos ya cargados en memoria — evita un fetch extra
    const p = todosLosProductos.find(x => x.id_producto === id);
    if (!p) return alert("Producto no encontrado");

    await cargarSelects();
    abrirModal();

    editando = true;
    document.getElementById("tituloProducto").textContent = "Editar Producto";
    productoId.value = p.id_producto;

    document.getElementById("nombre").value      = p.nombre        || "";
    document.getElementById("categoria").value   = p.categoria_id  || "";
    document.getElementById("proveedor").value   = p.proveedor_id  || "";
    document.getElementById("compra").value      = p.precio_compra || "";
    document.getElementById("venta").value       = p.precio_venta  || "";
    document.getElementById("stock").value       = p.stock         || "";
    document.getElementById("stockMin").value    = p.stock_minimo  || "";
    document.getElementById("iva").value         = p.iva           ?? 0;
    document.getElementById("descuenti").value   = p.descuenti     ?? 0;
    document.getElementById("descripcion").value = p.descripcion   || "";
    document.getElementById("estado").value      = p.estado;

  } catch (err) {
    console.error(err);
    alert("Error cargando producto para editar");
  }
};

// ── Eliminar ──────────────────────────────────────────────────────────────────
window.eliminarProducto = async (id) => {
  if (!confirm("¿Eliminar este producto?")) return;

  try {
    const res = await fetch(`${API}/productos/${id}`, {
      method: "DELETE",
      credentials: "include"
    });

    if (!res.ok) throw new Error(await res.text());
    cargarProductos();

  } catch (err) {
    console.error(err);
    alert("Error eliminando producto: " + err.message);
  }
};

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const ok = await verificarSesion();
  if (!ok) return;

  cargarProductos();
  cargarSelects();
});