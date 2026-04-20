

const cargarProductos = async () => {
  const res = await fetch('http://localhost:4000/api/productos');
  const data = await res.json();
  const categoria = document.getElementById("categoria");
const proveedor = document.getElementById("proveedor");
const productoId = document.getElementById("productoId");
const formProducto = document.getElementById("formProducto");
  const tabla = document.getElementById('tablaProductos');
  tabla.innerHTML = "";

  data.forEach(p => {
    tabla.innerHTML += `
      <tr>
        <td>${p.id_producto}</td>
        <td><img src="http://localhost:4000${p.url}" width="40"></td>
        <td>${p.nombre}</td>
        <td>${p.categoria || "N/A"}</td>
        <td>${p.proveedor || "N/A"}</td>
        <td>$${p.precio_compra}</td>
        <td>$${p.precio_venta}</td>
        <td>${p.stock}</td>
        <td>${p.stock_minimo}</td>
        <td>${p.iva ?? 0}%</td>
        <td>${p.descuenti ?? 0}%</td>
        <td>${p.estado == 1 ? '✅' : '❌'}</td>
        <td>${p.descripcion || ""}</td>
       <td>
  <button onclick='editar(${JSON.stringify(p)})'>✏️</button>
  <button onclick='eliminar(${p.id_producto})'>🗑️</button>
</td>
      </tr>`;
  });
};

const modal = document.getElementById("modalProducto");
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("cerrarModalProducto").onclick = () => {
    modal.style.display = "none";
  };
});
const abrirModal = () => {
  modal.style.display = "flex";
};

const cerrarModal = () => {
  modal.style.display = "none";
};
const cargarSelects = async () => {
  const cat = await fetch('http://localhost:4000/api/categorias').then(r=>r.json());
  const prov = await fetch('http://localhost:4000/api/proveedores').then(r=>r.json());

  categoria.innerHTML = cat.map(c =>
    `<option value="${c.id_categoria}">${c.nombre}</option>`).join("");

  proveedor.innerHTML = prov.map(p =>
    `<option value="${p.id_proveedor}">${p.nombre}</option>`).join("");
};
let editando = false;

formProducto.addEventListener("submit", async (e) => {
  e.preventDefault();

  const datos = new FormData();

  datos.append("nombre", nombre.value);
  datos.append("categoria_id", categoria.value);
  datos.append("proveedor_id", proveedor.value);
  datos.append("precio_compra", compra.value);
  datos.append("precio_venta", venta.value);
  datos.append("stock", stock.value);
  datos.append("stock_minimo", stockMin.value);
  datos.append("iva", iva.value);
  datos.append("descuenti", descuenti.value);
  datos.append("descripcion", descripcion.value);
  datos.append("estado", estado.value);
  datos.append("imagen", imagen.files[0]);

  let url = "http://localhost:4000/api/productos";
  let metodo = "POST";

  if (editando) {
    url += "/" + productoId.value;
    metodo = "PUT";
  }

  await fetch(url, {
    method: metodo,
    body: datos
  });

  cerrarModal();
  cargarProductos();
});
const editar = (p) => {
  abrirModal();
  editando = true;

  productoId.value = p.id_producto;
  nombre.value = p.nombre;
  compra.value = p.precio_compra;
  venta.value = p.precio_venta;
  stock.value = p.stock;
  stockMin.value = p.stock_minimo;
  iva.value = p.iva;
  descuenti.value = p.descuenti;
  descripcion.value = p.descripcion;
  estado.value = p.estado;
};
const eliminar = async (id) => {
  if (!confirm("¿Eliminar producto?")) return;

  await fetch(`http://localhost:4000/api/productos/${id}`, {
    method: "DELETE"
  });

  cargarProductos();
};

//estilo modo oscuro
const body = document.body;
const mode = document.getElementById('btn_modo');

// cargar modo guardado
const guardado = localStorage.getItem('mode');

if (guardado === 'dark') {
  body.classList.add('dark-mode');
}

mode.addEventListener('click', () => {
  const isDark = body.classList.toggle('dark-mode');
  localStorage.setItem('mode', isDark ? 'dark' : 'light');
});
cargarProductos();
cargarSelects();