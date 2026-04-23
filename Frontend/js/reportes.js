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
const toggle = document.getElementById("btn_modo");

if (toggle) {
  toggle.addEventListener("change", () => {
    const dark = document.body.classList.toggle("dark-mode");
    localStorage.setItem("mode", dark ? "dark" : "light");
  });
}
if (localStorage.getItem("mode") === "dark") document.body.classList.add("dark-mode");

// ── Estado ────────────────────────────────────────────────────────────────────
const ahora = new Date();
let anioActual = ahora.getFullYear();
let mesActual  = ahora.getMonth();

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

// ── Cargar todo ───────────────────────────────────────────────────────────────
async function cargarReportes() {
  await Promise.all([cargarVentas(), cargarGastos(), cargarResumen()]);
}

// ── Resumen (cards) ───────────────────────────────────────────────────────────
async function cargarResumen() {
  try {
    const res  = await fetch(
      `${API}/reportes/movimientos?anio=${anioActual}&mes=${mesActual}`,
      { headers: getHeaders() }
    );
    const data = await res.json();

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = `$${Number(val || 0).toLocaleString("es-CO")}`;
    };

    set("totalVentas",  data.resumen?.totalVentas);
    set("totalCompras", data.resumen?.totalCompras);
    set("totalGastos",  data.resumen?.totalGastos);

    const ganancia = Number(data.resumen?.ganancia || 0);
    const elG = document.getElementById("ganancia");
    if (elG) {
      elG.textContent = `$${ganancia.toLocaleString("es-CO")}`;
      elG.style.color = ganancia >= 0 ? "#27ae60" : "#e74c3c";
    }

    const tp = document.getElementById("tituloPeriodo");
    if (tp) tp.textContent = `${MESES[mesActual]} ${anioActual}`;

  } catch (err) {
    console.error("Error resumen:", err);
  }
}

// ── Tabla de ventas ───────────────────────────────────────────────────────────
async function cargarVentas() {
  try {
    const res  = await fetch(
      `${API}/ventas/detalle?anio=${anioActual}&mes=${mesActual}`,
      { headers: getHeaders() }
    );
    const data = await res.json();
    const tbody = document.getElementById("tablaVentas");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#aaa;padding:20px;">Sin ventas este mes</td></tr>`;
      return;
    }

    data.forEach(v => {
      const fecha = v.fecha ? new Date(v.fecha).toLocaleDateString("es-CO") : "—";
      tbody.innerHTML += `
        <tr>
          <td>#${v.id_ventas}</td>
          <td>${v.producto}</td>
          <td style="text-align:center;">${v.cantidad}</td>
          <td>$${Number(v.precio).toLocaleString("es-CO")}</td>
          <td style="color:#27ae60;font-weight:700;">+$${Number(v.subtotal).toLocaleString("es-CO")}</td>
          <td style="color:#888;font-size:12px;">${fecha}</td>
        </tr>`;
    });

  } catch (err) {
    console.error("Error ventas:", err);
  }
}

// ── Tabla de gastos ───────────────────────────────────────────────────────────
async function cargarGastos() {
  try {
    const res  = await fetch(
      `${API}/reportes/movimientos?anio=${anioActual}&mes=${mesActual}`,
      { headers: getHeaders() }
    );
    const data = await res.json();
    const tbody = document.getElementById("tablaGastos");
    if (!tbody) return;

    tbody.innerHTML = "";

    const gastosYcompras = data.movimientos.filter(m =>
      m.tipo === "GASTO" || m.tipo === "COMPRA"
    );

    if (!gastosYcompras.length) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#aaa;padding:20px;">Sin gastos este mes</td></tr>`;
      return;
    }

    gastosYcompras.forEach(g => {
      const fecha = g.fecha ? new Date(g.fecha).toLocaleDateString("es-CO") : "—";
      const badge = g.tipo === "COMPRA"
        ? `<span style="background:#fdeaea;color:#e74c3c;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;">🛒 Compra</span>`
        : `<span style="background:#fff3e0;color:#e67e22;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;">💸 Gasto</span>`;

      tbody.innerHTML += `
        <tr>
          <td>${badge}</td>
          <td>${g.descripcion || "—"}</td>
          <td style="color:#e74c3c;font-weight:700;">-$${Number(g.monto).toLocaleString("es-CO")}</td>
          <td style="color:#888;font-size:12px;">${fecha}</td>
        </tr>`;
    });

  } catch (err) {
    console.error("Error gastos:", err);
  }
}

// ── Buscador ──────────────────────────────────────────────────────────────────
document.getElementById("buscador")?.addEventListener("input", (e) => {
  const texto = e.target.value.toLowerCase();
  ["tablaVentas", "tablaGastos"].forEach(id => {
    document.querySelectorAll(`#${id} tr`).forEach(fila => {
      fila.style.display = fila.textContent.toLowerCase().includes(texto) ? "" : "none";
    });
  });
});

// ── Navegación de meses ───────────────────────────────────────────────────────
document.getElementById("btnMesAnterior")?.addEventListener("click", () => {
  mesActual--;
  if (mesActual < 0) { mesActual = 11; anioActual--; }
  cargarReportes();
});

document.getElementById("btnMesSiguiente")?.addEventListener("click", () => {
  mesActual++;
  if (mesActual > 11) { mesActual = 0; anioActual++; }
  cargarReportes();
});

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const ok = await verificarSesion();
  if (!ok) return;
  cargarReportes();
});