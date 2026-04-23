import { getConnection } from "./db_conectar.js";
import bcrypt from "bcryptjs";

// ── Obtener todos ────────────────────────────────────────────────────────────
export const getUsuarios = async () => {
  const conn = await getConnection();
  const [rows] = await conn.query(`
    SELECT id_usuario, nombre, correo, usuario, rol, estado
    FROM usuarios
  `);
  return rows;
};

// ── Obtener uno ──────────────────────────────────────────────────────────────
export const getUsuario = async (id) => {
  const conn = await getConnection();
  const [rows] = await conn.query(
    "SELECT id_usuario, nombre, correo, usuario, rol, estado FROM usuarios WHERE id_usuario = ?",
    [id]
  );
  if (rows.length === 0) return null;
  return rows[0];
};

// ── Crear ────────────────────────────────────────────────────────────────────
export const crearUsuario = async (data) => {
  const conn = await getConnection();
  const sql = `
    INSERT INTO usuarios (nombre, correo, usuario, contrasena, rol, estado)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  await conn.query(sql, [
    data.nombre,
    data.correo,
    data.usuario,
    await bcrypt.hash(data.contrasena, 10),
    data.rol,
    data.estado ?? 1
  ]);
  return { ok: true };
};

// ── Actualizar ───────────────────────────────────────────────────────────────
export const actualizarUsuario = async (id, data) => {
  const conn = await getConnection();
  await conn.query(
    `UPDATE usuarios SET nombre=?, correo=?, usuario=?, rol=?, estado=? WHERE id_usuario=?`,
    [data.nombre, data.correo, data.usuario, data.rol, data.estado, id]
  );
  return { ok: true };
};

// ── Cambiar contraseña ───────────────────────────────────────────────────────
export const cambiarPassword = async (id, actual, nueva) => {
  const conn = await getConnection();
  const [rows] = await conn.query(
    "SELECT contrasena FROM usuarios WHERE id_usuario = ?",
    [id]
  );

  if (rows.length === 0) return { ok: false, msg: "Usuario no encontrado" };

  const match = await bcrypt.compare(actual, rows[0].contrasena);
  if (!match) return { ok: false, msg: "Contraseña actual incorrecta" };

  const hash = await bcrypt.hash(nueva, 10);
  await conn.query(
    "UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?",
    [hash, id]
  );
  return { ok: true, msg: "Contraseña actualizada" };
};

// ── Eliminar ─────────────────────────────────────────────────────────────────
export const eliminarUsuario = async (id) => {
  try {
    const conn = await getConnection();
    await conn.query("DELETE FROM usuarios WHERE id_usuario = ?", [id]);
    return { ok: true };
  } catch (error) {
    console.error("Error MySQL:", error.code);
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return { ok: false, mensaje: "No puedes eliminar este usuario porque tiene ventas registradas" };
    }
    return { ok: false, mensaje: "Error interno del servidor" };
  }
};