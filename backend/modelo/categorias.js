import { getConnection } from "./db_conectar.js";

export const getCategorias = async () => {
  const conn = await getConnection();
  const [rows] = await conn.query("SELECT * FROM categorias");
  return rows;
};

export const getCategoria = async (id) => {
  const conn = await getConnection();
  const [rows] = await conn.query("SELECT * FROM categorias WHERE id_categoria = ?", [id]);
  return rows[0] || null;
};

export const crearCategoria = async (data) => {
  const conn = await getConnection();
  await conn.query("INSERT INTO categorias (nombre) VALUES (?)", [data.nombre]);
  return { ok: true };
};

export const actualizarCategoria = async (id, data) => {
  const conn = await getConnection();
  await conn.query("UPDATE categorias SET nombre=? WHERE id_categoria=?", [data.nombre, id]);
  return { ok: true };
};

export const eliminarCategoria = async (id) => {
  const conn = await getConnection();
  const [result] = await conn.query("DELETE FROM categorias WHERE id_categoria=?", [id]);
  return result.affectedRows > 0 ? { ok: true } : { ok: false, msg: "No encontrada" };
};