import { getConnection } from "./db_conectar.js";

//helper gastos
function vecesEnPeriodo(gasto, anio, mes) {
    const f = gasto.frecuencia;

    if (f === "unica") {
        if (!gasto.fecha) return 0;
        const d = new Date(gasto.fecha);
        return (d.getFullYear() === anio && d.getMonth() === mes) ? 1 : 0;
    }

    if (f === "diaria") {
        const inicio = gasto.fecha_inicio ? new Date(gasto.fecha_inicio) : new Date(0);
        const diasEnMes = new Date(anio, mes + 1, 0).getDate();
        let count = 0;
        for (let d = 1; d <= diasEnMes; d++) {
            const dia = new Date(anio, mes, d);
            if (dia >= inicio) count++;
        }
        return count;
    }

    if (f === "semanal") {
        
        const inicio = gasto.fecha_inicio ? new Date(gasto.fecha_inicio) : new Date(0);
        const diasEnMes = new Date(anio, mes + 1, 0).getDate();
        let count = 0;
        for (let d = 1; d <= diasEnMes; d++) {
            const dia = new Date(anio, mes, d);
           
            if (dia >= inicio && dia.getDay() === inicio.getDay()) count++;
        }
        return count;
    }

    if (f === "mensual") {
     
        const inicio = gasto.fecha_inicio ? new Date(gasto.fecha_inicio) : new Date(0);
        const inicioMes = new Date(anio, mes, 1);
        if (inicioMes < new Date(inicio.getFullYear(), inicio.getMonth(), 1)) return 0;
        const diaMes = gasto.dia_del_mes || 1;
        const diasEnMes = new Date(anio, mes + 1, 0).getDate();
        return diaMes <= diasEnMes ? 1 : 0;
    }

    if (f === "anual") {
        const inicio = gasto.fecha_inicio ? new Date(gasto.fecha_inicio) : new Date(0);
        if (anio < inicio.getFullYear()) return 0;
        const mesGasto = (gasto.mes_del_anio || 1) - 1; 
        return mesGasto === mes ? 1 : 0;
    }

    return 0;
}

//todos - gastos
export const obtenergastos = async () => {
    const conexion = await getConnection();
    const [rows] = await conexion.execute(`
        SELECT * FROM gastos ORDER BY fecha DESC
    `);
    return rows;
};


//gastos mensuales
export const obtenerGastosExpandidos = async (anio, mes) => {
    const conexion = await getConnection();
    const [rows] = await conexion.execute(`SELECT * FROM gastos`);

    const resultado = [];
    rows.forEach(g => {
        const veces = vecesEnPeriodo(g, anio, mes);
        if (veces > 0) {
            resultado.push({
                ...g,
                monto_periodo: Number(g.monto) * veces,
                veces
            });
        }
    });

    return resultado;
};

//gastos
export const obtenerGastosTotales = async () => {
    const conexion = await getConnection();
    const [rows] = await conexion.execute(`SELECT * FROM gastos`);


    const ahora = new Date();
    const anioActual = ahora.getFullYear();
    const mesActual = ahora.getMonth();

    let totalGastos = 0;

    rows.forEach(g => {
        if (g.frecuencia === "unica") {
            totalGastos += Number(g.monto) || 0;
            return;
        }

       
        const inicio = g.fecha_inicio ? new Date(g.fecha_inicio) : new Date();
        const anioInicio = inicio.getFullYear();
        const mesInicio = inicio.getMonth();

        for (let a = anioInicio; a <= anioActual; a++) {
            const mesStart = (a === anioInicio) ? mesInicio : 0;
            const mesEnd = (a === anioActual) ? mesActual : 11;
            for (let m = mesStart; m <= mesEnd; m++) {
                const veces = vecesEnPeriodo(g, a, m);
                totalGastos += (Number(g.monto) || 0) * veces;
            }
        }
    });

    return totalGastos;
};

//agregar
export const agregarGasto = async (datos) => {
    const conexion = await getConnection();

    const descripcion  = datos.descripcion  || "";
    const monto        = Number(datos.monto) || 0;
    // tipo: 'Compra' | 'Gasto'  (Venta viene de ventas, no de aquí)
    const tipo         = datos.tipo         || "Gasto";
    const frecuencia   = datos.frecuencia   || "unica";
    const fecha        = datos.fecha        || new Date().toISOString().split("T")[0];
    const fecha_inicio = datos.fecha_inicio || fecha;
    const dia_del_mes  = datos.dia_del_mes  ? Number(datos.dia_del_mes)  : null;
    const mes_del_anio = datos.mes_del_anio ? Number(datos.mes_del_anio) : null;

    const [result] = await conexion.execute(
        `INSERT INTO gastos
            (descripcion, monto, tipo, frecuencia, fecha, fecha_inicio, dia_del_mes, mes_del_anio)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [descripcion, monto, tipo, frecuencia, fecha, fecha_inicio, dia_del_mes, mes_del_anio]
    );

    return { ok: true, result };
};

//actualizar
export const actualizarGasto = async (id, datos) => {
    const conexion = await getConnection();

    const descripcion  = datos.descripcion  || "";
    const monto        = Number(datos.monto) || 0;
    const tipo         = datos.tipo         || "Gasto";
    const frecuencia   = datos.frecuencia   || "unica";
    const fecha        = datos.fecha        || null;
    const fecha_inicio = datos.fecha_inicio || fecha;
    const dia_del_mes  = datos.dia_del_mes  ? Number(datos.dia_del_mes)  : null;
    const mes_del_anio = datos.mes_del_anio ? Number(datos.mes_del_anio) : null;

    const [result] = await conexion.execute(
        `UPDATE gastos
         SET descripcion = ?, monto = ?, tipo = ?, frecuencia = ?,
             fecha = ?, fecha_inicio = ?, dia_del_mes = ?, mes_del_anio = ?
         WHERE id_gastos = ?`,
        [descripcion, monto, tipo, frecuencia, fecha, fecha_inicio, dia_del_mes, mes_del_anio, id]
    );

    if (result.affectedRows === 0) return { ok: false, msg: "No se pudo actualizar" };
    return { ok: true };
};

//eliminar
export const eliminarGastoDB = async (id) => {
    const conexion = await getConnection();
    const [result] = await conexion.execute(
        `DELETE FROM gastos WHERE id_gastos = ?`, [id]
    );
    if (result.affectedRows === 0) return { ok: false, msg: "Gasto no encontrado" };
    return { ok: true };
};