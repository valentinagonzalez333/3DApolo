import { getConnection } from "./db_conectar.js";


export const obtenerProductos = async (req, res) => {
  try {
    const conexion = await getConnection();

    const [rows] = await conexion.execute(`
      SELECT 
        p.id_producto,
        p.nombre,
        p.categoria_id,
        p.proveedor_id,
        c.nombre AS categoria,
        pr.nombre AS proveedor,
        p.precio_compra,
        p.precio_venta,
        p.stock,
        p.stock_minimo,
        p.descripcion,
        p.estado,
        p.url,
        p.iva,
        p.descuenti
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id_categoria
      LEFT JOIN proveedor pr ON p.proveedor_id = pr.id_proveedor
    `);

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
};

//agregar

export const crearProducto = async (req, res) => {
  try {
    const conexion = await getConnection();

    const {
      nombre, categoria_id, proveedor_id,
      precio_compra, precio_venta,
      stock, stock_minimo,
      iva, descuenti,
      descripcion, estado
    } = req.body;
    

    const url = req.file ? "/uploads/" + req.file.filename : null;

    await conexion.execute(`
      INSERT INTO productos
      (nombre, categoria_id, proveedor_id, precio_compra, precio_venta,
       stock, stock_minimo, iva, descuenti, descripcion, estado, url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nombre, categoria_id, proveedor_id,
      precio_compra, precio_venta,
      stock, stock_minimo,
      iva || 0, descuenti || 0,
      descripcion, estado,
      url
    ]);

    res.json({ ok: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
};

//actualizar

export const actualizarProducto = async (req, res) => {
  try {
    const conexion = await getConnection();
    const { id } = req.params;

    const {
      nombre, categoria_id, proveedor_id,
      precio_compra, precio_venta,
      stock, stock_minimo,
      iva, descuenti,
      descripcion, estado
    } = req.body;

    
    let url;
    if (req.file) {
      url = "/uploads/" + req.file.filename;

      await conexion.execute(`
        UPDATE productos SET
          nombre=?, categoria_id=?, proveedor_id=?,
          precio_compra=?, precio_venta=?,
          stock=?, stock_minimo=?,
          iva=?, descuenti=?,
          descripcion=?, estado=?, url=?
        WHERE id_producto=?
      `, [
        nombre, categoria_id, proveedor_id,
        precio_compra, precio_venta,
        stock, stock_minimo,
        iva || 0, descuenti || 0,
        descripcion, estado,
        url, id
      ]);

    } else {
      
      await conexion.execute(`
        UPDATE productos SET
          nombre=?, categoria_id=?, proveedor_id=?,
          precio_compra=?, precio_venta=?,
          stock=?, stock_minimo=?,
          iva=?, descuenti=?,
          descripcion=?, estado=?
        WHERE id_producto=?
      `, [
        nombre, categoria_id, proveedor_id,
        precio_compra, precio_venta,
        stock, stock_minimo,
        iva || 0, descuenti || 0,
        descripcion, estado,
        id
      ]);
    }

    res.json({ ok: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
};


//eliminar

export const eliminarProducto = async (req, res) => {
  try {
    const conexion = await getConnection();
    const { id } = req.params;

    await conexion.execute(
      "DELETE FROM productos WHERE id_producto=?",
      [id]
    );

    res.json({ ok: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
};