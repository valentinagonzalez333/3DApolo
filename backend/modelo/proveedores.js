import { getConnection } from "./db_conectar.js";

export const getProveedores = async () => {
  const conn = await getConnection();
  const [rows] = await conn.query("SELECT * FROM proveedor");
  return rows;
};

export const getProveedor = async (id) => {
  const conn = await getConnection();
  const [rows] = await conn.query("SELECT * FROM proveedor WHERE id_proveedor = ?", [id]);
  return rows[0] || null;
};

export const crearProveedor = async (data) => {
  const conn = await getConnection();
  await conn.query(
    "INSERT INTO proveedor (nombre, correo, ubicacion) VALUES (?, ?, ?)",
    [data.nombre, data.correo, data.ubicacion]
  );
  return { ok: true };
};

export const actualizarProveedor = async (id, data) => {
  const conn = await getConnection();
  await conn.query(
    "UPDATE proveedor SET nombre=?, correo=?, ubicacion=? WHERE id_proveedor=?",
    [data.nombre, data.correo, data.ubicacion, id]
  );
  return { ok: true };
};

export const eliminarProveedor = async (id) => {
  const conn = await getConnection();
  const [result] = await conn.query("DELETE FROM proveedor WHERE id_proveedor=?", [id]);
  return result.affectedRows > 0 ? { ok: true } : { ok: false, msg: "No encontrado" };
};