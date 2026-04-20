const cargarGastos = async () => {
    try {
        const res = await fetch('http://localhost:4000/api/gastos');
        const data = await res.json();

        const tabla = document.getElementById('tabla-gastos');
        tabla.innerHTML = "";

        let totalAcumulado = 0;
        let mayorMonto = 0;
        const categoriasSet = new Set();
        const mesActual = new Date().getMonth();
        const anioActual = new Date().getFullYear();
        let totalMensual = 0;

        data.forEach(g => {
            const montoNf = parseFloat(g.monto) || 0;
            totalAcumulado += montoNf;
            if (montoNf > mayorMonto) mayorMonto = montoNf;
            categoriasSet.add(g.tipo);

            if (g.fecha) {
                const fechaGasto = new Date(g.fecha);
                if (fechaGasto.getMonth() === mesActual && fechaGasto.getFullYear() === anioActual) {
                    totalMensual += montoNf;
                }
            }

            
            tabla.innerHTML += `
                <tr>
                   <td>${g.id_gastos}</td>
        <td>${g.descripcion}</td>
        <td>${g.tipo}</td>
        <td>${g.fecha ? g.fecha.split('T')[0] : 'Sin fecha'}</td>
        <td>$${montoNf.toLocaleString()}</td>
        <td>
            <button onclick="prepararEdicion(${g.id_gastos}, '${g.descripcion}', ${g.monto}, '${g.tipo}', '${g.fecha}')">✏️</button>
            <button onclick="eliminarGasto(${g.id_gastos})">🗑️</button>
                    </td>
                </tr>
            `;
        });

        document.getElementById('total').textContent = `$${totalAcumulado.toLocaleString()}`;
        document.getElementById('mensual').textContent = `$${totalMensual.toLocaleString()}`;
        document.getElementById('mayor').textContent = `$${mayorMonto.toLocaleString()}`;
        document.getElementById('categorias').textContent = categoriasSet.size;

    } catch (error) {
        console.error("Error al cargar:", error);
    }
};

// eliminar
window.eliminarGasto = async (id) => {
    if (confirm("¿Estás seguro de eliminar este gasto?")) {
        try {
            const res = await fetch(`http://localhost:4000/api/gastos/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                cargarGastos();
            } else {
                alert("Error al eliminar del servidor");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
};

window.prepararEdicion = (id, desc, monto, tipo, fecha) => {
    document.getElementById('gastoId').value = id;
    document.getElementById('desc').value = desc;
    document.getElementById('monto').value = monto;
    document.getElementById('tipo').value = tipo;
    
    
    if (fecha && fecha !== 'null') {
        document.getElementById('fecha_pago').value = fecha.split('T')[0];
    }
    
    document.getElementById('modalTitulo').innerText = "Editar Gasto";
    modal.style.display = "block";
};

// ventana
const modal = document.getElementById('gasto');
const form = document.getElementById('formGasto');

document.getElementById('btnAbrirAgregar').addEventListener('click', () => {
    form.reset();
    document.getElementById('gastoId').value = "";
    document.getElementById('modalTitulo').innerText = "Nuevo Gasto";
    modal.style.display = "block";
});

document.getElementById('btnCerrar').addEventListener('click', () => {
    modal.style.display = "none";
});

// Guardar 
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('gastoId').value;
    
   
const datos = {
    descripcion: document.getElementById('desc').value,
    monto: parseFloat(document.getElementById('monto').value),
    tipo: document.getElementById('tipo').value,
    fecha: document.getElementById('fecha_pago').value 
};
    const url = id ? `http://localhost:4000/api/gastos/${id}` : 'http://localhost:4000/api/gastos';
    const metodo = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            modal.style.display = "none";
            cargarGastos();
        } else {
            const errData = await res.json();
            alert("Error del servidor: " + (errData.error || "Desconocido"));
        }
    } catch (error) {
        console.error("Error al guardar:", error);
    }
});


cargarGastos();