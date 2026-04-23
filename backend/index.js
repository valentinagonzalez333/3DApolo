import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

import { verifyToken } from "./middlewares.js";
import { getConnection } from "./modelo/db_conectar.js";

import { obtenerProductos, crearProducto, actualizarProducto, eliminarProducto } from "./modelo/productos.js";
import { obtenergastos, agregarGasto, eliminarGastoDB, actualizarGasto } from "./modelo/gastos.js";
import { getUsuarios, crearUsuario, getUsuario, actualizarUsuario, cambiarPassword, eliminarUsuario } from "./modelo/usuarios.js";
import { getProveedores, crearProveedor, actualizarProveedor, eliminarProveedor } from "./modelo/proveedores.js";
import { getCategorias, crearCategoria, actualizarCategoria, eliminarCategoria } from "./modelo/categorias.js";
import ventasRouter from "./modelo/ventas.js";
import reportesRouter from "./modelo/reportes.js";

const app = express();
const upload = multer({ dest: "uploads/" });
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("ERROR: JWT_SECRET no está definido en las variables de entorno.");
  process.exit(1);
}

app.set("port", process.env.PORT || 4000);

// ── Middlewares ──────────────────────────────────────────────────────────────
// En producción (Railway), el origen cambia; usar variable de entorno
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:4000";

app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.post("/login", async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ ok: false, msg: "Campos incompletos" });
  }

  try {
    const conn = await getConnection();
    const [rows] = await conn.query(
      "SELECT * FROM usuarios WHERE BINARY usuario = ?",
      [usuario]
    );

    if (rows.length === 0) {
      return res.status(401).json({ ok: false, msg: "Credenciales incorrectas" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.contrasena);

    if (!valid) {
      return res.status(401).json({ ok: false, msg: "Credenciales incorrectas" });
    }

    if (user.estado == 0) {
      return res.status(403).json({ ok: false, msg: "Usuario inactivo" });
    }

    const token = jwt.sign(
      { id: user.id_usuario, rol: user.rol },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 2
    });

    res.json({
      ok: true,
      id_usuario: user.id_usuario,
      usuario: user.usuario,
      rol: user.rol
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ ok: false, msg: "Error del servidor" });
  }
});


// ── Estáticos ────────────────────────────────────────────────────────────────
//app.use(express.static(path.join(__dirname, "../Frontend")));
app.use("/uploads", express.static("uploads"));
app.use("/img", express.static(path.join(__dirname, "../Frontend/img")));

// ── Servidor ─────────────────────────────────────────────────────────────────
app.listen(app.get("port"), () => {
  console.log("✅ Servidor corriendo en el puerto", app.get("port"));
});

// ── Páginas ──────────────────────────────────────────────────────────────────
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../Frontend/html/Info.html"))
);
app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "../Frontend/html/login.html"))
);
app.get("/inicio",        verifyToken, (req, res) => res.sendFile(path.join(__dirname, "../Frontend/html/panel.html")));
app.get("/productos",     verifyToken, (req, res) => res.sendFile(path.join(__dirname, "../Frontend/html/productos.html")));
app.get("/ventas",        verifyToken, (req, res) => res.sendFile(path.join(__dirname, "../Frontend/html/ventas.html")));
app.get("/gastos",        verifyToken, (req, res) => res.sendFile(path.join(__dirname, "../Frontend/html/gastos.html")));
app.get("/reportes",      verifyToken, (req, res) => res.sendFile(path.join(__dirname, "../Frontend/html/reportes.html")));
app.get("/usuarios",      verifyToken, (req, res) => res.sendFile(path.join(__dirname, "../Frontend/html/usuarios.html")));
app.get("/configuracion", verifyToken, (req, res) => res.sendFile(path.join(__dirname, "../Frontend/html/confi.html")));

// ── Login ────────────────────────────────────────────────────────────────────

// ── Logout ───────────────────────────────────────────────────────────────────
app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/"
  });
  res.json({ ok: true });
});

// ── API: me ──────────────────────────────────────────────────────────────────
app.get("/api/me", verifyToken, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// ── API: Usuarios ────────────────────────────────────────────────────────────
app.get("/api/usuarios", verifyToken, async (req, res) => {
  try {
    res.json(await getUsuarios());
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al obtener usuarios" });
  }
});

app.get("/api/usuarios/:id", verifyToken, async (req, res) => {
  try {
    const usuario = await getUsuario(req.params.id);
    if (!usuario) return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
    res.json(usuario);
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al obtener usuario" });
  }
});

app.post("/api/usuarios", verifyToken, async (req, res) => {
  try {
    await crearUsuario(req.body);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al crear usuario" });
  }
});

app.put("/api/usuarios/:id", verifyToken, async (req, res) => {
  try {
    await actualizarUsuario(req.params.id, req.body);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al actualizar usuario" });
  }
});

// ── CAMBIAR CONTRASEÑA (admin cambia la de otro usuario) ─────────────────────
// Ruta: PUT /api/usuarios/pass/:id
// IMPORTANTE: esta ruta debe ir ANTES de /api/usuarios/:id para que Express
// no interprete "pass" como un :id
app.put("/api/usuarios/pass/:id", verifyToken, async (req, res) => {
  const { actual, nueva } = req.body;
  if (!actual || !nueva) {
    return res.status(400).json({ ok: false, msg: "Datos incompletos" });
  }
  try {
    const result = await cambiarPassword(req.params.id, actual, nueva);
    if (!result.ok) return res.status(400).json(result);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al cambiar contraseña" });
  }
});

app.delete("/api/usuarios/:id", verifyToken, async (req, res) => {
  try {
    const result = await eliminarUsuario(req.params.id);
    if (!result.ok) return res.status(400).json({ ok: false, msg: result.mensaje });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, msg: "Error al eliminar usuario" });
  }
});

// ── API: Proveedores ─────────────────────────────────────────────────────────
app.get("/api/proveedores",        verifyToken, async (req, res) => res.json(await getProveedores()));
app.post("/api/proveedores",       verifyToken, async (req, res) => { await crearProveedor(req.body); res.json({ ok: true }); });
app.put("/api/proveedores/:id",    verifyToken, async (req, res) => { await actualizarProveedor(req.params.id, req.body); res.json({ ok: true }); });
app.delete("/api/proveedores/:id", verifyToken, async (req, res) => { await eliminarProveedor(req.params.id); res.json({ ok: true }); });

// ── API: Categorías ──────────────────────────────────────────────────────────
app.get("/api/categorias",        verifyToken, async (req, res) => res.json(await getCategorias()));
app.post("/api/categorias",       verifyToken, async (req, res) => { await crearCategoria(req.body); res.json({ ok: true }); });
app.put("/api/categorias/:id",    verifyToken, async (req, res) => { await actualizarCategoria(req.params.id, req.body); res.json({ ok: true }); });
app.delete("/api/categorias/:id", verifyToken, async (req, res) => { await eliminarCategoria(req.params.id); res.json({ ok: true }); });

// ── API: Productos ───────────────────────────────────────────────────────────
app.get("/api/productos",        verifyToken, obtenerProductos);
app.post("/api/productos",       verifyToken, upload.single("imagen"), crearProducto);
app.put("/api/productos/:id",    verifyToken, upload.single("imagen"), actualizarProducto);
app.delete("/api/productos/:id", verifyToken, eliminarProducto);

// ── API: Gastos ──────────────────────────────────────────────────────────────
app.get("/api/gastos",        verifyToken, async (req, res) => res.json(await obtenergastos()));
app.post("/api/gastos",       verifyToken, async (req, res) => { await agregarGasto(req.body); res.json({ ok: true }); });
app.put("/api/gastos/:id",    verifyToken, async (req, res) => { await actualizarGasto(req.params.id, req.body); res.json({ ok: true }); });
app.delete("/api/gastos/:id", verifyToken, async (req, res) => { await eliminarGastoDB(req.params.id); res.json({ ok: true }); });

// ── API: Ventas y Reportes ───────────────────────────────────────────────────
app.use("/api/ventas",   verifyToken, ventasRouter);
app.use("/api/reportes", verifyToken, reportesRouter);