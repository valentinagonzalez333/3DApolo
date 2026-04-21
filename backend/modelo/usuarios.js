import { getConnection } from "./db_conectar.js";

// 🔹 obtener todos
export const getUsuarios = async () => {
  const conn = await getConnection();
  const [rows] = await conn.query("SELECT id_usuario, nombre, correo, usuario, rol, estado FROM usuarios");
  return rows;
};

// 🔹 crear
export const crearUsuario = async (data) => {
  const conn = await getConnection();

  const sql = `
    INSERT INTO usuarios (nombre, correo, usuario, contrasena, rol, estado)
    VALUES (?, ?, ?, ?, ?, 1)
  `;

  await conn.query(sql, [
    data.nombre,
    data.correo,
    data.usuario,
    data.contrasena,
    data.rol
  ]);
};

// 🔹 obtener uno
export const getUsuario = async (id) => {
  const conn = await getConnection();
  const [rows] = await conn.query("SELECT * FROM usuarios WHERE id_usuario = ?", [id]);
  return rows[0];
};

// 🔹 actualizar
export const actualizarUsuario = async (id, data) => {
  const conn = await getConnection();

  await conn.query(`
    UPDATE usuarios 
    SET nombre=?, correo=?, usuario=?, rol=?, estado=?
    WHERE id_usuario=?
  `, [
    data.nombre,
    data.correo,
    data.usuario,
    data.rol,
    data.estado,
    id
  ]);
};

// 🔹 cambiar contraseña (validando actual)
export const cambiarPassword = async (id, actual, nueva) => {
  const conn = await getConnection();

  const [rows] = await conn.query(
    "SELECT contrasena FROM usuarios WHERE id_usuario=?",
    [id]
  );

  if (rows[0].contrasena !== actual) {
    return false;
  }

  await conn.query(
    "UPDATE usuarios SET contrasena=? WHERE id_usuario=?",
    [nueva, id]
  );

  return true;
};

// 🔹 eliminar
export const eliminarUsuario = async (id) => {
  const conn = await getConnection();
  await conn.query("DELETE FROM usuarios WHERE id_usuario=?", [id]);
};