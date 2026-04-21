import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import multer from 'multer';

// 🔹 MODELOS
import { getConnection } from "./modelo/db_conectar.js";
// PRODUCTOS
import {
  insertarProducto,
  actualizarProducto,
  obtenerProductos
} from './modelo/productos.js';

// GASTOS
import {
  obtenergastos,
  agregarGasto,
  eliminarGastoDB,
  actualizarGasto
} from './modelo/gastos.js';

// USUARIOS
import {
  getUsuarios,
  crearUsuario,
  getUsuario,
  actualizarUsuario,
  cambiarPassword,
  eliminarUsuario
} from "./modelo/usuarios.js";

// CONFIG
import * as confModel from "./modelo/confi.js";

// 🔹 CONFIG APP
const app = express();
const upload = multer({ dest: 'uploads/' });
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 🔹 SERVER
app.set('port', 4000);
app.listen(app.get('port'), () => {
  console.log(" Servidor corriendo en puerto", app.get('port'));
});

// 🔹 MIDDLEWARE
app.use(cors()); // más simple
app.use(express.json());

// 🔹 ESTÁTICOS
app.use(express.static(path.join(__dirname, "../Frontend")));
app.use('/uploads', express.static('uploads'));
app.use('/img', express.static('../Frontend/img'));


// ==================================================
// 🌐 RUTAS VISTAS (HTML)
// ==================================================

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../Frontend/html/Info.html"))
);

app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "../Frontend/html/login.html"))
);

app.get("/inicio", (req, res) =>
  res.sendFile(path.join(__dirname, "../Frontend/html/panel.html"))
);

app.get("/productos", (req, res) =>
  res.sendFile(path.join(__dirname, "../Frontend/html/productos.html"))
);

app.get("/ventas", (req, res) =>
  res.sendFile(path.join(__dirname, "../Frontend/html/ventas.html"))
);

app.get("/reportes", (req, res) =>
  res.sendFile(path.join(__dirname, "../Frontend/html/reportes.html"))
);

app.get("/usuarios", (req, res) =>
  res.sendFile(path.join(__dirname, "../Frontend/html/usuarios.html"))
);

app.get("/gastos", (req, res) =>
  res.sendFile(path.join(__dirname, "../Frontend/html/gastos.html"))
);

app.get("/configuracion", (req, res) =>
  res.sendFile(path.join(__dirname, "../Frontend/html/confi.html"))
);


// ==================================================
// 🔐 LOGIN
// ==================================================

app.post("/login", async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const connection = await getConnection();

    const [rows] = await connection.query(
      "SELECT * FROM usuarios WHERE usuario = ?",
      [usuario]
    );

    if (rows.length > 0) {
      const user = rows[0];

      // ⚠️ aquí puedes usar bcrypt después
      if (user.contrasena === password) {
        return res.json({
          ok: true,
          usuario: user.usuario,
          rol: user.rol
        });
      }
    }

    res.json({ ok: false });

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});


// ==================================================
// ⚙️ CONFIGURACIÓN (usuario logueado)
// ==================================================

app.get("/api/conf", async (req, res) => {
  try {
    const { usuario } = req.query;

    const resultados = await confModel.obtenerUsuario(usuario);

    if (resultados.length > 0) {
      res.json({
        ok: true,
        usuario: resultados[0].usuario,
        rol: resultados[0].rol
      });
    } else {
      res.json({ ok: false });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});


// ==================================================
// 👤 USUARIOS (CRUD)
// ==================================================

app.get("/api/usuarios", async (req, res) => {
  try {
    const data = await getUsuarios();
    res.json(data);
  } catch (error) {
    res.status(500).json({ ok: false });
  }
});

app.get("/api/usuarios/:id", async (req, res) => {
  try {
    const user = await getUsuario(req.params.id);
    res.json(user);
  } catch {
    res.status(500).json({ ok: false });
  }
});

app.post("/api/usuarios", async (req, res) => {
  try {
    await crearUsuario(req.body);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

app.put("/api/usuarios/:id", async (req, res) => {
  try {
    await actualizarUsuario(req.params.id, req.body);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

app.post("/api/usuarios/pass/:id", async (req, res) => {
  try {
    const ok = await cambiarPassword(
      req.params.id,
      req.body.actual,
      req.body.nueva
    );

    res.json({ ok });
  } catch {
    res.status(500).json({ ok: false });
  }
});

app.delete("/api/usuarios/:id", async (req, res) => {
  try {
    await eliminarUsuario(req.params.id);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});


// ==================================================
// 📦 PRODUCTOS
// ==================================================

app.get('/api/productos', async (req, res) => {
  try {
    const productos = await obtenerProductos();
    res.json(productos);
  } catch {
    res.status(500).json({ error: "Error" });
  }
});

app.post('/api/productos', upload.single('imagen'), async (req, res) => {
  const img = req.file ? `/uploads/${req.file.filename}` : null;

  const data = [
    req.body.nombre,
    req.body.categoria_id,
    req.body.proveedor_id,
    req.body.precio_compra,
    req.body.precio_venta,
    req.body.stock,
    req.body.stock_minimo,
    req.body.iva,
    req.body.descuenti,
    req.body.descripcion,
    req.body.estado,
    img
  ];

  await insertarProducto(data);
  res.json({ ok: true });
});

app.put('/api/productos/:id', upload.single('imagen'), async (req, res) => {
  const img = req.file ? `/uploads/${req.file.filename}` : req.body.url;

  const data = [
    req.body.nombre,
    req.body.categoria_id,
    req.body.proveedor_id,
    req.body.precio_compra,
    req.body.precio_venta,
    req.body.stock,
    req.body.stock_minimo,
    req.body.iva,
    req.body.descuenti,
    req.body.descripcion,
    req.body.estado,
    img
  ];

  await actualizarProducto(req.params.id, data);
  res.json({ ok: true });
});

app.delete('/api/productos/:id', async (req, res) => {
  try {
    const conexion = await getConnection();

    const [result] = await conexion.execute(
      'DELETE FROM productos WHERE id_producto = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No encontrado" });
    }

    res.json({ ok: true });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ==================================================
// 💸 GASTOS
// ==================================================

app.get('/api/gastos', async (req, res) => {
  try {
    const gastos = await obtenergastos();
    res.json(gastos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gastos', async (req, res) => {
  try {
    await agregarGasto(req.body);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

app.put('/api/gastos/:id', async (req, res) => {
  try {
    await actualizarGasto(req.params.id, req.body);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

app.delete('/api/gastos/:id', async (req, res) => {
  try {
    await eliminarGastoDB(req.params.id);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});