const API = "/api";

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

// ── Verificar sesión ──────────────────────────────────────────────────────────
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

// ── Dashboard ─────────────────────────────────────────────────────────────────
const cargarDashboard = async () => {
  try {
    const [gastos, productos, usuarios, ventas] = await Promise.all([
      fetch(`${API}/gastos`,   { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/productos`,{ credentials: "include" }).then(r => r.json()),
      fetch(`${API}/usuarios`, { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/ventas`,   { credentials: "include" }).then(r => r.json())
    ]);

    const totalGastos = gastos.reduce((acc, g) => acc + Number(g.monto || 0), 0);
    const totalVentas = ventas.reduce((acc, v) => acc + Number(v.total || 0), 0);

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("gastos",   "$" + totalGastos.toLocaleString("es-CO"));
    set("productos", productos.length);
    set("usuarios",  usuarios.length);
    set("ventas",   "$" + totalVentas.toLocaleString("es-CO"));

    const tabla = document.getElementById("tablaDatos");
    if (tabla) {
      tabla.innerHTML = "";
      gastos.slice(0, 5).forEach(g => {
        tabla.innerHTML += `
          <tr>
            <td>${g.descripcion || "—"}</td>
            <td>$${Number(g.monto).toLocaleString("es-CO")}</td>
            <td>${g.fecha ? new Date(g.fecha).toLocaleDateString("es-CO") : "—"}</td>
          </tr>`;
      });
    }

  } catch (error) {
    console.error("Error dashboard:", error);
  }
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
      fetch(`${API}/productos`, { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/usuarios`,  { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/ventas`,    { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/gastos`,    { credentials: "include" }).then(r => r.json())
    ]);

    const prod  = productos.find(p => p.nombre?.toLowerCase().includes(q));
    if (prod)  return (window.location.href = `/productos?id=${prod.id_producto}`);

    const user  = usuarios.find(u => u.usuario?.toLowerCase().includes(q));
    if (user)  return (window.location.href = `/configuracion?user=${user.id_usuario}`);

    const venta = Array.isArray(ventas) && ventas.find(v => String(v.id_ventas).includes(q));
    if (venta) return (window.location.href = `/reportes?venta=${venta.id_ventas}`);

    const gasto = Array.isArray(gastos) && gastos.find(g => g.descripcion?.toLowerCase().includes(q));
    if (gasto) return (window.location.href = `/gastos?gasto=${gasto.id_gasto}`);

    alert("No se encontró nada");
  } catch {
    alert("Error al buscar.");
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const ok = await verificarSesion();
  if (!ok) return;
  cargarDashboard();
});