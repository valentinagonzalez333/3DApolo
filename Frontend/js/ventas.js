const API = "/api";

let productos = [];
let carrito   = [];

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

// ── Cargar productos ──────────────────────────────────────────────────────────
async function cargarProductos() {
  try {
    const res = await fetch(`${API}/productos`, { headers: getHeaders() });
    productos = await res.json();
    renderProductos(productos);
  } catch (error) {
    console.error("Error cargando productos:", error);
  }
}

function renderProductos(lista) {
  const cont = document.getElementById("listaProductos");
  cont.innerHTML = "";

  lista.forEach(p => {
    const img = p.url || "/img/default.png";
    cont.innerHTML += `
      <div class="card-producto" onclick="agregar(${p.id_producto})">
        <img src="${img}" alt="${p.nombre}">
        <span class="prod-nombre">${p.nombre}</span>
        <span class="prod-precio">$${Number(p.precio_venta).toLocaleString()}</span>
      </div>`;
  });
}

// ── Buscador ──────────────────────────────────────────────────────────────────
document.addEventListener("input", (e) => {
  if (e.target.id !== "buscador") return;
  const txt = e.target.value.toLowerCase();
  renderProductos(productos.filter(p => p.nombre.toLowerCase().includes(txt)));
});

// ── Carrito ───────────────────────────────────────────────────────────────────
function agregar(id) {
  const prod = productos.find(p => p.id_producto === id);
  if (!prod) return;

  const existe         = carrito.find(p => p.id === id);
  const cantidadActual = existe ? existe.cantidad : 0;

  if (cantidadActual >= prod.stock) { alert("No hay suficiente stock"); return; }

  if (existe) {
    existe.cantidad++;
  } else {
    carrito.push({
      id:        prod.id_producto,
      nombre:    prod.nombre,
      precio:    Number(prod.precio_venta),
      descuento: Number(prod.descuenti || 0),
      cantidad:  1,
      url:       prod.url
    });
  }

  renderCarrito();
}

function cambiarCantidad(id, delta) {
  const item = carrito.find(p => p.id === id);
  const prod = productos.find(p => p.id_producto === id);
  if (!item || !prod) return;

  const nuevaCantidad = item.cantidad + delta;
  if (nuevaCantidad > prod.stock) { alert("Stock insuficiente"); return; }

  item.cantidad = nuevaCantidad;
  if (item.cantidad <= 0) carrito = carrito.filter(p => p.id !== id);

  renderCarrito();
}

function eliminar(id) {
  carrito = carrito.filter(p => p.id !== id);
  renderCarrito();
}

function renderCarrito() {
  const body       = document.getElementById("carrito-body");
  const vacio      = document.getElementById("carrito-vacio");
  const subtotalEl = document.getElementById("subtotal");
  const totalEl    = document.getElementById("total");
  const badge      = document.getElementById("badge-items");

  body.querySelectorAll(".carrito-row").forEach(r => r.remove());

  let total      = 0;
  let totalItems = 0;

  if (carrito.length === 0) {
    vacio.style.display = "flex";
  } else {
    vacio.style.display = "none";

    carrito.forEach(p => {
      const precioFinal = p.precio - (p.precio * (p.descuento || 0) / 100);
      const sub         = precioFinal * p.cantidad;
      total            += sub;
      totalItems       += p.cantidad;

      const img = p.url || "/img/default.png";

      const row = document.createElement("div");
      row.className = "carrito-row";
      row.innerHTML = `
        <img src="${img}" alt="${p.nombre}">
        <div class="carrito-info">
          <div class="carrito-nombre">${p.nombre}</div>
          <div class="carrito-precio-unit">$${precioFinal.toLocaleString()} c/u</div>
        </div>
        <div class="qty-control">
          <button class="qty-btn" onclick="cambiarCantidad(${p.id}, -1)">−</button>
          <span class="qty-num">${p.cantidad}</span>
          <button class="qty-btn" onclick="cambiarCantidad(${p.id}, 1)">+</button>
        </div>
        <div class="carrito-subtotal">$${sub.toLocaleString()}</div>
        <button class="btn-eliminar" onclick="eliminar(${p.id})">✕</button>
      `;
      body.appendChild(row);
    });
  }

  if (subtotalEl) subtotalEl.textContent = "$" + total.toLocaleString();
  if (totalEl)    totalEl.textContent    = total.toLocaleString();
  if (badge)      badge.textContent      = totalItems + (totalItems === 1 ? " item" : " items");
}

// ── Guardar venta ─────────────────────────────────────────────────────────────
async function guardarVenta() {
  if (carrito.length === 0) { alert("Carrito vacío"); return; }

  const metodo = document.getElementById("metodo_pago").value;

  try {
    const res  = await fetch(`${API}/ventas`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ productos: carrito, metodo_pago: metodo })
    });
    const data = await res.json();

    if (data.ok) {
      alert("Venta guardada correctamente");
      carrito = [];
      renderCarrito();
      cargarProductos();
    } else {
      alert(data.msg || "Error al guardar venta");
    }
  } catch (error) {
    console.error("Error guardando venta:", error);
    alert("Error de conexión con el servidor");
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const ok = await verificarSesion();
  if (!ok) return;
  await cargarProductos();
  renderCarrito();
});