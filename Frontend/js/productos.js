const cargarProductos = async () => {
  try {
    const res = await fetch('http://localhost:4000/api/productos')
    const data = await res.json();

    const tabla = document.getElementById('tablaProductos');
    tabla.innerHTML = "";

    data.forEach(p => {
      tabla.innerHTML += `
  <tr>
    <td>${p.id_producto}</td>

    <td>
      <img src="http://localhost:4000${p.url}" width="50">
    </td>

    <td>${p.nombre}</td>
    <td>${p.categoria || "Sin categoría"}</td>
    <td>${p.proveedor || "Sin proveedor"}</td>

    <td>$${p.precio_compra}</td>
    <td>$${p.precio_venta}</td>

    <td>${p.stock}</td>
    <td>${p.stock_minimo}</td>

    <td>${p.iva ?? 0}%</td>
    <td>${p.descuenti ?? 0}%</td>

    <td>
      ${p.estado == 1
          ? '<span style="color:green;">Activo</span>'
          : '<span style="color:red;">Inactivo</span>'}
    </td>

    <td>${p.descripcion}</td>
  </tr>
`;
    });

  } catch (error) {
    console.error("Error:", error);
  }
};

cargarProductos();