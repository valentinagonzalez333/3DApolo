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
const body    = document.body;
const modeBtn = document.getElementById("btn_modo");

if (localStorage.getItem("mode") === "dark") body.classList.add("dark-mode");

modeBtn?.addEventListener("change", () => {
  const isDark = body.classList.toggle("dark-mode");
  localStorage.setItem("mode", isDark ? "dark" : "light");
});

// ── Helpers de badges ─────────────────────────────────────────────────────────
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function proximoCobro(g) {
  const f = g.frecuencia;
  if (f === "unica")   return g.fecha ? new Date(g.fecha).toLocaleDateString("es-CO") : "—";
  if (f === "mensual" && g.dia_del_mes) return `${g.dia_del_mes} de cada mes`;
  if (f === "anual"   && g.dia_del_mes && g.mes_del_anio)
    return `${g.dia_del_mes} de ${MESES[g.mes_del_anio - 1]} cada año`;
  if (f === "semanal") {
    if (!g.fecha_inicio) return "Semanal";
    const dias = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
    return `Cada ${dias[new Date(g.fecha_inicio).getDay()]}`;
  }
  if (f === "diaria") return "Cada día";
  return "—";
}

function badgeTipo(tipo) {
  const map = {
    Compra: { color: "#e74c3c", bg: "#fdeaea", label: "🛒 Compra" },
    Gasto:  { color: "#e67e22", bg: "#fff3e0", label: "💸 Gasto"  }
  };
  const t = map[tipo] || { color: "#999", bg: "#f5f5f5", label: tipo };
  return `<span style="background:${t.bg};color:${t.color};padding:2px 8px;border-radius:12px;font-size:12px;font-weight:600;">${t.label}</span>`;
}

function badgeFrecuencia(f) {
  const map = {
    unica:   { label: "Una vez", color: "#7f8c8d" },
    mensual: { label: "Mensual", color: "#2980b9" },
    anual:   { label: "Anual",   color: "#8e44ad" },
    semanal: { label: "Semanal", color: "#27ae60" },
    diaria:  { label: "Diaria",  color: "#e67e22" }
  };
  const b = map[f] || { label: f, color: "#999" };
  return `<span style="color:${b.color};font-size:12px;font-weight:600;">● ${b.label}</span>`;
}

// ── Modal: abrir / cerrar ─────────────────────────────────────────────────────
function abrirModal() {
  document.getElementById("gasto").style.display = "flex";
}

function cerrarModal() {
  document.getElementById("gasto").style.display = "none";
  document.getElementById("formGasto").reset();
  document.getElementById("gastoId").value = "";
  document.getElementById("modalTitulo").textContent = "Agregar Gasto";
  mostrarCamposFrecuencia("unica");
}

// ── Mostrar/ocultar campos según frecuencia ───────────────────────────────────
function mostrarCamposFrecuencia(frecuencia) {
  const campos = {
    unica:   "campoUnica",
    mensual: "campoMensual",
    anual:   "campoAnual",
    semanal: "campoSemanal",
    diaria:  "campoDiaria"
  };
  Object.values(campos).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  const visible = campos[frecuencia];
  if (visible) {
    const el = document.getElementById(visible);
    if (el) el.style.display = "block";
  }
}

// ── Cargar gastos ─────────────────────────────────────────────────────────────
const cargarGastos = async () => {
  try {
    const res  = await fetch(`${API}/gastos`, { headers: getHeaders() });
    const data = await res.json();

    const tabla = document.getElementById("tabla-gastos");
    if (!tabla) return;

    tabla.innerHTML = "";

    let totalAcumulado = 0;
    let mayorMonto     = 0;
    const tiposSet     = new Set();
    const ahora        = new Date();
    const mesActual    = ahora.getMonth();
    const anioActual   = ahora.getFullYear();
    let totalMensual   = 0;

    data.forEach(g => {
      const monto = Number(g.monto) || 0;
      totalAcumulado += monto;
      if (monto > mayorMonto) mayorMonto = monto;
      if (g.tipo) tiposSet.add(g.tipo);

      if (g.frecuencia === "unica" && g.fecha) {
        const d = new Date(g.fecha);
        if (d.getMonth() === mesActual && d.getFullYear() === anioActual) totalMensual += monto;
      } else if (g.frecuencia === "mensual") {
        totalMensual += monto;
      }

      tabla.innerHTML += `
        <tr>
          <td>${g.id_gastos}</td>
          <td>${g.descripcion ?? ""}</td>
          <td>${badgeTipo(g.tipo)}</td>
          <td>${badgeFrecuencia(g.frecuencia || "unica")}</td>
          <td style="font-size:12px;color:#888;">${proximoCobro(g)}</td>
          <td><strong>$${monto.toLocaleString("es-CO")}</strong></td>
          <td>
            <button onclick="prepararEdicion(${g.id_gastos})">✏️</button>
            <button onclick="eliminarGasto(${g.id_gastos})">🗑️</button>
          </td>
        </tr>`;
    });

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("total",      `$${totalAcumulado.toLocaleString("es-CO")}`);
    set("mensual",    `$${totalMensual.toLocaleString("es-CO")}`);
    set("mayor",      `$${mayorMonto.toLocaleString("es-CO")}`);
    set("categorias", tiposSet.size);

  } catch (error) {
    console.error("Error cargando gastos:", error);
  }
};

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const ok = await verificarSesion();
  if (!ok) return;

  cargarGastos();

  document.getElementById("btnAbrirAgregar").addEventListener("click", () => {
    cerrarModal();
    abrirModal();
  });

  document.getElementById("btnCerrar").addEventListener("click", cerrarModal);

  document.getElementById("gasto").addEventListener("click", (e) => {
    if (e.target === document.getElementById("gasto")) cerrarModal();
  });

  document.getElementById("frecuencia").addEventListener("change", (e) => {
    mostrarCamposFrecuencia(e.target.value);
  });

  mostrarCamposFrecuencia("unica");
});

// ── Guardar (crear / editar) ──────────────────────────────────────────────────
document.getElementById("formGasto")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id         = document.getElementById("gastoId").value;
  const frecuencia = document.getElementById("frecuencia").value;

  const datos = {
    descripcion: document.getElementById("desc").value,
    monto:       Number(document.getElementById("monto").value),
    tipo:        document.getElementById("tipo").value,
    frecuencia
  };

  if (frecuencia === "unica") {
    datos.fecha = document.getElementById("fecha_pago").value || null;
  } else if (frecuencia === "mensual") {
    datos.dia_del_mes  = document.getElementById("dia_del_mes").value          || null;
    datos.fecha_inicio = document.getElementById("fecha_inicio_mensual").value || null;
  } else if (frecuencia === "anual") {
    datos.dia_del_mes  = document.getElementById("dia_anual").value            || null;
    datos.mes_del_anio = document.getElementById("mes_anual").value            || null;
    datos.fecha_inicio = document.getElementById("fecha_inicio_anual").value   || null;
  } else if (frecuencia === "semanal") {
    datos.fecha_inicio = document.getElementById("fecha_inicio_semanal").value || null;
  } else if (frecuencia === "diaria") {
    datos.fecha_inicio = document.getElementById("fecha_inicio_diaria").value  || null;
  }

  const url    = id ? `${API}/gastos/${id}` : `${API}/gastos`;
  const metodo = id ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method: metodo,
      headers: getHeaders(),
      body: JSON.stringify(datos)
    });

    if (res.ok) { cerrarModal(); cargarGastos(); }
    else { const err = await res.json(); alert(err.msg || err.error || "Error al guardar"); }
  } catch (error) {
    console.error("Error guardando gasto:", error);
    alert("Error de conexión");
  }
});

// ── Preparar edición
window.prepararEdicion = async (id) => {
  try {
    const res  = await fetch(`${API}/gastos`, { headers: getHeaders() });
    const data = await res.json();
    const g    = data.find(x => x.id_gastos === id);
    if (!g) return alert("Gasto no encontrado");

    document.getElementById("gastoId").value           = g.id_gastos;
    document.getElementById("desc").value              = g.descripcion || "";
    document.getElementById("monto").value             = g.monto       || "";
    document.getElementById("tipo").value              = g.tipo        || "Gasto";
    document.getElementById("frecuencia").value        = g.frecuencia  || "unica";
    document.getElementById("modalTitulo").textContent = "Editar Gasto";

    mostrarCamposFrecuencia(g.frecuencia || "unica");

    if (g.frecuencia === "unica") {
      document.getElementById("fecha_pago").value = g.fecha ? g.fecha.split("T")[0] : "";
    } else if (g.frecuencia === "mensual") {
      document.getElementById("dia_del_mes").value          = g.dia_del_mes  || "";
      document.getElementById("fecha_inicio_mensual").value = g.fecha_inicio ? g.fecha_inicio.split("T")[0] : "";
    } else if (g.frecuencia === "anual") {
      document.getElementById("dia_anual").value          = g.dia_del_mes  || "";
      document.getElementById("mes_anual").value          = g.mes_del_anio || "";
      document.getElementById("fecha_inicio_anual").value = g.fecha_inicio ? g.fecha_inicio.split("T")[0] : "";
    } else if (g.frecuencia === "semanal") {
      document.getElementById("fecha_inicio_semanal").value = g.fecha_inicio ? g.fecha_inicio.split("T")[0] : "";
    } else if (g.frecuencia === "diaria") {
      document.getElementById("fecha_inicio_diaria").value = g.fecha_inicio ? g.fecha_inicio.split("T")[0] : "";
    }

    abrirModal();
  } catch (err) {
    console.error("Error cargando gasto para editar:", err);
    alert("Error al cargar el gasto");
  }
};

// ── Eliminar ──────────────────────────────────────────────────────────────────
window.eliminarGasto = async (id) => {
  if (!confirm("¿Seguro que quieres eliminar este gasto?")) return;
  try {
    const res = await fetch(`${API}/gastos/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (res.ok) cargarGastos();
    else alert("Error al eliminar");
  } catch (error) {
    console.error("Error:", error);
  }
};