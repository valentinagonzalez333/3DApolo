
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import multer from 'multer';

import { 
  insertarProducto,
  actualizarProducto
} from './modelo/productos.js';

import { getConnection } from './modelo/db_conectar.js';
import { obtenerProductos } from './modelo/productos.js';
import { obtenergastos } from './modelo/gastos.js';

import { 
  agregarGasto, 
  eliminarGastoDB, 
  actualizarGasto 
} from './modelo/gastos.js';

const app = express();
const upload = multer({ dest: 'uploads/' });
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Server 
app.set('port', 4000);
app.listen(app.get('port'));
console.log("Servidor corriendo en puerto", app.get('port'));

// configuracion estatica para el frontend
app.use(express.static(path.join(__dirname, "../Frontend")));
app.use('/uploads', express.static('uploads'));
app.use('/img', express.static('../frontend/img'));

// Middleware
app.use(cors({
  origin: 'http://localhost:4000',
}));
app.use(express.json());

// Rotas

// Rutas generales
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/html/Info.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/html/login.html"));
});

app.get("/registro", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/registro.html"));
});

app.get("/inicio", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/html/panel.html"));
});

app.get("/ventas", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/html/ventas.html"));
});

app.get("/reportes", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/html/reportes.html"));
});

app.get("/usuarios", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/html/usuarios.html"));
});

app.get("/gastos", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/html/gastos.html"));
});

app.get("/configuracion", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/html/confi.html"));
});
// Login
app.post("/login", async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const connection = await getConnection();

    const [resultados] = await connection.query(
      "SELECT usuario, rol FROM usuarios WHERE usuario = ? AND contrasena = ?",
      [usuario, password]
    );

    if (resultados.length > 0) {
      const user = resultados[0];

      res.json({
        ok: true,
        rol: user.rol,
        usuario: user.usuario
      });

    } else {
      res.json({ ok: false });
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({ ok: false });
  }
});

// Productos
app.get('/productos', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/html/productos.html'));
});

app.get('/api/productos', async (req, res) => {
  try {
    const productos = await obtenerProductos();
    res.json(productos);
  } catch (error) {
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
    const { id } = req.params;

    const conexion = await getConnection();

    const [result] = await conexion.execute(
      'DELETE FROM productos WHERE id_producto = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ ok: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/categorias', async (req, res) => {
  const conexion = await getConnection();
  const [rows] = await conexion.execute('SELECT * FROM categorias');
  res.json(rows);
});

app.get('/api/proveedores', async (req, res) => {
  const conexion = await getConnection();
  const [rows] = await conexion.execute('SELECT * FROM proveedor');
  res.json(rows);
});

// Usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const conexion = await getConnection();

    const [rows] = await conexion.execute(`
      SELECT id_usuario, nombre 
      FROM usuarios
      WHERE estado = 1
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// Gastos
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
    res.json({ message: "Gasto creado con éxito" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/gastos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await eliminarGastoDB(id);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Gasto no encontrado" });
    }
    res.json({ message: "Gasto eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/gastos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await actualizarGasto(id, req.body);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Gasto no encontrado" });
    }
    res.json({ message: "Gasto actualizado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
