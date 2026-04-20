
import { getConnection } from './db_conectar.js';

// Obtener todos los gastos
export const obtenergastos = async () => {
    const conexion = await getConnection();
    const [rows] = await conexion.execute('SELECT * FROM gastos ORDER BY fecha DESC');
    return rows;
};

// Agregar un nuevo gasto
export const agregarGasto = async (datos) => {
    const { descripcion, monto, tipo, fecha } = datos;
    const conexion = await getConnection();
    const [result] = await conexion.execute(
        'INSERT INTO gastos (descripcion, monto, tipo, fecha) VALUES (?, ?, ?, ?)',
        [descripcion, monto, tipo, fecha]
    );
    return result;
};

// Eliminar un gasto
export const eliminarGastoDB = async (id) => {
    const conexion = await getConnection();
    const [result] = await conexion.execute('DELETE FROM gastos WHERE id_gastos = ?', [id]);
    return result;
};

// Actualizar un gasto existente
export const actualizarGasto = async (id, datos) => {
    const { descripcion, monto, tipo, fecha } = datos;
    const conexion = await getConnection();
    const [result] = await conexion.execute(
        'UPDATE gastos SET descripcion = ?, monto = ?, tipo = ?, fecha = ? WHERE id_gastos = ?',
        [descripcion, monto, tipo, fecha, id]
    );
    return result;
};