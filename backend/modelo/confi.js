import express from "express";
import { getConnection } from "../modelo/db_conectar.js";
import bcrypt from "bcryptjs";
import { verifyToken } from "../middlewares.js";

const router = express.Router();


//usuario - inicio de sesion User
router.get("/me", verifyToken, async (req, res) => {
  try {
    const conn = await getConnection();

    const [rows] = await conn.query(
      `SELECT 
        id_usuario,
        nombre,
        correo,
        usuario,
        rol,
        estado
      FROM usuarios
      WHERE id_usuario = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
    }

    res.json({ ok: true, data: rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: "Error servidor" });
  }
});


//Cambiar contraseña
router.post("/password", verifyToken, async (req, res) => {
  try {
    const { actual, nueva } = req.body;

    if (!actual || !nueva) {
      return res.status(400).json({ ok: false, msg: "Datos incompletos" });
    }

    const conn = await getConnection();

    const [rows] = await conn.query(
      "SELECT contrasena FROM usuarios WHERE id_usuario = ?",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, msg: "Usuario no existe" });
    }

    const user = rows[0];

    const ok = await bcrypt.compare(actual, user.contrasena);

    if (!ok) {
      return res.status(401).json({ ok: false, msg: "Contraseña actual incorrecta" });
    }

    const hash = await bcrypt.hash(nueva, 10);

    await conn.query(
      "UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?",
      [hash, req.user.id]
    );

    res.json({ ok: true, msg: "Contraseña actualizada" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});


//Actualizar
router.put("/perfil", verifyToken, async (req, res) => {
  try {
    const { nombre, correo, usuario } = req.body;

    const conn = await getConnection();

    await conn.query(
      `UPDATE usuarios 
       SET nombre=?, correo=?, usuario=? 
       WHERE id_usuario=?`,
      [nombre, correo, usuario, req.user.id]
    );

    res.json({ ok: true, msg: "Perfil actualizado" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});


export default router;